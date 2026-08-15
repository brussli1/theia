"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Dictionary } from "../lib/i18n";

const inputClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none";

type AdminStrings = Dictionary["admin"];

export type NamedItem = { id: number; name: string; slug: string };

/** Shared manager for categories and brands (#15): a create form on top and
 * each row editable in place (rename / delete). Mutations go through the
 * given server actions, then the router refreshes to re-render the list. */
export default function NameManager({
  t,
  items,
  itemTestid,
  emptyLabel,
  save,
  remove,
}: {
  t: AdminStrings;
  items: NamedItem[];
  itemTestid: string;
  emptyLabel: string;
  save: (formData: FormData, id: number | null) => Promise<void>;
  remove: (id: number) => Promise<void>;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function handleSave(formData: FormData, id: number | null) {
    setError(null);
    try {
      await save(formData, id);
      router.refresh();
    } catch {
      setError(t.errorGeneric);
    }
  }

  async function handleRemove(id: number) {
    if (!window.confirm(t.deleteConfirm)) {
      return;
    }
    setError(null);
    try {
      await remove(id);
      router.refresh();
    } catch {
      setError(t.errorGeneric);
    }
  }

  return (
    <div data-testid={itemTestid}>
      {error && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      <form
        action={(formData) => handleSave(formData, null)}
        className="flex items-end gap-3"
        data-testid={`${itemTestid}-create`}
      >
        <div className="flex-1">
          <label htmlFor={`new-${itemTestid}-name`} className="mb-1 block text-sm font-medium text-slate-700">
            {t.name}
          </label>
          <input
            id={`new-${itemTestid}-name`}
            name="name"
            required
            placeholder={t.namePlaceholder}
            data-testid={`${itemTestid}-create-name`}
            className={inputClass}
          />
        </div>
        <button
          type="submit"
          data-testid={`${itemTestid}-create-submit`}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          {t.save}
        </button>
      </form>

      {items.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">{emptyLabel}</p>
      ) : (
        <ul className="mt-6 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
          {items.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4">
              <form
                action={(formData) => handleSave(formData, item.id)}
                className="flex flex-1 items-center gap-3"
              >
                <input
                  name="name"
                  defaultValue={item.name}
                  data-testid={`${itemTestid}-name`}
                  className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none"
                />
                <button
                  type="submit"
                  data-testid={`${itemTestid}-save`}
                  className="text-sm font-medium text-slate-700 hover:text-brand-700"
                >
                  {t.save}
                </button>
              </form>
              <span className="text-xs text-slate-400">{item.slug}</span>
              <button
                type="button"
                onClick={() => handleRemove(item.id)}
                data-testid={`${itemTestid}-delete`}
                className="text-sm text-slate-500 hover:text-red-700"
              >
                {t.delete}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
