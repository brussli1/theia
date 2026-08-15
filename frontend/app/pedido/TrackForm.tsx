"use client";

import { useRouter } from "next/navigation";
import type { Dictionary } from "../lib/i18n";

const inputClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none";

const labelClass = "mb-1 block text-sm font-medium text-slate-700";

export default function TrackForm({ t }: { t: Dictionary["order"] }) {
  const router = useRouter();

  function submit(formData: FormData) {
    const orderNumber = String(formData.get("order_number") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    if (!orderNumber || !email) {
      return;
    }
    router.push(`/pedido/${orderNumber}?email=${encodeURIComponent(email)}`);
  }

  return (
    <form action={submit} className="space-y-4">
      <div>
        <label htmlFor="track-number" className={labelClass}>
          {t.trackNumber}
        </label>
        <input
          id="track-number"
          name="order_number"
          required
          placeholder={t.trackNumberPlaceholder}
          data-testid="track-number"
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="track-email" className={labelClass}>
          {t.trackEmail}
        </label>
        <input
          id="track-email"
          type="email"
          name="email"
          required
          data-testid="track-email"
          className={inputClass}
        />
      </div>
      <button
        type="submit"
        data-testid="track-submit"
        className="rounded-md bg-brand-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
      >
        {t.trackButton}
      </button>
    </form>
  );
}
