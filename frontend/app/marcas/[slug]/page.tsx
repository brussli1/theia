import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CatalogListing from "../../components/CatalogListing";
import {
  fetchBrands,
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
  let brands: Facet[] = [];
  try {
    brands = await fetchBrands();
  } catch {
    // Fall through to the generic catalog metadata.
  }
  const brand = brands.find((facet) => facet.slug === params.slug);
  if (!brand) {
    return pageMetadata({
      locale,
      title: `${page.title} — Theia`,
      description: page.description,
      path: "/productos",
    });
  }
  return pageMetadata({
    locale,
    title: `${brand.name} — Theia`,
    description: `${brand.name}: ${page.description}`,
    path: `/marcas/${brand.slug}`,
  });
}

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
