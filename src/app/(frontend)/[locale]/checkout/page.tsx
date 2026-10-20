import type { Metadata } from 'next'

import { CheckoutForm } from '@/components/cart/CheckoutForm'
import { getDictionary } from '@/i18n/dictionaries'
import { getSettings } from '@/lib/data'
import { resolveLocale, type LocaleParams } from '@/lib/params'
import { availableMethods } from '@/lib/payments'
import { buildMetadata } from '@/lib/seo'
import { getCustomer } from '@/lib/session'

type Props = { params: LocaleParams }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await resolveLocale(params)
  return buildMetadata({ locale, path: '/checkout', title: getDictionary(locale).checkout.title, noIndex: true })
}

export default async function CheckoutPage({ params }: Props) {
  const { locale } = await resolveLocale(params)
  const t = getDictionary(locale)
  const [settings, customer] = await Promise.all([getSettings(locale), getCustomer()])
  return (
    <div className="container-page py-10">
      <h1 className="mb-8 text-3xl font-bold sm:text-4xl">{t.checkout.title}</h1>
      <CheckoutForm
        methods={availableMethods(settings)}
        pickupEnabled={settings.pickupEnabled !== false}
        shippingNote={settings.shippingNote}
        loggedIn={Boolean(customer)}
        prefill={{
          name: customer?.name,
          email: customer?.email,
          phone: customer?.phone ?? undefined,
          company: customer?.company ?? undefined,
          taxId: customer?.taxId ?? undefined,
          legalName: customer?.legalName ?? undefined,
          address: customer?.address?.line ?? undefined,
          city: customer?.address?.city ?? undefined,
          country: customer?.address?.country ?? undefined,
        }}
      />
    </div>
  )
}
