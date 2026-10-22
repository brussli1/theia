import { ArrowRight, Layers } from 'lucide-react'
import Link from 'next/link'

import { PostCard } from '@/components/content/PostCard'
import { ProductGrid } from '@/components/product/ProductCard'
import { LinkButton } from '@/components/ui/Button'
import { MediaImage } from '@/components/ui/MediaImage'
import { Section, SectionHeading } from '@/components/ui/Section'
import { localePath } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { descendantIds } from '@/lib/categories'
import {
  countProducts,
  findProducts,
  getBrands,
  getCategories,
  getCategoryTree,
  getPosts,
} from '@/lib/data'
import { resolveHref } from '@/lib/links'
import { firstImage, isMedia } from '@/lib/media'
import type { Brand, Category, Product } from '@/payload-types'
import type { BlockContext, BlockOf } from '../types'

export async function ProductShowcaseBlock({ block, ctx }: { block: BlockOf<'productShowcase'>; ctx: BlockContext }) {
  const limit = block.limit ?? 8
  let products: Product[] = []
  const slugOf = (v: unknown) => (typeof v === 'object' && v ? (v as { slug?: string }).slug : undefined)

  if (block.source === 'manual') {
    products = (block.products ?? []).filter((p): p is Product => typeof p === 'object' && p !== null).slice(0, limit)
  } else if (block.source === 'category' || block.source === 'brand') {
    const query = block.source === 'category' ? { category: slugOf(block.category) } : { brand: slugOf(block.brand) }
    products = (await findProducts({ ...query, limit, sort: 'featured' }, ctx.locale, ctx.currency)).docs as Product[]
  } else if (block.source === 'newest') {
    products = (await findProducts({ limit, sort: 'newest' }, ctx.locale, ctx.currency)).docs as Product[]
  } else {
    // Featured first; tops up with the newest products when few are marked.
    products = (await findProducts({ limit, sort: 'featured' }, ctx.locale, ctx.currency)).docs as Product[]
  }
  if (!products.length) return null

  const viewAllHref = resolveHref(block.viewAll, ctx.locale)
  const t = getDictionary(ctx.locale)

  return (
    <Section background={block.background}>
      <SectionHeading
        eyebrow={block.eyebrow}
        title={block.title}
        intro={block.intro}
        inverted={block.background === 'brand'}
        action={
          viewAllHref ? (
            <LinkButton href={viewAllHref} variant={block.background === 'brand' ? 'light' : 'outline'} size="sm">
              {block.viewAll?.label || t.common.viewAll} <ArrowRight className="h-4 w-4" />
            </LinkButton>
          ) : null
        }
      />
      <ProductGrid products={products} locale={ctx.locale} currency={ctx.currency} />
    </Section>
  )
}

