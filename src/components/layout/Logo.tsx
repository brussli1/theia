import Image from 'next/image'

import { cn } from '@/lib/cn'
import { isMedia, mediaSrc } from '@/lib/media'
import type { Media } from '@/payload-types'

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <circle cx="16" cy="16" r="15" fill="var(--brand)" />
      <path d="M5 16c3.2-5.4 7-8 11-8s7.8 2.6 11 8c-3.2 5.4-7 8-11 8s-7.8-2.6-11-8z" fill="#fff" />
      <circle cx="16" cy="16" r="5.2" fill="var(--accent)" />
      <circle cx="16" cy="16" r="2.2" fill="var(--brand)" />
    </svg>
  )
}

/** The uploaded logo when there is one; otherwise the Theia mark + name. */
export function Logo({
  logo,
  name,
  inverted,
  className,
}: {
  logo?: Media | number | null
  name: string
  inverted?: boolean
  className?: string
}) {
  if (isMedia(logo) && logo.url) {
    return (
      <Image
        src={mediaSrc(logo.url)!}
        alt={name}
        width={logo.width || 160}
        height={logo.height || 48}
        className={cn('h-9 w-auto', className)}
        priority
      />
    )
  }
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <BrandMark className="h-9 w-9" />
      <span className={cn('font-display text-2xl font-bold tracking-tight', inverted ? 'text-white' : 'text-brand')}>
        {name}
      </span>
    </span>
  )
}
