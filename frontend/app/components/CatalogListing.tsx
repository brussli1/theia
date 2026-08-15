import type { ProductCard } from "../lib/api";
import type { Currency } from "../lib/currency";
import { getDictionary, getLocale } from "../lib/i18n";
import Pagination from "./Pagination";
import ProductGrid from "./ProductGrid";

export default function CatalogListing({
  title,
  total,
  products,
  page,
  pages,
  currency,
  buildPageUrl,
}: {
  title: string;
  total: number;
  products: ProductCard[];
  page: number;
  pages: number;
  currency: Currency;
  buildPageUrl: (target: number) => string;
}) {
  const t = getDictionary(getLocale());
  return (
    <main className="mx-auto max-w-6xl p-8">
      <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
      <p className="mt-1 text-sm text-slate-500">{t.listing.productsCount(total)}</p>
      <ProductGrid products={products} currency={currency} />
      <Pagination page={page} pages={pages} buildPageUrl={buildPageUrl} />
    </main>
  );
}
