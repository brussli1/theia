import { setOrderStatus } from "../../lib/admin-actions";
import {
  fetchAdminOrders,
  ORDER_STATUS_AWAITING_PAYMENT,
  ORDER_STATUS_DELIVERED,
  ORDER_STATUS_PAID,
  ORDER_STATUS_SHIPPED,
  type AdminOrder,
} from "../../lib/api";
import { formatAmount } from "../../lib/currency";
import { getDictionary, getLocale } from "../../lib/i18n";
import { orderStatusKey } from "../../lib/labels";

export const dynamic = "force-dynamic";

// `received` is a legacy pre-payment status (ADR 0001); it renders but is
// not a target an admin can set.
const ORDER_STATUSES = [
  ORDER_STATUS_AWAITING_PAYMENT,
  ORDER_STATUS_PAID,
  ORDER_STATUS_SHIPPED,
  ORDER_STATUS_DELIVERED,
];

function formatDate(iso: string, locale: "es" | "en"): string {
  return new Date(iso).toLocaleDateString(locale === "es" ? "es-PY" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function AdminOrdersPage() {
  const locale = getLocale();
  const t = getDictionary(locale);
  let orders: AdminOrder[] = [];
  try {
    orders = await fetchAdminOrders();
  } catch {
    orders = [];
  }

  const statusBadge = (status: string) =>
    status === ORDER_STATUS_AWAITING_PAYMENT
      ? "bg-amber-100 text-amber-800"
      : "bg-emerald-100 text-emerald-800";

  return (
    <main className="mx-auto max-w-6xl p-8">
      <h1 className="text-2xl font-semibold text-slate-900">{t.admin.ordersTitle}</h1>
      <p className="mt-2 text-sm text-slate-500">{t.admin.ordersSubtitle}</p>

      {orders.length === 0 ? (
        <p className="mt-8 text-sm text-slate-500">{t.admin.noOrders}</p>
      ) : (
        <ul className="mt-6 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
          {orders.map((order) => {
            const statusLabel = orderStatusKey(order.status);
            const statusText = statusLabel ? t.order[statusLabel] : order.status;
            return (
              <li
                key={order.id}
                data-testid="admin-order-row"
                className="p-4 text-sm"
              >
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                  <div className="min-w-0">
                    <p
                      data-testid="admin-order-number"
                      className="font-semibold text-slate-900"
                    >
                      {order.order_number}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatDate(order.created_at, locale)}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-slate-900">{order.name}</p>
                    <p className="text-xs text-slate-500">
                      {order.email} · {order.phone}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-slate-600">
                      {t.admin.items}: {order.items.length}
                    </p>
                    <p className="text-xs text-slate-500">
                      {order.delivery_type === "local"
                        ? t.order.deliveryLocal
                        : t.order.deliveryInternational}
                    </p>
                  </div>
                  <span className="text-slate-900">
                    {formatAmount(order.subtotal_gs, "PYG", locale)} ·{" "}
                    {formatAmount(Number(order.subtotal_usd), "USD", locale)}
                  </span>
                  <span
                    data-testid="admin-order-status-badge"
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadge(order.status)}`}
                  >
                    {statusText}
                  </span>
                  <span
                    data-testid="admin-order-payment-badge"
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      order.payment_status === "paid"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {order.payment_status === "paid"
                      ? t.admin.paymentPaid
                      : t.admin.paymentPending}
                  </span>
                </div>

                <ul className="mt-2 space-y-0.5 text-xs text-slate-500">
                  {order.items.map((item) => (
                    <li key={item.product_name}>
                      {item.quantity} × {item.product_name}
                    </li>
                  ))}
                </ul>

                <form
                  action={setOrderStatus.bind(null, order.id)}
                  className="mt-3 flex flex-wrap items-center gap-2"
                >
                  <select
                    name="status"
                    defaultValue={order.status}
                    data-testid="admin-order-status"
                    className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                  >
                    {ORDER_STATUSES.map((status) => {
                      const key = orderStatusKey(status);
                      return (
                        <option key={status} value={status}>
                          {key ? t.order[key] : status}
                        </option>
                      );
                    })}
                  </select>
                  <button
                    type="submit"
                    data-testid="admin-order-status-save"
                    className="rounded-md bg-slate-900 px-3 py-1 text-sm font-medium text-white hover:bg-slate-700"
                  >
                    {t.admin.updateStatus}
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
