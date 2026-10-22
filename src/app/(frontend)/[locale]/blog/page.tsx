import type { Metadata } from 'next'

import { Pagination } from '@/components/catalog/Pagination'
import { PostCard } from '@/components/content/PostCard'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { localePath } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { getPosts } from '@/lib/data'
import { first, resolveLocale, type LocaleParams, type SearchParams } from '@/lib/params'
import { buildMetadata } from '@/lib/seo'

type Props = { params: LocaleParams; searchParams: SearchParams }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await resolveLocale(params)
  const t = getDictionary(locale)
  return buildMetadata({ locale, path: '/blog', title: t.blog.title, description: t.blog.intro })
}

export default async function BlogPage({ params, searchParams }: Props) {
  const { locale } = await resolveLocale(params)
  const t = getDictionary(locale)
  const page = Number(first((await searchParams).pagina)) || 1
  const posts = await getPosts(locale, { page, limit: 9 })
  return (
    <div className="container-page py-8 sm:py-10">
      <Breadcrumbs items={[{ label: t.nav.home, href: localePath(locale, '/') }, { label: t.blog.title }]} />
      <h1 className="mt-6 text-3xl font-bold sm:text-4xl">{t.blog.title}</h1>
      <p className="mt-2 text-slate-600">{t.blog.intro}</p>
      {posts.docs.length ? (
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.docs.map((post) => (
            <PostCard key={post.id} post={post} locale={locale} />
          ))}
        </div>
      ) : (
        <p className="mt-10 text-slate-500">{t.blog.empty}</p>
      )}
      <Pagination
        page={posts.page ?? 1}
        totalPages={posts.totalPages}
        hrefFor={(p) => localePath(locale, p > 1 ? `/blog?pagina=${p}` : '/blog')}
        labels={t.pagination}
      />
    </div>
  )
}
