import { CheckCircle2 } from 'lucide-react'

import { LinkButton } from '@/components/ui/Button'
import { MediaImage } from '@/components/ui/MediaImage'
import { cn } from '@/lib/cn'
import { resolveHref } from '@/lib/links'
import { isMedia } from '@/lib/media'
import type { BlockContext, BlockOf } from '../types'

export function HeroBlock({ block, ctx }: { block: BlockOf<'hero'>; ctx: BlockContext }) {
  const Heading = ctx.isFirst ? 'h1' : 'h2'
  const style = block.style ?? 'split'
  const hasImage = isMedia(block.image)
  const buttons = (block.buttons ?? [])
    .map((b, i) => {
      const href = resolveHref(b.link, ctx.locale)
      return href && b.link?.label ? { href, label: b.link.label, newTab: Boolean(b.link.newTab), primary: i === 0 } : null
    })
    .filter((b): b is NonNullable<typeof b> => b !== null)

  if (style === 'background' && hasImage) {
    return (
      <section className="relative isolate overflow-hidden bg-ink">
        <MediaImage media={block.image} size="large" className="absolute inset-0 -z-10" imgClassName="opacity-50" priority />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink/90 via-ink/60 to-transparent" />
        <div className="container-page py-24 sm:py-32 lg:py-40">
          <div className="max-w-2xl text-white">
            {block.eyebrow && <p className="mb-3 text-sm font-semibold tracking-wider text-accent-100 uppercase">{block.eyebrow}</p>}
            {block.title && <Heading className="text-4xl leading-tight font-bold text-white sm:text-5xl lg:text-6xl">{block.title}</Heading>}
            {block.intro && <p className="mt-5 text-lg text-white/85 sm:text-xl">{block.intro}</p>}
            <Buttons buttons={buttons} inverted />
            <Highlights items={block.highlights} inverted />
          </div>
        </div>
      </section>
    )
  }

  if (style === 'simple' || !hasImage) {
    return (
      <section className="border-b border-slate-100 bg-gradient-to-b from-brand-50 to-white">
        <div className="container-page py-16 text-center sm:py-24">
          {block.eyebrow && <p className="mb-3 text-sm font-semibold tracking-wider text-accent-700 uppercase">{block.eyebrow}</p>}
          {block.title && <Heading className="mx-auto max-w-3xl text-4xl leading-tight font-bold sm:text-5xl">{block.title}</Heading>}
          {block.intro && <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">{block.intro}</p>}
          <Buttons buttons={buttons} center />
          <Highlights items={block.highlights} center />
        </div>
      </section>
    )
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-accent-50">
      <div aria-hidden="true" className="absolute -top-40 -right-40 h-[32rem] w-[32rem] rounded-full bg-accent/10 blur-3xl" />
      <div className="container-page relative grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-2 lg:gap-16 lg:py-24">
        <div>
          {block.eyebrow && (
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-semibold text-accent-700 shadow-sm ring-1 ring-accent-100">
              {block.eyebrow}
            </p>
          )}
          {block.title && <Heading className="text-4xl leading-[1.1] font-extrabold sm:text-5xl lg:text-[3.5rem]">{block.title}</Heading>}
          {block.intro && <p className="mt-5 max-w-xl text-lg text-slate-600 sm:text-xl">{block.intro}</p>}
          <Buttons buttons={buttons} />
          <Highlights items={block.highlights} />
        </div>
        <div className="relative">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[1.75rem] bg-white shadow-lift ring-1 ring-slate-200">
            <MediaImage media={block.image} size="large" className="absolute inset-0" imgClassName="object-cover" priority sizes="(min-width:1024px) 50vw, 100vw" />
          </div>
        </div>
      </div>
    </section>
  )
}

function Buttons({ buttons, inverted, center }: { buttons: { href: string; label: string; newTab: boolean; primary: boolean }[]; inverted?: boolean; center?: boolean }) {
  if (!buttons.length) return null
  return (
    <div className={cn('mt-8 flex flex-wrap gap-3', center && 'justify-center')}>
      {buttons.map((b) => (
        <LinkButton
          key={b.href + b.label}
          href={b.href}
          newTab={b.newTab}
          size="lg"
          variant={b.primary ? (inverted ? 'secondary' : 'primary') : inverted ? 'light' : 'outline'}
        >
          {b.label}
        </LinkButton>
      ))}
    </div>
  )
}

function Highlights({ items, inverted, center }: { items?: { text: string; id?: string | null }[] | null; inverted?: boolean; center?: boolean }) {
  if (!items?.length) return null
  return (
    <ul className={cn('mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium', inverted ? 'text-white/85' : 'text-slate-600', center && 'justify-center')}>
      {items.map((h) => (
        <li key={h.id ?? h.text} className="flex items-center gap-2">
          <CheckCircle2 className={cn('h-4.5 w-4.5', inverted ? 'text-accent-100' : 'text-accent')} aria-hidden="true" />
          {h.text}
        </li>
      ))}
    </ul>
  )
}
