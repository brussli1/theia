import type { ProductCard } from "../lib/api";
import Pagination from "./Pagination";
import ProductGrid from "./ProductGrid";

export default function CatalogListing({
  title,
  total,
  products,
  page,
  pages,
  buildPageUrl,
}: {
  title: string;
  total: number;
  products: ProductCard[];
  page: number;
  pages: number;
  buildPageUrl: (target: number) => string;
}) {
  return (
    <main className="mx-auto max-w-6xl p-8">
      <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
      <p className="mt-1 text-sm text-slate-500">{total} productos</p>
      <ProductGrid products={products} />
      <Pagination page={page} pages={pages} buildPageUrl={buildPageUrl} />
    </main>
  );
}
