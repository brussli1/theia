import { ImageOff, Recycle } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { RequestForm } from '@/components/forms/RequestForm'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { MediaImage } from '@/components/ui/MediaImage'
import { localePath } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { cn } from '@/lib/cn'
import { formatPrice } from '@/lib/currency'
import { getUsedEquipmentList } from '@/lib/data'
import { firstImage } from '@/lib/media'
import { resolveLocale, type LocaleParams } from '@/lib/params'
import { buildMetadata } from '@/lib/seo'
import { getCurrency } from '@/lib/session'

type Props = { params: LocaleParams }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await resolveLocale(params)
  const t = getDictionary(locale)
  return buildMetadata({ locale, path: '/usados', title: t.used.title, description: t.used.intro })
}

export default async function UsedPage({ params }: Props) {
  const { locale } = await resolveLocale(params)
  const t = getDictionary(locale)
  const [list, currency] = await Promise.all([getUsedEquipmentList(locale), getCurrency()])

  return (
    <div className="container-page py-8 sm:py-10">
      <Breadcrumbs items={[{ label: t.nav.home, href: localePath(locale, '/') }, { label: t.used.title }]} />
      <h1 className="mt-6 text-3xl font-bold sm:text-4xl">{t.used.title}</h1>
      <p className="mt-2 max-w-2xl text-slate-600">{t.used.intro}</p>

      {list.length ? (
        <ul className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((item) => {
            const image = firstImage(item.images)
            const price = currency === 'PYG' ? item.priceGs : item.priceUsd
            const brand = typeof item.brand === 'object' && item.brand ? item.brand.name : null
            return (
              <li key={item.id}>
                <article className="group relative flex h-full flex-col overflow-hidden rounded-card border border-slate-200 bg-white shadow-card transition hover:shadow-lift">
                  <div className="relative aspect-[4/3] bg-slate-50">
                    {image ? (
                      <MediaImage media={image} size="card" className="absolute inset-0" sizes="(min-width:1024px) 33vw, 100vw" />
                    ) : (
                      <ImageOff className="absolute inset-0 m-auto h-8 w-8 text-slate-300" />
                    )}
                    <span
                      className={cn(
                        'absolute top-3 left-3 rounded-full px-2.5 py-1 text-xs font-semibold',
                        item.saleStatus === 'reserved' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800',
                      )}
                    >
                      {t.used.statuses[item.saleStatus]}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <p className="text-xs font-semibold text-slate-500 uppercase">
                      {[brand, item.year].filter(Boolean).join(' · ')}
                    </p>
                    <h2 className="mt-1 text-lg leading-snug font-semibold">
                      <Link href={localePath(locale, `/usados/${item.slug}`)} className="after:absolute after:inset-0">
                        {item.name}
                      </Link>
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      {t.used.condition}: {t.used.conditions[item.condition]}
                    </p>
                    <p className="mt-auto pt-4 font-bold">
                      {price ? formatPrice(price, currency, locale) : <span className="text-accent-700">{t.product.priceOnRequest}</span>}
                    </p>
                  </div>
                </article>
              </li>
            )
          })}
        </ul>
      ) : (
        <div className="mt-10 flex flex-col items-center rounded-card border border-dashed border-slate-300 px-6 py-12 text-center">
          <Recycle className="h-10 w-10 text-slate-400" aria-hidden="true" />
          <p className="mt-4 max-w-md text-slate-600">{t.used.empty}</p>
        </div>
      )}

      <section className="mx-auto mt-16 max-w-3xl rounded-card border border-slate-200 bg-white p-6 shadow-card sm:p-8">
        <h2 className="mb-6 text-2xl font-bold">{t.forms.titles.used}</h2>
        <RequestForm kind="used" />
      </section>
    </div>
  )
}
