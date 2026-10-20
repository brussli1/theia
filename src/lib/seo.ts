import type { Metadata } from 'next'

import { localePath, type Locale } from '@/i18n/config'
import { isMedia, mediaSrc } from './media'

type Meta = { title?: string | null; description?: string | null; image?: unknown } | null | undefined

/**
 * Page metadata with canonical + hreflang alternates. Uses the SEO tab from
 * the admin when filled in, otherwise falls back to the content itself.
 */
export function buildMetadata({
  locale,
  path,
  title,
  description,
  image,
  meta,
  noIndex,
}: {
  locale: Locale
  path: string
  title?: string | null
  description?: string | null
  image?: unknown
  meta?: Meta
  noIndex?: boolean
}): Metadata {
  const finalTitle = meta?.title || title || undefined
  const finalDescription = (meta?.description || description || '').slice(0, 300) || undefined
  const img = isMedia(meta?.image) ? meta!.image : isMedia(image) ? image : null
  const imageUrl = img ? mediaSrc(img.sizes?.large?.url || img.url) : null
  return {
    // A title from the SEO tab is already complete ("… | Theia").
    title: meta?.title ? { absolute: meta.title } : finalTitle,
    description: finalDescription,
    alternates: {
      canonical: localePath(locale, path),
      languages: { es: localePath('es', path), en: localePath('en', path), 'x-default': localePath('es', path) },
    },
    openGraph: {
      title: finalTitle,
      description: finalDescription,
      url: localePath(locale, path),
      images: imageUrl ? [{ url: imageUrl }] : undefined,
    },
    robots: noIndex ? { index: false, follow: false } : undefined,
  }
}

export function jsonLd(data: unknown) {
  return { __html: JSON.stringify(data).replace(/</g, '\\u003c') }
}
