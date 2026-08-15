import Link from "next/link";
import AuthForms from "./AuthForms";
import {
  ORDER_STATUS_AWAITING_PAYMENT,
  fetchAccountOrders,
  fetchAccountQuotes,
  fetchCurrentUser,
  fetchVisitorCurrency,
  type Currency,
  type Order,
  type Quote,
  type User,
} from "../lib/api";
import { asPriceLine, formatAmount, totalIn } from "../lib/currency";
import { getDictionary, getLocale, type Locale } from "../lib/i18n";
import { orderStatusKey, quoteKindKey, quoteStatusKey } from "../lib/labels";
import { logout } from "../lib/auth-actions";

export const dynamic = "force-dynamic";

function formatDate(iso: string, locale: Locale): string {
  return new Date(iso).toLocaleDateString(locale === "es" ? "es-PY" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function CuentaPage() {
  const locale = getLocale();
  const t = getDictionary(locale);
  let user: User | null = null;
  try {
    user = await fetchCurrentUser();
  } catch {
    // Backend unreachable: treat the visitor as signed out — the page still
    // renders the login/register forms rather than a 500.
    user = null;
  }

  if (!user) {
    // `welcome` is a function; client components only receive serializable
    // strings, so it is excluded from the props passed to AuthForms.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { welcome: _welcome, ...accountStrings } = t.account;
    return (
      <main className="mx-auto max-w-4xl p-8">
        <h1 className="text-2xl font-semibold text-slate-900">{t.account.title}</h1>
        <p className="mt-2 text-sm text-slate-500">{t.account.subtitle}</p>
        <div className="mt-8">
          <AuthForms t={accountStrings} />
        </div>
      </main>
    );
  }

  let orders: Order[] = [];
  let quotes: Quote[] = [];
  let currency: Currency = "USD";
  try {
    [orders, quotes, currency] = await Promise.all([
      fetchAccountOrders(),
      fetchAccountQuotes(),
      fetchVisitorCurrency(),
    ]);
  } catch {
    // History unavailable: show the account with empty sections rather than
    // failing the page; the header still shows the signed-in state.
  }

  const orderStatusBadge = (status: string) =>
    status === ORDER_STATUS_AWAITING_PAYMENT
      ? "bg-amber-100 text-amber-800"
      : "bg-emerald-100 text-emerald-800";

  return (
    <main className="mx-auto max-w-4xl p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {t.account.welcome(user.name)}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{t.account.welcomeSubtitle}</p>
        </div>
        <form action={logout}>
          <button
            type="submit"
            data-testid="account-logout"
            className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            {t.account.logout}
          </button>
        </form>
      </div>

      <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">{t.account.ordersTitle}</h2>
        {orders.length === 0 ? (
          <p data-testid="account-empty-orders" className="mt-3 text-sm text-slate-500">
            {t.account.emptyOrders}
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {orders.map((order) => {
              const statusKey = orderStatusKey(order.status);
              return (
                <li
                  key={order.order_number}
                  data-testid="account-order"
                  className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border border-slate-100 p-3 text-sm"
                >
                  <Link
                    href={`/pedido/${order.order_number}?email=${encodeURIComponent(order.email)}`}
                    className="font-semibold text-slate-900 hover:underline"
                    data-testid="account-order-link"
                  >
                    {order.order_number}
                  </Link>
                  <span className="text-slate-500">
                    {t.account.date}: {formatDate(order.created_at, locale)}
                  </span>
                  <span className="text-slate-500">
                    {t.account.items}: {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                  <span className="text-slate-900">
                    {formatAmount(
                      totalIn(order.items.map(asPriceLine), currency),
                      currency,
                      locale,
                    )}
                  </span>
                  <span
                    className={`ml-auto rounded-full px-2 py-0.5 text-xs font-semibold ${orderStatusBadge(order.status)}`}
                  >
                    {statusKey ? t.order[statusKey] : order.status}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">{t.account.quotesTitle}</h2>
        {quotes.length === 0 ? (
          <p data-testid="account-empty-quotes" className="mt-3 text-sm text-slate-500">
            {t.account.emptyQuotes}
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {quotes.map((quote) => {
              const kindKey = quoteKindKey(quote.kind);
              const statusKey = quoteStatusKey(quote.status);
              return (
                <li
                  key={quote.reference}
                  data-testid="account-quote"
                  className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border border-slate-100 p-3 text-sm"
                >
                  <Link
                    href={`/cotizacion/${quote.reference}?email=${encodeURIComponent(quote.email)}`}
                    className="font-semibold text-slate-900 hover:underline"
                    data-testid="account-quote-link"
                  >
                    {quote.reference}
                  </Link>
                  <span className="text-slate-500">
                    {t.account.date}: {formatDate(quote.created_at, locale)}
                  </span>
                  <span className="text-slate-600">{kindKey ? t.quote[kindKey] : quote.kind}</span>
                  {quote.product_name && <span className="text-slate-500">{quote.product_name}</span>}
                  <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                    {statusKey ? t.quote[statusKey] : quote.status}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Link
        href="/"
        className="mt-8 inline-block text-sm text-slate-600 hover:text-slate-900"
      >
        {t.account.backHome}
      </Link>
    </main>
  );
}
