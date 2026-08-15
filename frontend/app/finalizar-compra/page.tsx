import type { Metadata } from "next";
import Link from "next/link";
import { fetchCart, fetchVisitorCurrency, type Cart } from "../lib/api";
import { asPriceLine, formatAmount, totalIn, type Currency } from "../lib/currency";
import { getDictionary, getLocale } from "../lib/i18n";
import { pageMetadata } from "../lib/metadata";
import CheckoutForm from "./CheckoutForm";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = getLocale();
  const t = getDictionary(locale);
  const page = t.pages.checkout;
  return pageMetadata({
    locale,
    title: `${page.title} — Theia`,
    description: page.description,
    path: "/finalizar-compra",
    noIndex: true,
  });
}

export default async function CheckoutPage() {
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

  if (cart && cart.items.length === 0) {
    return (
      <main className="mx-auto max-w-6xl p-8">
        <h1 className="text-2xl font-semibold text-slate-900">{t.checkout.title}</h1>
        <div className="mt-8">
          <p className="text-sm text-slate-500">{t.checkout.empty}</p>
          <Link
            href="/productos"
            className="mt-4 inline-block rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            {t.cart.continueShopping}
          </Link>
        </div>
      </main>
    );
  }

  const subtotal = cart ? totalIn(cart.items.map(asPriceLine), currency) : null;

  return (
    <main className="mx-auto max-w-6xl p-8">
      <h1 className="text-2xl font-semibold text-slate-900">{t.checkout.title}</h1>
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_320px]">
        <CheckoutForm t={t.checkout} />
        <aside className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">{t.checkout.summary}</h2>
          {subtotal !== null && cart ? (
            <>
              <ul className="mt-3 space-y-2">
                {cart.items.map((item) => (
                  <li key={item.id} className="flex justify-between gap-4 text-sm">
                    <span className="min-w-0 flex-1 text-slate-600">
                      {item.name} <span className="text-slate-400">× {item.quantity}</span>
                    </span>
                    <span className="shrink-0 text-slate-900">
                      {formatAmount(totalIn([asPriceLine(item)], currency), currency, locale)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex justify-between border-t border-slate-200 pt-3">
                <span className="text-sm font-medium text-slate-500">{t.checkout.subtotal}</span>
                <span className="text-lg font-semibold text-slate-900" data-testid="checkout-subtotal">
                  {formatAmount(subtotal, currency, locale)}
                </span>
              </div>
            </>
          ) : (
            <p className="mt-3 text-sm text-slate-500">{t.checkout.cartUnavailable}</p>
          )}
        </aside>
      </div>
    </main>
  );
}
