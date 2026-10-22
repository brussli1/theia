import 'server-only'

import { createHash } from 'crypto'

/**
 * Bancard vPOS 2.0 (cards in Paraguay, guaraníes only). Requests are signed
 * with MD5 tokens built from the private key, as in Bancard's official
 * connectors. BANCARD_ENV=staging uses Bancard's test environment.
 * Confirm the exact API version with the "Portal de Comercios" on onboarding.
 */

const base = () =>
  process.env.BANCARD_ENV === 'staging' ? 'https://vpos.infonet.com.py:8888' : 'https://vpos.infonet.com.py'

export const bancardConfigured = () => Boolean(process.env.BANCARD_PUBLIC_KEY && process.env.BANCARD_PRIVATE_KEY)

const md5 = (value: string) => createHash('md5').update(value, 'utf8').digest('hex')
const amountString = (amount: number) => amount.toFixed(2)

export function bancardConfirmToken(shopProcessId: number | string, amount: string, currency: string) {
  return md5(`${process.env.BANCARD_PRIVATE_KEY}${shopProcessId}confirm${amount}${currency}`)
}

export async function bancardSingleBuy(args: {
  shopProcessId: number
  amountGs: number
  description: string
  returnUrl: string
  cancelUrl: string
}): Promise<{ processId: string; redirectUrl: string }> {
  const amount = amountString(args.amountGs)
  const res = await fetch(`${base()}/vpos/api/0.3/single_buy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      public_key: process.env.BANCARD_PUBLIC_KEY,
      operation: {
        token: md5(`${process.env.BANCARD_PRIVATE_KEY}${args.shopProcessId}${amount}PYG`),
        shop_process_id: args.shopProcessId,
        amount,
        currency: 'PYG',
        additional_data: '',
        description: args.description.slice(0, 20),
        return_url: args.returnUrl,
        cancel_url: args.cancelUrl,
      },
    }),
    cache: 'no-store',
  })
  const data = (await res.json().catch(() => ({}))) as { status?: string; process_id?: string }
  if (data.status !== 'success' || !data.process_id) throw new Error('Bancard single_buy failed')
  return { processId: data.process_id, redirectUrl: `${base()}/payment/single_buy?process_id=${data.process_id}` }
}

export async function bancardGetConfirmation(shopProcessId: number): Promise<{ paid: boolean; reference?: string }> {
  const res = await fetch(`${base()}/vpos/api/0.3/single_buy/confirmations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      public_key: process.env.BANCARD_PUBLIC_KEY,
      operation: {
        token: md5(`${process.env.BANCARD_PRIVATE_KEY}${shopProcessId}get_confirmation`),
        shop_process_id: shopProcessId,
      },
    }),
    cache: 'no-store',
  })
  const data = (await res.json().catch(() => ({}))) as {
    status?: string
    confirmation?: { response?: string; response_code?: string; authorization_number?: string; ticket_number?: string }
  }
  const c = data.confirmation
  const paid = data.status === 'success' && c?.response === 'S' && c?.response_code === '00'
  return { paid, reference: c?.authorization_number || c?.ticket_number }
}
