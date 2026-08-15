import Link from "next/link";
import {
  fetchOrder,
  fetchVisitorCurrency,
  ORDER_STATUS_RECEIVED,
  type Currency,
  type Order,
} from "../../lib/api";
import { asPriceLine, formatAmount, formatPrice, totalIn } from "../../lib/currency";
import { getDictionary, getLocale } from "../../lib/i18n";

export const dynamic = "force-dynamic";

export default async function PedidoPage({
  params,
  searchParams,
}: {
  params: { orderNumber: string };
  searchParams: { email?: string };
}) {
  const locale = getLocale();
  const t = getDictionary(locale);
  let order: Order | null = null;
  let currency: Currency = "USD";
  try {
    if (searchParams?.email) {
      [order, currency] = await Promise.all([
        fetchOrder(params.orderNumber, searchParams.email),
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

  const statusLabel =
    order.status === ORDER_STATUS_RECEIVED ? t.order.statusReceived : order.status;

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
              className="inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800"
            >
              {statusLabel}
            </span>
          </p>
        </div>
      </div>

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
