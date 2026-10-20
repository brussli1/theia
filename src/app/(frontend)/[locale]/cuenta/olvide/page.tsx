import type { Metadata } from 'next'

import { ForgotForm } from '@/components/account/AccountForms'
import { getDictionary } from '@/i18n/dictionaries'
import { resolveLocale, type LocaleParams } from '@/lib/params'
import { buildMetadata } from '@/lib/seo'

type Props = { params: LocaleParams }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await resolveLocale(params)
  return buildMetadata({ locale, path: '/cuenta/olvide', title: getDictionary(locale).account.forgotTitle, noIndex: true })
}

export default async function ForgotPage({ params }: Props) {
  const { locale } = await resolveLocale(params)
  const t = getDictionary(locale)
  return (
    <div className="container-page max-w-md py-16">
      <h1 className="text-3xl font-bold">{t.account.forgotTitle}</h1>
      <p className="mt-2 mb-8 text-slate-600">{t.account.forgotIntro}</p>
      <ForgotForm />
    </div>
  )
}
