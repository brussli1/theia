import type { Metadata } from "next";
import Link from "next/link";
import ContentPage from "../components/ContentPage";
import { getDictionary, getLocale } from "../lib/i18n";
import { pageMetadata } from "../lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const locale = getLocale();
  const t = getDictionary(locale);
  const page = t.pages.alquiler;
  return pageMetadata({
    locale,
    title: `${page.title} — Theia`,
    description: page.description,
    path: "/alquiler",
  });
}

export default async function AlquilerPage() {
  const locale = getLocale();
  const t = getDictionary(locale);
  const page = t.pages.alquiler;
  return (
    <ContentPage title={page.title} intro={page.intro}>
      <div className="space-y-8">
        <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
          {page.bullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
        <section>
          <h2 className="text-lg font-semibold text-slate-900">{page.processTitle}</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-700">
            {page.processSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>
        <section className="rounded-xl border border-slate-200 bg-slate-50 p-6">
          <h2 className="text-lg font-semibold text-slate-900">{page.ctaTitle}</h2>
          <p className="mt-1 text-sm text-slate-600">{page.ctaText}</p>
          <Link
            href="/cotizacion?tipo=rental"
            data-testid="alquiler-cta"
            className="mt-4 inline-block rounded-md bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-700"
          >
            {page.ctaButton}
          </Link>
        </section>
      </div>
    </ContentPage>
  );
}
