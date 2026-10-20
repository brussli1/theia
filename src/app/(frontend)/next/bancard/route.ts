import { NextResponse, type NextRequest } from 'next/server'

import { getPayloadClient } from '@/lib/payload'
import { markPaid } from '@/lib/payments'
import { bancardConfirmToken } from '@/lib/payments/bancard'

export const dynamic = 'force-dynamic'

/**
 * Bancard's server-to-server confirmation. Configure this URL in the Bancard
 * "Portal de Comercios": https://<your-domain>/next/bancard
 */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as {
    operation?: {
      token?: string
      shop_process_id?: number | string
      response?: string
      response_code?: string
      amount?: string
      currency?: string
      authorization_number?: string
    }
  } | null
  const op = body?.operation
  if (!op?.shop_process_id || !op.token || !op.amount || !op.currency) {
    return NextResponse.json({ status: 'error' }, { status: 400 })
  }
  if (op.token !== bancardConfirmToken(op.shop_process_id, op.amount, op.currency)) {
    return NextResponse.json({ status: 'error' }, { status: 403 })
  }
  const payload = await getPayloadClient()
  const order = await payload.findByID({ collection: 'orders', id: Number(op.shop_process_id), depth: 0 }).catch(() => null)
  if (order && op.response === 'S' && op.response_code === '00' && Number(op.amount) === order.subtotalGs) {
    await markPaid(payload, order, op.authorization_number)
  }
  return NextResponse.json({ status: 'success' })
}
