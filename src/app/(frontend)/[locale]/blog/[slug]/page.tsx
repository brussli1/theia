import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { formatDate } from '@/components/content/PostCard'
import { ProductGrid } from '@/components/product/ProductCard'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { MediaImage } from '@/components/ui/MediaImage'
import { RichText } from '@/components/ui/RichText'
import { localePath } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { getPost } from '@/lib/data'
import { resolveLocale, type LocaleParams } from '@/lib/params'
import { buildMetadata, jsonLd } from '@/lib/seo'
import { getCurrency, isDraft } from '@/lib/session'
import type { Product } from '@/payload-types'

type Props = { params: LocaleParams<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await resolveLocale(params)
  const post = await getPost(slug, locale)
  if (!post) return {}
  return buildMetadata({ locale, path: `/blog/${slug}`, title: post.title, description: post.excerpt, image: post.cover, meta: post.meta })
}

export default async function PostPage({ params }: Props) {
  const { locale, slug } = await resolveLocale(params)
  const post = await getPost(slug, locale, await isDraft())
  if (!post) notFound()
  const t = getDictionary(locale)
  const currency = await getCurrency()
  const related = (post.relatedProducts ?? []).filter((p): p is Product => typeof p === 'object' && p !== null)
  const article = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    datePublished: post.publishedAt || undefined,
    dateModified: post.updatedAt,
    description: post.excerpt || undefined,
  }

  return (
    <article className="pb-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(article)} />
      <div className="container-page max-w-3xl pt-8 sm:pt-10">
        <Breadcrumbs
          items={[
            { label: t.nav.home, href: localePath(locale, '/') },
            { label: t.blog.title, href: localePath(locale, '/blog') },
            { label: post.title },
          ]}
        />
        {post.publishedAt && <time className="mt-8 block text-sm text-slate-500">{formatDate(post.publishedAt, locale)}</time>}
        <h1 className="mt-2 text-4xl leading-tight font-bold sm:text-5xl">{post.title}</h1>
        {post.excerpt && <p className="mt-4 text-xl text-slate-600">{post.excerpt}</p>}
      </div>
      {post.cover && (
        <div className="container-page mt-10 max-w-5xl">
          <MediaImage media={post.cover} size="large" className="aspect-[16/9] rounded-card" priority sizes="(min-width:1024px) 1024px, 100vw" />
        </div>
      )}
      <div className="container-page mt-10 max-w-3xl">
        <RichText data={post.body} />
      </div>
      {related.length > 0 && (
        <section className="container-page mt-16">
          <h2 className="mb-6 text-2xl font-bold">{t.blog.related}</h2>
          <ProductGrid products={related} locale={locale} currency={currency} />
        </section>
      )}
    </article>
  )
}
