import type { NextRequest } from 'next/server'

import { handleGatewayReturn } from '@/lib/payments/return'

export const dynamic = 'force-dynamic'

// PayPal appends ?token=<paypal order id>&PayerID=… to the return URL.
export function GET(request: NextRequest) {
  return handleGatewayReturn(request, 'token')
}
