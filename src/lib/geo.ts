import type { Currency } from './currency'

/**
 * Best-effort visitor country. Proxies/CDNs in front of the site add a
 * country header (Cloudflare: cf-ipcountry; Vercel: x-vercel-ip-country; a
 * geo-aware reverse proxy can add x-country). Without one, a Paraguayan
 * browser language ("es-PY", Guaraní) counts as Paraguay.
 */
export function detectCountry(headers: Headers): string | null {
  const fromProxy =
    headers.get('cf-ipcountry') || headers.get('x-vercel-ip-country') || headers.get('x-country')
  if (fromProxy && /^[A-Za-z]{2}$/.test(fromProxy)) return fromProxy.toUpperCase()
  const language = headers.get('accept-language') || ''
  if (/\b(es|gn)-PY\b/i.test(language) || /^gn\b/i.test(language)) return 'PY'
  return null
}

/**
 * Guaraníes for Paraguay, dollars for any other known country. When the
 * country is unknown, Spanish-speaking browsers get guaraníes (most of the
 * audience is local) and everyone else dollars. Visitors can always switch.
 */
export function defaultCurrency(headers: Headers): Currency {
  const country = detectCountry(headers)
  if (country) return country === 'PY' ? 'PYG' : 'USD'
  const language = (headers.get('accept-language') || '').trim().toLowerCase()
  return language.startsWith('es') ? 'PYG' : 'USD'
}
