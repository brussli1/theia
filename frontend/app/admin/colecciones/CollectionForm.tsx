"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Dictionary } from "../../lib/i18n";
import type { AdminProduct } from "../../lib/api";

type AdminStrings = Dictionary["admin"];

/** One curated collection (#15): the ordered list on the left, available
 * products to pick from on the right. Order is set by adding products and
 * moving them up/down; saving replaces the collection wholesale. */
export default function CollectionForm({
  t,
  collectionType,
  products,
  currentIds,
  save,
}: {
  t: AdminStrings;
  collectionType: string;
  products: AdminProduct[];
  currentIds: number[];
  save: (collectionType: string, productIds: number[]) => Promise<void>;
}) {
  const router = useRouter();
  const [order, setOrder] = useState<number[]>(currentIds);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const byId = new Map(products.map((product) => [product.id, product]));
  const available = products.filter((product) => !order.includes(product.id));

  function addProduct(productId: number) {
    setOrder((current) => [...current, productId]);
  }

  function removeProduct(productId: number) {
    setOrder((current) => current.filter((id) => id !== productId));
  }

  function moveProduct(index: number, delta: number) {
    setOrder((current) => {
      const target = index + delta;
      if (target < 0 || target >= current.length) {
        return current;
      }
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function handleSave() {
    setPending(true);
    setError(null);
    try {
      await save(collectionType, order);
      router.refresh();
    } catch {
      setError(t.errorGeneric);
    } finally {
      setPending(false);
    }
  }

  return (
    <section
      data-testid={`admin-collection-${collectionType}`}
      className="rounded-xl border border-slate-200 bg-white p-6"
    >
      <h2 className="text-lg font-semibold text-slate-900">{t[collectionType as "carousel"]}</h2>

      {error && (
        <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="mt-4 grid gap-6 md:grid-cols-2">
        <div>
          <span className="mb-2 block text-sm font-medium text-slate-700">{t.products}</span>
          {order.length === 0 ? (
            <p className="text-sm text-slate-500">{t.collectionEmpty}</p>
          ) : (
            <ul data-testid="admin-collection-order" className="space-y-2">
              {order.map((productId, index) => {
                const product = byId.get(productId);
                return (
                  <li
                    key={productId}
                    data-testid="admin-collection-order-item"
                    className="flex items-center gap-2 rounded-md border border-slate-100 p-2 text-sm"
                  >
                    <span className="min-w-0 flex-1 truncate text-slate-900">
                      {product?.name ?? productId}
                    </span>
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => moveProduct(index, -1)}
                      aria-label={t.moveUp}
                      data-testid="admin-collection-up"
                      className="text-slate-500 hover:text-brand-700 disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      disabled={index === order.length - 1}
                      onClick={() => moveProduct(index, 1)}
                      aria-label={t.moveDown}
                      data-testid="admin-collection-down"
                      className="text-slate-500 hover:text-brand-700 disabled:opacity-30"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => removeProduct(productId)}
                      data-testid="admin-collection-remove"
                      className="text-slate-500 hover:text-red-700"
                    >
                      {t.removeFromCollection}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div>
          <span className="mb-2 block text-sm font-medium text-slate-700">{t.available}</span>
          {available.length === 0 ? (
            <p className="text-sm text-slate-500">{t.noProducts}</p>
          ) : (
            <ul data-testid="admin-collection-available" className="max-h-64 space-y-1 overflow-y-auto">
              {available.map((product) => (
                <li key={product.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="min-w-0 truncate text-slate-700">{product.name}</span>
                  <button
                    type="button"
                    onClick={() => addProduct(product.id)}
                    data-testid="admin-collection-add"
                    className="shrink-0 text-sm font-medium text-slate-700 hover:text-brand-700"
                  >
                    {t.addToCollection}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={pending}
        data-testid="admin-collection-save"
        className="mt-4 rounded-md bg-brand-600 px-5 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {t.saveCollection}
      </button>
    </section>
  );
}
