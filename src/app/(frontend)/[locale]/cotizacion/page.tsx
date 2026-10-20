import type { Metadata } from 'next'

import { QuoteView } from '@/components/cart/QuoteView'
import { getDictionary } from '@/i18n/dictionaries'
import { resolveLocale, type LocaleParams } from '@/lib/params'
import { buildMetadata } from '@/lib/seo'
import { getCustomer } from '@/lib/session'

type Props = { params: LocaleParams }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await resolveLocale(params)
  const t = getDictionary(locale)
  return buildMetadata({ locale, path: '/cotizacion', title: t.quote.title, description: t.quote.intro })
}

export default async function QuotePage({ params }: Props) {
  const { locale } = await resolveLocale(params)
  const t = getDictionary(locale)
  const customer = await getCustomer()
  return (
    <div className="container-page py-10">
      <h1 className="text-3xl font-bold sm:text-4xl">{t.quote.title}</h1>
      <p className="mt-2 mb-8 max-w-2xl text-slate-600">{t.quote.intro}</p>
      <QuoteView
        prefill={{
          name: customer?.name,
          email: customer?.email,
          phone: customer?.phone ?? undefined,
          company: customer?.company ?? undefined,
        }}
      />
    </div>
  )
}
