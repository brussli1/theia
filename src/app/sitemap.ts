import type { MetadataRoute } from 'next'

import { localePath, locales } from '@/i18n/config'
import { getPayloadClient } from '@/lib/payload'

export const dynamic = 'force-dynamic'
export const revalidate = 3600

/** Every public page in both languages, with hreflang alternates. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
  const payload = await getPayloadClient()
  const list = async (collection: 'products' | 'pages' | 'posts' | 'categories' | 'brands' | 'used-equipment') =>
    (
      await payload.find({
        collection,
        depth: 0,
        limit: 0,
        pagination: false,
        overrideAccess: false,
        select: { slug: true, updatedAt: true },
      })
    ).docs as { slug?: string | null; updatedAt: string }[]

  const [products, pages, posts, categories, brands, used] = await Promise.all([
    list('products'),
    list('pages'),
    list('posts'),
    list('categories'),
    list('brands'),
    list('used-equipment'),
  ])

  const entries: { path: string; updatedAt?: string; priority: number }[] = [
    { path: '/', priority: 1 },
    { path: '/productos', priority: 0.9 },
    { path: '/marcas', priority: 0.6 },
    { path: '/usados', priority: 0.6 },
    { path: '/blog', priority: 0.5 },
    { path: '/cotizacion', priority: 0.5 },
    ...pages.filter((p) => p.slug && p.slug !== 'inicio').map((p) => ({ path: `/${p.slug}`, updatedAt: p.updatedAt, priority: 0.6 })),
    ...categories.map((c) => ({ path: `/categorias/${c.slug}`, updatedAt: c.updatedAt, priority: 0.8 })),
    ...products.map((p) => ({ path: `/productos/${p.slug}`, updatedAt: p.updatedAt, priority: 0.7 })),
    ...brands.map((b) => ({ path: `/marcas/${b.slug}`, updatedAt: b.updatedAt, priority: 0.5 })),
    ...posts.map((p) => ({ path: `/blog/${p.slug}`, updatedAt: p.updatedAt, priority: 0.5 })),
    ...used.map((u) => ({ path: `/usados/${u.slug}`, updatedAt: u.updatedAt, priority: 0.5 })),
  ]

  return entries.map((e) => ({
    url: `${site}${e.path === '/' ? '' : e.path}`,
    lastModified: e.updatedAt ? new Date(e.updatedAt) : undefined,
    priority: e.priority,
    alternates: { languages: Object.fromEntries(locales.map((l) => [l, `${site}${localePath(l, e.path)}`])) },
  }))
}
