import type { Metadata } from "next";
import Link from "next/link";
import ContentPage from "../components/ContentPage";
import { CONTACT_EMAIL, WHATSAPP_URL } from "../lib/contact";
import { getDictionary, getLocale } from "../lib/i18n";
import { pageMetadata } from "../lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const locale = getLocale();
  const t = getDictionary(locale);
  const page = t.pages.mapa;
  return pageMetadata({
    locale,
    title: `${page.title} — Theia`,
    description: page.description,
    path: "/mapa",
  });
}

export default async function MapaPage() {
  const locale = getLocale();
  const t = getDictionary(locale);
  const page = t.pages.mapa;
  return (
    <ContentPage title={page.title} intro={page.intro}>
      <div className="space-y-6">
        <iframe
          title={page.mapTitle}
          src="https://www.google.com/maps?q=Asuncion,Paraguay&output=embed"
          loading="lazy"
          className="h-96 w-full rounded-xl border border-slate-200"
        />
        <p className="rounded-md bg-slate-50 px-4 py-3 text-sm text-slate-600">{page.note}</p>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link
            href={WHATSAPP_URL}
            target="_blank"
            rel="noreferrer"
            data-testid="map-whatsapp"
            className="rounded-md bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700"
          >
            {t.pages.contacto.whatsapp}
          </Link>
          <Link
            href={`mailto:${CONTACT_EMAIL}`}
            data-testid="map-email"
            className="rounded-md border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
          >
            {t.pages.contacto.email}
          </Link>
        </div>
      </div>
    </ContentPage>
  );
}
