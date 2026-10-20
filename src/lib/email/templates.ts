import { formatPrice, type Currency } from '@/lib/currency'
import type { Locale } from '@/i18n/config'

/** Transactional e-mails: plain, branded HTML that renders in every client. */

const SERVER_URL = () => process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

const escape = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

function layout(title: string, body: string, siteName = 'Theia'): string {
  return `<!doctype html><html><body style="margin:0;background:#f3f6f9;font-family:Arial,Helvetica,sans-serif;color:#10212f">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f6f9;padding:24px 0"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden">
<tr><td style="background:#0B3B5C;padding:20px 28px;color:#ffffff;font-size:20px;font-weight:bold;letter-spacing:.5px">${escape(siteName)}</td></tr>
<tr><td style="padding:28px">
<h1 style="margin:0 0 16px;font-size:20px;color:#0B3B5C">${escape(title)}</h1>
${body}
</td></tr>
<tr><td style="padding:16px 28px;background:#f8fafc;color:#64748b;font-size:12px">${escape(siteName)} · ${escape(SERVER_URL())}</td></tr>
</table></td></tr></table></body></html>`
}

const p = (text: string) => `<p style="margin:0 0 12px;line-height:1.55">${text}</p>`
const button = (href: string, label: string) =>
  `<p style="margin:20px 0"><a href="${escape(href)}" style="display:inline-block;background:#0E9F9A;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:bold">${escape(label)}</a></p>`
const pre = (text: string) =>
  `<div style="white-space:pre-line;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;margin:0 0 12px;font-size:14px">${escape(text)}</div>`

export function passwordResetEmail(token: string): string {
  const url = `${SERVER_URL()}/cuenta/restablecer?token=${encodeURIComponent(token)}`
  return layout(
    'Restablecer contraseña',
    p('Recibimos un pedido para restablecer la contraseña de tu cuenta.') +
      button(url, 'Elegir una nueva contraseña') +
      p('Si no fuiste vos, ignorá este mensaje: tu contraseña no cambia.'),
  )
}

type OrderLike = {
  orderNumber: string
  contactName: string
  email: string
  phone?: string | null
  company?: string | null
  taxId?: string | null
  legalName?: string | null
  items: { name: string; quantity: number; unitPriceGs: number; unitPriceUsd: number }[]
  subtotalGs: number
  subtotalUsd: number
  currency: Currency
  paymentMethod: string
  status: string
  deliveryMethod: string
  address?: string | null
  city?: string | null
  country?: string | null
  trackingCode?: string | null
  customerNotes?: string | null
  accessToken: string
  locale?: Locale | null
}

const T = {
  es: {
    product: 'Producto',
    qty: 'Cant.',
    total: 'Total',
    viewOrder: 'Ver mi pedido',
    created: (n: string) => `Recibimos tu pedido ${n}`,
    createdIntro: 'Gracias por tu compra. Este es el resumen de tu pedido:',
    payNext: 'Cómo pagar',
    status: {
      paid: 'Recibimos tu pago',
      processing: 'Estamos preparando tu pedido',
      shipped: 'Tu pedido está en camino',
      ready_for_pickup: 'Tu pedido está listo para retirar',
      delivered: 'Tu pedido fue entregado',
      cancelled: 'Tu pedido fue cancelado',
    } as Record<string, string>,
    statusIntro: (n: string) => `Novedades sobre tu pedido ${n}.`,
    tracking: 'Código de seguimiento',
    quoteTitle: (r: string) => `Recibimos tu solicitud ${r}`,
    quoteIntro:
      'Gracias por escribirnos. Un asesor te responderá a la brevedad (normalmente el mismo día hábil).',
  },
  en: {
    product: 'Product',
    qty: 'Qty',
    total: 'Total',
    viewOrder: 'View my order',
    created: (n: string) => `We received your order ${n}`,
    createdIntro: 'Thank you for your purchase. Here is your order summary:',
    payNext: 'How to pay',
    status: {
      paid: 'We received your payment',
      processing: 'We are preparing your order',
      shipped: 'Your order is on its way',
      ready_for_pickup: 'Your order is ready for pickup',
      delivered: 'Your order was delivered',
      cancelled: 'Your order was cancelled',
    } as Record<string, string>,
    statusIntro: (n: string) => `An update on your order ${n}.`,
    tracking: 'Tracking code',
    quoteTitle: (r: string) => `We received your request ${r}`,
    quoteIntro: 'Thanks for reaching out. An advisor will reply shortly (usually the same business day).',
  },
}

