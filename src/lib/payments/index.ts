import 'server-only'

import type { Payload } from 'payload'

import { localePath } from '@/i18n/config'
import type { PaymentMethod } from '@/lib/constants'
import type { Currency } from '@/lib/currency'
import type { Order, Setting } from '@/payload-types'
import { bancardConfigured, bancardGetConfirmation, bancardSingleBuy } from './bancard'
import { paypalCapture, paypalConfigured, paypalCreateOrder } from './paypal'

/**
 * One interface for every way to pay:
 *  - transfer / Western Union: manual. The customer gets instructions and an
 *    admin marks the order "Pagado" once the money arrives.
 *  - card (Bancard vPOS, guaraníes) and PayPal (US dollars): hosted pages.
 * With PAYMENT_MODE=sandbox (default) card and PayPal are simulated, so the
 * whole checkout can be tried without merchant accounts.
 */

export const SERVER_URL = () => process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
export const isSandbox = () => process.env.PAYMENT_MODE !== 'production'

export function availableMethods(settings: Setting): PaymentMethod[] {
  const p = settings.payments ?? {}
  const methods: PaymentMethod[] = []
  if (p.transfer !== false) methods.push('transfer')
  if (p.card !== false && (isSandbox() || bancardConfigured())) methods.push('card')
  if (p.paypal !== false && (isSandbox() || paypalConfigured())) methods.push('paypal')
  if (p.westernUnion !== false) methods.push('western_union')
  return methods
}

/** Bancard settles in guaraníes and PayPal only in dollars; manual methods follow the visitor. */
export function chargeCurrency(method: PaymentMethod, visitorCurrency: Currency): Currency {
  if (method === 'card') return 'PYG'
  if (method === 'paypal') return 'USD'
  return visitorCurrency
}

export function orderPagePath(order: Pick<Order, 'orderNumber' | 'accessToken' | 'locale'>, extra = '') {
  const locale = order.locale === 'en' ? 'en' : 'es'
  return `${localePath(locale, `/pedido/${order.orderNumber}`)}?t=${order.accessToken}${extra}`
}

function returnUrl(order: Order, provider: 'paypal' | 'bancard') {
  const locale = order.locale === 'en' ? 'en' : 'es'
  const qs = new URLSearchParams({ pedido: order.orderNumber, t: order.accessToken })
  return `${SERVER_URL()}${localePath(locale, `/pago/${provider}`)}?${qs.toString()}`
}

/** Starts the payment. Returns where to send the customer next. */
export async function startPayment(order: Order, payload: Payload): Promise<string> {
  const method = order.paymentMethod
  if (method === 'transfer' || method === 'western_union') return orderPagePath(order)

  if (isSandbox()) {
    const locale = order.locale === 'en' ? 'en' : 'es'
    return `${localePath(locale, '/pago/prueba')}?pedido=${order.orderNumber}&t=${order.accessToken}`
  }

  const amount = order.currency === 'PYG' ? order.subtotalGs : order.subtotalUsd
  if (method === 'paypal') {
    const { id, approveUrl } = await paypalCreateOrder({
      reference: order.orderNumber,
      amountUsd: amount,
      returnUrl: returnUrl(order, 'paypal'),
      cancelUrl: `${SERVER_URL()}${orderPagePath(order, '&pago=cancelado')}`,
    })
    await payload.update({ collection: 'orders', id: order.id, data: { paymentReference: id }, context: { skipNotifications: true } })
    return approveUrl
  }

  // card → Bancard
  const { processId, redirectUrl } = await bancardSingleBuy({
    shopProcessId: order.id,
    amountGs: amount,
    description: `Pedido ${order.orderNumber}`,
    returnUrl: returnUrl(order, 'bancard'),
    cancelUrl: `${SERVER_URL()}${orderPagePath(order, '&pago=cancelado')}`,
  })
  await payload.update({ collection: 'orders', id: order.id, data: { paymentReference: processId }, context: { skipNotifications: true } })
  return redirectUrl
}

/** Marks an order as paid (idempotent). The status change e-mails the customer. */
export async function markPaid(payload: Payload, order: Order, reference?: string) {
  if (order.paymentStatus === 'paid') return
  await payload.update({
    collection: 'orders',
    id: order.id,
    data: {
      paymentStatus: 'paid',
      status: order.status === 'awaiting_payment' ? 'paid' : order.status,
      ...(reference ? { paymentReference: reference } : {}),
    },
  })
}

export async function markFailed(payload: Payload, order: Order) {
  if (order.paymentStatus === 'paid') return
  await payload.update({
    collection: 'orders',
    id: order.id,
    data: { paymentStatus: 'failed' },
    context: { skipNotifications: true },
  })
}

/** Asks the gateway whether the payment went through. */
export async function verifyGatewayPayment(order: Order, providerRef?: string | null): Promise<{ paid: boolean; reference?: string }> {
  if (order.paymentMethod === 'paypal') {
    const id = providerRef || order.paymentReference
    if (!id) return { paid: false }
    return paypalCapture(id)
  }
  if (order.paymentMethod === 'card') return bancardGetConfirmation(order.id)
  return { paid: false }
}

export async function findOrderByToken(payload: Payload, orderNumber: string, token: string): Promise<Order | null> {
  if (!orderNumber || !token) return null
  const { docs } = await payload.find({
    collection: 'orders',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    showHiddenFields: true,
    where: { and: [{ orderNumber: { equals: orderNumber } }, { accessToken: { equals: token } }] },
  })
  return docs[0] ?? null
}
