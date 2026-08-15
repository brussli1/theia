import Link from "next/link";
import { getDictionary, getLocale } from "../lib/i18n";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const locale = getLocale();
  const t = getDictionary(locale);

  const sections = [
    { href: "/admin/productos", label: t.admin.products, testid: "admin-dashboard-products" },
    { href: "/admin/categorias", label: t.admin.categories, testid: "admin-dashboard-categories" },
    { href: "/admin/marcas", label: t.admin.brands, testid: "admin-dashboard-brands" },
    { href: "/admin/colecciones", label: t.admin.collections, testid: "admin-dashboard-collections" },
    { href: "/admin/pedidos", label: t.admin.orders, testid: "admin-dashboard-orders" },
    { href: "/admin/cotizaciones", label: t.admin.quotes, testid: "admin-dashboard-quotes" },
  ];

  return (
    <main data-testid="admin-dashboard" className="mx-auto max-w-6xl p-8">
      <h1 className="text-2xl font-semibold text-slate-900">{t.admin.dashboardTitle}</h1>
      <p className="mt-2 text-sm text-slate-500">{t.admin.dashboardSubtitle}</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            data-testid={section.testid}
            className="rounded-xl border border-slate-200 bg-white p-6 text-sm font-medium text-slate-900 hover:border-slate-400"
          >
            {section.label}
          </Link>
        ))}
      </div>
    </main>
  );
}
