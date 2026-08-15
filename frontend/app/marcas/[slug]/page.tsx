import { notFound } from "next/navigation";
import CatalogListing from "../../components/CatalogListing";
import { fetchBrands, fetchProducts, fetchVisitorCurrency } from "../../lib/api";

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
  let currency;
  try {
    [brands, page, currency] = await Promise.all([
      fetchBrands(),
      fetchProducts(
        new URLSearchParams({
          brand: params.slug,
          sort: "newest",
          page: String(pageNumber),
        })
      ),
      fetchVisitorCurrency(),
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
      currency={currency}
      buildPageUrl={(target) => `/marcas/${params.slug}?page=${target}`}
    />
  );
}
