import { fetchAdminBrands, type AdminBrand } from "../../lib/api";
import { getDictionary, getLocale } from "../../lib/i18n";
import { deleteBrand, saveBrand } from "../../lib/admin-actions";
import NameManager from "../NameManager";

export const dynamic = "force-dynamic";

export default async function AdminBrandsPage() {
  const locale = getLocale();
  const t = getDictionary(locale);
  let brands: AdminBrand[] = [];
  try {
    brands = await fetchAdminBrands();
  } catch {
    brands = [];
  }

  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="text-2xl font-semibold text-slate-900">{t.admin.brandsTitle}</h1>
      <div className="mt-6">
        <NameManager
          t={t.admin}
          items={brands}
          itemTestid="admin-brand"
          emptyLabel={t.admin.noBrands}
          save={saveBrand}
          remove={deleteBrand}
        />
      </div>
    </main>
  );
}
