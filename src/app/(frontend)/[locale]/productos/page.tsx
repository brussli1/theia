import type { Metadata } from 'next'

import { CatalogView, parseQuery } from '@/components/catalog/CatalogView'
import { localePath } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { resolveLocale, type LocaleParams, type SearchParams } from '@/lib/params'
import { buildMetadata } from '@/lib/seo'
import { getCurrency } from '@/lib/session'

type Props = { params: LocaleParams; searchParams: SearchParams }

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { locale } = await resolveLocale(params)
  const t = getDictionary(locale)
  const sp = await searchParams
  return buildMetadata({
    locale,
    path: '/productos',
    title: t.catalog.title,
    // Filtered/search result pages should not compete with the catalog in Google.
    noIndex: Object.keys(sp).some((k) => k !== 'pagina'),
  })
}

export default async function ProductsPage({ params, searchParams }: Props) {
  const { locale } = await resolveLocale(params)
  const t = getDictionary(locale)
  const query = parseQuery(await searchParams)
  return (
    <CatalogView
      locale={locale}
      currency={await getCurrency()}
      basePath="/productos"
      query={query}
      title={t.catalog.title}
      breadcrumbs={[{ label: t.nav.home, href: localePath(locale, '/') }, { label: t.nav.products }]}
    />
  )
}
