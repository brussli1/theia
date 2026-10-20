import 'server-only'

import { NextResponse, type NextRequest } from 'next/server'

import { getPayloadClient } from '@/lib/payload'
import { SERVER_URL, findOrderByToken, markPaid, orderPagePath, verifyGatewayPayment } from './index'

/**
 * Where PayPal / Bancard send the customer back after paying. We ask the
 * gateway directly (never trusting the URL) and then show the order page.
 */
export async function handleGatewayReturn(request: NextRequest, providerRefParam?: string) {
  const sp = request.nextUrl.searchParams
  const payload = await getPayloadClient()
  const order = await findOrderByToken(payload, sp.get('pedido') ?? '', sp.get('t') ?? '')
  if (!order) return NextResponse.redirect(new URL('/', SERVER_URL()))

  let ok = order.paymentStatus === 'paid'
  if (!ok) {
    try {
      const result = await verifyGatewayPayment(order, providerRefParam ? sp.get(providerRefParam) : null)
      if (result.paid) {
        await markPaid(payload, order, result.reference)
        ok = true
      }
    } catch (err) {
      payload.logger.error({ err }, `Payment verification failed for ${order.orderNumber}`)
    }
  }
  return NextResponse.redirect(new URL(orderPagePath(order, ok ? '&pago=ok' : '&pago=error'), SERVER_URL()))
}
