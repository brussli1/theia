import Link from "next/link";
import { fetchCart, fetchVisitorCurrency, type Cart } from "../lib/api";
import { asPriceLine, formatAmount, totalIn, type Currency } from "../lib/currency";
import { getDictionary, getLocale } from "../lib/i18n";
import CartControls from "./CartControls";

export const dynamic = "force-dynamic";

export default async function CarritoPage() {
  const locale = getLocale();
  const t = getDictionary(locale);
  let cart: Cart | null;
  let currency: Currency;
  try {
    [cart, currency] = await Promise.all([fetchCart(), fetchVisitorCurrency()]);
  } catch {
    cart = null;
    currency = "USD";
  }

  const line = asPriceLine;

  return (
    <main className="mx-auto max-w-6xl p-8">
      <h1 className="text-2xl font-semibold text-slate-900">{t.cart.title}</h1>
      {!cart || cart.items.length === 0 ? (
        <div className="mt-8">
          <p className="text-sm text-slate-500">{t.cart.empty}</p>
          <Link
            href="/productos"
            className="mt-4 inline-block rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            {t.cart.continueShopping}
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {cart.items.map((item) => (
            <div
              key={item.id}
              data-testid="cart-item"
              className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-4"
            >
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg bg-slate-100">
                {item.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs text-slate-400">{t.card.noImage}</span>
                )}
              </div>
              <Link
                href={`/productos/${item.slug}`}
                className="min-w-0 flex-1 text-sm font-medium text-slate-900 hover:underline"
              >
                {item.name}
              </Link>
              <p className="text-sm text-slate-500">
                {formatAmount(totalIn([line(item)], currency), currency, locale)}
              </p>
              <CartControls itemId={item.id} quantity={item.quantity} t={t.cart} />
            </div>
          ))}
          <div className="flex items-center justify-between border-t border-slate-200 pt-4">
            <span className="text-sm font-medium text-slate-500">{t.cart.subtotal}</span>
            <span className="text-xl font-semibold text-slate-900" data-testid="cart-subtotal">
              {formatAmount(totalIn(cart.items.map(line), currency), currency, locale)}
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
            <Link href="/pedido" className="text-sm text-slate-500 hover:text-slate-900">
              {t.cart.trackOrder}
            </Link>
            <Link
              href="/finalizar-compra"
              data-testid="go-to-checkout"
              className="rounded-md bg-slate-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-slate-700"
            >
              {t.cart.checkout}
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
