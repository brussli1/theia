'use client'

import { Check, ClipboardList, Minus, Plus, ShoppingCart } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import { WhatsAppIcon } from '@/components/layout/WhatsAppButton'
import { useSite } from '@/components/providers/LocaleProvider'
import { Button, buttonClasses } from '@/components/ui/Button'
import { whatsappHref } from '@/lib/links'
import { lists, useLines } from '@/lib/store'

type Props = {
  productId: number
  productName: string
  mode: 'buy' | 'quote'
  available: boolean
  pageUrl: string
}

export function QuantityInput({ value, onChange, label }: { value: number; onChange: (n: number) => void; label: string }) {
  return (
    <div className="flex h-11 items-center rounded-lg border border-slate-300 bg-white" role="group" aria-label={label}>
      <button type="button" className="flex h-full w-10 items-center justify-center text-slate-600 hover:text-ink disabled:opacity-40" onClick={() => onChange(value - 1)} disabled={value <= 1} aria-label="−">
        <Minus className="h-4 w-4" />
      </button>
      <input
        type="number"
        min={1}
        max={99}
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 1)}
        className="h-full w-12 [appearance:textfield] border-x border-slate-200 text-center text-[15px] font-semibold focus:outline-none [&::-webkit-inner-spin-button]:appearance-none"
        aria-label={label}
      />
      <button type="button" className="flex h-full w-10 items-center justify-center text-slate-600 hover:text-ink disabled:opacity-40" onClick={() => onChange(value + 1)} disabled={value >= 99} aria-label="+">
        <Plus className="h-4 w-4" />
      </button>
    </div>
  )
}

/** Buy box on the product page: cart or quote list, plus a WhatsApp shortcut. */
export function ProductActions({ productId, productName, mode, available, pageUrl }: Props) {
  const { t, href, whatsapp } = useSite()
  const [qty, setQty] = useState(1)
  const [justAdded, setJustAdded] = useState(false)
  const { lines: quote } = useLines('quote')
  const inQuote = quote.some((l) => l.id === productId)
  const wa = whatsappHref(whatsapp, t.product.whatsappMessage(productName, pageUrl))
  const clamp = (n: number) => Math.min(99, Math.max(1, Math.round(n)))

  const canBuy = mode === 'buy' && available

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <QuantityInput value={qty} onChange={(n) => setQty(clamp(n))} label={t.product.quantity} />
        {canBuy ? (
          <Button
            variant="primary"
            size="lg"
            className="flex-1"
            data-testid="add-to-cart"
            onClick={() => {
              lists.add('cart', productId, qty)
              setJustAdded(true)
              setTimeout(() => setJustAdded(false), 2500)
            }}
          >
            {justAdded ? <Check className="h-5 w-5" /> : <ShoppingCart className="h-5 w-5" />}
            {justAdded ? t.product.added : t.product.addToCart}
          </Button>
        ) : (
          <Button
            variant="primary"
            size="lg"
            className="flex-1"
            data-testid="add-to-quote"
            onClick={() => (inQuote ? lists.setQty('quote', productId, qty) : lists.add('quote', productId, qty))}
          >
            {inQuote ? <Check className="h-5 w-5" /> : <ClipboardList className="h-5 w-5" />}
            {inQuote ? t.product.addedToQuote : t.product.addToQuote}
          </Button>
        )}
      </div>
      {justAdded && (
        <Link href={href('/carrito')} className={buttonClasses('outline', 'md', 'w-full')}>
          {t.cart.checkout} →
        </Link>
      )}
      {inQuote && !canBuy && (
        <Link href={href('/cotizacion')} className={buttonClasses('outline', 'md', 'w-full')} data-testid="go-to-quote">
          {t.product.requestQuote} →
        </Link>
      )}
      {canBuy && (
        <button
          type="button"
          onClick={() => lists.add('quote', productId, qty)}
          className="w-full text-center text-sm font-medium text-slate-600 underline-offset-2 hover:text-brand hover:underline"
        >
          {inQuote ? t.product.addedToQuote : `${t.common.or} ${t.product.addToQuote.toLowerCase()}`}
        </button>
      )}
      {wa && (
        <a href={wa} target="_blank" rel="noopener noreferrer" className={buttonClasses('whatsapp', 'md', 'w-full')}>
          <WhatsAppIcon className="h-5 w-5" />
          {t.common.whatsappChat}
        </a>
      )}
    </div>
  )
}
