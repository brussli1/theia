import ProductCardView from "./ProductCard";
import type { ProductCard } from "../lib/api";

export default function ProductGrid({ products }: { products: ProductCard[] }) {
  if (products.length === 0) {
    return <p className="mt-8 text-sm text-slate-500">No se encontraron productos.</p>;
  }
  return (
    <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCardView key={product.slug} product={product} />
      ))}
    </div>
  );
}
