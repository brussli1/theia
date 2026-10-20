'use client'

import { CheckCircle2 } from 'lucide-react'
import { useState, useTransition } from 'react'

import { WhatsAppIcon } from '@/components/layout/WhatsAppButton'
import { useSite } from '@/components/providers/LocaleProvider'
import { Button, buttonClasses } from '@/components/ui/Button'
import { submitRequest, type RequestResult } from '@/lib/actions/requests'
import type { QuoteKind } from '@/lib/constants'
import { whatsappHref } from '@/lib/links'
import type { FieldErrors } from '@/lib/validation'
import { Field, FormAlert } from './Field'

type Props = {
  kind: Exclude<QuoteKind, 'products'>
  usedEquipmentId?: number
  defaultMessage?: string
  submitLabel?: string
  prefill?: { name?: string; email?: string; phone?: string; company?: string }
}

/** Contact / service / rental / used-equipment / general quote form. */
export function RequestForm({ kind, usedEquipmentId, defaultMessage, submitLabel, prefill }: Props) {
  const { t, locale, whatsapp } = useSite()
  const [errors, setErrors] = useState<FieldErrors>({})
  const [message, setMessage] = useState<string | null>(null)
  const [reference, setReference] = useState<string | null>(null)
  const [pending, start] = useTransition()

  if (reference) {
    const wa = whatsappHref(whatsapp, t.quote.whatsappMessage(reference))
    return (
      <div className="rounded-card border border-emerald-200 bg-emerald-50 p-6 text-center" role="status" data-testid="request-success">
        <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" aria-hidden="true" />
        <p className="mt-3 font-semibold text-emerald-900">{t.forms.success(reference)}</p>
        {wa && (
          <a href={wa} target="_blank" rel="noopener noreferrer" className={buttonClasses('whatsapp', 'md', 'mt-5')}>
            <WhatsAppIcon className="h-5 w-5" /> {t.common.whatsapp}
          </a>
        )}
      </div>
    )
  }

  return (
    <form
      className="grid gap-4 sm:grid-cols-2"
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        const form = new FormData(e.currentTarget)
        const get = (k: string) => String(form.get(k) ?? '')
        start(async () => {
          setMessage(null)
          const res = await submitRequest({
            kind,
            locale,
            usedEquipmentId,
            name: get('name'),
            email: get('email'),
            phone: get('phone'),
            company: get('company'),
            city: get('city'),
            message: get('message'),
            website: get('website'),
          }).catch((): RequestResult => ({ ok: false, message: t.common.errorGeneric }))
          if (res.ok) setReference(res.reference)
          else {
            setErrors(res.errors ?? {})
            setMessage(res.message ?? (res.errors ? null : t.common.errorGeneric))
          }
        })
      }}
    >
      <Field label={t.forms.name} name="name" required autoComplete="name" defaultValue={prefill?.name} error={errors.name} />
      <Field label={t.forms.email} name="email" type="email" required autoComplete="email" defaultValue={prefill?.email} error={errors.email} />
      <Field label={t.forms.phone} name="phone" type="tel" autoComplete="tel" defaultValue={prefill?.phone} optionalLabel={t.common.optional} />
      <Field label={t.forms.company} name="company" autoComplete="organization" defaultValue={prefill?.company} optionalLabel={t.common.optional} />
      <Field label={t.forms.city} name="city" autoComplete="address-level2" optionalLabel={t.common.optional} className="sm:col-span-2" />
      <Field
        label={t.forms.message}
        name="message"
        textarea
        required
        defaultValue={defaultMessage}
        placeholder={t.forms.placeholders[kind]}
        error={errors.message}
        className="sm:col-span-2"
      />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      {message && (
        <div className="sm:col-span-2">
          <FormAlert>{message}</FormAlert>
        </div>
      )}
      <div className="sm:col-span-2">
        <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto" data-testid="request-submit">
          {pending ? t.common.sending : submitLabel || t.common.send}
        </Button>
      </div>
    </form>
  )
}
