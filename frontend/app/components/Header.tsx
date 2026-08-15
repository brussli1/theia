import Link from "next/link";
import { fetchCart, fetchCategories, fetchCurrentUser, type Facet } from "../lib/api";
import { getDictionary, getLocale } from "../lib/i18n";
import LocaleSwitcher from "./LocaleSwitcher";
import NavLink from "./NavLink";

export default async function Header() {
  const locale = getLocale();
  const t = getDictionary(locale);
  let categories: Facet[] = [];
  try {
    categories = await fetchCategories();
  } catch {
    categories = [];
  }
  let cartCount = 0;
  try {
    const cart = await fetchCart();
    cartCount = cart.total_items;
  } catch {
    cartCount = 0;
  }
  let isAdmin = false;
  try {
    isAdmin = (await fetchCurrentUser())?.role === "admin";
  } catch {
    isAdmin = false;
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-8">
        <Link href="/" className="text-xl font-bold tracking-tight text-slate-900">
          Theia<span className="text-brand-600">.</span>
        </Link>
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-1">
          <NavLink href="/productos">{t.header.products}</NavLink>
          {categories.map((category) => (
            <NavLink key={category.slug} href={`/categorias/${category.slug}`}>
              {category.name}
            </NavLink>
          ))}
          <NavLink href="/cotizacion">{t.header.quotes}</NavLink>
          <NavLink href="/usados">{t.pages.footer.used}</NavLink>
          <NavLink href="/alquiler">{t.pages.footer.rentals}</NavLink>
          <NavLink href="/contacto">{t.pages.footer.contact}</NavLink>
        </nav>
        <div className="ml-auto flex items-center gap-4">
          {isAdmin && (
            <Link
              href="/admin"
              data-testid="header-admin-link"
              className="text-sm font-medium text-brand-700 hover:text-brand-800"
            >
              {t.admin.dashboard}
            </Link>
          )}
          <NavLink href="/cuenta" className="whitespace-nowrap">
            {t.header.account}
          </NavLink>
          <Link href="/carrito" className="relative text-sm text-slate-600 hover:text-brand-700">
            {t.cart.title}
            {cartCount > 0 && (
              <span
                data-testid="cart-badge"
                className="absolute -right-3 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-xs font-semibold text-white"
              >
                {cartCount}
              </span>
            )}
          </Link>
          <LocaleSwitcher currentLocale={locale} />
        </div>
      </div>
    </header>
  );
}
