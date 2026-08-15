import { setQuoteStatus } from "../../lib/admin-actions";
import {
  fetchAdminQuotes,
  QUOTE_STATUS_CLOSED,
  QUOTE_STATUS_NEW,
  QUOTE_STATUS_RESPONDED,
  type AdminQuote,
} from "../../lib/api";
import { getDictionary, getLocale } from "../../lib/i18n";
import { quoteKindKey, quoteStatusKey } from "../../lib/labels";

export const dynamic = "force-dynamic";

const QUOTE_STATUSES = [QUOTE_STATUS_NEW, QUOTE_STATUS_RESPONDED, QUOTE_STATUS_CLOSED];

function formatDate(iso: string, locale: "es" | "en"): string {
  return new Date(iso).toLocaleDateString(locale === "es" ? "es-PY" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function AdminQuotesPage() {
  const locale = getLocale();
  const t = getDictionary(locale);
  let quotes: AdminQuote[] = [];
  try {
    quotes = await fetchAdminQuotes();
  } catch {
    quotes = [];
  }

  const statusBadge = (status: string) =>
    status === QUOTE_STATUS_NEW
      ? "bg-amber-100 text-amber-800"
      : "bg-emerald-100 text-emerald-800";

  return (
    <main className="mx-auto max-w-6xl p-8">
      <h1 className="text-2xl font-semibold text-slate-900">{t.admin.quotesTitle}</h1>
      <p className="mt-2 text-sm text-slate-500">{t.admin.quotesSubtitle}</p>

      {quotes.length === 0 ? (
        <p className="mt-8 text-sm text-slate-500">{t.admin.noQuotes}</p>
      ) : (
        <ul className="mt-6 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
          {quotes.map((quote) => {
            const kindKey = quoteKindKey(quote.kind);
            const statusKey = quoteStatusKey(quote.status);
            return (
              <li key={quote.id} data-testid="admin-quote-row" className="p-4 text-sm">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                  <div className="min-w-0">
                    <p
                      data-testid="admin-quote-reference"
                      className="font-semibold text-slate-900"
                    >
                      {quote.reference}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatDate(quote.created_at, locale)}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-slate-900">
                      {kindKey ? t.quote[kindKey] : quote.kind}
                      {quote.product_name ? ` · ${quote.product_name}` : ""}
                    </p>
                    <p className="text-xs text-slate-500">
                      {quote.name} · {quote.email} · {quote.phone}
                    </p>
                    {quote.message && (
                      <p className="mt-0.5 italic text-slate-500">“{quote.message}”</p>
                    )}
                  </div>
                  <span
                    data-testid="admin-quote-status-badge"
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadge(quote.status)}`}
                  >
                    {statusKey ? t.quote[statusKey] : quote.status}
                  </span>
                  <form
                    action={setQuoteStatus.bind(null, quote.id)}
                    className="ml-auto flex flex-wrap items-center gap-2"
                  >
                    <select
                      name="status"
                      defaultValue={quote.status}
                      data-testid="admin-quote-status"
                      className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                    >
                      {QUOTE_STATUSES.map((status) => {
                        const key = quoteStatusKey(status);
                        return (
                          <option key={status} value={status}>
                            {key ? t.quote[key] : status}
                          </option>
                        );
                      })}
                    </select>
                    <button
                      type="submit"
                      data-testid="admin-quote-status-save"
                      className="rounded-md bg-brand-600 px-3 py-1 text-sm font-medium text-white hover:bg-brand-700"
                    >
                      {t.admin.updateStatus}
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
