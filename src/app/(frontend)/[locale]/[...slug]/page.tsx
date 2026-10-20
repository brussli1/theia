import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'

import { PageView } from '@/components/content/PageView'
import { localePath } from '@/i18n/config'
import { getPage } from '@/lib/data'
import { resolveLocale, type LocaleParams } from '@/lib/params'
import { findRedirect } from '@/lib/redirects'
import { buildMetadata } from '@/lib/seo'
import { getCurrency, isDraft } from '@/lib/session'

type Props = { params: LocaleParams<{ slug: string[] }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await resolveLocale(params)
  const page = slug.length === 1 ? await getPage(slug[0], locale) : null
  if (!page) return {}
  return buildMetadata({ locale, path: `/${page.slug}`, title: page.title, meta: page.meta })
}

/** Any page created in the admin ("Nosotros", "Contacto", legal pages…). */
export default async function CmsPage({ params }: Props) {
  const { locale, slug } = await resolveLocale(params)
  const path = `/${slug.map(decodeURIComponent).join('/')}`

  if (slug.length === 1 && slug[0] !== 'inicio') {
    const draft = await isDraft()
    const page = await getPage(slug[0], locale, draft)
    if (page) return <PageView page={page} locale={locale} currency={await getCurrency()} />
  }
  if (slug.length === 1 && slug[0] === 'inicio') permanentRedirect(localePath(locale, '/'))

  // Old addresses an editor redirected in "Redirecciones".
  const target = await findRedirect(path)
  if (target) permanentRedirect(target.startsWith('/') ? localePath(locale, target) : target)
  notFound()
}
