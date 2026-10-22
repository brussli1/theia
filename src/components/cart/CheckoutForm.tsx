'use client'

import { Lock } from 'lucide-react'
import Link from 'next/link'
import { useState, useTransition } from 'react'

import { Field, FormAlert } from '@/components/forms/Field'
import { useSite } from '@/components/providers/LocaleProvider'
import { Button, LinkButton } from '@/components/ui/Button'
import { placeOrder, type CheckoutResult } from '@/lib/actions/checkout'
import type { PaymentMethod } from '@/lib/constants'
import { cn } from '@/lib/cn'
import { formatPrice } from '@/lib/currency'
import { lists } from '@/lib/store'
import type { FieldErrors } from '@/lib/validation'
import { useListProducts } from './useListProducts'

type Props = {
  methods: PaymentMethod[]
  pickupEnabled: boolean
  shippingNote?: string | null
  loggedIn: boolean
  prefill: {
    name?: string
    email?: string
    phone?: string
    company?: string
    taxId?: string
    legalName?: string
    address?: string
    city?: string
    country?: string
  }
}

export function CheckoutForm({ methods, pickupEnabled, shippingNote, loggedIn, prefill }: Props) {
  const { t, href, currency, locale } = useSite()
  const { items, loading } = useListProducts('cart')
  const [delivery, setDelivery] = useState<'shipping' | 'pickup'>('shipping')
  const [method, setMethod] = useState<PaymentMethod | null>(methods[0] ?? null)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [message, setMessage] = useState<string | null>(null)
  const [pending, start] = useTransition()

  if (loading) return <p className="py-16 text-center text-slate-500">{t.common.loading}</p>
  const buyable = items.filter((i) => i.product.purchaseMode === 'buy')
  if (!buyable.length) {
    return (
      <div className="rounded-card border border-dashed border-slate-300 py-16 text-center">
        <p className="text-lg font-semibold">{t.cart.empty}</p>
        <LinkButton href={href('/productos')} className="mt-6">
          {t.cart.emptyCta}
        </LinkButton>
      </div>
    )
  }

  // What will actually be charged depends on the payment method.
  const chargeCurrency = method === 'card' ? 'PYG' : method === 'paypal' ? 'USD' : currency
  const unit = (p: { priceGs: number | null; priceUsd: number | null }) => (chargeCurrency === 'PYG' ? p.priceGs ?? 0 : p.priceUsd ?? 0)
  const total = buyable.reduce((s, i) => s + unit(i.product) * i.qty, 0)

  return (
    <form
      noValidate
      className="grid gap-8 lg:grid-cols-3"
      onSubmit={(e) => {
        e.preventDefault()
        if (!method) return setMessage(t.checkout.errors.method)
        const form = new FormData(e.currentTarget)
        const get = (k: string) => String(form.get(k) ?? '')
        start(async () => {
          setMessage(null)
          const res: CheckoutResult = await placeOrder({
            locale,
            items: buyable.map((i) => ({ id: i.id, qty: i.qty })),
            name: get('name'),
            email: get('email'),
            phone: get('phone'),
            company: get('company'),
            taxId: get('taxId'),
            legalName: get('legalName'),
            deliveryMethod: delivery,
            address: get('address'),
            city: get('city'),
            country: get('country'),
            notes: get('notes'),
            paymentMethod: method,
          }).catch(() => ({ ok: false, message: t.common.errorGeneric }))
          if (res.ok) {
            lists.clear('cart')
            window.location.assign(res.redirect)
            return
          }
          if (res.removed?.length) lists.removeMany('cart', res.removed)
          setErrors(res.errors ?? {})
          setMessage(res.message ?? t.common.errorGeneric)
          window.scrollTo({ top: 0, behavior: 'smooth' })
        })
      }}
    >
      <div className="space-y-8 lg:col-span-2">
        {message && <FormAlert>{message}</FormAlert>}
        {!loggedIn && (
          <p className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
            {t.checkout.loginHint}{' '}
            <Link href={href('/cuenta?volver=/checkout')} className="font-semibold text-accent-700 hover:underline">
              {t.account.login}
            </Link>
          </p>
        )}

        <fieldset className="rounded-card border border-slate-200 p-6">
          <legend className="px-2 text-lg font-semibold">{t.checkout.contact}</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t.checkout.name} name="name" required autoComplete="name" defaultValue={prefill.name} error={errors.name} />
            <Field label={t.checkout.email} name="email" type="email" required autoComplete="email" defaultValue={prefill.email} error={errors.email} />
            <Field label={t.checkout.phone} name="phone" type="tel" required autoComplete="tel" defaultValue={prefill.phone} error={errors.phone} />
            <Field label={t.checkout.company} name="company" autoComplete="organization" defaultValue={prefill.company} optionalLabel={t.common.optional} />
          </div>
        </fieldset>

        <fieldset className="rounded-card border border-slate-200 p-6">
          <legend className="px-2 text-lg font-semibold">{t.checkout.billing}</legend>
          <p className="mb-4 text-sm text-slate-500">{t.checkout.billingHint}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t.checkout.taxId} name="taxId" defaultValue={prefill.taxId} optionalLabel={t.common.optional} />
            <Field label={t.checkout.legalName} name="legalName" defaultValue={prefill.legalName} optionalLabel={t.common.optional} />
          </div>
        </fieldset>

        <fieldset className="rounded-card border border-slate-200 p-6">
          <legend className="px-2 text-lg font-semibold">{t.checkout.delivery}</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {(pickupEnabled ? (['shipping', 'pickup'] as const) : (['shipping'] as const)).map((d) => (
              <label
                key={d}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition',
                  delivery === d ? 'border-accent bg-accent-50 ring-1 ring-accent' : 'border-slate-200 hover:border-slate-300',
                )}
              >
                <input type="radio" name="delivery" value={d} checked={delivery === d} onChange={() => setDelivery(d)} className="accent-[var(--accent)]" />
                <span className="font-medium">{d === 'shipping' ? t.checkout.shipping : t.checkout.pickup}</span>
              </label>
            ))}
          </div>
          {delivery === 'shipping' && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label={t.checkout.address} name="address" required autoComplete="street-address" defaultValue={prefill.address} error={errors.address} className="sm:col-span-2" />
              <Field label={t.checkout.city} name="city" required autoComplete="address-level2" defaultValue={prefill.city} error={errors.city} />
              <Field label={t.checkout.country} name="country" required autoComplete="country-name" defaultValue={prefill.country || 'Paraguay'} error={errors.country} />
            </div>
          )}
          {shippingNote && <p className="mt-4 text-sm text-slate-500">{shippingNote}</p>}
          <Field label={t.checkout.notes} name="notes" textarea rows={3} optionalLabel={t.common.optional} className="mt-4" />
        </fieldset>

        <fieldset className="rounded-card border border-slate-200 p-6">
          <legend className="px-2 text-lg font-semibold">{t.checkout.payment}</legend>
          <div className="space-y-3">
            {methods.map((m) => (
              <label
                key={m}
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition',
                  method === m ? 'border-accent bg-accent-50 ring-1 ring-accent' : 'border-slate-200 hover:border-slate-300',
                )}
              >
                <input type="radio" name="paymentMethod" value={m} checked={method === m} onChange={() => setMethod(m)} className="mt-1 accent-[var(--accent)]" data-testid={`pay-${m}`} />
                <span>
                  <span className="block font-medium">{t.checkout.methods[m]}</span>
                  <span className="block text-sm text-slate-500">{t.checkout.methodHints[m]}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <aside className="h-fit rounded-card border border-slate-200 bg-slate-50 p-6 lg:sticky lg:top-40">
        <h2 className="text-lg font-semibold">{t.checkout.summary}</h2>
        <ul className="mt-4 divide-y divide-slate-200 text-sm">
          {buyable.map(({ id, qty, product }) => (
            <li key={id} className="flex justify-between gap-3 py-2.5">
              <span className="min-w-0">
                <span className="line-clamp-2">{product.name}</span>
                <span className="text-slate-500">× {qty}</span>
              </span>
              <span className="shrink-0 font-medium tabular-nums">{formatPrice(unit(product) * qty, chargeCurrency, locale)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between border-t border-slate-300 pt-3 text-base">
          <span className="font-semibold">{t.cart.total}</span>
          <span className="font-bold tabular-nums" data-testid="checkout-total">
            {formatPrice(total, chargeCurrency, locale)}
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500">{t.checkout.chargedIn(chargeCurrency)}</p>
        <Button type="submit" size="lg" className="mt-5 w-full" disabled={pending} data-testid="place-order">
          <Lock className="h-4 w-4" />
          {pending ? t.checkout.placing : t.checkout.placeOrder}
        </Button>
        <p className="mt-3 text-center text-xs text-slate-500">{t.checkout.terms}</p>
      </aside>
    </form>
  )
}
