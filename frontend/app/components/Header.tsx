import Link from "next/link";
import { fetchCategories, type Facet } from "../lib/api";

export default async function Header() {
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
            Productos
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
      </div>
    </header>
  );
}
