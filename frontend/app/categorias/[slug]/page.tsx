import { notFound } from "next/navigation";
import CatalogListing from "../../components/CatalogListing";
import { fetchCategories, fetchProducts } from "../../lib/api";

export const dynamic = "force-dynamic";

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
  try {
    [categories, page] = await Promise.all([
      fetchCategories(),
      fetchProducts(
        new URLSearchParams({
          category: params.slug,
          sort: "newest",
          page: String(pageNumber),
        })
      ),
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
      buildPageUrl={(target) => `/categorias/${params.slug}?page=${target}`}
    />
  );
}
