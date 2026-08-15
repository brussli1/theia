"use client";

import { useState } from "react";
import type { Dictionary } from "../lib/i18n";
import { placeOrder, type CheckoutError } from "../lib/checkout-actions";

const inputClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none";

const labelClass = "mb-1 block text-sm font-medium text-slate-700";

export default function CheckoutForm({ t }: { t: Dictionary["checkout"] }) {
  const [error, setError] = useState<CheckoutError | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await placeOrder(formData);
    if (result.error) {
      setError(result.error);
      setPending(false);
      return;
    }
    if (result.redirectUrl) {
      // Gateway methods (PayPal, card): the customer pays at the gateway and is
      // sent back to the order page, which confirms the payment.
      window.location.assign(result.redirectUrl);
    }
  }

  // "Paraguay" is the country default; switching to international delivery
  // clears it so the customer has to enter the real destination.
  function onDeliveryChange(value: string) {
    const country = document.getElementById("checkout-country") as HTMLInputElement | null;
    if (value === "international" && country?.value === "Paraguay") {
      country.value = "";
    }
  }

  const errorMessage =
    error === "cart_empty"
      ? t.errorEmpty
      : error === "unavailable"
        ? t.errorUnavailable
        : t.errorGeneric;

  return (
    <form action={submit} className="space-y-5">
      {error && (
        <p data-testid="checkout-error" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </p>
      )}

      <fieldset>
        <legend className="text-sm font-semibold text-slate-900">{t.delivery}</legend>
        <div className="mt-2 flex gap-6 text-sm text-slate-700">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="delivery_type"
              value="local"
              defaultChecked
              data-testid="delivery-local"
              className="accent-slate-900"
            />
            {t.deliveryLocal}
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="delivery_type"
              value="international"
              data-testid="delivery-international"
              onChange={() => onDeliveryChange("international")}
              className="accent-slate-900"
            />
            {t.deliveryInternational}
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-semibold text-slate-900">{t.payment}</legend>
        <div className="mt-2 flex flex-wrap gap-6 text-sm text-slate-700">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="payment_method"
              value="paypal"
              data-testid="payment-paypal"
              className="accent-slate-900"
            />
            {t.paymentPaypal}
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="payment_method"
              value="western_union"
              defaultChecked
              data-testid="payment-western-union"
              className="accent-slate-900"
            />
            {t.paymentWesternUnion}
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="payment_method"
              value="card"
              data-testid="payment-card"
              className="accent-slate-900"
            />
            {t.paymentCard}
          </label>
        </div>
        <p className="mt-1 text-xs text-slate-400">{t.paymentNote}</p>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="checkout-email" className={labelClass}>
            {t.email}
          </label>
          <input
            id="checkout-email"
            type="email"
            name="email"
            required
            placeholder={t.emailPlaceholder}
            data-testid="checkout-email"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="checkout-phone" className={labelClass}>
            {t.phone}
          </label>
          <input
            id="checkout-phone"
            type="tel"
            name="phone"
            required
            placeholder={t.phonePlaceholder}
            data-testid="checkout-phone"
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="checkout-name" className={labelClass}>
            {t.name}
          </label>
          <input
            id="checkout-name"
            name="name"
            required
            placeholder={t.namePlaceholder}
            data-testid="checkout-name"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="checkout-country" className={labelClass}>
            {t.country}
          </label>
          <input
            id="checkout-country"
            name="country"
            required
            defaultValue="Paraguay"
            data-testid="checkout-country"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="checkout-address" className={labelClass}>
          {t.address}
        </label>
        <input
          id="checkout-address"
          name="address"
          required
          placeholder={t.addressPlaceholder}
          data-testid="checkout-address"
          className={inputClass}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="checkout-city" className={labelClass}>
            {t.city}
          </label>
          <input
            id="checkout-city"
            name="city"
            required
            placeholder={t.cityPlaceholder}
            data-testid="checkout-city"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="checkout-region" className={labelClass}>
            {t.region}
          </label>
          <input id="checkout-region" name="region" data-testid="checkout-region" className={inputClass} />
        </div>
        <div>
          <label htmlFor="checkout-postal" className={labelClass}>
            {t.postalCode}
          </label>
          <input
            id="checkout-postal"
            name="postal_code"
            data-testid="checkout-postal"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="checkout-notes" className={labelClass}>
          {t.notes}
        </label>
        <textarea
          id="checkout-notes"
          name="notes"
          rows={2}
          placeholder={t.notesPlaceholder}
          data-testid="checkout-notes"
          className={inputClass}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        data-testid="place-order"
        className="rounded-md bg-brand-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {t.placeOrder}
      </button>
    </form>
  );
}
