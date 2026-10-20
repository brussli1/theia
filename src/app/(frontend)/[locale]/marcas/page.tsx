import type { Metadata } from 'next'
import Link from 'next/link'

import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { MediaImage } from '@/components/ui/MediaImage'
import { localePath } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { getBrands } from '@/lib/data'
import { isMedia } from '@/lib/media'
import { getPayloadClient } from '@/lib/payload'
import { resolveLocale, type LocaleParams } from '@/lib/params'
import { buildMetadata } from '@/lib/seo'

type Props = { params: LocaleParams }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await resolveLocale(params)
  const t = getDictionary(locale)
  return buildMetadata({ locale, path: '/marcas', title: t.brands.title, description: t.brands.intro })
}

export default async function BrandsPage({ params }: Props) {
  const { locale } = await resolveLocale(params)
  const t = getDictionary(locale)
  const brands = await getBrands()
  const payload = await getPayloadClient()
  const counts = await Promise.all(
    brands.map((b) => payload.count({ collection: 'products', overrideAccess: false, where: { brand: { equals: b.id } } })),
  )
  const list = brands.map((b, i) => ({ brand: b, count: counts[i].totalDocs })).filter((x) => x.count > 0)

  return (
    <div className="container-page py-8 sm:py-10">
      <Breadcrumbs items={[{ label: t.nav.home, href: localePath(locale, '/') }, { label: t.brands.title }]} />
      <h1 className="mt-6 text-3xl font-bold sm:text-4xl">{t.brands.title}</h1>
      <p className="mt-2 text-slate-600">{t.brands.intro}</p>
      <ul className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {list.map(({ brand, count }) => (
          <li key={brand.id}>
            <Link
              href={localePath(locale, `/marcas/${brand.slug}`)}
              className="flex h-full flex-col items-center justify-center gap-3 rounded-card border border-slate-200 bg-white p-6 text-center shadow-card transition hover:border-accent hover:shadow-lift"
            >
              {isMedia(brand.logo) ? (
                <MediaImage media={brand.logo} size="thumbnail" fill={false} imgClassName="h-12 w-auto object-contain" sizes="200px" />
              ) : (
                <span className="font-display text-xl font-bold text-brand">{brand.name}</span>
              )}
              <span className="text-sm text-slate-500">{t.brands.products(count)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
