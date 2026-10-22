import type { Metadata } from 'next'

import { CartView } from '@/components/cart/CartView'
import { getDictionary } from '@/i18n/dictionaries'
import { resolveLocale, type LocaleParams } from '@/lib/params'
import { buildMetadata } from '@/lib/seo'

type Props = { params: LocaleParams }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await resolveLocale(params)
  return buildMetadata({ locale, path: '/carrito', title: getDictionary(locale).cart.title, noIndex: true })
}

export default async function CartPage({ params }: Props) {
  const { locale } = await resolveLocale(params)
  const t = getDictionary(locale)
  return (
    <div className="container-page py-10">
      <h1 className="mb-8 text-3xl font-bold sm:text-4xl">{t.cart.title}</h1>
      <CartView />
    </div>
  )
}
