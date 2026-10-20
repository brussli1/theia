'use client'

import { ChevronDown, ClipboardList, Menu, ShoppingCart, User, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState, type ReactNode } from 'react'

import { useSite } from '@/components/providers/LocaleProvider'
import { cn } from '@/lib/cn'
import { useLines } from '@/lib/store'
import { SearchBox } from './SearchBox'
import { Switchers } from './Switchers'

export type MenuCategory = { name: string; href: string; children: { name: string; href: string }[] }
export type NavLink = { label: string; href: string; newTab?: boolean }

type Props = {
  logo: ReactNode
  categories: MenuCategory[]
  nav: NavLink[]
  announcement: { text: string; href: string | null } | null
  customerName: string | null
}

function CountBadge({ count }: { count: number }) {
  if (!count) return null
  return (
    <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-bold text-white">
      {count > 99 ? '99+' : count}
    </span>
  )
}

export function HeaderClient({ logo, categories, nav, announcement, customerName }: Props) {
  const { t, href } = useSite()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [megaOpen, setMegaOpen] = useState(false)
  const megaRef = useRef<HTMLDivElement>(null)
  const { lines: cart } = useLines('cart')
  const { lines: quote } = useLines('quote')
  const cartCount = cart.reduce((n, l) => n + l.qty, 0)
  const quoteCount = quote.length

  // Close menus after navigating (adjusting state during render, per React docs).
  const [lastPath, setLastPath] = useState(pathname)
  if (pathname !== lastPath) {
    setLastPath(pathname)
    setMobileOpen(false)
    setMegaOpen(false)
  }

  useEffect(() => {
    if (!megaOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMegaOpen(false)
    const onClick = (e: MouseEvent) => {
      if (megaRef.current && !megaRef.current.contains(e.target as Node)) setMegaOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClick)
    }
  }, [megaOpen])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
  }, [mobileOpen])

  const iconLink = 'relative flex h-10 items-center gap-2 rounded-lg px-2.5 text-sm font-medium text-ink hover:bg-slate-100'

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      {announcement && (
        <div className="bg-brand text-center text-[13px] font-medium text-white">
          <div className="container-page py-2">
            {announcement.href ? (
              <Link href={announcement.href} className="hover:underline">
                {announcement.text}
              </Link>
            ) : (
              announcement.text
            )}
          </div>
        </div>
      )}

      <div className="container-page flex h-16 items-center gap-3 lg:h-[76px] lg:gap-6">
        <button
          type="button"
          className="-ml-2 flex h-10 w-10 items-center justify-center rounded-lg hover:bg-slate-100 lg:hidden"
          onClick={() => setMobileOpen(true)}
          aria-label={t.nav.menu}
          aria-expanded={mobileOpen}
        >
          <Menu className="h-6 w-6" />
        </button>
        <Link href={href('/')} className="shrink-0" aria-label={t.nav.home}>
          {logo}
        </Link>
        <div className="mx-auto hidden w-full max-w-xl md:block">
          <SearchBox />
        </div>
        <div className="ml-auto flex items-center gap-0.5 md:ml-0">
          <Switchers className="mr-2 hidden xl:flex" />
          <Link href={href('/cuenta')} className={iconLink} aria-label={t.nav.account}>
            <User className="h-5 w-5" />
            <span className="hidden max-w-28 truncate lg:inline">{customerName ?? t.nav.account}</span>
          </Link>
          <Link href={href('/cotizacion')} className={iconLink} aria-label={t.nav.quoteList} data-testid="quote-link">
            <ClipboardList className="h-5 w-5" />
            <span className="hidden lg:inline">{t.nav.quoteList}</span>
            <CountBadge count={quoteCount} />
          </Link>
          <Link href={href('/carrito')} className={iconLink} aria-label={t.nav.cart} data-testid="cart-link">
            <ShoppingCart className="h-5 w-5" />
            <span className="hidden lg:inline">{t.nav.cart}</span>
            <CountBadge count={cartCount} />
          </Link>
        </div>
      </div>

      <div className="container-page pb-3 md:hidden">
        <SearchBox />
      </div>

      <nav aria-label="Principal" className="hidden border-t border-slate-100 lg:block">
        <div className="container-page flex h-12 items-center gap-1">
          <div ref={megaRef} className="relative" onMouseLeave={() => setMegaOpen(false)}>
            <button
              type="button"
              className={cn(
                'flex h-12 items-center gap-1.5 px-3 text-[15px] font-semibold text-ink hover:text-brand',
                megaOpen && 'text-brand',
              )}
              aria-expanded={megaOpen}
              aria-haspopup="true"
              onClick={() => setMegaOpen((v) => !v)}
              onMouseEnter={() => setMegaOpen(true)}
            >
              {t.nav.products}
              <ChevronDown className={cn('h-4 w-4 transition', megaOpen && 'rotate-180')} />
            </button>
            {megaOpen && (
              <div className="absolute top-full left-0 z-40 w-[min(92vw,64rem)] rounded-b-2xl border border-slate-200 bg-white p-6 shadow-lift">
                <div className="grid max-h-[65vh] grid-cols-2 gap-x-8 gap-y-6 overflow-y-auto pr-2 md:grid-cols-3 xl:grid-cols-4">
                  {categories.map((c) => (
                    <div key={c.href}>
                      <Link href={c.href} className="font-display text-[15px] font-semibold text-ink hover:text-accent-700">
                        {c.name}
                      </Link>
                      {c.children.length > 0 && (
                        <ul className="mt-2 space-y-1.5">
                          {c.children.map((s) => (
                            <li key={s.href}>
                              <Link href={s.href} className="text-sm text-slate-600 hover:text-brand">
                                {s.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-5 border-t border-slate-100 pt-4">
                  <Link href={href('/productos')} className="text-sm font-semibold text-accent-700 hover:underline">
                    {t.nav.allProducts} →
                  </Link>
                </div>
              </div>
            )}
          </div>
          {nav.map((item) => (
            <Link
              key={item.href + item.label}
              href={item.href}
              target={item.newTab ? '_blank' : undefined}
              className={cn(
                'flex h-12 items-center px-3 text-[15px] font-medium text-slate-700 hover:text-brand',
                pathname === item.href && 'text-brand',
              )}
            >
              {item.label}
            </Link>
          ))}
          <Switchers className="ml-auto xl:hidden" />
        </div>
      </nav>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label={t.nav.menu}>
          <div className="absolute inset-0 bg-ink/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[min(88vw,22rem)] flex-col bg-white shadow-lift">
            <div className="flex h-16 items-center justify-between border-b border-slate-100 px-4">
              <span className="font-display text-lg font-semibold">{t.nav.menu}</span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-slate-100"
                aria-label={t.nav.close}
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <Link href={href('/productos')} className="block rounded-lg px-3 py-2.5 font-semibold text-brand hover:bg-slate-50">
                {t.nav.allProducts}
              </Link>
              <p className="mt-4 px-3 text-xs font-semibold tracking-wider text-slate-400 uppercase">{t.nav.categories}</p>
              <ul className="mt-1">
                {categories.map((c) => (
                  <li key={c.href}>
                    <details className="group">
                      <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg px-3 py-2.5 font-medium hover:bg-slate-50">
                        {c.name}
                        {c.children.length > 0 && <ChevronDown className="h-4 w-4 text-slate-400 transition group-open:rotate-180" />}
                      </summary>
                      <ul className="mb-2 ml-3 border-l border-slate-100 pl-3">
                        <li>
                          <Link href={c.href} className="block py-1.5 text-sm font-medium text-accent-700">
                            {t.common.viewAll}
                          </Link>
                        </li>
                        {c.children.map((s) => (
                          <li key={s.href}>
                            <Link href={s.href} className="block py-1.5 text-sm text-slate-600">
                              {s.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </details>
                  </li>
                ))}
              </ul>
              <ul className="mt-4 border-t border-slate-100 pt-4">
                {nav.map((item) => (
                  <li key={item.href + item.label}>
                    <Link href={item.href} className="block rounded-lg px-3 py-2.5 font-medium hover:bg-slate-50">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="border-t border-slate-100 p-4">
              <Switchers />
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
