import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { ResetForm } from '@/components/account/AccountForms'
import { getDictionary } from '@/i18n/dictionaries'
import { first, resolveLocale, type LocaleParams, type SearchParams } from '@/lib/params'

type Props = { params: LocaleParams; searchParams: SearchParams }

export const metadata: Metadata = { robots: { index: false, follow: false } }

export default async function ResetPage({ params, searchParams }: Props) {
  const { locale } = await resolveLocale(params)
  const token = first((await searchParams).token)
  if (!token) notFound()
  const t = getDictionary(locale)
  return (
    <div className="container-page max-w-md py-16">
      <h1 className="mb-8 text-3xl font-bold">{t.account.resetTitle}</h1>
      <ResetForm token={token} />
    </div>
  )
}
