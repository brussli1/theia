import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CatalogListing from "../../components/CatalogListing";
import {
  fetchCategories,
  fetchProducts,
  fetchVisitorCurrency,
  type CategoryFacet,
} from "../../lib/api";
import { buildCategoryTree, findNodeBySlug } from "../../lib/categories";
import { getDictionary, getLocale } from "../../lib/i18n";
import { pageMetadata } from "../../lib/metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const locale = getLocale();
  const t = getDictionary(locale);
  const page = t.pages.catalog;
  let categories: CategoryFacet[] = [];
  try {
    categories = await fetchCategories();
  } catch {
    // Fall through to the generic catalog metadata.
  }
  const category = categories.find((facet) => facet.slug === params.slug);
  if (!category) {
    return pageMetadata({
      locale,
      title: `${page.title} — Theia`,
      description: page.description,
      path: "/productos",
    });
  }
  return pageMetadata({
    locale,
    title: `${category.name} — Theia`,
    description: `${category.name}: ${page.description}`,
    path: `/categorias/${category.slug}`,
  });
}

export default async function CategoriaPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { page?: string };
}) {
  let categories;
  try {
    categories = await fetchCategories();
  } catch {
    notFound();
  }
  const tree = buildCategoryTree(categories);
  const category = findNodeBySlug(tree, params.slug);
  if (!category) {
    notFound();
  }

  if (category.children.length > 0) {
    return (
      <main className="mx-auto max-w-6xl px-8 py-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          {category.name}
        </h1>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {category.children.map((child) => (
            <Link
              key={child.slug}
              href={`/categorias/${child.slug}`}
              data-testid="child-category-link"
              className="rounded-xl border border-slate-200 bg-white p-6 text-sm font-medium text-slate-900 transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md"
            >
              {child.name}
            </Link>
          ))}
        </div>
      </main>
    );
  }

  const pageNumber = Math.max(1, Number(searchParams.page) || 1);
  let page;
  let currency;
  try {
    [page, currency] = await Promise.all([
      fetchProducts(
        new URLSearchParams({
          category: params.slug,
          sort: "newest",
          page: String(pageNumber),
        })
      ),
      fetchVisitorCurrency(),
    ]);
  } catch {
    notFound();
  }

  return (
    <CatalogListing
      title={category.name}
      total={page.total}
      products={page.items}
      page={page.page}
      pages={page.pages}
      currency={currency}
      buildPageUrl={(target) => `/categorias/${params.slug}?page=${target}`}
    />
  );
}
