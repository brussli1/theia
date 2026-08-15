import Link from "next/link";
import { fetchQuote, type Quote } from "../../lib/api";
import { CONTACT_EMAIL, WHATSAPP_URL } from "../../lib/contact";
import { getDictionary, getLocale } from "../../lib/i18n";
import { quoteKindKey, quoteStatusKey } from "../../lib/labels";

export const dynamic = "force-dynamic";

export default async function QuoteConfirmationPage({
  params,
  searchParams,
}: {
  params: { reference: string };
  searchParams: { email?: string };
}) {
  const locale = getLocale();
  const t = getDictionary(locale);
  let quote: Quote | null = null;
  try {
    if (searchParams?.email) {
      quote = await fetchQuote(params.reference, searchParams.email);
    }
  } catch {
    quote = null;
  }

  if (!quote) {
    return (
      <main className="mx-auto max-w-2xl p-8">
        <h1 className="text-2xl font-semibold text-slate-900">{t.quote.title}</h1>
        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 text-center">
          <p className="text-sm text-slate-500">{t.quote.notFound}</p>
          <p className="mt-1 text-sm text-slate-400">{t.quote.notFoundHint}</p>
          <Link
            href="/cotizacion"
            className="mt-4 inline-block rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            {t.quote.newRequest}
          </Link>
        </div>
      </main>
    );
  }

  const kindKey = quoteKindKey(quote.kind);
  const kindLabel = kindKey ? t.quote[kindKey] : quote.kind;
  const statusKey = quoteStatusKey(quote.status);
  const statusLabel = statusKey ? t.quote[statusKey] : quote.status;
  const mailSubject = encodeURIComponent(
    `Solicitud de cotización ${quote.reference}`,
  );
  const mailBody = encodeURIComponent(
    [
      `Hola Theia, mi solicitud de cotización es ${quote.reference}.`,
      "",
      `Nombre: ${quote.name}`,
      `Email: ${quote.email}`,
      `Teléfono: ${quote.phone}`,
      ...(quote.message ? [`Mensaje: ${quote.message}`] : []),
    ].join("\n"),
  );
  const whatsappText = encodeURIComponent(
    `Hola Theia, mi solicitud de cotización es ${quote.reference}.`,
  );

  return (
    <main className="mx-auto max-w-2xl p-8">
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h1 className="text-2xl font-semibold text-slate-900">
          {t.quote.confirmationTitle}
        </h1>
        <p className="mt-2 text-sm text-slate-500">{t.quote.confirmationSubtitle}</p>
        <div className="mt-4 flex flex-wrap gap-6 text-sm">
          <p>
            <span className="text-slate-500">{t.quote.reference}: </span>
            <span data-testid="quote-reference" className="font-semibold text-slate-900">
              {quote.reference}
            </span>
          </p>
          <p>
            <span className="text-slate-500">{t.quote.status}: </span>
            <span
              data-testid="quote-status"
              className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700"
            >
              {statusLabel}
            </span>
          </p>
        </div>
      </div>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 text-sm">
        <h2 className="font-semibold text-slate-900">{t.quote.details}</h2>
        <dl className="mt-2 space-y-1 text-slate-600" data-testid="quote-details">
          <p data-testid="quote-kind">{kindLabel}</p>
          {quote.product_name && <p className="font-medium text-slate-900">{quote.product_name}</p>}
          {quote.message && <p className="italic">{quote.message}</p>}
        </dl>
      </section>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 text-sm">
        <h2 className="font-semibold text-slate-900">{t.quote.contact}</h2>
        <dl className="mt-2 space-y-1 text-slate-600">
          <p data-testid="quote-name">{quote.name}</p>
          <p data-testid="quote-email">{quote.email}</p>
          <p data-testid="quote-phone">{quote.phone}</p>
        </dl>
      </section>

      <div className="mt-6 flex flex-wrap gap-3 text-sm">
        <a
          href={`${WHATSAPP_URL}?text=${whatsappText}`}
          target="_blank"
          rel="noreferrer"
          data-testid="quote-whatsapp"
          className="rounded-md bg-slate-900 px-4 py-2 text-white hover:bg-slate-700"
        >
          {t.quote.whatsApp}
        </a>
        <a
          href={`mailto:${CONTACT_EMAIL}?subject=${mailSubject}&body=${mailBody}`}
          data-testid="quote-email-link"
          className="rounded-md border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50"
        >
          {t.quote.sendEmail}
        </a>
        <Link
          href="/cotizacion"
          className="rounded-md border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50"
        >
          {t.quote.newRequest}
        </Link>
      </div>
    </main>
  );
}
