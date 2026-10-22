'use client'

import { SlidersHorizontal, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import { useSite } from '@/components/providers/LocaleProvider'
import { CERTIFICATIONS } from '@/lib/constants'
import { cn } from '@/lib/cn'

type Option = { slug: string; name: string }
type Current = Record<'q' | 'categoria' | 'marca' | 'certificacion' | 'disponibilidad' | 'modalidad' | 'orden', string>

type Props = {
  basePath: string
  categories: (Option & { children: Option[] })[]
  brands: Option[]
  current: Current
  total: number
}

export function CatalogFilters({ basePath, categories, brands, current, total }: Props) {
  const { t } = useSite()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, start] = useTransition()
  const [q, setQ] = useState(current.q)

  const go = (changes: Partial<Current>) => {
    const next = { ...current, ...changes }
    const params = new URLSearchParams()
    for (const [k, v] of Object.entries(next)) if (v) params.set(k, v)
    const qs = params.toString()
    start(() => router.push(`${basePath}${qs ? `?${qs}` : ''}`, { scroll: false }))
  }

  const activeCount = (['categoria', 'marca', 'certificacion', 'disponibilidad', 'modalidad', 'q'] as const).filter((k) => current[k]).length

  const select = (label: string, key: keyof Current, options: { value: string; label: string }[], allLabel = t.catalog.any) => (
    <div>
      <label htmlFor={`filter-${key}`} className="mb-1.5 block text-sm font-semibold text-ink">
        {label}
      </label>
      <select id={`filter-${key}`} value={current[key]} onChange={(e) => go({ [key]: e.target.value })} className="field-input py-2">
        <option value="">{allLabel}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )

  return (
    <aside aria-label={t.catalog.filters}>
      <div className="flex items-center justify-between gap-3 lg:hidden">
        <p className="text-sm text-slate-600" aria-live="polite">
          {t.catalog.results(total)}
        </p>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex h-10 items-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-semibold"
        >
          <SlidersHorizontal className="h-4 w-4" />
          {t.catalog.filters}
          {activeCount > 0 && <span className="rounded-full bg-accent px-1.5 text-xs text-white">{activeCount}</span>}
        </button>
      </div>

      <div className={cn('mt-4 space-y-5 lg:sticky lg:top-40 lg:mt-0 lg:block', !open && 'hidden', pending && 'opacity-60')}>
        <p className="hidden text-sm text-slate-600 lg:block" aria-live="polite">
          {t.catalog.results(total)}
        </p>
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault()
            go({ q: q.trim() })
          }}
        >
          <label htmlFor="filter-q" className="mb-1.5 block text-sm font-semibold text-ink">
            {t.nav.search}
          </label>
          <input id="filter-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.nav.searchPlaceholder} className="field-input py-2" />
        </form>

        {select(
          t.catalog.sort,
          'orden',
          Object.entries(t.catalog.sortOptions)
            .filter(([k]) => k !== 'featured')
            .map(([value, label]) => ({ value, label })),
          t.catalog.sortOptions.featured,
        )}

        {categories.length > 0 && (
          <div>
            <label htmlFor="filter-categoria" className="mb-1.5 block text-sm font-semibold text-ink">
              {t.catalog.category}
            </label>
            <select id="filter-categoria" value={current.categoria} onChange={(e) => go({ categoria: e.target.value })} className="field-input py-2">
              <option value="">{t.catalog.allCategories}</option>
              {categories.map((c) => (
                <optgroup key={c.slug} label={c.name}>
                  <option value={c.slug}>{c.name}</option>
                  {c.children.map((s) => (
                    <option key={s.slug} value={s.slug}>
                      {'  '}
                      {s.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        )}

        {brands.length > 0 &&
          select(
            t.catalog.brand,
            'marca',
            brands.map((b) => ({ value: b.slug, label: b.name })),
            t.catalog.allBrands,
          )}

        {select(t.catalog.purchase, 'modalidad', [
          { value: 'buy', label: t.catalog.buyOnline },
          { value: 'quote', label: t.catalog.quoteOnly },
        ])}

        {select(
          t.catalog.availability,
          'disponibilidad',
          Object.entries(t.product.availability).map(([value, label]) => ({ value, label })),
        )}

        {select(
          t.catalog.certification,
          'certificacion',
          CERTIFICATIONS.map((c) => ({ value: c.value, label: c.label })),
        )}

        {activeCount > 0 && (
          <Link href={basePath} className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-700 hover:underline">
            <X className="h-4 w-4" />
            {t.catalog.clear}
          </Link>
        )}
      </div>
    </aside>
  )
}
