import { formatPrice, priceIn, type Currency } from '@/lib/currency'
import type { Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { cn } from '@/lib/cn'

type Props = {
  product: { purchaseMode?: string | null; priceGs?: number | null; priceUsd?: number | null }
  currency: Currency
  locale: Locale
  className?: string
}

/** Price in the visitor's currency, or "Precio a consultar" for quote-only products. */
export function Price({ product, currency, locale, className }: Props) {
  const amount = product.purchaseMode === 'buy' ? priceIn(product, currency) : null
  if (amount === null) {
    return <span className={cn('font-semibold text-accent-700', className)}>{getDictionary(locale).product.quoteOnly}</span>
  }
  return <span className={cn('font-bold text-ink tabular-nums', className)}>{formatPrice(amount, currency, locale)}</span>
}
