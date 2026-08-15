import { formatGs, formatUsd, type ProductCard } from "../lib/api";

export default function ProductCardView({ product }: { product: ProductCard }) {
  const quoteOnly = !product.orderable;
  const unavailable = !product.available;

  return (
    <div
      data-testid="product-card"
      className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white"
    >
      <div className="flex h-40 items-center justify-center bg-slate-100">
        {product.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <span className="text-xs text-slate-400">Sin imagen</span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center gap-2">
          {quoteOnly && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
              Solo cotización
            </span>
          )}
          {unavailable && (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
              No disponible
            </span>
          )}
        </div>
        <h3 className="line-clamp-2 text-sm font-medium text-slate-900">{product.name}</h3>
        <p className="text-xs text-slate-500">
          {product.brand ?? ""}
          {product.brand && product.category ? " · " : ""}
          {product.category ?? ""}
        </p>
        <div className="mt-auto pt-2">
          <p className="text-sm font-semibold text-slate-900">{formatGs(product.price_gs)}</p>
          <p className="text-xs text-slate-500">{formatUsd(product.price_usd)}</p>
        </div>
      </div>
    </div>
  );
}
