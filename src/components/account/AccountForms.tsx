'use client'

import Link from 'next/link'
import { useActionState } from 'react'

import { Field, FormAlert } from '@/components/forms/Field'
import { useSite } from '@/components/providers/LocaleProvider'
import { Button } from '@/components/ui/Button'
import { forgotPassword, login, register, resetPassword, updateProfile, type FormState } from '@/lib/actions/account'
import type { Customer } from '@/payload-types'

function Status({ state }: { state: FormState }) {
  if (state.error) return <FormAlert>{state.error}</FormAlert>
  if (state.message) return <FormAlert tone="success">{state.message}</FormAlert>
  return null
}

export function LoginForm({ returnTo }: { returnTo?: string }) {
  const { t, locale, href } = useSite()
  const [state, action, pending] = useActionState(login, {})
  return (
    <form action={action} className="space-y-4" data-testid="login-form">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="volver" value={returnTo ?? ''} />
      <Status state={state} />
      <Field label={t.forms.email} name="email" type="email" required autoComplete="email" />
      <Field label={t.account.password} name="password" type="password" required autoComplete="current-password" />
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {t.account.login}
      </Button>
      <Link href={href('/cuenta/olvide')} className="block text-center text-sm font-medium text-accent-700 hover:underline">
        {t.account.forgot}
      </Link>
    </form>
  )
}

export function RegisterForm({ returnTo }: { returnTo?: string }) {
  const { t, locale } = useSite()
  const [state, action, pending] = useActionState(register, {})
  return (
    <form action={action} className="space-y-4" data-testid="register-form">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="volver" value={returnTo ?? ''} />
      <Status state={state} />
      <Field label={t.forms.name} name="name" required autoComplete="name" />
      <Field label={t.forms.email} name="email" type="email" required autoComplete="email" />
      <Field label={t.forms.phone} name="phone" type="tel" autoComplete="tel" optionalLabel={t.common.optional} />
      <Field label={t.forms.company} name="company" autoComplete="organization" optionalLabel={t.common.optional} />
      <Field label={t.account.password} name="password" type="password" required minLength={8} autoComplete="new-password" hint={t.account.passwordHint} />
      <Button type="submit" size="lg" variant="secondary" className="w-full" disabled={pending}>
        {t.account.register}
      </Button>
    </form>
  )
}

export function ForgotForm() {
  const { t, locale } = useSite()
  const [state, action, pending] = useActionState(forgotPassword, {})
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />
      <Status state={state} />
      {!state.ok && (
        <>
          <Field label={t.forms.email} name="email" type="email" required autoComplete="email" />
          <Button type="submit" size="lg" className="w-full" disabled={pending}>
            {t.common.send}
          </Button>
        </>
      )}
    </form>
  )
}

export function ResetForm({ token }: { token: string }) {
  const { t, locale, href } = useSite()
  const [state, action, pending] = useActionState(resetPassword, {})
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="token" value={token} />
      <Status state={state} />
      {state.ok ? (
        <Link href={href('/cuenta')} className="block text-center font-semibold text-accent-700 hover:underline">
          {t.account.login} →
        </Link>
      ) : (
        <>
          <Field label={t.account.newPassword} name="password" type="password" required minLength={8} autoComplete="new-password" hint={t.account.passwordHint} />
          <Button type="submit" size="lg" className="w-full" disabled={pending}>
            {t.common.save}
          </Button>
        </>
      )}
    </form>
  )
}

export function ProfileForm({ customer }: { customer: Customer }) {
  const { t, locale } = useSite()
  const [state, action, pending] = useActionState(updateProfile, {})
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="locale" value={locale} />
      <div className="sm:col-span-2">
        <Status state={state} />
      </div>
      <Field label={t.forms.name} name="name" required defaultValue={customer.name} />
      <Field label={t.forms.phone} name="phone" defaultValue={customer.phone ?? ''} />
      <Field label={t.forms.company} name="company" defaultValue={customer.company ?? ''} />
      <Field label={t.checkout.taxId} name="taxId" defaultValue={customer.taxId ?? ''} />
      <Field label={t.checkout.legalName} name="legalName" defaultValue={customer.legalName ?? ''} className="sm:col-span-2" />
      <Field label={t.checkout.address} name="address" defaultValue={customer.address?.line ?? ''} className="sm:col-span-2" />
      <Field label={t.checkout.city} name="city" defaultValue={customer.address?.city ?? ''} />
      <Field label={t.checkout.country} name="country" defaultValue={customer.address?.country ?? ''} />
      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {t.common.save}
        </Button>
      </div>
    </form>
  )
}
