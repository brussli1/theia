import Link from "next/link";
import {
  confirmPayment,
  fetchOrder,
  fetchVisitorCurrency,
  ORDER_STATUS_AWAITING_PAYMENT,
  type Currency,
  type Order,
} from "../../lib/api";
import { CONTACT_EMAIL, WHATSAPP_URL } from "../../lib/contact";
import { asPriceLine, formatAmount, formatPrice, totalIn } from "../../lib/currency";
import { getDictionary, getLocale } from "../../lib/i18n";
import { orderStatusKey } from "../../lib/labels";

export const dynamic = "force-dynamic";

const PAYMENT_METHOD_KEYS = {
  paypal: "paymentPaypal",
  western_union: "paymentWesternUnion",
  card: "paymentCard",
} as const;

export default async function PedidoPage({
  params,
  searchParams,
}: {
  params: { orderNumber: string };
  searchParams: { email?: string; payment_ref?: string };
}) {
  const locale = getLocale();
  const t = getDictionary(locale);
  let order: Order | null = null;
  let currency: Currency = "USD";
  try {
    if (searchParams?.email) {
      // Coming back from a gateway payment page: confirm the payment first so
      // the page shows the fresh status. If the gateway is unreachable, fall
      // back to a plain lookup so the page still renders (as awaiting payment).
      [order, currency] = await Promise.all([
        searchParams.payment_ref
          ? confirmPayment(params.orderNumber, searchParams.payment_ref).catch(() =>
              fetchOrder(params.orderNumber, searchParams.email ?? ""),
            )
          : fetchOrder(params.orderNumber, searchParams.email),
        fetchVisitorCurrency(),
      ]);
    }
  } catch {
    order = null;
  }

  if (!order) {
    return (
      <main className="mx-auto max-w-6xl p-8">
        <h1 className="text-2xl font-semibold text-slate-900">{t.order.track}</h1>
        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 text-center">
          <p className="text-sm text-slate-500">{t.order.notFound}</p>
          <p className="mt-1 text-sm text-slate-400">{t.order.notFoundHint}</p>
          <Link
            href="/pedido"
            className="mt-4 inline-block rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            {t.order.track}
          </Link>
        </div>
      </main>
    );
  }

  const statusKey = orderStatusKey(order.status);
  const statusLabel = statusKey ? t.order[statusKey] : order.status;

  const statusBadge =
    order.status === ORDER_STATUS_AWAITING_PAYMENT
      ? "bg-amber-100 text-amber-800"
      : "bg-emerald-100 text-emerald-800";

  const paymentMethodKey =
    order.payment_method && order.payment_method in PAYMENT_METHOD_KEYS
      ? PAYMENT_METHOD_KEYS[order.payment_method as keyof typeof PAYMENT_METHOD_KEYS]
      : null;

  return (
    <main className="mx-auto max-w-6xl p-8">
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h1 className="text-2xl font-semibold text-slate-900">{t.order.confirmationTitle}</h1>
        <p className="mt-2 text-sm text-slate-500">{t.order.confirmationSubtitle}</p>
        <div className="mt-4 flex flex-wrap gap-6 text-sm">
          <p>
            <span className="text-slate-500">{t.order.number}: </span>
            <span data-testid="order-number" className="font-semibold text-slate-900">
              {order.order_number}
            </span>
          </p>
          <p>
            <span className="text-slate-500">{t.order.status}: </span>
            <span
              data-testid="order-status"
              className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadge}`}
            >
              {statusLabel}
            </span>
          </p>
        </div>
      </div>

      {order.payment_method && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-slate-900">{t.order.payment}</h2>
          <div className="mt-2 flex flex-wrap gap-6 text-sm">
            <p data-testid="payment-method">
              <span className="text-slate-500">{t.order.payment}: </span>
              <span className="font-medium text-slate-900">
                {paymentMethodKey ? t.order[paymentMethodKey] : order.payment_method}
              </span>
            </p>
            <p>
              <span className="text-slate-500">{t.order.paymentAmount}: </span>
              <span className="font-medium text-slate-900" data-testid="payment-amount">
                {formatAmount(
                  order.payment_currency === "USD"
                    ? Number(order.subtotal_usd)
                    : order.subtotal_gs,
                  order.payment_currency === "USD" ? "USD" : "PYG",
                  locale,
                )}
              </span>
            </p>
          </div>

          {order.payment_method === "western_union" && (
            <div className="mt-4 rounded-md bg-slate-50 p-4" data-testid="wu-instructions">
              <h3 className="text-sm font-semibold text-slate-900">{t.order.wuTitle}</h3>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-600">
                {t.order.wuSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              <div className="mt-3 flex flex-wrap gap-3 text-sm">
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md bg-slate-900 px-4 py-2 text-white hover:bg-slate-700"
                >
                  {t.order.wuWhatsApp}
                </a>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="rounded-md border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50"
                >
                  {t.order.wuEmail}
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_320px]">
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">{t.order.items}</h2>
          <ul className="mt-3 space-y-3">
            {order.items.map((item) => (
              <li key={item.product_name} data-testid="order-item" className="flex gap-4 text-sm">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100">
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image} alt={item.product_name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xs text-slate-400">{t.card.noImage}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900">{item.product_name}</p>
                  <p className="text-slate-500">
                    {t.order.quantity}: {item.quantity}
                  </p>
                </div>
                <p className="shrink-0 text-slate-900">
                  {formatPrice(item.price_gs, item.price_usd, currency, locale)}
                </p>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-between border-t border-slate-200 pt-3">
            <span className="text-sm font-medium text-slate-500">{t.order.subtotal}</span>
            <span className="text-xl font-semibold text-slate-900" data-testid="order-subtotal">
              {formatAmount(totalIn(order.items.map(asPriceLine), currency), currency, locale)}
            </span>
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
            <h2 className="font-semibold text-slate-900">{t.order.shipping}</h2>
            <dl className="mt-2 space-y-1 text-slate-600">
              <p>
                {order.delivery_type === "local"
                  ? t.order.deliveryLocal
                  : t.order.deliveryInternational}
              </p>
              <p>{order.name}</p>
              <p>{order.address}</p>
              <p>
                {[order.city, order.region, order.postal_code].filter(Boolean).join(", ")}
              </p>
              <p>{order.country}</p>
              {order.notes && <p className="italic">{order.notes}</p>}
            </dl>
          </section>
          <section className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
            <h2 className="font-semibold text-slate-900">{t.order.contact}</h2>
            <dl className="mt-2 space-y-1 text-slate-600">
              <p>{order.email}</p>
              <p>{order.phone}</p>
            </dl>
          </section>
          <Link
            href="/pedido"
            className="block rounded-md bg-slate-900 px-4 py-2 text-center text-sm font-medium text-white hover:bg-slate-700"
          >
            {t.order.track}
          </Link>
        </aside>
      </div>
    </main>
  );
}
