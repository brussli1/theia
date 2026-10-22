import { PackageSearch } from 'lucide-react'
import type { Metadata } from 'next'

import { TrackForm } from '@/components/cart/TrackForm'
import { getDictionary } from '@/i18n/dictionaries'
import { resolveLocale, type LocaleParams } from '@/lib/params'
import { buildMetadata } from '@/lib/seo'

type Props = { params: LocaleParams }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await resolveLocale(params)
  return buildMetadata({ locale, path: '/seguimiento', title: getDictionary(locale).track.title })
}

export default async function TrackPage({ params }: Props) {
  const { locale } = await resolveLocale(params)
  const t = getDictionary(locale)
  return (
    <div className="container-page max-w-md py-16">
      <PackageSearch className="h-10 w-10 text-accent" aria-hidden="true" />
      <h1 className="mt-4 text-3xl font-bold">{t.track.title}</h1>
      <p className="mt-2 mb-8 text-slate-600">{t.track.intro}</p>
      <TrackForm />
    </div>
  )
}
