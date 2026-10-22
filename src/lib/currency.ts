import type { Locale } from '@/i18n/config'

export type Currency = 'PYG' | 'USD'
export const CURRENCIES: Currency[] = ['PYG', 'USD']
export const CURRENCY_COOKIE = 'theia-currency'

export function isCurrency(value: unknown): value is Currency {
  return value === 'PYG' || value === 'USD'
}

/** Visitors in Paraguay see guaraníes; everyone else sees US dollars. */
export function currencyForCountry(country: string | null | undefined): Currency {
  return country?.toUpperCase() === 'PY' ? 'PYG' : 'USD'
}

export function formatPrice(amount: number, currency: Currency, locale: Locale = 'es'): string {
  if (currency === 'PYG') {
    return `Gs. ${new Intl.NumberFormat('es-PY', { maximumFractionDigits: 0 }).format(Math.round(amount))}`
  }
  const formatted = new Intl.NumberFormat(locale === 'es' ? 'es-PY' : 'en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
  return `US$ ${formatted}`
}

type Priced = { priceGs?: number | null; priceUsd?: number | null }

/** The product price in a currency, or null when it has none. */
export function priceIn(product: Priced, currency: Currency): number | null {
  const value = currency === 'PYG' ? product.priceGs : product.priceUsd
  return typeof value === 'number' && value > 0 ? value : null
}
