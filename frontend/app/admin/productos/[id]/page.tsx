import Link from "next/link";
import {
  fetchAdminBrands,
  fetchAdminCategories,
  fetchAdminProduct,
  type AdminBrand,
  type AdminCategory,
  type AdminProduct,
} from "../../../lib/api";
import { getDictionary, getLocale } from "../../../lib/i18n";
import ProductForm from "../ProductForm";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const locale = getLocale();
  const t = getDictionary(locale);
  let product: AdminProduct | null = null;
  let categories: AdminCategory[] = [];
  let brands: AdminBrand[] = [];
  try {
    [product, categories, brands] = await Promise.all([
      fetchAdminProduct(Number(params.id)),
      fetchAdminCategories(),
      fetchAdminBrands(),
    ]);
  } catch {
    product = null;
    categories = [];
    brands = [];
  }

  if (!product) {
    return (
      <main className="mx-auto max-w-3xl p-8">
        <h1 className="text-2xl font-semibold text-slate-900">{t.admin.productNotFound}</h1>
        <Link
          href="/admin/productos"
          className="mt-4 inline-block text-sm text-slate-600 hover:text-brand-700"
        >
          {t.admin.productsTitle}
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="text-2xl font-semibold text-slate-900">{t.admin.editProduct}</h1>
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
        <ProductForm
          t={t.admin}
          product={product}
          categories={categories}
          brands={brands}
          productId={product.id}
        />
      </div>
    </main>
  );
}
