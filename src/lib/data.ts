import 'server-only'

import type { Where } from 'payload'
import { cache } from 'react'

import type { Locale } from '@/i18n/config'
import type {
  Brand,
  Category,
  Footer,
  Header,
  Page,
  Post,
  Product,
  Setting,
  UsedEquipment,
} from '@/payload-types'
import { ancestry, buildTree, descendantIds } from './categories'
import type { Currency } from './currency'
import { getPayloadClient } from './payload'

/**
 * Every storefront read goes through here. Reads are per-request (dynamic),
 * so whatever an editor publishes shows up on the next page load.
 */

export const getSettings = cache(async (locale: Locale): Promise<Setting> => {
  const payload = await getPayloadClient()
  return payload.findGlobal({ slug: 'settings', locale, depth: 1 })
})

export const getHeader = cache(async (locale: Locale): Promise<Header> => {
  const payload = await getPayloadClient()
  return payload.findGlobal({ slug: 'header', locale, depth: 1 })
})

export const getFooter = cache(async (locale: Locale): Promise<Footer> => {
  const payload = await getPayloadClient()
  return payload.findGlobal({ slug: 'footer', locale, depth: 1 })
})

export const getCategories = cache(async (locale: Locale): Promise<Category[]> => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'categories',
    locale,
    depth: 1,
    limit: 0,
    pagination: false,
    sort: ['order', 'name'],
    select: { name: true, slug: true, parent: true, order: true, showInMenu: true, image: true, description: true },
  })
  return docs as Category[]
})

export async function getCategoryTree(locale: Locale) {
  const flat = await getCategories(locale)
  return buildTree(flat.map((c) => ({ ...c, parent: typeof c.parent === 'object' ? c.parent?.id : c.parent })))
}

export async function getCategoryBySlug(slug: string, locale: Locale) {
  const flat = await getCategories(locale)
  const category = flat.find((c) => c.slug === slug)
  if (!category) return null
  const normalized = flat.map((c) => ({ ...c, parent: typeof c.parent === 'object' ? c.parent?.id : c.parent }))
  return {
    category,
    trail: ancestry(normalized, category.id),
    children: buildTree(normalized).flatMap(function find(n): typeof n[] {
      return n.id === category.id ? n.children : n.children.flatMap(find)
    }),
    ids: descendantIds(normalized, category.id),
  }
}

export const getBrands = cache(async (): Promise<Brand[]> => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'brands',
    depth: 1,
    limit: 0,
    pagination: false,
    sort: 'name',
  })
  return docs
})

export type ProductSort = 'featured' | 'newest' | 'name' | 'priceAsc' | 'priceDesc'

export type ProductQuery = {
  q?: string
  category?: string
  brand?: string
  certification?: string
  availability?: string
  mode?: string
  sort?: ProductSort
  page?: number
  limit?: number
}

const LIST_SELECT = {
  name: true,
  slug: true,
  sku: true,
  images: true,
  brand: true,
  summary: true,
  purchaseMode: true,
  priceGs: true,
  priceUsd: true,
  availability: true,
  featured: true,
  certifications: true,
} as const

