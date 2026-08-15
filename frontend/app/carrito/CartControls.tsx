"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Dictionary } from "../lib/i18n";
import { removeCartItem, updateCartItem } from "../lib/cart-actions";

export default function CartControls({
  itemId,
  quantity,
  t,
}: {
  itemId: number;
  quantity: number;
  t: Dictionary["cart"];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function update(next: number) {
    if (next < 1) {
      return;
    }
    startTransition(async () => {
      try {
        await updateCartItem(itemId, next);
        router.refresh();
      } catch {
        // Transient failure: buttons re-enable, state is untouched.
      }
    });
  }

  function remove() {
    startTransition(async () => {
      try {
        await removeCartItem(itemId);
        router.refresh();
      } catch {
        // Transient failure: buttons re-enable, state is untouched.
      }
    });
  }

  const buttonClass =
    "h-7 w-7 rounded-md border border-slate-300 text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-50";

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1">
        <button
          type="button"
          data-testid="qty-minus"
          aria-label={t.quantity}
          onClick={() => update(quantity - 1)}
          disabled={pending || quantity <= 1}
          className={buttonClass}
        >
          −
        </button>
        <span className="w-8 text-center text-sm font-medium text-slate-900">{quantity}</span>
        <button
          type="button"
          data-testid="qty-plus"
          aria-label={t.quantity}
          onClick={() => update(quantity + 1)}
          disabled={pending}
          className={buttonClass}
        >
          +
        </button>
      </div>
      <button
        type="button"
        data-testid="remove-item"
        onClick={remove}
        disabled={pending}
        className="text-sm text-slate-500 hover:text-red-600 disabled:opacity-50"
      >
        {t.remove}
      </button>
    </div>
  );
}
