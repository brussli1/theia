import Link from "next/link";
import { fetchAdminProducts, type AdminProduct } from "../../lib/api";
import { formatAmount } from "../../lib/currency";
import { getDictionary, getLocale } from "../../lib/i18n";
import { toggleProductAvailability } from "../../lib/admin-actions";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const locale = getLocale();
  const t = getDictionary(locale);
  let products: AdminProduct[] = [];
  try {
    products = await fetchAdminProducts();
  } catch {
    products = [];
  }

  const statusBadge = (available: boolean) =>
    available
      ? "bg-emerald-100 text-emerald-800"
      : "bg-slate-100 text-slate-600";

  return (
    <main className="mx-auto max-w-6xl p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-slate-900">{t.admin.productsTitle}</h1>
        <Link
          href="/admin/productos/nuevo"
          data-testid="admin-new-product"
          className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
        >
          + {t.admin.newProduct}
        </Link>
      </div>

      {products.length === 0 ? (
        <p className="mt-8 text-sm text-slate-500">{t.admin.noProducts}</p>
      ) : (
        <ul className="mt-6 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
          {products.map((product) => (
            <li
              key={product.id}
              data-testid="admin-product-row"
              className="flex flex-wrap items-center gap-x-6 gap-y-2 p-4 text-sm"
            >
              <div className="min-w-0">
                <p className="font-medium text-slate-900">{product.name}</p>
                <p className="text-xs text-slate-500">{product.slug}</p>
              </div>
              <span className="text-slate-600">
                {[product.category_name, product.brand_name].filter(Boolean).join(" · ") || "—"}
              </span>
              <span className="text-slate-900">
                {formatAmount(product.price_gs, "PYG", locale)}
              </span>
              <span
                data-testid="admin-product-status"
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadge(product.available)}`}
              >
                {product.available ? t.admin.available : t.admin.unavailable}
              </span>
              <div className="ml-auto flex items-center gap-3">
                <Link
                  href={`/admin/productos/${product.id}`}
                  data-testid="admin-edit-product"
                  className="font-medium text-slate-700 hover:text-brand-700"
                >
                  {t.admin.edit}
                </Link>
                <form action={toggleProductAvailability.bind(null, product.id, !product.available)}>
                  <button
                    type="submit"
                    data-testid="admin-toggle-availability"
                    className="font-medium text-slate-700 hover:text-brand-700"
                  >
                    {product.available ? t.admin.deactivate : t.admin.activate}
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
