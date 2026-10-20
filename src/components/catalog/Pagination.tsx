import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

import { cn } from '@/lib/cn'

type Labels = { previous: string; next: string; page: (p: number, t: number) => string }

/** Numbered pagination with ellipses: 1 … 4 5 6 … 20 */
export function pageWindow(page: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = new Set([1, total, page - 1, page, page + 1].filter((p) => p >= 1 && p <= total))
  const sorted = [...pages].sort((a, b) => a - b)
  const out: (number | '…')[] = []
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push('…')
    out.push(p)
  })
  return out
}

export function Pagination({
  page,
  totalPages,
  hrefFor,
  labels,
}: {
  page: number
  totalPages: number
  hrefFor: (page: number) => string
  labels: Labels
}) {
  if (totalPages <= 1) return null
  const base = 'flex h-10 min-w-10 items-center justify-center rounded-lg px-3 text-sm font-medium'
  return (
    <nav aria-label={labels.page(page, totalPages)} className="mt-10 flex items-center justify-center gap-1">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className={cn(base, 'hover:bg-slate-100')} aria-label={labels.previous}>
          <ChevronLeft className="h-4 w-4" />
        </Link>
      ) : (
        <span className={cn(base, 'text-slate-300')} aria-hidden="true">
          <ChevronLeft className="h-4 w-4" />
        </span>
      )}
      {pageWindow(page, totalPages).map((p, i) =>
        p === '…' ? (
          <span key={`gap-${i}`} className="px-1 text-slate-400">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={hrefFor(p)}
            aria-current={p === page ? 'page' : undefined}
            className={cn(base, p === page ? 'bg-brand text-white' : 'hover:bg-slate-100')}
          >
            {p}
          </Link>
        ),
      )}
      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} className={cn(base, 'hover:bg-slate-100')} aria-label={labels.next}>
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <span className={cn(base, 'text-slate-300')} aria-hidden="true">
          <ChevronRight className="h-4 w-4" />
        </span>
      )}
    </nav>
  )
}
