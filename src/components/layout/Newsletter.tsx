'use client'

import { useState, useTransition } from 'react'

import { useSite } from '@/components/providers/LocaleProvider'
import { Button } from '@/components/ui/Button'
import { subscribe } from '@/lib/actions/site'

export function Newsletter() {
  const { t, locale } = useSite()
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'done' | 'error'>('idle')
  const [pending, start] = useTransition()

  if (state === 'done') return <p className="font-medium text-accent-100">{t.footer.newsletterThanks}</p>

  return (
    <form
      className="flex w-full max-w-md gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        start(async () => {
          const res = await subscribe(email, locale).catch(() => ({ ok: false }))
          setState(res.ok ? 'done' : 'error')
        })
      }}
    >
      <label htmlFor="newsletter-email" className="sr-only">
        {t.footer.newsletterPlaceholder}
      </label>
      <input
        id="newsletter-email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={t.footer.newsletterPlaceholder}
        aria-invalid={state === 'error'}
        className="h-11 min-w-0 flex-1 rounded-lg border border-white/15 bg-white/5 px-4 text-white placeholder:text-slate-500 focus:border-accent focus:outline-none"
      />
      <Button type="submit" variant="secondary" disabled={pending}>
        {t.footer.newsletterButton}
      </Button>
    </form>
  )
}
