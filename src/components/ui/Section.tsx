import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'

type Background = 'white' | 'muted' | 'brand' | null | undefined

export function Section({
  children,
  background = 'white',
  className,
  id,
}: {
  children: ReactNode
  background?: Background
  className?: string
  id?: string
}) {
  return (
    <section
      id={id}
      className={cn(
        'py-14 sm:py-20',
        background === 'muted' && 'bg-slate-50',
        background === 'brand' && 'bg-brand text-white [&_h2]:text-white [&_h3]:text-white',
        className,
      )}
    >
      <div className="container-page">{children}</div>
    </section>
  )
}

export function SectionHeading({
  eyebrow,
  title,
  intro,
  align = 'left',
  inverted,
  action,
}: {
  eyebrow?: string | null
  title?: string | null
  intro?: string | null
  align?: 'left' | 'center'
  inverted?: boolean
  action?: ReactNode
}) {
  if (!eyebrow && !title && !intro && !action) return null
  return (
    <div
      className={cn(
        'mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between',
        align === 'center' && 'items-center text-center sm:flex-col sm:items-center',
      )}
    >
      <div className={cn('max-w-2xl', align === 'center' && 'mx-auto')}>
        {eyebrow && (
          <p className={cn('mb-2 text-sm font-semibold tracking-wider uppercase', inverted ? 'text-accent-100' : 'text-accent-700')}>
            {eyebrow}
          </p>
        )}
        {title && <h2 className="text-3xl font-bold sm:text-4xl">{title}</h2>}
        {intro && <p className={cn('mt-3 text-lg', inverted ? 'text-white/80' : 'text-slate-600')}>{intro}</p>}
      </div>
      {action}
    </div>
  )
}
