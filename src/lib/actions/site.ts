'use server'

import { cookies } from 'next/headers'

import { isLocale, type Locale } from '@/i18n/config'
import { CURRENCY_COOKIE, isCurrency } from '@/lib/currency'
import { mediaSrc } from '@/lib/media'
import { getPayloadClient } from '@/lib/payload'

export async function setCurrency(currency: string) {
  if (!isCurrency(currency)) return
  ;(await cookies()).set(CURRENCY_COOKIE, currency, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  })
}

export type Suggestion = { id: number; name: string; slug: string; brand: string | null; image: string | null }

export async function searchSuggestions(query: string, locale: string): Promise<Suggestion[]> {
  const q = query.trim().slice(0, 80)
  if (q.length < 2) return []
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'products',
    locale: (isLocale(locale) ? locale : 'es') as Locale,
    overrideAccess: false,
    depth: 1,
    limit: 6,
    where: { or: [{ name: { like: q } }, { sku: { like: q } }] },
    sort: ['-featured', 'name'],
    select: { name: true, slug: true, images: true, brand: true },
  })
  return docs.map((p) => {
    const image = Array.isArray(p.images) && typeof p.images[0] === 'object' ? p.images[0] : null
    return {
      id: p.id,
      name: p.name,
      slug: p.slug ?? '',
      brand: typeof p.brand === 'object' && p.brand ? p.brand.name : null,
      image: image ? mediaSrc(image.sizes?.thumbnail?.url || image.url) : null,
    }
  })
}

export async function subscribe(email: string, locale: string): Promise<{ ok: boolean }> {
  const value = email.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || value.length > 200) return { ok: false }
  const payload = await getPayloadClient()
  const existing = await payload.count({ collection: 'subscribers', where: { email: { equals: value } } })
  if (!existing.totalDocs) {
    await payload.create({
      collection: 'subscribers',
      data: { email: value, locale: locale === 'en' ? 'en' : 'es' },
    })
  }
  return { ok: true }
}
