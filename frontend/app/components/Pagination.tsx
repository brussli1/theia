import Link from "next/link";
import { getDictionary, getLocale } from "../lib/i18n";

export default function Pagination({
  page,
  pages,
  buildPageUrl,
}: {
  page: number;
  pages: number;
  buildPageUrl: (target: number) => string;
}) {
  const t = getDictionary(getLocale());
  if (pages <= 1) {
    return null;
  }
  return (
    <nav className="mt-8 flex items-center justify-center gap-4 text-sm">
      {page > 1 ? (
        <Link href={buildPageUrl(page - 1)} className="text-slate-700 hover:underline">
          {t.pagination.previous}
        </Link>
      ) : (
        <span className="text-slate-300">{t.pagination.previous}</span>
      )}
      <span className="text-slate-500">{t.pagination.pageOf(page, pages)}</span>
      {page < pages ? (
        <Link href={buildPageUrl(page + 1)} className="text-slate-700 hover:underline">
          {t.pagination.next}
        </Link>
      ) : (
        <span className="text-slate-300">{t.pagination.next}</span>
      )}
    </nav>
  );
}
