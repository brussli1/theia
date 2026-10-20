import { ImageOff } from 'lucide-react'
import Link from 'next/link'

import { MediaImage } from '@/components/ui/MediaImage'
import { localePath, type Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { cn } from '@/lib/cn'
import type { Currency } from '@/lib/currency'
import { firstImage } from '@/lib/media'
import type { Product } from '@/payload-types'
import { Price } from './Price'

type Props = { product: Product; locale: Locale; currency: Currency; priority?: boolean }

export function ProductCard({ product, locale, currency, priority }: Props) {
  const t = getDictionary(locale)
  const image = firstImage(product.images)
  const brand = typeof product.brand === 'object' && product.brand ? product.brand.name : null
  const href = localePath(locale, `/productos/${product.slug}`)
  const availability = product.availability ?? 'available'

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-card border border-slate-200 bg-white shadow-card transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lift">
      <div className="relative aspect-[4/3] bg-white">
        {image ? (
          <MediaImage
            media={image}
            size="card"
            className="absolute inset-0"
            imgClassName="object-contain p-4 transition duration-300 group-hover:scale-[1.03]"
            sizes="(min-width:1280px) 300px, (min-width:768px) 33vw, 50vw"
            priority={priority}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-50 text-slate-400">
            <ImageOff className="h-8 w-8" aria-hidden="true" />
            <span className="text-xs">{t.product.noImage}</span>
          </div>
        )}
        {product.purchaseMode === 'quote' && (
          <span className="absolute top-3 left-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-accent-700 shadow-sm ring-1 ring-accent-100">
            {t.catalog.quoteOnly}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 border-t border-slate-100 p-4">
        {brand && <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">{brand}</p>}
        <h3 className="line-clamp-2 font-sans text-[15px] leading-snug font-semibold text-ink">
          <Link href={href} className="after:absolute after:inset-0 focus:outline-none">
            {product.name}
          </Link>
        </h3>
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <Price product={product} currency={currency} locale={locale} className="text-[15px]" />
          <span
            className={cn(
              'shrink-0 text-[11px] font-medium',
              availability === 'available' && 'text-emerald-700',
              availability === 'on_order' && 'text-amber-700',
              availability === 'unavailable' && 'text-slate-400',
            )}
          >
            {t.product.availability[availability]}
          </span>
        </div>
      </div>
    </article>
  )
}

export function ProductGrid({
  products,
  locale,
  currency,
  columns = 4,
}: {
  products: Product[]
  locale: Locale
  currency: Currency
  columns?: 3 | 4
}) {
  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3',
        columns === 4 && 'xl:grid-cols-4',
      )}
    >
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} locale={locale} currency={currency} priority={i < 4} />
      ))}
    </div>
  )
}
