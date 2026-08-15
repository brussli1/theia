import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CatalogListing from "../../components/CatalogListing";
import {
  fetchCategories,
  fetchProducts,
  fetchVisitorCurrency,
  type Facet,
} from "../../lib/api";
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
  let categories: Facet[] = [];
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
  const pageNumber = Math.max(1, Number(searchParams.page) || 1);
  let categories;
  let page;
  let currency;
  try {
    [categories, page, currency] = await Promise.all([
      fetchCategories(),
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
  const category = categories.find((facet) => facet.slug === params.slug);
  if (!category) {
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
