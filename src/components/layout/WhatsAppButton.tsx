'use client'

import { useSite } from '@/components/providers/LocaleProvider'
import { whatsappHref } from '@/lib/links'

export function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2zm5.8 14.13c-.24.69-1.42 1.32-1.95 1.36-.5.05-.97.23-3.27-.68-2.77-1.09-4.53-3.93-4.67-4.11-.13-.18-1.11-1.48-1.11-2.82s.7-2 .96-2.27c.24-.27.53-.33.71-.33h.51c.16 0 .39-.06.6.46.24.55.78 1.9.85 2.04.07.13.11.29.02.47-.09.18-.13.29-.27.45-.13.16-.28.35-.4.47-.13.13-.27.28-.12.55.16.27.7 1.15 1.5 1.86 1.03.92 1.9 1.2 2.17 1.34.27.13.42.11.58-.07.16-.18.67-.78.85-1.05.18-.27.36-.22.6-.13.25.09 1.58.75 1.85.88.27.13.45.2.51.31.07.12.07.66-.17 1.35z" />
    </svg>
  )
}

/** Floating chat button, bottom-right on every page. */
export function WhatsAppButton({ message }: { message?: string | null }) {
  const { whatsapp, t } = useSite()
  const href = whatsappHref(whatsapp, message ?? undefined)
  if (!href) return null
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t.common.whatsappChat}
      className="fixed right-4 bottom-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lift transition hover:scale-105 sm:right-6 sm:bottom-6"
    >
      <WhatsAppIcon className="h-7 w-7" />
    </a>
  )
}
