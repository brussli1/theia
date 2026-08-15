import ProductGrid from "../components/ProductGrid";
import Pagination from "../components/Pagination";
import { fetchProducts } from "../lib/api";
import ProductFilters from "./ProductFilters";

export const dynamic = "force-dynamic";

export default async function ProductosPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    const first = Array.isArray(value) ? value[0] : value;
    if (first) params.set(key, first);
  }
  if (!params.get("sort")) params.set("sort", "newest");
  if (!params.get("page")) params.set("page", "1");

  let page;
  try {
    page = await fetchProducts(params);
  } catch {
    return (
      <main className="mx-auto max-w-6xl p-8">
        <p className="text-sm text-red-600">No se pudo cargar el catálogo.</p>
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
      <h1 className="text-2xl font-semibold text-slate-900">Productos</h1>
      <p className="mt-1 text-sm text-slate-500">{page.total} productos</p>
      <div className="mt-6">
        <ProductFilters
          categories={page.categories}
          brands={page.brands}
          currentQuery={current.toString()}
        />
      </div>
      <ProductGrid products={page.items} />
      <Pagination page={page.page} pages={page.pages} buildPageUrl={buildPageUrl} />
    </main>
  );
}
