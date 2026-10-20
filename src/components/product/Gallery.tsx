'use client'

import { ChevronLeft, ChevronRight, ImageOff, X, ZoomIn } from 'lucide-react'
import Image from 'next/image'
import { useCallback, useEffect, useState } from 'react'

import { useSite } from '@/components/providers/LocaleProvider'
import { cn } from '@/lib/cn'

export type GalleryImage = { src: string; thumb: string; alt: string }

/** Product photos: main image, thumbnails and a full-screen viewer. */
export function Gallery({ images, name }: { images: GalleryImage[]; name: string }) {
  const { t } = useSite()
  const [index, setIndex] = useState(0)
  const [zoom, setZoom] = useState(false)
  const count = images.length
  const go = useCallback((delta: number) => setIndex((i) => (i + delta + count) % count), [count])

  useEffect(() => {
    if (!zoom) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setZoom(false)
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [zoom, go])

  if (!count) {
    return (
      <div className="flex aspect-square flex-col items-center justify-center gap-2 rounded-card border border-slate-200 bg-slate-50 text-slate-400">
        <ImageOff className="h-10 w-10" aria-hidden="true" />
        <span className="text-sm">{t.product.noImage}</span>
      </div>
    )
  }

  const current = images[index]

  return (
    <div>
      <div className="group relative aspect-square overflow-hidden rounded-card border border-slate-200 bg-white">
        <button type="button" className="absolute inset-0 cursor-zoom-in" onClick={() => setZoom(true)} aria-label={`${t.product.zoom}: ${current.alt || name}`}>
          <Image src={current.src} alt={current.alt || name} fill priority sizes="(min-width:1024px) 600px, 100vw" className="object-contain p-6" />
        </button>
        <ZoomIn className="pointer-events-none absolute right-4 bottom-4 h-5 w-5 text-slate-400 opacity-0 transition group-hover:opacity-100" aria-hidden="true" />
        {count > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} className="absolute top-1/2 left-3 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-card hover:bg-white" aria-label={t.pagination.previous}>
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button type="button" onClick={() => go(1)} className="absolute top-1/2 right-3 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-card hover:bg-white" aria-label={t.pagination.next}>
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>
      {count > 1 && (
        <ul className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <li key={img.src} className="shrink-0">
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`${i + 1} / ${count}`}
                aria-current={i === index}
                className={cn(
                  'relative block h-18 w-18 overflow-hidden rounded-lg border-2 bg-white transition',
                  i === index ? 'border-accent' : 'border-slate-200 hover:border-slate-300',
                )}
              >
                <Image src={img.thumb} alt="" fill sizes="72px" className="object-contain p-1" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {zoom && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/95" role="dialog" aria-modal="true" aria-label={name}>
          <button type="button" className="absolute top-4 right-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20" onClick={() => setZoom(false)} aria-label={t.nav.close}>
            <X className="h-6 w-6" />
          </button>
          {count > 1 && (
            <>
              <button type="button" onClick={() => go(-1)} className="absolute left-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20" aria-label={t.pagination.previous}>
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button type="button" onClick={() => go(1)} className="absolute right-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20" aria-label={t.pagination.next}>
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
          <div className="relative h-[85vh] w-[90vw]">
            <Image src={current.src} alt={current.alt || name} fill sizes="90vw" className="object-contain" />
          </div>
          <p className="absolute bottom-4 text-sm text-white/70">
            {index + 1} / {count}
          </p>
        </div>
      )}
    </div>
  )
}
