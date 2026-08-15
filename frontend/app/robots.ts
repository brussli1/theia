import type { MetadataRoute } from "next";
import { SITE_URL } from "./lib/metadata";

/** Robots policy (#17): the storefront is crawlable; the admin panel and
 *  account/transactional pages are not. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/cuenta",
        "/carrito",
        "/finalizar-compra",
        "/pedido/",
        "/cotizacion/",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
