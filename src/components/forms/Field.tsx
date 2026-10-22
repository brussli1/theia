import type { ComponentProps, ReactNode } from 'react'

import { cn } from '@/lib/cn'

type Common = { label: string; name: string; error?: string; hint?: ReactNode; optionalLabel?: string; className?: string }

export function Field({
  label,
  name,
  error,
  hint,
  optionalLabel,
  className,
  textarea,
  ...props
}: Common & { textarea?: boolean } & ComponentProps<'input'> & ComponentProps<'textarea'>) {
  const id = `f-${name}`
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined
  const control = textarea ? (
    <textarea
      id={id}
      name={name}
      rows={5}
      aria-invalid={Boolean(error)}
      aria-describedby={describedBy}
      className={cn('field-input', error && 'border-red-400')}
      {...(props as ComponentProps<'textarea'>)}
    />
  ) : (
    <input
      id={id}
      name={name}
      aria-invalid={Boolean(error)}
      aria-describedby={describedBy}
      className={cn('field-input', error && 'border-red-400')}
      {...(props as ComponentProps<'input'>)}
    />
  )
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        {optionalLabel && !props.required && <span className="ml-1 font-normal text-slate-400">({optionalLabel})</span>}
      </label>
      {control}
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-sm text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1 text-sm text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

export function FormAlert({ tone = 'error', children }: { tone?: 'error' | 'success' | 'info'; children: ReactNode }) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'rounded-lg border px-4 py-3 text-sm',
        tone === 'error' && 'border-red-200 bg-red-50 text-red-800',
        tone === 'success' && 'border-emerald-200 bg-emerald-50 text-emerald-800',
        tone === 'info' && 'border-sky-200 bg-sky-50 text-sky-800',
      )}
    >
      {children}
    </div>
  )
}
