import { CheckCircle2 } from 'lucide-react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { RequestForm } from '@/components/forms/RequestForm'
import { WhatsAppIcon } from '@/components/layout/WhatsAppButton'
import { Gallery } from '@/components/product/Gallery'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { buttonClasses } from '@/components/ui/Button'
import { RichText } from '@/components/ui/RichText'
import { localePath } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { formatPrice } from '@/lib/currency'
import { getSettings, getUsedEquipment } from '@/lib/data'
import { whatsappHref } from '@/lib/links'
import { isMedia, mediaSrc } from '@/lib/media'
import { resolveLocale, type LocaleParams } from '@/lib/params'
import { buildMetadata } from '@/lib/seo'
import { getCurrency, isDraft } from '@/lib/session'

type Props = { params: LocaleParams<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await resolveLocale(params)
  const item = await getUsedEquipment(slug, locale)
  if (!item) return {}
  return buildMetadata({ locale, path: `/usados/${slug}`, title: item.name, description: item.summary, image: item.images?.[0] })
}

export default async function UsedItemPage({ params }: Props) {
  const { locale, slug } = await resolveLocale(params)
  const item = await getUsedEquipment(slug, locale, await isDraft())
  if (!item) notFound()
  const t = getDictionary(locale)
  const [currency, settings] = await Promise.all([getCurrency(), getSettings(locale)])
  const brand = typeof item.brand === 'object' && item.brand ? item.brand.name : null
  const price = currency === 'PYG' ? item.priceGs : item.priceUsd
  const wa = whatsappHref(settings.whatsapp, t.used.whatsappMessage(item.name))
  const images = (item.images ?? []).filter(isMedia).map((m) => ({
    src: mediaSrc(m.sizes?.large?.url || m.url)!,
    thumb: mediaSrc(m.sizes?.thumbnail?.url || m.url)!,
    alt: m.alt || item.name,
  }))
  const facts = [
    brand && { label: t.product.brand, value: brand },
    item.model && { label: t.product.sku, value: item.model },
    item.year && { label: t.used.year, value: String(item.year) },
    { label: t.used.condition, value: t.used.conditions[item.condition] },
  ].filter(Boolean) as { label: string; value: string }[]

  return (
    <div className="container-page py-8 sm:py-10">
      <Breadcrumbs
        items={[
          { label: t.nav.home, href: localePath(locale, '/') },
          { label: t.used.title, href: localePath(locale, '/usados') },
          { label: item.name },
        ]}
      />
      <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:gap-14">
        <Gallery images={images} name={item.name} />
        <div>
          <span className="inline-block rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
            {t.used.statuses[item.saleStatus]}
          </span>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">{item.name}</h1>
          {item.summary && <p className="mt-4 text-lg text-slate-600">{item.summary}</p>}
          <dl className="mt-6 grid grid-cols-2 gap-4 rounded-card border border-slate-200 p-5 text-sm">
            {facts.map((f) => (
              <div key={f.label}>
                <dt className="text-slate-500">{f.label}</dt>
                <dd className="font-semibold">{f.value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-6 text-sm text-slate-500">{t.used.referencePrice}</p>
          <p className="text-3xl font-bold">{price ? formatPrice(price, currency, locale) : <span className="text-accent-700">{t.product.priceOnRequest}</span>}</p>
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" className={buttonClasses('whatsapp', 'lg', 'mt-6 w-full')}>
              <WhatsAppIcon className="h-5 w-5" /> {t.common.whatsappChat}
            </a>
          )}
          {(item.includes?.length ?? 0) > 0 && (
            <section className="mt-8">
              <h2 className="text-lg font-semibold">{t.used.includes}</h2>
              <ul className="mt-3 space-y-2">
                {item.includes!.map((i) => (
                  <li key={i.id ?? i.item} className="flex gap-2 text-slate-700">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-accent" /> {i.item}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
      {item.description && <RichText data={item.description} className="mt-14 max-w-3xl" />}
      <section className="mt-14 max-w-3xl rounded-card border border-slate-200 bg-white p-6 shadow-card sm:p-8">
        <h2 className="mb-6 text-2xl font-bold">{t.used.ask}</h2>
        <RequestForm kind="used" usedEquipmentId={item.id} defaultMessage={`${t.used.whatsappMessage(item.name)}`} />
      </section>
    </div>
  )
}
