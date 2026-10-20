/**
 * One-time import of the previous Theia catalog into Payload.
 *
 * Input: legacy-data/catalog.json (exported from the old database) and
 * legacy-data/media/ (the old image files). Both are gitignored.
 *
 *   npm run import:legacy                    # import everything (safe to re-run)
 *   IMPORT_LIMIT=20 npm run import:legacy    # try with a few products first
 *
 * Re-running skips anything already imported (matched by slug; images are
 * remembered in legacy-data/import-state.json).
 */
import { convertHTMLToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical'
import config from '@payload-config'
import fs from 'fs'
import { JSDOM } from 'jsdom'
import path from 'path'
import { getPayload, type Payload } from 'payload'

type LegacyCategory = { id: number; name: string; slug: string; parent_id: number | null }
type LegacyBrand = { id: number; name: string; slug: string }
type LegacyProduct = {
  id: number
  name: string
  slug: string
  description: string | null
  description_html: string | null
  price_gs: number
  price_usd: number | string
  available: boolean
  orderable: boolean
  certifications: string[] | null
  images: string[] | null
  image_alt: string[] | null
  specifications: { key: string; value: string }[] | null
  cross_links: { related_products?: string[] } | null
  category_id: number | null
  brand_id: number | null
}
type Export = { categories: LegacyCategory[]; brands: LegacyBrand[]; products: LegacyProduct[] }

const ROOT = path.resolve(process.cwd(), 'legacy-data')
const STATE_FILE = path.join(ROOT, 'import-state.json')
/** Galleries are capped: past a dozen photos a product page gets unwieldy. */
const MAX_IMAGES = 12
/** Same manufacturer under two names in the old data. */
const BRAND_ALIASES: Record<string, string> = { 'huvitz-co-ltd': 'huvitz' }
const KNOWN_CERTS = ['fda', 'ce', 'iso', 'anvisa', 'dinavisa']

type State = { media: Record<string, number> }
const loadState = (): State => (fs.existsSync(STATE_FILE) ? JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')) : { media: {} })
const saveState = (s: State) => fs.writeFileSync(STATE_FILE, JSON.stringify(s))

function localFile(url: string): string | null {
  const marker = '/media/'
  const at = url.indexOf(marker)
  if (at < 0) return null
  const file = path.join(ROOT, 'media', decodeURIComponent(url.slice(at + marker.length)))
  return fs.existsSync(file) ? file : null
}

function plainSummary(text: string | null): string | undefined {
  const clean = (text ?? '').replace(/\s+/g, ' ').trim()
  if (!clean) return undefined
  if (clean.length <= 220) return clean
  const cut = clean.slice(0, 220)
  const sentence = cut.lastIndexOf('. ')
  return (sentence > 80 ? cut.slice(0, sentence + 1) : `${cut.slice(0, cut.lastIndexOf(' '))}…`).trim()
}

async function findIdBySlug(payload: Payload, collection: 'brands' | 'categories' | 'products', slug: string) {
  const { docs } = await payload.find({ collection, where: { slug: { equals: slug } }, limit: 1, depth: 0, draft: collection === 'products' })
  return docs[0]?.id as number | undefined
}

async function run() {
  const data: Export = JSON.parse(fs.readFileSync(path.join(ROOT, 'catalog.json'), 'utf8'))
  const payload = await getPayload({ config })
  const state = loadState()
  const editorConfig = await editorConfigFactory.default({ config: payload.config })
  const ctx = { skipNotifications: true }

  // Brands
  const brandIds = new Map<number, number>()
  const bySlug = new Map<string, number>()
  for (const b of data.brands) {
    const slug = BRAND_ALIASES[b.slug] ?? b.slug
    let id = bySlug.get(slug) ?? (await findIdBySlug(payload, 'brands', slug))
    if (!id) {
      id = (await payload.create({ collection: 'brands', data: { name: b.name, slug }, context: ctx })).id
    }
    bySlug.set(slug, id)
    brandIds.set(b.id, id)
  }
  payload.logger.info(`Brands: ${bySlug.size}`)

  // Categories: create first, then link parents.
  const categoryIds = new Map<number, number>()
  for (const [i, c] of data.categories.entries()) {
    let id = await findIdBySlug(payload, 'categories', c.slug)
    if (!id) {
      id = (await payload.create({ collection: 'categories', data: { name: c.name, slug: c.slug, order: (i + 1) * 10 }, context: ctx })).id
    }
    categoryIds.set(c.id, id)
  }
  for (const c of data.categories) {
    if (c.parent_id && categoryIds.has(c.parent_id)) {
      await payload.update({ collection: 'categories', id: categoryIds.get(c.id)!, data: { parent: categoryIds.get(c.parent_id)! }, context: ctx })
    }
  }
  payload.logger.info(`Categories: ${categoryIds.size}`)

  // Products
  const limit = Number(process.env.IMPORT_LIMIT) || Infinity
  const productIds = new Map<string, number>()
  let created = 0
  let skipped = 0
  for (const p of data.products.slice(0, limit)) {
    const existing = await findIdBySlug(payload, 'products', p.slug)
    if (existing) {
      productIds.set(p.slug, existing)
      skipped++
      continue
    }

    const images: number[] = []
    for (const [index, url] of (p.images ?? []).slice(0, MAX_IMAGES).entries()) {
      if (state.media[url]) {
        images.push(state.media[url])
        continue
      }
      const file = localFile(url)
      if (!file) continue
      try {
        const alt = (p.image_alt?.[index] || p.name).slice(0, 200)
        const media = await payload.create({ collection: 'media', data: { alt }, filePath: file })
        state.media[url] = media.id
        images.push(media.id)
      } catch (err) {
        payload.logger.warn({ err }, `Image skipped: ${url}`)
      }
    }
    saveState(state)

    let description
    if (p.description_html?.trim()) {
      try {
        description = convertHTMLToLexical({ editorConfig, html: p.description_html, JSDOM })
      } catch {
        description = undefined
      }
    }

    const priceGs = Number(p.price_gs) || 0
    const priceUsd = Number(p.price_usd) || 0
    const buy = p.orderable && priceGs > 0 && priceUsd > 0

    const doc = await payload.create({
      collection: 'products',
      context: ctx,
      data: {
        name: p.name,
        slug: p.slug,
        _status: 'published',
        brand: p.brand_id ? brandIds.get(p.brand_id) : undefined,
        categories: p.category_id && categoryIds.has(p.category_id) ? [categoryIds.get(p.category_id)!] : [],
        images,
        summary: plainSummary(p.description),
        description,
        purchaseMode: buy ? 'buy' : 'quote',
        priceGs: priceGs || undefined,
        priceUsd: priceUsd || undefined,
        availability: p.available ? 'available' : 'unavailable',
        certifications: (p.certifications ?? []).map((c) => c.toLowerCase()).filter((c) => KNOWN_CERTS.includes(c)) as never,
        specifications: (p.specifications ?? [])
          .filter((s) => s.key && s.value)
          .map((s) => ({ label: String(s.key).slice(0, 200), value: String(s.value).slice(0, 500) })),
      },
    })
    productIds.set(p.slug, doc.id)
    created++
    if (created % 25 === 0) payload.logger.info(`Products created: ${created}`)
  }

  // Related products, now that every product exists.
  for (const p of data.products.slice(0, limit)) {
    const related = (p.cross_links?.related_products ?? []).map((s) => productIds.get(s)).filter((id): id is number => Boolean(id))
    const id = productIds.get(p.slug)
    if (id && related.length) {
      await payload.update({ collection: 'products', id, data: { relatedProducts: related.slice(0, 8) }, context: ctx })
    }
  }

  payload.logger.info(`Done. Products created: ${created}, already present: ${skipped}. Images: ${Object.keys(state.media).length}`)
  process.exit(0)
}

try {
  await run()
} catch (err) {
  console.error(err)
  process.exit(1)
}
