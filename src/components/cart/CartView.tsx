'use client'

import { ImageOff, ShoppingCart, Trash2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { QuantityInput } from '@/components/product/ProductActions'
import { useSite } from '@/components/providers/LocaleProvider'
import { FormAlert } from '@/components/forms/Field'
import { LinkButton } from '@/components/ui/Button'
import { formatPrice } from '@/lib/currency'
import { lists } from '@/lib/store'
import { useListProducts } from './useListProducts'

export function CartView() {
  const { t, href, currency, locale } = useSite()
  const { items, loading, removed } = useListProducts('cart')
  const notice = removed ? t.cart.unavailable : null

  if (loading) return <p className="py-16 text-center text-slate-500">{t.common.loading}</p>

  if (!items.length) {
    return (
      <div className="flex flex-col items-center rounded-card border border-dashed border-slate-300 px-6 py-16 text-center">
        {notice && (
          <div className="mb-6 w-full max-w-md">
            <FormAlert tone="info">{notice}</FormAlert>
          </div>
        )}
        <ShoppingCart className="h-10 w-10 text-slate-400" aria-hidden="true" />
        <p className="mt-4 text-lg font-semibold">{t.cart.empty}</p>
        <LinkButton href={href('/productos')} className="mt-6">
          {t.cart.emptyCta}
        </LinkButton>
      </div>
    )
  }

  const price = (p: { priceGs: number | null; priceUsd: number | null }) => (currency === 'PYG' ? p.priceGs ?? 0 : p.priceUsd ?? 0)
  const total = items.reduce((s, i) => s + price(i.product) * i.qty, 0)

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        {notice && (
          <div className="mb-4">
            <FormAlert tone="info">{notice}</FormAlert>
          </div>
        )}
        <ul className="divide-y divide-slate-200 rounded-card border border-slate-200 bg-white" data-testid="cart-lines">
          {items.map(({ id, qty, product }) => (
            <li key={id} className="flex gap-4 p-4 sm:p-5">
              <Link href={href(`/productos/${product.slug}`)} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-slate-100 bg-white sm:h-24 sm:w-24">
                {product.image ? (
                  <Image src={product.image} alt="" fill sizes="96px" className="object-contain p-1" />
                ) : (
                  <ImageOff className="absolute inset-0 m-auto h-6 w-6 text-slate-300" />
                )}
              </Link>
              <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  {product.brand && <p className="text-xs font-semibold text-slate-500 uppercase">{product.brand}</p>}
                  <Link href={href(`/productos/${product.slug}`)} className="line-clamp-2 font-semibold hover:text-brand">
                    {product.name}
                  </Link>
                  <p className="mt-1 text-sm text-slate-500">{formatPrice(price(product), currency, locale)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <QuantityInput value={qty} onChange={(n) => lists.setQty('cart', id, n)} label={t.product.quantity} />
                  <span className="w-32 text-right font-semibold tabular-nums">{formatPrice(price(product) * qty, currency, locale)}</span>
                  <button
                    type="button"
                    onClick={() => lists.remove('cart', id)}
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-red-600"
                    aria-label={`${t.common.remove}: ${product.name}`}
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <Link href={href('/productos')} className="mt-4 inline-block text-sm font-semibold text-accent-700 hover:underline">
          ← {t.cart.continue}
        </Link>
      </div>
      <aside className="h-fit rounded-card border border-slate-200 bg-slate-50 p-6 lg:sticky lg:top-40">
        <h2 className="text-lg font-semibold">{t.checkout.summary}</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-600">{t.cart.subtotal}</dt>
            <dd className="font-medium tabular-nums">{formatPrice(total, currency, locale)}</dd>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-3 text-base">
            <dt className="font-semibold">{t.cart.total}</dt>
            <dd className="font-bold tabular-nums" data-testid="cart-total">
              {formatPrice(total, currency, locale)}
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-slate-500">{t.cart.shippingNote}</p>
        <LinkButton href={href('/checkout')} size="lg" className="mt-5 w-full">
          {t.cart.checkout}
        </LinkButton>
      </aside>
    </div>
  )
}
