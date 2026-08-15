"use client";

import { useState } from "react";
import type { Dictionary } from "../lib/i18n";
import { submitQuote, type QuoteError } from "../lib/quote-actions";

// Quote kind values mirror the backend (app/models/quote.py); kept inline
// because this is a client component and api.ts imports next/headers.
const KIND_PRODUCT = "product";

const inputClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none";

const labelClass = "mb-1 block text-sm font-medium text-slate-700";

export type QuoteProduct = { slug: string; name: string };

export default function QuoteForm({
  t,
  products,
  initialProductSlug,
  initialKind,
}: {
  t: Dictionary["quote"];
  products: QuoteProduct[];
  initialProductSlug?: string | null;
  initialKind?: "used" | "rental" | null;
}) {
  const [error, setError] = useState<QuoteError | null>(null);
  const [pending, setPending] = useState(false);
  const [kind, setKind] = useState<string>(initialKind ?? KIND_PRODUCT);
  const isProduct = kind === KIND_PRODUCT;

  async function submit(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await submitQuote(formData);
    if (result.error) {
      setError(result.error);
      setPending(false);
    }
  }

  const errorMessage =
    error === "invalid_product" ? t.errorInvalidProduct : t.errorGeneric;

  return (
    <form action={submit} className="mt-6 space-y-5">
      {error && (
        <p data-testid="quote-error" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </p>
      )}

      <fieldset>
        <legend className="text-sm font-semibold text-slate-900">{t.kind}</legend>
        <div className="mt-2 flex flex-wrap gap-6 text-sm text-slate-700">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="kind"
              value="product"
              defaultChecked={kind === "product"}
              onChange={() => setKind("product")}
              data-testid="quote-kind-product"
              className="accent-slate-900"
            />
            {t.kindProduct}
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="kind"
              value="used"
              defaultChecked={kind === "used"}
              onChange={() => setKind("used")}
              data-testid="quote-kind-used"
              className="accent-slate-900"
            />
            {t.kindUsed}
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="kind"
              value="rental"
              defaultChecked={kind === "rental"}
              onChange={() => setKind("rental")}
              data-testid="quote-kind-rental"
              className="accent-slate-900"
            />
            {t.kindRental}
          </label>
        </div>
      </fieldset>

      {isProduct && (
        <div>
          <label htmlFor="quote-product" className={labelClass}>
            {t.product}
          </label>
          <select
            id="quote-product"
            name="product_slug"
            required
            defaultValue={initialProductSlug ?? ""}
            data-testid="quote-product"
            className={inputClass}
          >
            <option value="" disabled>
              {t.productPlaceholder}
            </option>
            {products.map((product) => (
              <option key={product.slug} value={product.slug}>
                {product.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="quote-name" className={labelClass}>
            {t.name}
          </label>
          <input
            id="quote-name"
            name="name"
            required
            placeholder={t.namePlaceholder}
            data-testid="quote-name"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="quote-phone" className={labelClass}>
            {t.phone}
          </label>
          <input
            id="quote-phone"
            type="tel"
            name="phone"
            required
            placeholder={t.phonePlaceholder}
            data-testid="quote-phone"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="quote-email" className={labelClass}>
          {t.email}
        </label>
        <input
          id="quote-email"
          type="email"
          name="email"
          required
          placeholder={t.emailPlaceholder}
          data-testid="quote-email"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="quote-message" className={labelClass}>
          {t.message}
        </label>
        <textarea
          id="quote-message"
          name="message"
          rows={3}
          placeholder={t.messagePlaceholder}
          data-testid="quote-message"
          className={inputClass}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        data-testid="quote-submit"
        className="rounded-md bg-slate-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {t.submit}
      </button>
    </form>
  );
}
