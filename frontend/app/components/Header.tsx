import Link from "next/link";
import { fetchCategories, type Facet } from "../lib/api";
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
        <div className="ml-auto">
          <LocaleSwitcher currentLocale={locale} />
        </div>
      </div>
    </header>
  );
}
