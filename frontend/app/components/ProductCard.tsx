import Link from "next/link";
import { formatBrandCategory, type ProductCard } from "../lib/api";
import { formatPrice, type Currency } from "../lib/currency";
import { getDictionary, getLocale } from "../lib/i18n";

export default function ProductCardView({
  product,
  currency,
}: {
  product: ProductCard;
  currency: Currency;
}) {
  const locale = getLocale();
  const t = getDictionary(locale);
  const quoteOnly = !product.orderable;
  const unavailable = !product.available;

  return (
    <div
      data-testid="product-card"
      className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lg"
    >
      <div className="flex aspect-[4/3] items-center justify-center bg-slate-100">
        {product.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <span className="text-xs text-slate-400">{t.card.noImage}</span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center gap-2">
          {quoteOnly && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
              {t.card.quoteOnly}
            </span>
          )}
          {unavailable && (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
              {t.card.unavailable}
            </span>
          )}
        </div>
        <Link
          href={`/productos/${product.slug}`}
          className="line-clamp-2 text-sm font-medium text-slate-900 hover:text-brand-700 hover:underline"
        >
          {product.name}
        </Link>
        <p className="text-xs text-slate-500">
          {formatBrandCategory(product.brand, product.category)}
        </p>
        <div className="mt-auto pt-2">
          <p className="text-sm font-semibold text-brand-800" data-testid="card-price">
            {formatPrice(product.price_gs, product.price_usd, currency, locale)}
          </p>
        </div>
      </div>
    </div>
  );
}
