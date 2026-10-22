'use server'

import { headers } from 'next/headers'

import { isLocale, type Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import type { QuoteKind } from '@/lib/constants'
import { getPayloadClient } from '@/lib/payload'
import { newQuoteReference } from '@/lib/references'
import { getCustomer } from '@/lib/session'
import { clean, requireFields, type FieldErrors } from '@/lib/validation'
import { rateLimit } from '@/lib/rate-limit'

export type RequestResult = { ok: true; reference: string } | { ok: false; errors?: FieldErrors; message?: string }

type Input = {
  kind: QuoteKind
  locale: string
  name: string
  email: string
  phone?: string
  company?: string
  city?: string
  country?: string
  message?: string
  usedEquipmentId?: number
  items?: { id: number; qty: number }[]
  /** Honeypot: real people leave it empty. */
  website?: string
}

const FORM_KINDS: QuoteKind[] = ['products', 'used', 'rental', 'service', 'quote', 'contact']

/**
 * Stores any request from the site (quote list, used equipment, rental,
 * technical service, contact). The collection hook e-mails the team.
 */
export async function submitRequest(input: Input): Promise<RequestResult> {
  const locale: Locale = isLocale(input.locale) ? input.locale : 'es'
  const t = getDictionary(locale)
  if (input.website) return { ok: true, reference: 'QT-OK' }

  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
  if (!rateLimit(`request:${ip}`, 12, 10 * 60 * 1000)) return { ok: false, message: t.common.errorGeneric }

  const kind = FORM_KINDS.includes(input.kind) ? input.kind : 'contact'
  const data = {
    name: clean(input.name),
    email: clean(input.email).toLowerCase(),
    phone: clean(input.phone, 40),
    company: clean(input.company),
    city: clean(input.city, 120),
    country: clean(input.country, 120),
    message: clean(input.message, 4000),
  }
  const required = ['name', 'email']
  if (kind !== 'products') required.push('message')
  const errors = requireFields(data, required, { required: t.forms.requiredField, email: t.forms.invalidEmail })
  if (Object.keys(errors).length) return { ok: false, errors }

  const payload = await getPayloadClient()

  // Only real, published products end up in the request.
  const lines = (input.items ?? []).filter((l) => Number.isInteger(l.id) && l.id > 0).slice(0, 50)
  let items: { product: number; name: string; quantity: number }[] = []
  if (lines.length) {
    const { docs } = await payload.find({
      collection: 'products',
      locale,
      overrideAccess: false,
      depth: 0,
      limit: lines.length,
      where: { id: { in: lines.map((l) => l.id) } },
      select: { name: true },
    })
    items = docs.map((p) => ({
      product: p.id,
      name: p.name,
      quantity: Math.min(99, Math.max(1, lines.find((l) => l.id === p.id)?.qty ?? 1)),
    }))
  }
  if (kind === 'products' && !items.length && !data.message) {
    return { ok: false, errors: { message: t.forms.requiredField } }
  }

  let usedEquipment: number | undefined
  if (input.usedEquipmentId) {
    const used = await payload
      .findByID({ collection: 'used-equipment', id: input.usedEquipmentId, depth: 0, overrideAccess: false })
      .catch(() => null)
    usedEquipment = used?.id
  }

  const customer = await getCustomer()
  const reference = newQuoteReference()
  try {
    await payload.create({
      collection: 'quote-requests',
      data: {
        reference,
        kind,
        status: 'new',
        ...data,
        items,
        usedEquipment,
        customer: customer?.id,
        locale,
      },
    })
  } catch (err) {
    payload.logger.error({ err }, 'Could not store request')
    return { ok: false, message: t.common.errorGeneric }
  }
  return { ok: true, reference }
}
