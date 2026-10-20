import type { CollectionAfterChangeHook, Payload } from 'payload'

import { QUOTE_KINDS } from '@/lib/constants'
import type { Order, QuoteRequest, Setting } from '@/payload-types'
import {
  orderBusinessEmail,
  orderCreatedEmail,
  orderStatusEmail,
  quoteBusinessEmail,
  quoteCustomerEmail,
} from './templates'

/**
 * E-mail side effects of orders and quote requests. Delivery is best-effort:
 * a failing mail server is logged but never breaks the checkout or the form.
 */

async function businessRecipients(payload: Payload): Promise<string[]> {
  const settings = (await payload.findGlobal({ slug: 'settings', depth: 0 })) as Setting
  const list = (settings.notificationEmails || settings.email || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  return list
}

function send(payload: Payload, message: { to: string | string[]; subject: string; html: string; replyTo?: string }) {
  if (Array.isArray(message.to) && message.to.length === 0) return
  payload.sendEmail(message).catch((err: unknown) => {
    payload.logger.error({ err }, `E-mail failed: ${message.subject}`)
  })
}

export function paymentInstructions(settings: Setting, method: string): string | null {
  if (method === 'transfer') return settings.transferInstructions || null
  if (method === 'western_union') return settings.westernUnionInstructions || null
  return null
}

export const notifyOrderChange: CollectionAfterChangeHook<Order> = async ({
  doc,
  previousDoc,
  operation,
  req,
}) => {
  if (req.context?.skipNotifications) return doc
  const { payload } = req
  const order = { ...doc, locale: doc.locale ?? 'es' } as Parameters<typeof orderCreatedEmail>[0]

  if (operation === 'create') {
    const settings = (await payload.findGlobal({
      slug: 'settings',
      locale: order.locale ?? 'es',
      depth: 0,
    })) as Setting
    send(payload, { to: doc.email, ...orderCreatedEmail(order, paymentInstructions(settings, doc.paymentMethod)) })
    send(payload, { to: await businessRecipients(payload), replyTo: doc.email, ...orderBusinessEmail(order) })
    return doc
  }

  if (previousDoc && previousDoc.status !== doc.status) {
    const message = orderStatusEmail(order)
    if (message) send(payload, { to: doc.email, ...message })
  }
  return doc
}

export const notifyQuoteCreated: CollectionAfterChangeHook<QuoteRequest> = async ({
  doc,
  operation,
  req,
}) => {
  if (operation !== 'create' || req.context?.skipNotifications) return doc
  const { payload } = req
  let usedEquipmentName: string | null = null
  if (doc.usedEquipment) {
    const id = typeof doc.usedEquipment === 'object' ? doc.usedEquipment.id : doc.usedEquipment
    const used = await payload.findByID({ collection: 'used-equipment', id, depth: 0, req })
    usedEquipmentName = used?.name ?? null
  }
  const quote = { ...doc, usedEquipmentName, locale: doc.locale ?? 'es' }
  const kindLabel = QUOTE_KINDS.find((k) => k.value === doc.kind)?.label ?? doc.kind
  send(payload, { to: doc.email, ...quoteCustomerEmail(quote) })
  send(payload, { to: await businessRecipients(payload), replyTo: doc.email, ...quoteBusinessEmail(quote, kindLabel) })
  return doc
}
