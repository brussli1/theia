import type { NextRequest } from 'next/server'

import { handleGatewayReturn } from '@/lib/payments/return'

export const dynamic = 'force-dynamic'

export function GET(request: NextRequest) {
  return handleGatewayReturn(request)
}
