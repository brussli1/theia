import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchProduct, fetchVisitorCurrency, formatBrandCategory } from "../../lib/api";
import { formatPrice } from "../../lib/currency";
import { getDictionary, getLocale } from "../../lib/i18n";
import { pageMetadata } from "../../lib/metadata";
import AddToCartButton from "./AddToCartButton";
import Gallery from "./Gallery";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const locale = getLocale();
  const t = getDictionary(locale);
  try {
    const product = await fetchProduct(params.slug);
    return pageMetadata({
      locale,
      title: `${product.name} — Theia`,
      description: product.description,
      path: `/productos/${product.slug}`,
      images: product.images,
    });
  } catch {
    const page = t.pages.catalog;
    return pageMetadata({
      locale,
      title: `${page.title} — Theia`,
      description: page.description,
      path: "/productos",
    });
  }
}

export default async function ProductoPage({
  params,
}: {
  params: { slug: string };
}) {
  const locale = getLocale();
  const t = getDictionary(locale);
  let product;
  let currency;
  try {
    [product, currency] = await Promise.all([
      fetchProduct(params.slug),
      fetchVisitorCurrency(),
    ]);
  } catch {
    notFound();
  }

  return (
    <main className="mx-auto max-w-6xl p-8">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <Gallery images={product.images} alts={product.image_alt} name={product.name} t={t.product} />
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            {product.certifications.map((cert) => (
              <span
                key={cert}
                className="rounded-full border border-slate-300 px-2.5 py-0.5 text-xs font-semibold text-slate-700"
              >
                {cert}
              </span>
            ))}
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{product.name}</h1>
          <p className="text-sm text-slate-500">
            {formatBrandCategory(product.brand, product.category)}
          </p>
          {!product.available && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {t.product.unavailable}
            </p>
          )}
          <p className="text-3xl font-semibold text-brand-800" data-testid="price">
            {formatPrice(product.price_gs, product.price_usd, currency, locale)}
          </p>
          {product.orderable ? (
            <AddToCartButton slug={product.slug} t={t.product} />
          ) : (
            <Link
              href={`/cotizacion?producto=${product.slug}`}
              data-testid="request-quote"
              className="inline-block rounded-md bg-brand-600 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-brand-700"
            >
              {t.product.requestQuote}
            </Link>
          )}
          <div className="mt-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              {t.product.description}
            </h2>
            {product.description_html ? (
              <StructuredDescription html={product.description_html} />
            ) : (
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700">
                {product.description}
              </p>
            )}
          </div>
          {product.specifications.length > 0 && (
            <div className="mt-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                {t.product.specifications}
              </h2>
              <dl className="mt-2 divide-y divide-slate-200 rounded-lg border border-slate-200">
                {product.specifications.map((spec) => (
                  <div key={spec.key} className="flex justify-between gap-6 px-3 py-2 text-sm">
                    <dt className="text-slate-500">{spec.key}</dt>
                    <dd className="text-right font-medium text-slate-900">{spec.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
          <RelatedSection
            crossLinks={product.cross_links}
            t={t.product}
          />
        </div>
      </div>
    </main>
  );
}

/** Related section from the source's cross-link data (D3). Only links whose
 * target exists in Theia are returned by the API, so the section renders
 * solely when there is something to link to. */
function RelatedSection({
  crossLinks,
  t,
}: {
  crossLinks: import("../../lib/api").ProductCrossLinks;
  t: {
    related: string;
    relatedCategories: string;
    relatedProducts: string;
  };
}) {
  const categories = crossLinks.related_categories;
  const products = crossLinks.related_products;
  if (categories.length === 0 && products.length === 0) {
    return null;
  }
  return (
    <div className="mt-6" data-testid="related-section">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        {t.related}
      </h2>
      {categories.length > 0 && (
        <div className="mt-2">
          <p className="text-xs font-medium text-slate-500">{t.relatedCategories}</p>
          <ul className="mt-1 flex flex-wrap gap-2">
            {categories.map((category) => (
              <li key={category.slug}>
                <Link
                  href={`/categorias/${category.slug}`}
                  className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      {products.length > 0 && (
        <div className="mt-2">
          <p className="text-xs font-medium text-slate-500">{t.relatedProducts}</p>
          <ul className="mt-1 space-y-1">
            {products.map((product) => (
              <li key={product.slug}>
                <Link
                  href={`/productos/${product.slug}`}
                  className="text-sm font-medium text-brand-700 hover:underline"
                >
                  {product.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/** Renders the server-sanitized description fragment (allowlist enforced at
 * import time; admin-created products render plain text instead). */
function StructuredDescription({ html }: { html: string }) {
  return (
    <div
      className="mt-2 space-y-2 text-sm leading-relaxed text-slate-700"
      data-testid="structured-description"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
