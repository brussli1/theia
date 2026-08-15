import type { MetadataRoute } from "next";
import { fetchBrands, fetchCategories, fetchProducts } from "./lib/api";
import { SITE_URL } from "./lib/metadata";

/** Catalog sitemap (#17): the static routes always, plus the live catalog's
 *  products, categories and brands when the backend is reachable. Dynamic so
 *  the product URLs stay current in production. */
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    "",
    "/productos",
    "/cotizacion",
    "/pedido",
    "/soporte",
    "/contacto",
    "/mapa",
    "/tos",
    "/privacidad",
    "/usados",
    "/alquiler",
  ];
  const routes: MetadataRoute.Sitemap = staticRoutes.map((path) => ({
    url: `${SITE_URL}${path}`,
  }));

  try {
    const [categories, brands] = await Promise.all([fetchCategories(), fetchBrands()]);
    routes.push(
      ...categories.map((category) => ({
        url: `${SITE_URL}/categorias/${category.slug}`,
      })),
      ...brands.map((brand) => ({
        url: `${SITE_URL}/marcas/${brand.slug}`,
      })),
    );
  } catch {
    // Taxonomy unreachable: keep the content routes.
  }

  try {
    // The backend caps page_size at 100; walk the pages to cover the catalog
    // (the loop bound keeps this cheap even for a large catalog).
    let pageNumber = 1;
    let pages = 1;
    while (pageNumber <= pages && pageNumber <= 10) {
      const page = await fetchProducts(
        new URLSearchParams({ page: String(pageNumber), page_size: "100" }),
      );
      routes.push(
        ...page.items.map((product) => ({
          url: `${SITE_URL}/productos/${product.slug}`,
        })),
      );
      pages = page.pages;
      pageNumber += 1;
    }
  } catch {
    // Catalog unreachable: serve the content routes rather than failing.
  }

  return routes;
}
