import { ExternalLink } from 'lucide-react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { CatalogView, parseQuery } from '@/components/catalog/CatalogView'
import { MediaImage } from '@/components/ui/MediaImage'
import { localePath } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { getBrands } from '@/lib/data'
import { isMedia } from '@/lib/media'
import { resolveLocale, type LocaleParams, type SearchParams } from '@/lib/params'
import { buildMetadata } from '@/lib/seo'
import { getCurrency } from '@/lib/session'

type Props = { params: LocaleParams<{ slug: string }>; searchParams: SearchParams }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await resolveLocale(params)
  const brand = (await getBrands()).find((b) => b.slug === slug)
  if (!brand) return {}
  return buildMetadata({ locale, path: `/marcas/${slug}`, title: brand.name, description: brand.description, image: brand.logo })
}

export default async function BrandPage({ params, searchParams }: Props) {
  const { locale, slug } = await resolveLocale(params)
  const brand = (await getBrands()).find((b) => b.slug === slug)
  if (!brand) notFound()
  const t = getDictionary(locale)

  return (
    <CatalogView
      locale={locale}
      currency={await getCurrency()}
      basePath={`/marcas/${slug}`}
      query={parseQuery(await searchParams)}
      fixed={{ brand: slug }}
      title={brand.name}
      intro={
        brand.description || brand.website ? (
          <div className="flex flex-col gap-2">
            {brand.description && <p>{brand.description}</p>}
            {brand.website && (
              <a href={brand.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-accent-700 hover:underline">
                {brand.website.replace(/^https?:\/\//, '')} <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        ) : undefined
      }
      header={
        isMedia(brand.logo) ? (
          <MediaImage media={brand.logo} size="thumbnail" fill={false} imgClassName="mt-6 h-14 w-auto object-contain" sizes="240px" />
        ) : null
      }
      breadcrumbs={[
        { label: t.nav.home, href: localePath(locale, '/') },
        { label: t.brands.title, href: localePath(locale, '/marcas') },
        { label: brand.name },
      ]}
    />
  )
}
