import Link from "next/link";

export default function Pagination({
  page,
  pages,
  buildPageUrl,
}: {
  page: number;
  pages: number;
  buildPageUrl: (target: number) => string;
}) {
  if (pages <= 1) {
    return null;
  }
  return (
    <nav className="mt-8 flex items-center justify-center gap-4 text-sm">
      {page > 1 ? (
        <Link href={buildPageUrl(page - 1)} className="text-slate-700 hover:underline">
          ← Anterior
        </Link>
      ) : (
        <span className="text-slate-300">← Anterior</span>
      )}
      <span className="text-slate-500">
        Página {page} de {pages}
      </span>
      {page < pages ? (
        <Link href={buildPageUrl(page + 1)} className="text-slate-700 hover:underline">
          Siguiente →
        </Link>
      ) : (
        <span className="text-slate-300">Siguiente →</span>
      )}
    </nav>
  );
}
