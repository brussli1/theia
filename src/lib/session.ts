import 'server-only'

import { cookies, draftMode, headers } from 'next/headers'
import { cache } from 'react'

import type { Customer } from '@/payload-types'
import { CURRENCY_COOKIE, isCurrency, type Currency } from './currency'
import { defaultCurrency } from './geo'
import { getPayloadClient } from './payload'

/** Storefront sessions use their own cookie so they never clash with /admin. */
export const CUSTOMER_COOKIE = 'theia-customer'

export const getCurrency = cache(async (): Promise<Currency> => {
  const stored = (await cookies()).get(CURRENCY_COOKIE)?.value
  if (isCurrency(stored)) return stored
  return defaultCurrency(await headers())
})

export const getCustomer = cache(async (): Promise<Customer | null> => {
  const token = (await cookies()).get(CUSTOMER_COOKIE)?.value
  if (!token) return null
  try {
    const payload = await getPayloadClient()
    const { user } = await payload.auth({ headers: new Headers({ Authorization: `JWT ${token}` }) })
    return user?.collection === 'customers' ? (user as Customer) : null
  } catch {
    return null
  }
})

/** True while an editor is looking at unpublished changes (Live Preview). */
export async function isDraft(): Promise<boolean> {
  return (await draftMode()).isEnabled
}