export async function findProducts(query: ProductQuery, locale: Locale, currency: Currency) {
  const payload = await getPayloadClient()
  const and: Where[] = []

  if (query.q?.trim()) {
    const q = query.q.trim()
    and.push({ or: [{ name: { like: q } }, { sku: { like: q } }, { summary: { like: q } }] })
  }
  if (query.category) {
    const found = await getCategoryBySlug(query.category, locale)
    and.push({ categories: { in: found ? found.ids : [-1] } })
  }
  if (query.brand) {
    const brand = (await getBrands()).find((b) => b.slug === query.brand)
    and.push({ brand: { equals: brand ? brand.id : -1 } })
  }
  if (query.certification) and.push({ certifications: { contains: query.certification } })
  if (query.availability) and.push({ availability: { equals: query.availability } })
  if (query.mode === 'buy' || query.mode === 'quote') and.push({ purchaseMode: { equals: query.mode } })

  const priceField = currency === 'PYG' ? 'priceGs' : 'priceUsd'
  const sort: Record<ProductSort, string | string[]> = {
    featured: ['-featured', '-createdAt'],
    newest: '-createdAt',
    name: 'name',
    priceAsc: priceField,
    priceDesc: `-${priceField}`,
  }

  return payload.find({
    collection: 'products',
    overrideAccess: false,
    locale,
    depth: 1,
    where: and.length ? { and } : undefined,
    sort: sort[query.sort ?? 'featured'],
    page: Math.max(1, query.page ?? 1),
    limit: query.limit ?? 24,
    select: LIST_SELECT,
  })
}

export async function getProduct(slug: string, locale: Locale, draft = false): Promise<Product | null> {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'products',
    locale,
    draft,
    overrideAccess: draft,
    depth: 2,
    limit: 1,
    where: { slug: { equals: slug } },
  })
  return docs[0] ?? null
}

export async function getRelatedProducts(product: Product, locale: Locale, limit = 4) {
  const chosen = (product.relatedProducts ?? []).filter(
    (p): p is Product => typeof p === 'object' && p !== null && p._status !== 'draft',
  )
  if (chosen.length) return chosen.slice(0, limit)
  const categoryIds = (product.categories ?? []).map((c) => (typeof c === 'object' ? c.id : c))
  if (!categoryIds.length) return []
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'products',
    overrideAccess: false,
    locale,
    depth: 1,
    limit,
    where: { and: [{ categories: { in: categoryIds } }, { id: { not_equals: product.id } }] },
    sort: ['-featured', '-createdAt'],
    select: LIST_SELECT,
  })
  return docs as Product[]
}

export async function getProductsByIds(ids: number[], locale: Locale) {
  if (!ids.length) return []
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'products',
    overrideAccess: false,
    locale,
    depth: 1,
    limit: ids.length,
    where: { id: { in: ids } },
    select: LIST_SELECT,
  })
  return docs as Product[]
}

export async function countProducts(where: Where): Promise<number> {
  const payload = await getPayloadClient()
  const { totalDocs } = await payload.count({ collection: 'products', where, overrideAccess: false })
  return totalDocs
}

export async function getPage(slug: string, locale: Locale, draft = false): Promise<Page | null> {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'pages',
    locale,
    draft,
    overrideAccess: draft,
    depth: 2,
    limit: 1,
    where: { slug: { equals: slug } },
  })
  return docs[0] ?? null
}

export async function getPosts(locale: Locale, { page = 1, limit = 9 } = {}) {
  const payload = await getPayloadClient()
  return payload.find({
    collection: 'posts',
    overrideAccess: false,
    locale,
    depth: 1,
    page,
    limit,
    sort: '-publishedAt',
    select: { title: true, slug: true, excerpt: true, cover: true, publishedAt: true, topic: true },
  })
}

export async function getPost(slug: string, locale: Locale, draft = false): Promise<Post | null> {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'posts',
    locale,
    draft,
    overrideAccess: draft,
    depth: 2,
    limit: 1,
    where: { slug: { equals: slug } },
  })
  return docs[0] ?? null
}

export async function getUsedEquipmentList(locale: Locale) {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'used-equipment',
    overrideAccess: false,
    locale,
    depth: 1,
    limit: 60,
    where: { saleStatus: { not_equals: 'sold' } },
    sort: '-createdAt',
  })
  return docs
}

export async function getUsedEquipment(slug: string, locale: Locale, draft = false): Promise<UsedEquipment | null> {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'used-equipment',
    locale,
    draft,
    overrideAccess: draft,
    depth: 2,
    limit: 1,
    where: { slug: { equals: slug } },
  })
  return docs[0] ?? null
}
