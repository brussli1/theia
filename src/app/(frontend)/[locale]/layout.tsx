import type { Metadata, Viewport } from 'next'
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'

import { Analytics } from '@/components/layout/Analytics'
import { LivePreviewListener } from '@/components/layout/LivePreviewListener'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { WhatsAppButton } from '@/components/layout/WhatsAppButton'
import { LocaleProvider } from '@/components/providers/LocaleProvider'
import { isLocale, locales, type Locale } from '@/i18n/config'
import { getSettings } from '@/lib/data'
import { isMedia, mediaSrc } from '@/lib/media'
import { getCurrency, isDraft } from '@/lib/session'

import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta', display: 'swap' })

const SITE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

type Props = { children: ReactNode; params: Promise<{ locale: string }> }

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const settings = await getSettings(locale)
  const siteName = settings.siteName || 'Theia'
  const shareImage = isMedia(settings.shareImage) ? mediaSrc(settings.shareImage.url) : null
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: `${siteName} — ${settings.tagline ?? ''}`.replace(/ — $/, ''), template: `%s | ${siteName}` },
    description: settings.description || settings.tagline || undefined,
    applicationName: siteName,
    icons: { icon: '/favicon.svg' },
    openGraph: {
      siteName,
      type: 'website',
      locale: locale === 'es' ? 'es_PY' : 'en_US',
      images: shareImage ? [{ url: shareImage }] : undefined,
    },
    twitter: { card: 'summary_large_image' },
  }
}

export const viewport: Viewport = { themeColor: '#0B3B5C', width: 'device-width', initialScale: 1 }

export default async function LocaleLayout({ children, params }: Props) {
  const { locale: raw } = await params
  if (!isLocale(raw)) notFound()
  const locale: Locale = raw
  const [settings, currency, draft] = await Promise.all([getSettings(locale), getCurrency(), isDraft()])

  const brandStyle = `:root{--brand:${settings.primaryColor || '#0B3B5C'};--accent:${settings.accentColor || '#0E9F9A'}}`

  return (
    <html lang={locale} className={`${inter.variable} ${jakarta.variable}`}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: brandStyle.replace(/[<>]/g, '') }} />
      </head>
      <body className="flex min-h-screen flex-col">
        <LocaleProvider locale={locale} currency={currency} whatsapp={settings.whatsapp ?? null}>
          <a
            href="#contenido"
            className="sr-only z-50 rounded bg-white px-4 py-2 text-brand focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
          >
            {locale === 'es' ? 'Saltar al contenido' : 'Skip to content'}
          </a>
          <SiteHeader locale={locale} />
          <main id="contenido" className="flex-1">
            {children}
          </main>
          <SiteFooter locale={locale} />
          <WhatsAppButton message={settings.whatsappMessage} />
        </LocaleProvider>
        <Analytics gaId={settings.gaId} metaPixelId={settings.metaPixelId} />
        {draft && <LivePreviewListener />}
      </body>
    </html>
  )
}
