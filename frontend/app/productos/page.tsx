import Link from "next/link";
import ProductCardView from "../components/ProductCard";
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
  const pageNumber = page.page;
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
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {page.items.map((product) => (
          <ProductCardView key={product.slug} product={product} />
        ))}
      </div>
      {page.total === 0 && (
        <p className="mt-8 text-sm text-slate-500">No se encontraron productos.</p>
      )}
      {page.pages > 1 && (
        <nav className="mt-8 flex items-center justify-center gap-4 text-sm">
          {pageNumber > 1 ? (
            <Link href={buildPageUrl(pageNumber - 1)} className="text-slate-700 hover:underline">
              ← Anterior
            </Link>
          ) : (
            <span className="text-slate-300">← Anterior</span>
          )}
          <span className="text-slate-500">
            Página {pageNumber} de {page.pages}
          </span>
          {pageNumber < page.pages ? (
            <Link href={buildPageUrl(pageNumber + 1)} className="text-slate-700 hover:underline">
              Siguiente →
            </Link>
          ) : (
            <span className="text-slate-300">Siguiente →</span>
          )}
        </nav>
      )}
    </main>
  );
}