export async function CategoryTilesBlock({ block, ctx }: { block: BlockOf<'categoryTiles'>; ctx: BlockContext }) {
  const flat = await getCategories(ctx.locale)
  const normalized = flat.map((c) => ({ ...c, parent: typeof c.parent === 'object' ? c.parent?.id : c.parent }))
  let chosen: Category[] = (block.categories ?? []).filter((c): c is Category => typeof c === 'object' && c !== null)
  if (!chosen.length) {
    const roots = (await getCategoryTree(ctx.locale)).filter((c) => c.showInMenu !== false)
    chosen = roots.slice(0, 8) as unknown as Category[]
  }
  const t = getDictionary(ctx.locale)

  const tiles = await Promise.all(
    chosen.map(async (category) => {
      const ids = descendantIds(normalized, category.id)
      const where = { categories: { in: ids } }
      const count = await countProducts(where)
      let image = isMedia(category.image) ? category.image : null
      if (!image) {
        const sample = await findProducts({ category: category.slug ?? undefined, limit: 1, sort: 'featured' }, ctx.locale, ctx.currency)
        image = firstImage((sample.docs[0] as Product | undefined)?.images)
      }
      return { category, count, image }
    }),
  )

  return (
    <Section background={block.background}>
      <SectionHeading eyebrow={block.eyebrow} title={block.title} intro={block.intro} inverted={block.background === 'brand'} />
      <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
        {tiles
          .filter((tile) => tile.count > 0)
          .map(({ category, count, image }) => (
            <Link
              key={category.id}
              href={localePath(ctx.locale, `/categorias/${category.slug}`)}
              className="group flex flex-col overflow-hidden rounded-card border border-slate-200 bg-white text-ink shadow-card transition hover:-translate-y-0.5 hover:border-accent hover:shadow-lift"
            >
              <div className="relative aspect-[4/3] bg-gradient-to-br from-slate-50 to-brand-50">
                {image ? (
                  <MediaImage media={image} size="card" className="absolute inset-0" imgClassName="object-contain p-5 transition group-hover:scale-105" sizes="(min-width:1024px) 25vw, 50vw" />
                ) : (
                  <Layers className="absolute inset-0 m-auto h-10 w-10 text-brand-200" aria-hidden="true" />
                )}
              </div>
              <div className="flex items-center justify-between gap-2 border-t border-slate-100 p-4">
                <div className="min-w-0">
                  <h3 className="truncate font-sans text-[15px] font-semibold">{category.name}</h3>
                  <p className="text-xs text-slate-500">{getDictionary(ctx.locale).brands.products(count)}</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-accent" aria-hidden="true" />
              </div>
            </Link>
          ))}
      </div>
      <p className="mt-8 text-center">
        <Link href={localePath(ctx.locale, '/productos')} className="font-semibold text-accent-700 hover:underline">
          {t.nav.allProducts} →
        </Link>
      </p>
    </Section>
  )
}

export async function BrandStripBlock({ block, ctx }: { block: BlockOf<'brandStrip'>; ctx: BlockContext }) {
  let brands: Brand[] = (block.brands ?? []).filter((b): b is Brand => typeof b === 'object' && b !== null)
  if (!brands.length) {
    const all = await getBrands()
    brands = all.filter((b) => b.featured)
    if (!brands.length) brands = all.filter((b) => isMedia(b.logo)).slice(0, 12)
  }
  if (!brands.length) return null
  return (
    <Section background={block.background} className="py-12 sm:py-16">
      <SectionHeading eyebrow={block.eyebrow} title={block.title} intro={block.intro} align="center" inverted={block.background === 'brand'} />
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {brands.map((brand) => (
          <li key={brand.id}>
            <Link
              href={localePath(ctx.locale, `/marcas/${brand.slug}`)}
              className="flex h-20 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-center transition hover:border-accent hover:shadow-card"
            >
              {isMedia(brand.logo) ? (
                <MediaImage media={brand.logo} size="thumbnail" fill={false} imgClassName="max-h-10 w-auto object-contain grayscale transition hover:grayscale-0" sizes="160px" />
              ) : (
                <span className="font-display text-lg font-bold tracking-tight text-slate-600">{brand.name}</span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  )
}

export async function LatestPostsBlock({ block, ctx }: { block: BlockOf<'latestPosts'>; ctx: BlockContext }) {
  const { docs } = await getPosts(ctx.locale, { limit: block.limit ?? 3 })
  if (!docs.length) return null
  const t = getDictionary(ctx.locale)
  return (
    <Section background={block.background}>
      <SectionHeading
        eyebrow={block.eyebrow}
        title={block.title}
        intro={block.intro}
        inverted={block.background === 'brand'}
        action={
          <LinkButton href={localePath(ctx.locale, '/blog')} variant="outline" size="sm">
            {t.common.viewAll} <ArrowRight className="h-4 w-4" />
          </LinkButton>
        }
      />
      <div className="grid gap-6 md:grid-cols-3">
        {docs.map((post) => (
          <PostCard key={post.id} post={post} locale={ctx.locale} />
        ))}
      </div>
    </Section>
  )
}