function orderTable(order: OrderLike, locale: Locale): string {
  const t = T[locale]
  const price = (gs: number, usd: number) =>
    order.currency === 'PYG' ? formatPrice(gs, 'PYG', locale) : formatPrice(usd, 'USD', locale)
  const rows = order.items
    .map(
      (item) =>
        `<tr><td style="padding:8px 0;border-bottom:1px solid #e2e8f0">${escape(item.name)}</td><td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:center">${item.quantity}</td><td style="padding:8px 0;border-bottom:1px solid #e2e8f0;text-align:right">${price(item.unitPriceGs * item.quantity, item.unitPriceUsd * item.quantity)}</td></tr>`,
    )
    .join('')
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin:0 0 16px">
<tr><th align="left" style="padding:8px 0;border-bottom:2px solid #0B3B5C">${t.product}</th><th style="padding:8px;border-bottom:2px solid #0B3B5C">${t.qty}</th><th align="right" style="padding:8px 0;border-bottom:2px solid #0B3B5C">${t.total}</th></tr>
${rows}
<tr><td colspan="2" style="padding:10px 0;font-weight:bold">${t.total}</td><td style="padding:10px 0;text-align:right;font-weight:bold">${price(order.subtotalGs, order.subtotalUsd)}</td></tr>
</table>`
}

export function orderUrl(order: Pick<OrderLike, 'orderNumber' | 'accessToken' | 'locale'>): string {
  const prefix = order.locale === 'en' ? '/en' : ''
  return `${SERVER_URL()}${prefix}/pedido/${order.orderNumber}?t=${order.accessToken}`
}

export function orderCreatedEmail(order: OrderLike, paymentInstructions: string | null) {
  const locale = order.locale ?? 'es'
  const t = T[locale]
  return {
    subject: t.created(order.orderNumber),
    html: layout(
      t.created(order.orderNumber),
      p(t.createdIntro) +
        orderTable(order, locale) +
        (paymentInstructions ? `<h2 style="font-size:16px;margin:16px 0 8px">${t.payNext}</h2>` + pre(paymentInstructions) : '') +
        button(orderUrl(order), t.viewOrder),
    ),
  }
}

export function orderStatusEmail(order: OrderLike) {
  const locale = order.locale ?? 'es'
  const t = T[locale]
  const title = t.status[order.status]
  if (!title) return null
  return {
    subject: `${title} — ${order.orderNumber}`,
    html: layout(
      title,
      p(t.statusIntro(order.orderNumber)) +
        (order.trackingCode ? p(`<strong>${t.tracking}:</strong> ${escape(order.trackingCode)}`) : '') +
        button(orderUrl(order), t.viewOrder),
    ),
  }
}

export function orderBusinessEmail(order: OrderLike) {
  const lines = [
    `Cliente: ${order.contactName} <${order.email}> · ${order.phone ?? ''}`,
    order.company ? `Empresa: ${order.company}` : '',
    order.taxId ? `RUC: ${order.taxId} · ${order.legalName ?? ''}` : '',
    `Pago: ${order.paymentMethod} (${order.currency})`,
    `Entrega: ${order.deliveryMethod === 'pickup' ? 'Retiro en local' : `Envío a ${[order.address, order.city, order.country].filter(Boolean).join(', ')}`}`,
    order.customerNotes ? `Notas: ${order.customerNotes}` : '',
  ].filter(Boolean)
  return {
    subject: `Nuevo pedido ${order.orderNumber} — ${order.contactName}`,
    html: layout(
      `Nuevo pedido ${order.orderNumber}`,
      orderTable(order, 'es') + pre(lines.join('\n')) + button(`${SERVER_URL()}/admin/collections/orders`, 'Abrir en el panel'),
    ),
  }
}

type QuoteLike = {
  reference: string
  kind: string
  name: string
  email: string
  phone?: string | null
  company?: string | null
  city?: string | null
  country?: string | null
  message?: string | null
  items?: { name: string; quantity?: number | null }[] | null
  usedEquipmentName?: string | null
  locale?: Locale | null
}

export function quoteCustomerEmail(quote: QuoteLike) {
  const locale = quote.locale ?? 'es'
  const t = T[locale]
  const items = quote.items?.length
    ? pre(quote.items.map((i) => `• ${i.name}${i.quantity && i.quantity > 1 ? ` × ${i.quantity}` : ''}`).join('\n'))
    : ''
  return {
    subject: t.quoteTitle(quote.reference),
    html: layout(t.quoteTitle(quote.reference), p(t.quoteIntro) + items + (quote.message ? pre(quote.message) : '')),
  }
}

export function quoteBusinessEmail(quote: QuoteLike, kindLabel: string) {
  const lines = [
    `Tipo: ${kindLabel}`,
    `Nombre: ${quote.name}`,
    `E-mail: ${quote.email}`,
    quote.phone ? `Teléfono: ${quote.phone}` : '',
    quote.company ? `Empresa: ${quote.company}` : '',
    [quote.city, quote.country].filter(Boolean).length ? `Ubicación: ${[quote.city, quote.country].filter(Boolean).join(', ')}` : '',
    quote.usedEquipmentName ? `Equipo usado: ${quote.usedEquipmentName}` : '',
    ...(quote.items ?? []).map((i) => `• ${i.name}${i.quantity && i.quantity > 1 ? ` × ${i.quantity}` : ''}`),
  ].filter(Boolean)
  return {
    subject: `Nueva solicitud ${quote.reference} — ${kindLabel} — ${quote.name}`,
    html: layout(
      `Nueva solicitud ${quote.reference}`,
      pre(lines.join('\n')) + (quote.message ? pre(quote.message) : '') + button(`${SERVER_URL()}/admin/collections/quote-requests`, 'Abrir en el panel'),
    ),
  }
}
