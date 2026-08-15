import type { Metadata } from "next";
import Link from "next/link";
import ContentPage from "../components/ContentPage";
import { CONTACT_EMAIL } from "../lib/contact";
import { getDictionary, getLocale } from "../lib/i18n";
import { pageMetadata } from "../lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const locale = getLocale();
  const t = getDictionary(locale);
  const page = t.pages.privacidad;
  return pageMetadata({
    locale,
    title: `${page.title} — Theia`,
    description: page.description,
    path: "/privacidad",
  });
}

export default async function PrivacidadPage() {
  const locale = getLocale();
  const t = getDictionary(locale);
  const page = t.pages.privacidad;
  return (
    <ContentPage title={page.title} intro={page.intro}>
      <div className="space-y-8">
        <section className="space-y-5">
          {page.sections.map((section) => (
            <div key={section.heading}>
              <h2 className="text-lg font-semibold text-slate-900">{section.heading}</h2>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">{section.text}</p>
            </div>
          ))}
        </section>
        <section className="rounded-xl border border-slate-200 bg-slate-50 p-6">
          <h2 className="text-lg font-semibold text-slate-900">{page.contactTitle}</h2>
          <p className="mt-1 text-sm text-slate-600">{page.contactText}</p>
          <Link
            href={`mailto:${CONTACT_EMAIL}`}
            data-testid="privacy-email"
            className="mt-4 inline-block rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {t.pages.contacto.email}
          </Link>
        </section>
      </div>
    </ContentPage>
  );
}
