import { fetchAdminCategories, type AdminCategory } from "../../lib/api";
import { getDictionary, getLocale } from "../../lib/i18n";
import { deleteCategory, saveCategory } from "../../lib/admin-actions";
import NameManager from "../NameManager";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const locale = getLocale();
  const t = getDictionary(locale);
  let categories: AdminCategory[] = [];
  try {
    categories = await fetchAdminCategories();
  } catch {
    categories = [];
  }

  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="text-2xl font-semibold text-slate-900">{t.admin.categoriesTitle}</h1>
      <div className="mt-6">
        <NameManager
          t={t.admin}
          items={categories}
          itemTestid="admin-category"
          emptyLabel={t.admin.noCategories}
          save={saveCategory}
          remove={deleteCategory}
        />
      </div>
    </main>
  );
}
