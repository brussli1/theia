import type { Metadata } from "next";
import { getDictionary, getLocale } from "../lib/i18n";
import { pageMetadata } from "../lib/metadata";
import TrackForm from "./TrackForm";

export async function generateMetadata(): Promise<Metadata> {
  const locale = getLocale();
  const t = getDictionary(locale);
  const page = t.pages.trackOrder;
  return pageMetadata({
    locale,
    title: `${page.title} — Theia`,
    description: page.description,
    path: "/pedido",
  });
}

export default async function TrackOrderPage() {
  const locale = getLocale();
  const t = getDictionary(locale);
  return (
    <main className="mx-auto max-w-xl p-8">
      <h1 className="text-2xl font-semibold text-slate-900">{t.order.track}</h1>
      <p className="mt-2 text-sm text-slate-500">{t.order.trackHint}</p>
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
        <TrackForm t={t.order} />
      </div>
    </main>
  );
}
