import type { MetadataRoute } from 'next'

export const dynamic = 'force-dynamic'

export default function robots(): MetadataRoute.Robots {
  const site = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api', '/next', '/carrito', '/checkout', '/cuenta', '/pedido', '/pago', '/en/carrito', '/en/checkout', '/en/cuenta', '/en/pedido', '/en/pago'],
      },
    ],
    sitemap: `${site}/sitemap.xml`,
  }
}
