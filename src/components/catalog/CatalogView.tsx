import { SearchX } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'

import { ProductGrid } from '@/components/product/ProductCard'
import { Breadcrumbs, type Crumb } from '@/components/ui/Breadcrumbs'
import { LinkButton } from '@/components/ui/Button'
import { localePath, type Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import type { Currency } from '@/lib/currency'
import { findProducts, getBrands, getCategoryTree, type ProductQuery, type ProductSort } from '@/lib/data'
import { first } from '@/lib/params'
import type { Product } from '@/payload-types'
import { CatalogFilters } from './CatalogFilters'
import { Pagination } from './Pagination'

const SORTS: ProductSort[] = ['featured', 'newest', 'name', 'priceAsc', 'priceDesc']

export function parseQuery(sp: Record<string, string | string[] | undefined>): ProductQuery {
  const sort = first(sp.orden) as ProductSort | undefined
  return {
    q: first(sp.q)?.slice(0, 80),
    category: first(sp.categoria),
    brand: first(sp.marca),
    certification: first(sp.certificacion),
    availability: first(sp.disponibilidad),
    mode: first(sp.modalidad),
    sort: sort && SORTS.includes(sort) ? sort : undefined,
    page: Number(first(sp.pagina)) || 1,
  }
}

type Props = {
  locale: Locale
  currency: Currency
  basePath: string
  query: ProductQuery
  /** Filters fixed by the page (e.g. the category of a category page). */
  fixed?: { category?: string; brand?: string }
  title: string
  intro?: ReactNode
  breadcrumbs: Crumb[]
  aside?: ReactNode
  header?: ReactNode
}

export async function CatalogView({ locale, currency, basePath, query, fixed, title, intro, breadcrumbs, header }: Props) {
  const t = getDictionary(locale)
  const effective = { ...query, ...fixed }
  const [result, tree, brands] = await Promise.all([
    findProducts(effective, locale, currency),
    getCategoryTree(locale),
    getBrands(),
  ])

  const params = new URLSearchParams()
  if (query.q) params.set('q', query.q)
  if (query.category && !fixed?.category) params.set('categoria', query.category)
  if (query.brand && !fixed?.brand) params.set('marca', query.brand)
  if (query.certification) params.set('certificacion', query.certification)
  if (query.availability) params.set('disponibilidad', query.availability)
  if (query.mode) params.set('modalidad', query.mode)
  if (query.sort) params.set('orden', query.sort)

  const categories = tree.map((c) => ({
    slug: c.slug ?? '',
    name: c.name,
    children: c.children.map((s) => ({ slug: s.slug ?? '', name: s.name })),
  }))

  return (
    <div className="container-page py-8 sm:py-10">
      <Breadcrumbs items={breadcrumbs} />
      <div className="mt-4 flex flex-col gap-2 sm:mt-6">
        <h1 className="text-3xl font-bold sm:text-4xl">{query.q ? t.catalog.searchFor(query.q) : title}</h1>
        {intro && <div className="max-w-3xl text-slate-600">{intro}</div>}
      </div>
      {header}
      <div className="mt-8 grid gap-8 lg:grid-cols-[17rem_1fr]">
        <CatalogFilters
          basePath={localePath(locale, basePath)}
          categories={fixed?.category ? [] : categories}
          brands={fixed?.brand ? [] : brands.map((b) => ({ slug: b.slug ?? '', name: b.name }))}
          current={{
            q: query.q ?? '',
            categoria: query.category ?? '',
            marca: query.brand ?? '',
            certificacion: query.certification ?? '',
            disponibilidad: query.availability ?? '',
            modalidad: query.mode ?? '',
            orden: query.sort ?? '',
          }}
          total={result.totalDocs}
        />
        <div>
          {result.docs.length ? (
            <>
              <ProductGrid products={result.docs as Product[]} locale={locale} currency={currency} columns={3} />
              <Pagination
                page={result.page ?? 1}
                totalPages={result.totalPages}
                hrefFor={(p) => {
                  const next = new URLSearchParams(params)
                  if (p > 1) next.set('pagina', String(p))
                  const qs = next.toString()
                  return `${localePath(locale, basePath)}${qs ? `?${qs}` : ''}`
                }}
                labels={t.pagination}
              />
            </>
          ) : (
            <div className="flex flex-col items-center rounded-card border border-dashed border-slate-300 px-6 py-16 text-center">
              <SearchX className="h-10 w-10 text-slate-400" aria-hidden="true" />
              <p className="mt-4 text-lg font-semibold">{t.catalog.empty}</p>
              <p className="mt-2 max-w-md text-slate-600">{t.catalog.emptyHint}</p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <LinkButton href={localePath(locale, basePath)} variant="outline">
                  {t.catalog.clear}
                </LinkButton>
                <LinkButton href={localePath(locale, '/cotizacion')}>{t.product.requestQuote}</LinkButton>
              </div>
            </div>
          )}
        </div>
      </div>
      <p className="sr-only">
        <Link href={localePath(locale, '/productos')}>{t.nav.allProducts}</Link>
      </p>
    </div>
  )
}
