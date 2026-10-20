'use client'

import { Search } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useId, useRef, useState } from 'react'

import { useSite } from '@/components/providers/LocaleProvider'
import { searchSuggestions, type Suggestion } from '@/lib/actions/site'

/** Search field with instant product suggestions. Enter opens the full results. */
export function SearchBox() {
  const { t, locale, href } = useSite()
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Suggestion[]>([])
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const listId = useId()
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) return
    let cancelled = false
    const timer = setTimeout(async () => {
      const found = await searchSuggestions(q, locale).catch(() => [])
      if (!cancelled) {
        setResults(found)
        setActive(-1)
      }
    }, 200)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [query, locale])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const submit = () => {
    const q = query.trim()
    setOpen(false)
    if (active >= 0 && results[active]) {
      router.push(href(`/productos/${results[active].slug}`))
    } else if (q) {
      router.push(href(`/productos?q=${encodeURIComponent(q)}`))
    }
  }

  const showPanel = open && query.trim().length >= 2

  return (
    <div ref={boxRef} className="relative">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <label className="sr-only" htmlFor={`${listId}-input`}>
          {t.nav.search}
        </label>
        <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
        <input
          id={`${listId}-input`}
          type="search"
          value={query}
          placeholder={t.nav.searchPlaceholder}
          autoComplete="off"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          className="h-11 w-full rounded-full border border-slate-200 bg-slate-50 pr-4 pl-10 text-[15px] transition placeholder:text-slate-400 focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/20 focus:outline-none"
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setActive((i) => Math.min(i + 1, results.length - 1))
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setActive((i) => Math.max(i - 1, -1))
            } else if (e.key === 'Escape') {
              setOpen(false)
            }
          }}
        />
      </form>
      {showPanel && (
        <div id={listId} role="listbox" className="absolute top-full right-0 left-0 z-50 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lift">
          {results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-slate-500">{t.nav.searchNoResults}</p>
          ) : (
            <ul>
              {results.map((r, i) => (
                <li key={r.id} role="option" aria-selected={i === active}>
                  <Link
                    href={href(`/productos/${r.slug}`)}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 ${i === active ? 'bg-slate-50' : ''}`}
                  >
                    <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md border border-slate-100 bg-white">
                      {r.image && <Image src={r.image} alt="" fill sizes="40px" className="object-contain" />}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-ink">{r.name}</span>
                      {r.brand && <span className="block text-xs text-slate-500">{r.brand}</span>}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            onClick={() => {
              setActive(-1)
              submit()
            }}
            className="block w-full border-t border-slate-100 px-4 py-2.5 text-left text-sm font-semibold text-accent-700 hover:bg-slate-50"
          >
            {t.nav.seeAllResults(query.trim())}
          </button>
        </div>
      )}
    </div>
  )
}
