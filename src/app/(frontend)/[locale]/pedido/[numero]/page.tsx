import { CheckCircle2, Clock, Package, XCircle } from 'lucide-react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { WhatsAppIcon } from '@/components/layout/WhatsAppButton'
import { Button, buttonClasses } from '@/components/ui/Button'
import { FormAlert } from '@/components/forms/Field'
import { getDictionary } from '@/i18n/dictionaries'
import { retryPayment } from '@/lib/actions/checkout'
import { cn } from '@/lib/cn'
import { formatPrice } from '@/lib/currency'
import { getSettings } from '@/lib/data'
import { whatsappHref } from '@/lib/links'
import { getPayloadClient } from '@/lib/payload'
import { first, resolveLocale, type LocaleParams, type SearchParams } from '@/lib/params'
import { paymentInstructions } from '@/lib/email/notify'
import { getCustomer } from '@/lib/session'
import type { Order } from '@/payload-types'

type Props = { params: LocaleParams<{ numero: string }>; searchParams: SearchParams }

export const metadata: Metadata = { robots: { index: false, follow: false } }

async function loadOrder(number: string, token: string | undefined): Promise<Order | null> {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'orders',
    depth: 0,
    limit: 1,
    showHiddenFields: true,
    where: { orderNumber: { equals: number.toUpperCase() } },
  })
  const order = docs[0]
  if (!order) return null
  if (token && token === order.accessToken) return order
  const customer = await getCustomer()
  const owner = typeof order.customer === 'object' ? order.customer?.id : order.customer
  return customer && owner === customer.id ? order : null
}

const STEPS = ['awaiting_payment', 'paid', 'processing', 'shipped', 'delivered'] as const

export default async function OrderPage({ params, searchParams }: Props) {
  const { locale, numero } = await resolveLocale(params)
  const sp = await searchParams
  const token = first(sp.t)
  const payment = first(sp.pago)
  const order = await loadOrder(numero, token)
  if (!order) notFound()

  const t = getDictionary(locale)
  const settings = await getSettings(locale)
  const instructions = order.paymentStatus !== 'paid' ? paymentInstructions(settings, order.paymentMethod) : null
  const money = (gs: number, usd: number) => (order.currency === 'PYG' ? formatPrice(gs, 'PYG', locale) : formatPrice(usd, 'USD', locale))
  const wa = whatsappHref(settings.whatsapp, `${t.order.title(order.orderNumber)} — ${order.contactName}`)
  const canRetry =
    (order.paymentMethod === 'card' || order.paymentMethod === 'paypal') &&
    order.paymentStatus !== 'paid' &&
    order.status === 'awaiting_payment' &&
    token
  const stepIndex = order.status === 'ready_for_pickup' ? 3 : STEPS.indexOf(order.status as (typeof STEPS)[number])

  return (
    <div className="container-page max-w-4xl py-10" data-testid="order-page">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold tracking-wider text-accent-700 uppercase">{t.order.thanks}</p>
        <h1 className="text-3xl font-bold sm:text-4xl">{t.order.title(order.orderNumber)}</h1>
        <p className="text-slate-600">{t.order.received}</p>
      </div>

      <div className="mt-6 space-y-3">
        {(payment === 'ok' || order.paymentStatus === 'paid') && <FormAlert tone="success">{t.order.paymentConfirmed}</FormAlert>}
        {(payment === 'error' || payment === 'cancelado') && order.paymentStatus !== 'paid' && <FormAlert>{t.order.paymentFailed}</FormAlert>}
      </div>

      {order.status !== 'cancelled' ? (
        <ol className="mt-8 grid grid-cols-5 gap-2" aria-label={t.order.status}>
          {STEPS.map((step, i) => (
            <li key={step} className="flex flex-col items-center gap-2 text-center">
              <span
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full border-2',
                  i <= stepIndex ? 'border-accent bg-accent text-white' : 'border-slate-200 bg-white text-slate-300',
                )}
              >
                {i <= stepIndex ? <CheckCircle2 className="h-5 w-5" /> : i === stepIndex + 1 ? <Clock className="h-4 w-4" /> : <Package className="h-4 w-4" />}
              </span>
              <span className={cn('text-xs', i === stepIndex ? 'font-semibold text-ink' : 'text-slate-500')}>{t.order.statuses[step]}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-8 flex items-center gap-2 font-semibold text-red-700">
          <XCircle className="h-5 w-5" /> {t.order.statuses.cancelled}
        </p>
      )}

      {(instructions || canRetry) && (
        <section className="mt-8 rounded-card border border-amber-200 bg-amber-50 p-6">
          <h2 className="text-lg font-semibold">{t.order.howToPay}</h2>
          {instructions && <p className="mt-3 text-[15px] whitespace-pre-line text-slate-700">{instructions}</p>}
          {instructions && <p className="mt-3 text-sm text-slate-600">{t.order.sendReceipt}</p>}
          <div className="mt-4 flex flex-wrap gap-3">
            {canRetry && (
              <form action={retryPayment.bind(null, order.orderNumber, token!)}>
                <Button type="submit">{t.order.payNow}</Button>
              </form>
            )}
            {instructions && wa && (
              <a href={wa} target="_blank" rel="noopener noreferrer" className={buttonClasses('whatsapp')}>
                <WhatsAppIcon className="h-5 w-5" /> {t.order.sendReceiptButton}
              </a>
            )}
          </div>
        </section>
      )}

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        <section className="rounded-card border border-slate-200 p-6 md:col-span-2">
          <h2 className="text-lg font-semibold">{t.order.items}</h2>
          <ul className="mt-4 divide-y divide-slate-100 text-sm">
            {order.items.map((item) => (
              <li key={item.id ?? item.name} className="flex justify-between gap-4 py-3">
                <span>
                  {item.name} <span className="text-slate-500">× {item.quantity}</span>
                </span>
                <span className="font-medium tabular-nums">{money(item.unitPriceGs * item.quantity, item.unitPriceUsd * item.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 font-bold">
            <span>{t.cart.total}</span>
            <span className="tabular-nums">{money(order.subtotalGs, order.subtotalUsd)}</span>
          </div>
        </section>
        <section className="space-y-4 rounded-card border border-slate-200 p-6 text-sm">
          <div>
            <h2 className="font-semibold">{t.order.status}</h2>
            <p className="mt-1 text-slate-600">{t.order.statuses[order.status]}</p>
          </div>
          <div>
            <h2 className="font-semibold">{t.checkout.payment}</h2>
            <p className="mt-1 text-slate-600">{t.checkout.methods[order.paymentMethod]}</p>
          </div>
          <div>
            <h2 className="font-semibold">{t.order.delivery}</h2>
            <p className="mt-1 text-slate-600">
              {order.deliveryMethod === 'pickup' ? t.checkout.pickup : [order.address, order.city, order.country].filter(Boolean).join(', ')}
            </p>
          </div>
          {order.trackingCode && (
            <div>
              <h2 className="font-semibold">{t.order.tracking}</h2>
              <p className="mt-1 font-mono text-slate-700">{order.trackingCode}</p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
