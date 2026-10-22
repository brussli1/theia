import { headers } from 'next/headers'
import { SearchX } from 'lucide-react'

import { LinkButton } from '@/components/ui/Button'
import { localePath } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'

export default async function NotFound() {
  // not-found pages receive no params; the proxy passes the language along.
  const locale = (await headers()).get('x-theia-locale') === 'en' ? 'en' : 'es'
  const t = getDictionary(locale)
  return (
    <div className="container-page flex flex-col items-center py-24 text-center">
      <SearchX className="h-14 w-14 text-accent" aria-hidden="true" />
      <p className="mt-6 text-sm font-semibold tracking-wider text-accent-700 uppercase">404</p>
      <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{t.notFound.title}</h1>
      <p className="mt-3 max-w-md text-slate-600">{t.notFound.text}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <LinkButton href={localePath(locale, '/productos')}>{t.notFound.catalog}</LinkButton>
        <LinkButton href={localePath(locale, '/')} variant="outline">
          {t.notFound.home}
        </LinkButton>
      </div>
    </div>
  )
}
