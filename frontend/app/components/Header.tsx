import Link from "next/link";
import { fetchCart, fetchCategories, fetchCurrentUser, type Facet } from "../lib/api";
import { getDictionary, getLocale } from "../lib/i18n";
import LocaleSwitcher from "./LocaleSwitcher";

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
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 p-4">
        <Link href="/" className="text-lg font-semibold text-slate-900">
          Theia
        </Link>
        <nav className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
          <Link href="/productos" className="hover:text-slate-900">
            {t.header.products}
          </Link>
          <Link href="/cotizacion" className="hover:text-slate-900">
            {t.header.quotes}
          </Link>
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/categorias/${category.slug}`}
              className="hover:text-slate-900"
            >
              {category.name}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-4">
          {isAdmin && (
            <Link href="/admin" className="text-sm font-medium text-slate-600 hover:text-slate-900">
              {t.admin.dashboard}
            </Link>
          )}
          <Link href="/cuenta" className="text-sm text-slate-600 hover:text-slate-900">
            {t.header.account}
          </Link>
          <Link href="/carrito" className="relative text-sm text-slate-600 hover:text-slate-900">
            {t.cart.title}
            {cartCount > 0 && (
              <span
                data-testid="cart-badge"
                className="absolute -right-3 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-900 px-1 text-xs font-semibold text-white"
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
