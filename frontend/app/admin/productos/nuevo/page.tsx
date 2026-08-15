import { fetchAdminBrands, fetchAdminCategories, type AdminBrand, type AdminCategory } from "../../../lib/api";
import { getDictionary, getLocale } from "../../../lib/i18n";
import ProductForm from "../ProductForm";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const locale = getLocale();
  const t = getDictionary(locale);
  let categories: AdminCategory[] = [];
  let brands: AdminBrand[] = [];
  try {
    [categories, brands] = await Promise.all([fetchAdminCategories(), fetchAdminBrands()]);
  } catch {
    categories = [];
    brands = [];
  }

  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="text-2xl font-semibold text-slate-900">{t.admin.newProduct}</h1>
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
        <ProductForm t={t.admin} categories={categories} brands={brands} productId={null} />
      </div>
    </main>
  );
}
