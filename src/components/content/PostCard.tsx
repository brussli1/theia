import { Newspaper } from 'lucide-react'
import Link from 'next/link'

import { MediaImage } from '@/components/ui/MediaImage'
import { localePath, type Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import type { Post } from '@/payload-types'

export function formatDate(value: string | null | undefined, locale: Locale) {
  if (!value) return ''
  return new Intl.DateTimeFormat(locale === 'es' ? 'es-PY' : 'en-US', { dateStyle: 'long' }).format(new Date(value))
}

export function PostCard({ post, locale }: { post: Pick<Post, 'id' | 'title' | 'slug' | 'excerpt' | 'cover' | 'publishedAt'>; locale: Locale }) {
  const t = getDictionary(locale)
  const href = localePath(locale, `/blog/${post.slug}`)
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-card border border-slate-200 bg-white text-ink shadow-card transition hover:shadow-lift">
      <div className="relative aspect-[16/9] bg-brand-50">
        {post.cover ? (
          <MediaImage media={post.cover} size="card" className="absolute inset-0" sizes="(min-width:768px) 33vw, 100vw" />
        ) : (
          <Newspaper className="absolute inset-0 m-auto h-10 w-10 text-brand-200" aria-hidden="true" />
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        {post.publishedAt && <time className="text-xs font-medium text-slate-500">{formatDate(post.publishedAt, locale)}</time>}
        <h3 className="mt-2 text-lg leading-snug font-semibold">
          <Link href={href} className="after:absolute after:inset-0">
            {post.title}
          </Link>
        </h3>
        {post.excerpt && <p className="mt-2 line-clamp-3 text-[15px] text-slate-600">{post.excerpt}</p>}
        <span className="mt-auto pt-4 text-sm font-semibold text-accent-700 group-hover:underline">{t.blog.readMore} →</span>
      </div>
    </article>
  )
}
