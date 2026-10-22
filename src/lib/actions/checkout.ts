'use server'

import { redirect } from 'next/navigation'

import { isLocale, type Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import type { PaymentMethod } from '@/lib/constants'
import { firstImage, mediaSrc } from '@/lib/media'
import { getPayloadClient } from '@/lib/payload'
import {
  availableMethods,
  chargeCurrency,
  findOrderByToken,
  isSandbox,
  markFailed,
  markPaid,
  orderPagePath,
  startPayment,
} from '@/lib/payments'
import { newAccessToken, newOrderNumber } from '@/lib/references'
import { getCurrency, getCustomer } from '@/lib/session'
import { clean, requireFields, type FieldErrors } from '@/lib/validation'
import type { Order, Product } from '@/payload-types'

export type ListProduct = {
  id: number
  name: string
  slug: string
  sku: string | null
  brand: string | null
  image: string | null
  purchaseMode: 'buy' | 'quote'
  priceGs: number | null
  priceUsd: number | null
  availability: string
}

const purchasable = (p: Product) =>
  p.purchaseMode === 'buy' && (p.priceGs ?? 0) > 0 && (p.priceUsd ?? 0) > 0 && p.availability !== 'unavailable'

/** Fresh names and prices for the ids kept in the browser's cart / quote list. */
export async function getListProducts(ids: number[], locale: string): Promise<ListProduct[]> {
  const clean = ids.filter((id) => Number.isInteger(id) && id > 0).slice(0, 100)
  if (!clean.length) return []
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'products',
    locale: isLocale(locale) ? locale : 'es',
    overrideAccess: false,
    depth: 1,
    limit: clean.length,
    where: { id: { in: clean } },
    select: { name: true, slug: true, sku: true, brand: true, images: true, purchaseMode: true, priceGs: true, priceUsd: true, availability: true },
  })
  return (docs as Product[]).map((p) => {
    const image = firstImage(p.images)
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      sku: p.sku ?? null,
      brand: typeof p.brand === 'object' && p.brand ? p.brand.name : null,
      image: image ? mediaSrc(image.sizes?.thumbnail?.url || image.url) : null,
      purchaseMode: purchasable(p) ? 'buy' : 'quote',
      priceGs: p.priceGs ?? null,
      priceUsd: p.priceUsd ?? null,
      availability: p.availability ?? 'available',
    }
  })
}

export type CheckoutInput = {
  locale: string
  items: { id: number; qty: number }[]
  name: string
  email: string
  phone: string
  company?: string
  taxId?: string
  legalName?: string
  deliveryMethod: 'shipping' | 'pickup'
  address?: string
  city?: string
  country?: string
  notes?: string
  paymentMethod: PaymentMethod
}

export type CheckoutResult =
  | { ok: true; redirect: string }
  | { ok: false; errors?: FieldErrors; message?: string; removed?: number[] }

