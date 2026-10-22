import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, permanentRedirect } from 'next/navigation'

import { CatalogView, parseQuery } from '@/components/catalog/CatalogView'
import { localePath } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { getCategoryBySlug } from '@/lib/data'
import { resolveLocale, type LocaleParams, type SearchParams } from '@/lib/params'
import { findRedirect } from '@/lib/redirects'
import { buildMetadata } from '@/lib/seo'
import { getCurrency } from '@/lib/session'

type Props = { params: LocaleParams<{ slug: string }>; searchParams: SearchParams }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await resolveLocale(params)
  const found = await getCategoryBySlug(slug, locale)
  if (!found) return {}
  return buildMetadata({
    locale,
    path: `/categorias/${slug}`,
    title: found.category.name,
    description: found.category.description,
    image: found.category.image,
  })
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { locale, slug } = await resolveLocale(params)
  const found = await getCategoryBySlug(slug, locale)
  if (!found) {
    const target = await findRedirect(`/categorias/${slug}`)
    if (target) permanentRedirect(localePath(locale, target))
    notFound()
  }
  const t = getDictionary(locale)
  const { category, trail, children } = found

  return (
    <CatalogView
      locale={locale}
      currency={await getCurrency()}
      basePath={`/categorias/${slug}`}
      query={parseQuery(await searchParams)}
      fixed={{ category: slug }}
      title={category.name}
      intro={category.description}
      breadcrumbs={[
        { label: t.nav.home, href: localePath(locale, '/') },
        { label: t.nav.products, href: localePath(locale, '/productos') },
        ...trail.map((c) => ({ label: c.name, href: localePath(locale, `/categorias/${c.slug}`) })),
      ]}
      header={
        children.length > 0 ? (
          <nav aria-label={t.catalog.subcategories} className="mt-6 flex flex-wrap gap-2">
            {children.map((c) => (
              <Link
                key={c.id}
                href={localePath(locale, `/categorias/${c.slug}`)}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-accent hover:text-accent-700"
              >
                {c.name}
              </Link>
            ))}
          </nav>
        ) : null
      }
    />
  )
}
