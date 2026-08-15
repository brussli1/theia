import type { Metadata } from "next";
import Link from "next/link";
import ContentPage from "../components/ContentPage";
import {
  BUSINESS_PHONE,
  CONTACT_EMAIL,
  WHATSAPP_URL,
} from "../lib/contact";
import { getDictionary, getLocale } from "../lib/i18n";
import { pageMetadata } from "../lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const locale = getLocale();
  const t = getDictionary(locale);
  const page = t.pages.contacto;
  return pageMetadata({
    locale,
    title: `${page.title} — Theia`,
    description: page.description,
    path: "/contacto",
  });
}

export default async function ContactoPage() {
  const locale = getLocale();
  const t = getDictionary(locale);
  const page = t.pages.contacto;
  const channels = [
    { label: page.whatsapp, value: BUSINESS_PHONE, href: WHATSAPP_URL },
    { label: page.email, value: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}` },
    { label: page.hours, value: page.hoursValue },
  ];
  return (
    <ContentPage title={page.title} intro={page.intro}>
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {channels.map((channel) => (
            <div
              key={channel.label}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              <p className="text-sm font-semibold text-slate-900">{channel.label}</p>
              {channel.href ? (
                <Link
                  href={channel.href}
                  target={channel.href.startsWith("http") ? "_blank" : undefined}
                  rel={channel.href.startsWith("http") ? "noreferrer" : undefined}
                  className="mt-1 block break-words text-sm text-slate-600 hover:text-brand-700"
                >
                  {channel.value}
                </Link>
              ) : (
                <p className="mt-1 text-sm text-slate-600">{channel.value}</p>
              )}
            </div>
          ))}
        </div>
        <section className="rounded-xl border border-slate-200 bg-slate-50 p-6">
          <h2 className="text-lg font-semibold text-slate-900">{page.otherTitle}</h2>
          <p className="mt-1 text-sm text-slate-600">{page.otherText}</p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <Link
              href="/usados"
              className="rounded-md border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
            >
              {t.pages.footer.used}
            </Link>
            <Link
              href="/alquiler"
              className="rounded-md border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
            >
              {t.pages.footer.rentals}
            </Link>
            <Link
              href="/soporte"
              className="rounded-md border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
            >
              {t.pages.footer.support}
            </Link>
          </div>
        </section>
      </div>
    </ContentPage>
  );
}
