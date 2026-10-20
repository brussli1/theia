'use server'

import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { isLocale, localePath, type Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { getPayloadClient } from '@/lib/payload'
import { rateLimit } from '@/lib/rate-limit'
import { CUSTOMER_COOKIE, getCustomer } from '@/lib/session'
import { EMAIL_RE, clean } from '@/lib/validation'

export type FormState = { error?: string; ok?: boolean; message?: string }

const localeOf = (form: FormData): Locale => (isLocale(form.get('locale')) ? (form.get('locale') as Locale) : 'es')

/** Only same-site paths are allowed after login. */
function safeReturn(value: FormDataEntryValue | null, locale: Locale): string {
  const path = typeof value === 'string' ? value : ''
  return path.startsWith('/') && !path.startsWith('//') ? localePath(locale, path) : localePath(locale, '/cuenta')
}

async function setSession(token: string) {
  ;(await cookies()).set(CUSTOMER_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })
}

async function ip() {
  return (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
}

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const locale = localeOf(form)
  const t = getDictionary(locale)
  if (!rateLimit(`login:${await ip()}`, 20, 15 * 60 * 1000)) return { error: t.common.errorGeneric }
  const email = clean(form.get('email')).toLowerCase()
  const password = String(form.get('password') ?? '')
  const payload = await getPayloadClient()
  try {
    const result = await payload.login({ collection: 'customers', data: { email, password } })
    if (!result.token) return { error: t.account.invalidLogin }
    await setSession(result.token)
  } catch {
    return { error: t.account.invalidLogin }
  }
  redirect(safeReturn(form.get('volver'), locale))
}

export async function register(_: FormState, form: FormData): Promise<FormState> {
  const locale = localeOf(form)
  const t = getDictionary(locale)
  if (!rateLimit(`register:${await ip()}`, 10, 60 * 60 * 1000)) return { error: t.common.errorGeneric }
  const name = clean(form.get('name'))
  const email = clean(form.get('email')).toLowerCase()
  const password = String(form.get('password') ?? '')
  if (!name) return { error: t.forms.requiredField }
  if (!EMAIL_RE.test(email)) return { error: t.forms.invalidEmail }
  if (password.length < 8) return { error: t.account.passwordHint }
  const payload = await getPayloadClient()
  const existing = await payload.count({ collection: 'customers', where: { email: { equals: email } } })
  if (existing.totalDocs) return { error: t.account.emailTaken }
  try {
    await payload.create({
      collection: 'customers',
      data: { name, email, password, phone: clean(form.get('phone'), 40) || undefined, company: clean(form.get('company')) || undefined, locale },
    })
    const result = await payload.login({ collection: 'customers', data: { email, password } })
    if (result.token) await setSession(result.token)
  } catch (err) {
    payload.logger.error({ err }, 'Registration failed')
    return { error: t.common.errorGeneric }
  }
  redirect(safeReturn(form.get('volver'), locale))
}

export async function logout(locale: string) {
  ;(await cookies()).delete(CUSTOMER_COOKIE)
  redirect(localePath(isLocale(locale) ? locale : 'es', '/'))
}

export async function forgotPassword(_: FormState, form: FormData): Promise<FormState> {
  const locale = localeOf(form)
  const t = getDictionary(locale)
  if (!rateLimit(`forgot:${await ip()}`, 5, 60 * 60 * 1000)) return { error: t.common.errorGeneric }
  const email = clean(form.get('email')).toLowerCase()
  if (!EMAIL_RE.test(email)) return { error: t.forms.invalidEmail }
  const payload = await getPayloadClient()
  // Same answer whether or not the account exists.
  await payload.forgotPassword({ collection: 'customers', data: { email } }).catch(() => null)
  return { ok: true, message: t.account.forgotSent }
}

export async function resetPassword(_: FormState, form: FormData): Promise<FormState> {
  const locale = localeOf(form)
  const t = getDictionary(locale)
  const token = String(form.get('token') ?? '')
  const password = String(form.get('password') ?? '')
  if (password.length < 8) return { error: t.account.passwordHint }
  const payload = await getPayloadClient()
  try {
    await payload.resetPassword({ collection: 'customers', data: { token, password }, overrideAccess: true })
  } catch {
    return { error: t.common.errorGeneric }
  }
  return { ok: true, message: t.account.resetDone }
}

export async function updateProfile(_: FormState, form: FormData): Promise<FormState> {
  const locale = localeOf(form)
  const t = getDictionary(locale)
  const customer = await getCustomer()
  if (!customer) return { error: t.common.errorGeneric }
  const name = clean(form.get('name'))
  if (!name) return { error: t.forms.requiredField }
  const payload = await getPayloadClient()
  await payload.update({
    collection: 'customers',
    id: customer.id,
    data: {
      name,
      phone: clean(form.get('phone'), 40),
      company: clean(form.get('company')),
      taxId: clean(form.get('taxId'), 40),
      legalName: clean(form.get('legalName')),
      address: {
        line: clean(form.get('address'), 300),
        city: clean(form.get('city'), 120),
        country: clean(form.get('country'), 120),
      },
    },
  })
  return { ok: true, message: t.common.saved }
}
