import Link from 'next/link'
import type { ComponentProps, ReactNode } from 'react'

import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'whatsapp' | 'light'
type Size = 'sm' | 'md' | 'lg'

const base =
  'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap'

const variants: Record<Variant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-900 shadow-sm',
  secondary: 'bg-accent text-white hover:bg-accent-700 shadow-sm',
  outline: 'border border-slate-300 bg-white text-ink hover:border-brand hover:text-brand',
  ghost: 'text-ink hover:bg-slate-100',
  whatsapp: 'bg-[#25D366] text-white hover:bg-[#1ebe5b] shadow-sm',
  light: 'bg-white text-brand hover:bg-brand-50 shadow-sm',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-sm',
  md: 'h-11 px-5 text-[15px]',
  lg: 'h-12 px-6 text-base',
}

export function buttonClasses(variant: Variant = 'primary', size: Size = 'md', className?: string) {
  return cn(base, variants[variant], sizes[size], className)
}

type ButtonProps = ComponentProps<'button'> & { variant?: Variant; size?: Size }

export function Button({ variant, size, className, ...props }: ButtonProps) {
  return <button className={buttonClasses(variant, size, className)} {...props} />
}

type LinkButtonProps = {
  href: string
  children: ReactNode
  variant?: Variant
  size?: Size
  className?: string
  newTab?: boolean
}

export function LinkButton({ href, children, variant, size, className, newTab }: LinkButtonProps) {
  const classes = buttonClasses(variant, size, className)
  const external = /^(https?:|mailto:|tel:)/.test(href)
  if (external || newTab) {
    return (
      <a href={href} className={classes} target={newTab ? '_blank' : undefined} rel={newTab ? 'noopener noreferrer' : undefined}>
        {children}
      </a>
    )
  }
  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  )
}
