import { notFound } from "next/navigation";
import CatalogListing from "../../components/CatalogListing";
import { fetchBrands, fetchProducts } from "../../lib/api";

export const dynamic = "force-dynamic";

export default async function MarcaPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { page?: string };
}) {
  const pageNumber = Math.max(1, Number(searchParams.page) || 1);
  let brands;
  let page;
  try {
    [brands, page] = await Promise.all([
      fetchBrands(),
      fetchProducts(
        new URLSearchParams({
          brand: params.slug,
          sort: "newest",
          page: String(pageNumber),
        })
      ),
    ]);
  } catch {
    notFound();
  }
  const brand = brands.find((facet) => facet.slug === params.slug);
  if (!brand) {
    notFound();
  }

  return (
    <CatalogListing
      title={brand.name}
      total={page.total}
      products={page.items}
      page={page.page}
      pages={page.pages}
      buildPageUrl={(target) => `/marcas/${params.slug}?page=${target}`}
    />
  );
}
