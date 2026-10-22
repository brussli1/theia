'use client'

import { Globe } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useTransition } from 'react'

import { useSite } from '@/components/providers/LocaleProvider'
import { localePath, stripLocale } from '@/i18n/config'
import { setCurrency } from '@/lib/actions/site'
import { cn } from '@/lib/cn'

/** Language (ES/EN) and currency (Gs./USD) toggles. */
export function Switchers(props: { className?: string }) {
  return (
    <Suspense fallback={null}>
      <SwitchersInner {...props} />
    </Suspense>
  )
}

function SwitchersInner({ className }: { className?: string }) {
  const { locale, currency, t } = useSite()
  const pathname = usePathname()
  const search = useSearchParams()
  const router = useRouter()
  const [pending, start] = useTransition()

  const query = search.toString()
  const base = stripLocale(pathname || '/')
  const otherLocale = locale === 'es' ? 'en' : 'es'
  const otherHref = localePath(otherLocale, base) + (query ? `?${query}` : '')

  const pill = 'rounded-md px-2 py-1 text-xs font-semibold transition'

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <Link
        href={otherHref}
        hrefLang={otherLocale}
        className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
        aria-label={`${t.nav.language}: ${otherLocale === 'en' ? 'English' : 'Español'}`}
      >
        <Globe className="h-3.5 w-3.5" />
        {otherLocale.toUpperCase()}
      </Link>
      <div
        role="group"
        aria-label={t.nav.currency}
        className={cn('flex rounded-lg bg-slate-100 p-0.5', pending && 'opacity-60')}
      >
        {(['PYG', 'USD'] as const).map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={currency === c}
            data-testid={`currency-${c}`}
            className={cn(pill, currency === c ? 'bg-white text-brand shadow-sm' : 'text-slate-500 hover:text-ink')}
            onClick={() =>
              start(async () => {
                await setCurrency(c)
                router.refresh()
              })
            }
          >
            {c === 'PYG' ? 'Gs.' : 'USD'}
          </button>
        ))}
      </div>
    </div>
  )
}
