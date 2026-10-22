'use client'

import { CheckCircle2, ClipboardList, ImageOff, Trash2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useState, useTransition } from 'react'

import { Field, FormAlert } from '@/components/forms/Field'
import { WhatsAppIcon } from '@/components/layout/WhatsAppButton'
import { QuantityInput } from '@/components/product/ProductActions'
import { useSite } from '@/components/providers/LocaleProvider'
import { Button, LinkButton, buttonClasses } from '@/components/ui/Button'
import { submitRequest, type RequestResult } from '@/lib/actions/requests'
import { whatsappHref } from '@/lib/links'
import { lists } from '@/lib/store'
import type { FieldErrors } from '@/lib/validation'
import { useListProducts } from './useListProducts'

type Prefill = { name?: string; email?: string; phone?: string; company?: string }

/** The quote list: several products, one request. */
export function QuoteView({ prefill }: { prefill: Prefill }) {
  const { t, href, locale, whatsapp } = useSite()
  const { items, loading } = useListProducts('quote')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [message, setMessage] = useState<string | null>(null)
  const [reference, setReference] = useState<string | null>(null)
  const [pending, start] = useTransition()

  if (reference) {
    const wa = whatsappHref(whatsapp, t.quote.whatsappMessage(reference))
    return (
      <div className="mx-auto max-w-xl rounded-card border border-emerald-200 bg-emerald-50 p-8 text-center" data-testid="quote-success">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" aria-hidden="true" />
        <h2 className="mt-4 text-2xl font-bold text-emerald-900">{t.quote.successTitle}</h2>
        <p className="mt-2 text-emerald-900">{t.quote.success(reference)}</p>
        <p className="mt-4 text-sm text-emerald-800">{t.quote.successWhatsapp}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" className={buttonClasses('whatsapp')}>
              <WhatsAppIcon className="h-5 w-5" /> {t.common.whatsapp}
            </a>
          )}
          <LinkButton href={href('/productos')} variant="outline">
            {t.cart.continue}
          </LinkButton>
        </div>
      </div>
    )
  }

  return (
    <form
      noValidate
      className="grid gap-8 lg:grid-cols-5"
      onSubmit={(e) => {
        e.preventDefault()
        const form = new FormData(e.currentTarget)
        const get = (k: string) => String(form.get(k) ?? '')
        start(async () => {
          setMessage(null)
          const res: RequestResult = await submitRequest({
            kind: 'products',
            locale,
            items: items.map((i) => ({ id: i.id, qty: i.qty })),
            name: get('name'),
            email: get('email'),
            phone: get('phone'),
            company: get('company'),
            city: get('city'),
            country: get('country'),
            message: get('message'),
            website: get('website'),
          }).catch(() => ({ ok: false, message: t.common.errorGeneric }))
          if (res.ok) {
            lists.clear('quote')
            setReference(res.reference)
            window.scrollTo({ top: 0, behavior: 'smooth' })
          } else {
            setErrors(res.errors ?? {})
            setMessage(res.message ?? null)
          }
        })
      }}
    >
      <section className="lg:col-span-2">
        <h2 className="text-lg font-semibold">{t.quote.yourList}</h2>
        {loading ? (
          <p className="mt-4 text-slate-500">{t.common.loading}</p>
        ) : items.length ? (
          <ul className="mt-4 divide-y divide-slate-200 rounded-card border border-slate-200 bg-white" data-testid="quote-lines">
            {items.map(({ id, qty, product }) => (
              <li key={id} className="flex gap-3 p-4">
                <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-slate-100 bg-white">
                  {product.image ? <Image src={product.image} alt="" fill sizes="64px" className="object-contain p-1" /> : <ImageOff className="absolute inset-0 m-auto h-5 w-5 text-slate-300" />}
                </span>
                <div className="min-w-0 flex-1">
                  <Link href={href(`/productos/${product.slug}`)} className="line-clamp-2 text-sm font-semibold hover:text-brand">
                    {product.name}
                  </Link>
                  <div className="mt-2 flex items-center gap-2">
                    <QuantityInput value={qty} onChange={(n) => lists.setQty('quote', id, n)} label={t.product.quantity} />
                    <button type="button" onClick={() => lists.remove('quote', id)} className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-red-600" aria-label={`${t.common.remove}: ${product.name}`}>
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-4 rounded-card border border-dashed border-slate-300 p-6 text-center">
            <ClipboardList className="mx-auto h-8 w-8 text-slate-400" aria-hidden="true" />
            <p className="mt-3 font-semibold">{t.quote.empty}</p>
            <p className="mt-1 text-sm text-slate-600">{t.quote.emptyHint}</p>
            <LinkButton href={href('/productos')} variant="outline" size="sm" className="mt-4">
              {t.cart.emptyCta}
            </LinkButton>
          </div>
        )}
      </section>

      <section className="rounded-card border border-slate-200 bg-white p-6 shadow-card sm:p-8 lg:col-span-3">
        <div className="grid gap-4 sm:grid-cols-2">
          {message && (
            <div className="sm:col-span-2">
              <FormAlert>{message}</FormAlert>
            </div>
          )}
          <Field label={t.forms.name} name="name" required autoComplete="name" defaultValue={prefill.name} error={errors.name} />
          <Field label={t.forms.email} name="email" type="email" required autoComplete="email" defaultValue={prefill.email} error={errors.email} />
          <Field label={t.forms.phone} name="phone" type="tel" autoComplete="tel" defaultValue={prefill.phone} optionalLabel={t.common.optional} />
          <Field label={t.forms.company} name="company" autoComplete="organization" defaultValue={prefill.company} optionalLabel={t.common.optional} />
          <Field label={t.forms.city} name="city" autoComplete="address-level2" optionalLabel={t.common.optional} />
          <Field label={t.forms.country} name="country" autoComplete="country-name" defaultValue="Paraguay" optionalLabel={t.common.optional} />
          <Field
            label={t.quote.message}
            name="message"
            textarea
            placeholder={t.quote.messagePlaceholder}
            error={errors.message}
            optionalLabel={items.length ? t.common.optional : undefined}
            required={!items.length}
            className="sm:col-span-2"
          />
          <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
          <div className="sm:col-span-2">
            <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto" data-testid="quote-submit">
              {pending ? t.common.sending : t.quote.send}
            </Button>
          </div>
        </div>
      </section>
    </form>
  )
}
