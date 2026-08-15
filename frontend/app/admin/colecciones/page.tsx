import {
  fetchAdminCollections,
  fetchAdminProducts,
  type AdminCollection,
  type AdminProduct,
} from "../../lib/api";
import { getDictionary, getLocale } from "../../lib/i18n";
import { saveCollection } from "../../lib/admin-actions";
import CollectionForm from "./CollectionForm";

export const dynamic = "force-dynamic";

export default async function AdminCollectionsPage() {
  const locale = getLocale();
  const t = getDictionary(locale);
  let products: AdminProduct[] = [];
  let collections: AdminCollection[] = [];
  try {
    [products, collections] = await Promise.all([
      fetchAdminProducts(),
      fetchAdminCollections(),
    ]);
  } catch {
    products = [];
    collections = [];
  }

  const byType = new Map(collections.map((collection) => [collection.type, collection]));
  const collectionTypes = ["carousel", "popular", "promo"] as const;

  return (
    <main className="mx-auto max-w-5xl p-8">
      <h1 className="text-2xl font-semibold text-slate-900">{t.admin.collectionsTitle}</h1>
      <p className="mt-2 text-sm text-slate-500">{t.admin.collectionsSubtitle}</p>
      <div className="mt-8 space-y-6">
        {collectionTypes.map((collectionType) => (
          <CollectionForm
            key={collectionType}
            t={t.admin}
            collectionType={collectionType}
            products={products}
            currentIds={byType.get(collectionType)?.product_ids ?? []}
            save={saveCollection}
          />
        ))}
      </div>
    </main>
  );
}
