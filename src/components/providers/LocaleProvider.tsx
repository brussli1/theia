'use client'

import { createContext, useContext, type ReactNode } from 'react'

import { localePath, type Locale } from '@/i18n/config'
import { getDictionary, type Dictionary } from '@/i18n/dictionaries'
import type { Currency } from '@/lib/currency'

type Ctx = { locale: Locale; currency: Currency; whatsapp: string | null }

const LocaleContext = createContext<Ctx>({ locale: 'es', currency: 'PYG', whatsapp: null })

export function LocaleProvider({ children, ...value }: Ctx & { children: ReactNode }) {
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useSite(): Ctx & { t: Dictionary; href: (path: string) => string } {
  const ctx = useContext(LocaleContext)
  return { ...ctx, t: getDictionary(ctx.locale), href: (path: string) => localePath(ctx.locale, path) }
}