export async function placeOrder(input: CheckoutInput): Promise<CheckoutResult> {
  const locale: Locale = isLocale(input.locale) ? input.locale : 'es'
  const t = getDictionary(locale)
  const payload = await getPayloadClient()

  const data = {
    name: clean(input.name),
    email: clean(input.email).toLowerCase(),
    phone: clean(input.phone, 40),
    company: clean(input.company),
    taxId: clean(input.taxId, 40),
    legalName: clean(input.legalName),
    address: clean(input.address, 300),
    city: clean(input.city, 120),
    country: clean(input.country, 120),
    notes: clean(input.notes, 2000),
  }
  const delivery = input.deliveryMethod === 'pickup' ? 'pickup' : 'shipping'
  const required = ['name', 'email', 'phone', ...(delivery === 'shipping' ? ['address', 'city', 'country'] : [])]
  const errors = requireFields(data, required, { required: t.forms.requiredField, email: t.forms.invalidEmail })
  if (Object.keys(errors).length) return { ok: false, errors, message: t.checkout.errors.invalid }

  const settings = await payload.findGlobal({ slug: 'settings', depth: 0 })
  if (delivery === 'pickup' && settings.pickupEnabled === false) return { ok: false, message: t.checkout.errors.invalid }
  const methods = availableMethods(settings)
  if (!methods.includes(input.paymentMethod)) return { ok: false, message: t.checkout.errors.method }

  // Prices always come from the database, never from the browser.
  const lines = (input.items ?? []).filter((l) => Number.isInteger(l.id) && Number.isInteger(l.qty) && l.qty > 0).slice(0, 100)
  if (!lines.length) return { ok: false, message: t.checkout.errors.empty }
  const { docs } = await payload.find({
    collection: 'products',
    locale,
    overrideAccess: false,
    depth: 0,
    limit: lines.length,
    where: { id: { in: lines.map((l) => l.id) } },
  })
  const products = new Map((docs as Product[]).filter(purchasable).map((p) => [p.id, p]))
  const removed = lines.filter((l) => !products.has(l.id)).map((l) => l.id)
  if (removed.length) return { ok: false, removed, message: t.cart.unavailable }

  const items = lines.map((l) => {
    const p = products.get(l.id)!
    return {
      product: p.id,
      name: p.name,
      sku: p.sku ?? undefined,
      quantity: Math.min(l.qty, 99),
      unitPriceGs: p.priceGs!,
      unitPriceUsd: p.priceUsd!,
    }
  })
  const subtotalGs = items.reduce((s, i) => s + i.unitPriceGs * i.quantity, 0)
  const subtotalUsd = Math.round(items.reduce((s, i) => s + i.unitPriceUsd * i.quantity, 0) * 100) / 100
  const currency = chargeCurrency(input.paymentMethod, await getCurrency())
  const customer = await getCustomer()

  let order: Order | null = null
  for (let attempt = 0; attempt < 3 && !order; attempt++) {
    try {
      order = await payload.create({
        collection: 'orders',
        data: {
          orderNumber: newOrderNumber(),
          accessToken: newAccessToken(),
          status: 'awaiting_payment',
          paymentStatus: 'pending',
          paymentMethod: input.paymentMethod,
          currency,
          items,
          subtotalGs,
          subtotalUsd,
          total: currency === 'PYG' ? `Gs. ${subtotalGs.toLocaleString('es-PY')}` : `US$ ${subtotalUsd.toFixed(2)}`,
          contactName: data.name,
          email: data.email,
          phone: data.phone,
          company: data.company || undefined,
          taxId: data.taxId || undefined,
          legalName: data.legalName || undefined,
          customer: customer?.id,
          deliveryMethod: delivery,
          address: delivery === 'shipping' ? data.address : undefined,
          city: delivery === 'shipping' ? data.city : undefined,
          country: delivery === 'shipping' ? data.country : undefined,
          customerNotes: data.notes || undefined,
          locale,
        },
      })
    } catch (err) {
      if (attempt === 2) {
        payload.logger.error({ err }, 'Could not create order')
        return { ok: false, message: t.common.errorGeneric }
      }
    }
  }

  try {
    return { ok: true, redirect: await startPayment(order!, payload) }
  } catch (err) {
    payload.logger.error({ err }, `Payment start failed for ${order!.orderNumber}`)
    return { ok: true, redirect: orderPagePath(order!, '&pago=error') }
  }
}

/** Test-mode gateway: approve or decline a simulated card/PayPal payment. */
export async function resolveSandboxPayment(orderNumber: string, token: string, approve: boolean) {
  if (!isSandbox()) return
  const payload = await getPayloadClient()
  const order = await findOrderByToken(payload, orderNumber, token)
  if (!order) return
  if (approve) await markPaid(payload, order, `SANDBOX-${Date.now()}`)
  else await markFailed(payload, order)
  redirect(orderPagePath(order, approve ? '&pago=ok' : '&pago=error'))
}

/** "Pagar ahora" on an unpaid card/PayPal order: starts the gateway again. */
export async function retryPayment(orderNumber: string, token: string) {
  const payload = await getPayloadClient()
  const order = await findOrderByToken(payload, orderNumber, token)
  if (!order || order.paymentStatus === 'paid' || order.status === 'cancelled') return
  let target: string
  try {
    target = await startPayment(order, payload)
  } catch (err) {
    payload.logger.error({ err }, `Payment retry failed for ${order.orderNumber}`)
    target = orderPagePath(order, '&pago=error')
  }
  redirect(target)
}

export async function trackOrder(_: unknown, form: FormData): Promise<{ error?: string }> {
  const locale: Locale = isLocale(form.get('locale')) ? (form.get('locale') as Locale) : 'es'
  const number = clean(form.get('number'), 30).toUpperCase()
  const email = clean(form.get('email')).toLowerCase()
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'orders',
    depth: 0,
    limit: 1,
    showHiddenFields: true,
    where: { and: [{ orderNumber: { equals: number } }, { email: { equals: email } }] },
  })
  const order = docs[0]
  if (!order) return { error: getDictionary(locale).track.notFound }
  redirect(orderPagePath({ ...order, locale }))
}
