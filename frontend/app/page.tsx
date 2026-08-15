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

export const dynamic = "force-dynamic";

function HomeSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
      {children}
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
    <main className="mx-auto max-w-6xl p-8">
      {carousel.length > 0 && <Carousel products={carousel} t={t.home} />}
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
