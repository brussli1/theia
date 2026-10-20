import { notFound } from 'next/navigation'

import { isLocale, type Locale } from '@/i18n/config'

export type LocaleParams<T = object> = Promise<{ locale: string } & T>

export async function resolveLocale<T extends object>(params: LocaleParams<T>): Promise<{ locale: Locale } & T> {
  const resolved = await params
  if (!isLocale(resolved.locale)) notFound()
  return resolved as { locale: Locale } & T
}

export type SearchParams = Promise<Record<string, string | string[] | undefined>>

export function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}
