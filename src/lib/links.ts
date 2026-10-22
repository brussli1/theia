import { localePath, type Locale } from '@/i18n/config'

type Ref = { relationTo: string; value: unknown } | null | undefined

export type LinkData = {
  type?: 'internal' | 'custom' | null
  label?: string | null
  reference?: Ref
  url?: string | null
  newTab?: boolean | null
}

const routes: Record<string, (slug: string) => string> = {
  pages: (slug) => (slug === 'inicio' ? '/' : `/${slug}`),
  products: (slug) => `/productos/${slug}`,
  categories: (slug) => `/categorias/${slug}`,
  brands: (slug) => `/marcas/${slug}`,
  posts: (slug) => `/blog/${slug}`,
  'used-equipment': (slug) => `/usados/${slug}`,
}

/** Turns a link chosen in the admin into a URL for the visitor's language. */
export function resolveHref(link: LinkData | null | undefined, locale: Locale): string | null {
  if (!link) return null
  if (link.type === 'custom' || (!link.type && link.url)) {
    const url = link.url?.trim()
    if (!url) return null
    return url.startsWith('/') ? localePath(locale, url) : url
  }
  const ref = link.reference
  if (!ref || typeof ref.value !== 'object' || ref.value === null) return null
  const slug = (ref.value as { slug?: string }).slug
  const route = routes[ref.relationTo]
  if (!slug || !route) return null
  return localePath(locale, route(slug))
}

export function whatsappHref(number: string | null | undefined, message?: string): string | null {
  const digits = (number || '').replace(/\D/g, '')
  if (!digits) return null
  return `https://wa.me/${digits}${message ? `?text=${encodeURIComponent(message)}` : ''}`
}
