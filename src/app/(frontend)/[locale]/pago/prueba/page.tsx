import { FlaskConical } from 'lucide-react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { Button } from '@/components/ui/Button'
import { getDictionary } from '@/i18n/dictionaries'
import { resolveSandboxPayment } from '@/lib/actions/checkout'
import { formatPrice } from '@/lib/currency'
import { first, resolveLocale, type LocaleParams, type SearchParams } from '@/lib/params'
import { getPayloadClient } from '@/lib/payload'
import { findOrderByToken, isSandbox } from '@/lib/payments'

type Props = { params: LocaleParams; searchParams: SearchParams }

export const metadata: Metadata = { robots: { index: false, follow: false } }

/** Simulated card/PayPal page, only while PAYMENT_MODE is not "production". */
export default async function SandboxPaymentPage({ params, searchParams }: Props) {
  const { locale } = await resolveLocale(params)
  if (!isSandbox()) notFound()
  const sp = await searchParams
  const number = first(sp.pedido) ?? ''
  const token = first(sp.t) ?? ''
  const order = await findOrderByToken(await getPayloadClient(), number, token)
  if (!order) notFound()
  const t = getDictionary(locale)
  const amount = order.currency === 'PYG' ? formatPrice(order.subtotalGs, 'PYG', locale) : formatPrice(order.subtotalUsd, 'USD', locale)

  return (
    <div className="container-page max-w-lg py-16">
      <div className="rounded-card border border-slate-200 bg-white p-8 text-center shadow-card">
        <FlaskConical className="mx-auto h-10 w-10 text-accent" aria-hidden="true" />
        <h1 className="mt-4 text-2xl font-bold">{t.sandbox.title}</h1>
        <p className="mt-2 text-slate-600">{t.sandbox.intro}</p>
        <p className="mt-6 text-sm text-slate-500">
          {t.order.title(order.orderNumber)} · {t.checkout.methods[order.paymentMethod]}
        </p>
        <p className="mt-1 text-3xl font-bold tabular-nums">{amount}</p>
        <div className="mt-8 flex flex-col gap-3">
          <form action={resolveSandboxPayment.bind(null, order.orderNumber, token, true)}>
            <Button type="submit" size="lg" className="w-full" data-testid="sandbox-approve">
              {t.sandbox.approve}
            </Button>
          </form>
          <form action={resolveSandboxPayment.bind(null, order.orderNumber, token, false)}>
            <Button type="submit" variant="outline" className="w-full">
              {t.sandbox.cancel}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
