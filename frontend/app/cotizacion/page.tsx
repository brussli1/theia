import { fetchProduct, fetchProducts } from "../lib/api";
import { getDictionary, getLocale } from "../lib/i18n";
import QuoteForm, { type QuoteProduct } from "./QuoteForm";

export const dynamic = "force-dynamic";

export default async function CotizacionPage({
  searchParams,
}: {
  searchParams: { producto?: string };
}) {
  const locale = getLocale();
  const t = getDictionary(locale);

  // The product picker lists quote-only products (orderable = false).
  let products: QuoteProduct[] = [];
  try {
    const page = await fetchProducts(
      new URLSearchParams({ orderable: "false", page_size: "100" }),
    );
    products = page.items.map((item) => ({ slug: item.slug, name: item.name }));
  } catch {
    products = [];
  }

  // Coming from a product page (?producto=slug): preselect that product.
  let initialProductSlug: string | null = null;
  if (searchParams?.producto) {
    try {
      const product = await fetchProduct(searchParams.producto);
      if (!product.orderable) {
        initialProductSlug = product.slug;
      }
    } catch {
      // Unknown or orderable product: fall back to the plain form.
    }
  }

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-semibold text-slate-900">{t.quote.title}</h1>
      <p className="mt-2 text-sm text-slate-500">{t.quote.subtitle}</p>
      <QuoteForm
        t={t.quote}
        products={products}
        initialProductSlug={initialProductSlug}
      />
    </main>
  );
}
