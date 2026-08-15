import Link from "next/link";
import AuthForms from "../cuenta/AuthForms";
import { fetchCurrentUser, type User } from "../lib/api";
import { getDictionary, getLocale } from "../lib/i18n";

export const dynamic = "force-dynamic";

/** The panel gate (#15): signed-out visitors get the login form, customers an
 * access-denied message, admins the panel with its section nav. Renders once
 * per navigation; the login redirect is a full reload, so the gate re-runs
 * with the fresh session. */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = getLocale();
  const t = getDictionary(locale);
  let user: User | null = null;
  try {
    user = await fetchCurrentUser();
  } catch {
    user = null;
  }

  if (!user) {
    // `welcome` is a function; client components only receive serializable
    // strings, so it is excluded from the props passed to AuthForms.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { welcome: _welcome, ...accountStrings } = t.account;
    return (
      <main className="mx-auto max-w-4xl p-8">
        <h1 className="text-2xl font-semibold text-slate-900">{t.admin.loginTitle}</h1>
        <p className="mt-2 text-sm text-slate-500">{t.admin.loginSubtitle}</p>
        <div className="mt-8">
          <AuthForms t={accountStrings} />
        </div>
      </main>
    );
  }

  if (user.role !== "admin") {
    return (
      <main className="mx-auto max-w-4xl p-8">
        <h1 className="text-2xl font-semibold text-slate-900">{t.admin.accessDenied}</h1>
        <Link href="/" className="mt-4 inline-block text-sm text-slate-600 hover:text-slate-900">
          {t.admin.backToStore}
        </Link>
      </main>
    );
  }

  const sections = [
    { href: "/admin", label: t.admin.dashboard, testid: "admin-nav-dashboard" },
    { href: "/admin/productos", label: t.admin.products, testid: "admin-nav-products" },
    { href: "/admin/categorias", label: t.admin.categories, testid: "admin-nav-categories" },
    { href: "/admin/marcas", label: t.admin.brands, testid: "admin-nav-brands" },
    { href: "/admin/colecciones", label: t.admin.collections, testid: "admin-nav-collections" },
    { href: "/admin/pedidos", label: t.admin.orders, testid: "admin-nav-orders" },
    { href: "/admin/cotizaciones", label: t.admin.quotes, testid: "admin-nav-quotes" },
  ];

  return (
    <div>
      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 p-4 text-sm">
          <span className="text-lg font-semibold text-slate-900">Theia</span>
          {sections.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              data-testid={section.testid}
              className="text-slate-600 hover:text-slate-900"
            >
              {section.label}
            </Link>
          ))}
          <Link
            href="/"
            className="ml-auto text-slate-600 hover:text-slate-900"
          >
            {t.admin.backToStore}
          </Link>
        </div>
      </nav>
      {children}
    </div>
  );
}
