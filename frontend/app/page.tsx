import Link from "next/link";
import type { Metadata } from "next";
import Carousel from "./components/Carousel";
import ProductGrid from "./components/ProductGrid";
import {
  COLLECTION_TYPES,
  fetchCollections,
  fetchProducts,
  fetchVisitorCurrency,
  type Collection,
  type ProductPage,
} from "./lib/api";
import { getDictionary, getLocale } from "./lib/i18n";
import { pageMetadata } from "./lib/metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = getLocale();
  const t = getDictionary(locale);
  return pageMetadata({
    locale,
    title: t.meta.title,
    description: t.meta.description,
    path: "/",
  });
}

function HomeSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <h2 className="flex items-center gap-3 text-xl font-semibold text-slate-900">
        <span className="h-5 w-1 rounded-full bg-brand-500" aria-hidden="true" />
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default async function Home() {
  const locale = getLocale();
  const t = getDictionary(locale);

  const [collections, newest, currency] = await Promise.all([
    fetchCollections().catch(() => [] as Collection[]),
    fetchProducts(new URLSearchParams({ sort: "newest", page_size: "8" })).catch(
      () => null as ProductPage | null,
    ),
    fetchVisitorCurrency(), // degrades to USD internally; never rejects
  ]);

  const byType = new Map(collections.map((collection) => [collection.type, collection]));
  const section = (type: (typeof COLLECTION_TYPES)[number]) =>
    byType.get(type)?.products ?? [];
  const carousel = section("carousel");
  const popular = section("popular");
  const promotions = section("promo");

  return (
    <main className="mx-auto max-w-6xl px-8 py-8">
      <section className="rounded-3xl bg-gradient-to-r from-brand-800 via-brand-600 to-brand-500 px-8 py-14 text-white sm:px-12">
        <p className="text-sm font-semibold uppercase tracking-widest text-brand-100">
          Theia
        </p>
        <h1 className="mt-3 max-w-2xl text-3xl font-bold leading-tight sm:text-4xl">
          {t.home.heroTitle}
        </h1>
        <p className="mt-4 max-w-xl text-brand-50">{t.home.heroSubtitle}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/productos"
            data-testid="hero-products-cta"
            className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-brand-800 shadow-sm hover:bg-brand-50"
          >
            {t.home.heroCta}
          </Link>
          <Link
            href="/cotizacion"
            className="rounded-lg border border-white/40 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
          >
            {t.home.heroQuoteCta}
          </Link>
        </div>
      </section>
      {carousel.length > 0 && (
        <div className="mt-8">
          <Carousel products={carousel} t={t.home} />
        </div>
      )}
      {newest && (
        <HomeSection title={t.home.loNuevo}>
          <ProductGrid products={newest.items} currency={currency} />
        </HomeSection>
      )}
      {popular.length > 0 && (
        <HomeSection title={t.home.popular}>
          <ProductGrid products={popular} currency={currency} />
        </HomeSection>
      )}
      {promotions.length > 0 && (
        <HomeSection title={t.home.promotions}>
          <ProductGrid products={promotions} currency={currency} />
        </HomeSection>
      )}
    </main>
  );
}
