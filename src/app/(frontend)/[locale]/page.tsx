import type { Metadata } from 'next'

import { PageView } from '@/components/content/PageView'
import { getPage, getSettings } from '@/lib/data'
import { isMedia, mediaSrc } from '@/lib/media'
import { resolveLocale, type LocaleParams } from '@/lib/params'
import { buildMetadata, jsonLd } from '@/lib/seo'
import { getCurrency, isDraft } from '@/lib/session'
import { HomeFallback } from './home-fallback'

type Props = { params: LocaleParams }

const SITE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await resolveLocale(params)
  const [page, settings] = await Promise.all([getPage('inicio', locale), getSettings(locale)])
  const meta = buildMetadata({ locale, path: '/', description: settings.description, meta: page?.meta })
  return { ...meta, title: page?.meta?.title ? { absolute: page.meta.title } : undefined }
}

export default async function HomePage({ params }: Props) {
  const { locale } = await resolveLocale(params)
  const draft = await isDraft()
  const [page, settings, currency] = await Promise.all([getPage('inicio', locale, draft), getSettings(locale), getCurrency()])

  const organization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: settings.siteName,
    url: SITE_URL,
    logo: isMedia(settings.logo) ? `${SITE_URL}${mediaSrc(settings.logo.url)}` : `${SITE_URL}/favicon.svg`,
    email: settings.email || undefined,
    telephone: settings.phone || undefined,
    address: settings.address || undefined,
    sameAs: (settings.social ?? []).map((s) => s.url),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(organization)} />
      {page ? <PageView page={{ ...page, showTitle: false }} locale={locale} currency={currency} /> : <HomeFallback locale={locale} currency={currency} />}
    </>
  )
}
