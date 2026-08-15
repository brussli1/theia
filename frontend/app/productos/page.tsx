import type { Metadata } from "next";
import ProductGrid from "../components/ProductGrid";
import Pagination from "../components/Pagination";
import { fetchProducts, fetchVisitorCurrency } from "../lib/api";
import { getDictionary, getLocale } from "../lib/i18n";
import { pageMetadata } from "../lib/metadata";
import ProductFilters from "./ProductFilters";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = getLocale();
  const t = getDictionary(locale);
  const page = t.pages.catalog;
  return pageMetadata({
    locale,
    title: `${page.title} — Theia`,
    description: page.description,
    path: "/productos",
  });
}

export default async function ProductosPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const locale = getLocale();
  const t = getDictionary(locale);

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    const first = Array.isArray(value) ? value[0] : value;
    if (first) params.set(key, first);
  }
  if (!params.get("sort")) params.set("sort", "newest");
  if (!params.get("page")) params.set("page", "1");

  let page;
  let currency;
  try {
    [page, currency] = await Promise.all([
      fetchProducts(params),
      fetchVisitorCurrency(),
    ]);
  } catch {
    return (
      <main className="mx-auto max-w-6xl p-8">
        <p className="text-sm text-red-600">{t.catalogError}</p>
      </main>
    );
  }

  const current = new URLSearchParams(params);
  const buildPageUrl = (target: number) => {
    const next = new URLSearchParams(current);
    next.set("page", String(target));
    return `/productos?${next.toString()}`;
  };

  return (
    <main className="mx-auto max-w-6xl p-8">
      <h1 className="text-2xl font-semibold text-slate-900">{t.header.products}</h1>
      <p className="mt-1 text-sm text-slate-500">{t.listing.productsCount(page.total)}</p>
      <div className="mt-6">
        <ProductFilters
          categories={page.categories}
          brands={page.brands}
          currentQuery={current.toString()}
          t={t.filters}
        />
      </div>
      <ProductGrid products={page.items} currency={currency} />
      <Pagination page={page.page} pages={page.pages} buildPageUrl={buildPageUrl} />
    </main>
  );
}
