"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Dictionary } from "../../lib/i18n";
import { addToCart } from "../../lib/cart-actions";

export default function AddToCartButton({
  slug,
  t,
}: {
  slug: string;
  t: Dictionary["product"];
}) {
  const router = useRouter();
  const [added, setAdded] = useState(false);
  const [pending, startTransition] = useTransition();

  function add() {
    startTransition(async () => {
      try {
        await addToCart(slug);
        setAdded(true);
        router.refresh();
      } catch {
        // Transient failure: keep the button actionable, no false success.
      }
    });
  }

  return (
    <button
      type="button"
      data-testid="add-to-cart"
      onClick={add}
      disabled={pending}
      className="rounded-md bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-70"
    >
      {added ? t.added : t.addToCart}
    </button>
  );
}
