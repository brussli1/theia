import type { Metadata } from "next";
import type { Locale } from "./i18n";

/** Canonical site URL for metadata, sitemap and robots (#17); override at
 *  deploy time with SITE_URL. */
export const SITE_URL = (process.env.SITE_URL ?? "http://localhost:3000").replace(
  /\/$/,
  "",
);

const MAX_DESCRIPTION_LENGTH = 160;

/** Builds per-page metadata with Open Graph tags (#17). Server context only:
 *  pages, layouts, sitemap and robots. `title` is the full document title;
 *  `path` is the route used for the canonical URL and Open Graph url. */
export function pageMetadata(opts: {
  locale: Locale;
  title: string;
  description: string;
  path: string;
  noIndex?: boolean;
  images?: string[];
}): Metadata {
  const { locale, title, description, path, noIndex, images } = opts;
  const url = `${SITE_URL}${path}`;
  const summary =
    description.length > MAX_DESCRIPTION_LENGTH
      ? `${description.slice(0, MAX_DESCRIPTION_LENGTH - 1).trimEnd()}…`
      : description;
  const absoluteImages = images?.filter((src) => /^https?:\/\//.test(src)) ?? [];
  return {
    title,
    description: summary,
    alternates: { canonical: url },
    robots: noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      title,
      description: summary,
      url,
      siteName: "Theia",
      type: "website",
      locale: locale === "es" ? "es_PY" : "en_US",
      ...(absoluteImages.length > 0
        ? { images: absoluteImages.map((image) => ({ url: image })) }
        : {}),
    },
  };
}
