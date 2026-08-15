import type { Metadata } from "next";
import ContentPage from "../components/ContentPage";
import { getDictionary, getLocale } from "../lib/i18n";
import { pageMetadata } from "../lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const locale = getLocale();
  const t = getDictionary(locale);
  const page = t.pages.tos;
  return pageMetadata({
    locale,
    title: `${page.title} — Theia`,
    description: page.description,
    path: "/tos",
  });
}

export default async function TosPage() {
  const locale = getLocale();
  const t = getDictionary(locale);
  const page = t.pages.tos;
  return (
    <ContentPage title={page.title} intro={page.intro}>
      <section className="space-y-5">
        {page.sections.map((section) => (
          <div key={section.heading}>
            <h2 className="text-lg font-semibold text-slate-900">{section.heading}</h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">{section.text}</p>
          </div>
        ))}
      </section>
    </ContentPage>
  );
}
