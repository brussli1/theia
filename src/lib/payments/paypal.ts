import 'server-only'

/**
 * PayPal REST (Orders v2), charged in US dollars.
 * PAYPAL_ENV=sandbox points at PayPal's own test environment.
 */

const base = () =>
  process.env.PAYPAL_ENV === 'sandbox' ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com'

export const paypalConfigured = () => Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET)

async function accessToken(): Promise<string> {
  const credentials = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64')
  const res = await fetch(`${base()}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${credentials}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`PayPal auth failed (${res.status})`)
  const data = (await res.json()) as { access_token: string }
  return data.access_token
}

export async function paypalCreateOrder(args: {
  reference: string
  amountUsd: number
  returnUrl: string
  cancelUrl: string
}): Promise<{ id: string; approveUrl: string }> {
  const token = await accessToken()
  const res = await fetch(`${base()}/v2/checkout/orders`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'PayPal-Request-Id': args.reference },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: args.reference,
          invoice_id: args.reference,
          description: `Pedido ${args.reference}`,
          amount: { currency_code: 'USD', value: args.amountUsd.toFixed(2) },
        },
      ],
      payment_source: {
        paypal: {
          experience_context: {
            return_url: args.returnUrl,
            cancel_url: args.cancelUrl,
            user_action: 'PAY_NOW',
            shipping_preference: 'NO_SHIPPING',
          },
        },
      },
    }),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`PayPal create order failed (${res.status})`)
  const data = (await res.json()) as { id: string; links: { rel: string; href: string }[] }
  const approve = data.links.find((l) => l.rel === 'payer-action' || l.rel === 'approve')
  if (!approve) throw new Error('PayPal returned no approval link')
  return { id: data.id, approveUrl: approve.href }
}

export async function paypalCapture(orderId: string): Promise<{ paid: boolean; reference?: string }> {
  const token = await accessToken()
  const res = await fetch(`${base()}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    cache: 'no-store',
  })
  const data = (await res.json().catch(() => ({}))) as {
    status?: string
    details?: { issue?: string }[]
    purchase_units?: { payments?: { captures?: { id: string; status: string }[] } }[]
  }
  // Already captured earlier (e.g. page reloaded): treat as paid.
  if (data.details?.some((d) => d.issue === 'ORDER_ALREADY_CAPTURED')) return { paid: true, reference: orderId }
  const capture = data.purchase_units?.[0]?.payments?.captures?.[0]
  return { paid: data.status === 'COMPLETED' && capture?.status === 'COMPLETED', reference: capture?.id }
}
