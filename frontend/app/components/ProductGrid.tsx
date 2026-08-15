import ProductCardView from "./ProductCard";
import type { ProductCard } from "../lib/api";
import type { Currency } from "../lib/currency";
import { getDictionary, getLocale } from "../lib/i18n";

export default function ProductGrid({
  products,
  currency,
}: {
  products: ProductCard[];
  currency: Currency;
}) {
  const t = getDictionary(getLocale());
  if (products.length === 0) {
    return <p className="mt-8 text-sm text-slate-500">{t.grid.empty}</p>;
  }
  return (
    <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCardView key={product.slug} product={product} currency={currency} />
      ))}
    </div>
  );
}
