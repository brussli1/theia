import { ChevronDown, Quote } from 'lucide-react'

import { WhatsAppIcon } from '@/components/layout/WhatsAppButton'
import { LinkButton, buttonClasses } from '@/components/ui/Button'
import { NamedIcon } from '@/components/ui/Icon'
import { MediaImage } from '@/components/ui/MediaImage'
import { RichText } from '@/components/ui/RichText'
import { Section, SectionHeading } from '@/components/ui/Section'
import { getDictionary } from '@/i18n/dictionaries'
import { cn } from '@/lib/cn'
import { getSettings } from '@/lib/data'
import { resolveHref, whatsappHref } from '@/lib/links'
import { youtubeId } from '@/lib/video'
import type { BlockContext, BlockOf } from '../types'

type Btn = { link?: Parameters<typeof resolveHref>[0]; id?: string | null }

function buttonList(buttons: Btn[] | null | undefined, ctx: BlockContext) {
  return (buttons ?? [])
    .map((b) => {
      const href = resolveHref(b.link, ctx.locale)
      return href && b.link?.label ? { href, label: b.link.label, newTab: Boolean(b.link.newTab) } : null
    })
    .filter((b): b is { href: string; label: string; newTab: boolean } => b !== null)
}

export function ContentBlock({ block }: { block: BlockOf<'content'> }) {
  return (
    <Section background={block.background}>
      <RichText data={block.body} className={cn(block.width !== 'wide' && 'mx-auto max-w-3xl', block.background === 'brand' && 'prose-invert')} />
    </Section>
  )
}

export function MediaTextBlock({ block, ctx }: { block: BlockOf<'mediaText'>; ctx: BlockContext }) {
  const buttons = buttonList(block.buttons, ctx)
  return (
    <Section background={block.background}>
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div className={cn(block.imagePosition === 'left' && 'lg:order-2')}>
          {block.eyebrow && <p className="mb-2 text-sm font-semibold tracking-wider text-accent-700 uppercase">{block.eyebrow}</p>}
          {block.title && <h2 className="text-3xl font-bold sm:text-4xl">{block.title}</h2>}
          {block.intro && <p className="mt-4 text-lg text-slate-600">{block.intro}</p>}
          <RichText data={block.body} className="mt-4" />
          {buttons.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-3">
              {buttons.map((b, i) => (
                <LinkButton key={b.href} href={b.href} newTab={b.newTab} variant={i === 0 ? 'primary' : 'outline'}>
                  {b.label}
                </LinkButton>
              ))}
            </div>
          )}
        </div>
        <div className={cn('relative aspect-[4/3] overflow-hidden rounded-[1.5rem] shadow-lift', block.imagePosition === 'left' && 'lg:order-1')}>
          <MediaImage media={block.image} size="large" className="absolute inset-0" sizes="(min-width:1024px) 50vw, 100vw" />
        </div>
      </div>
    </Section>
  )
}

export function FeaturesBlock({ block }: { block: BlockOf<'features'> }) {
  const inverted = block.background === 'brand'
  const items = block.items ?? []
  return (
    <Section background={block.background}>
      <SectionHeading eyebrow={block.eyebrow} title={block.title} intro={block.intro} align="center" inverted={inverted} />
      <div className={cn('grid gap-5 sm:grid-cols-2', items.length >= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3')}>
        {items.map((item) => (
          <div
            key={item.id ?? item.title}
            className={cn('rounded-card p-6', inverted ? 'bg-white/5 ring-1 ring-white/10' : 'border border-slate-200 bg-white shadow-card')}
          >
            <span className={cn('flex h-12 w-12 items-center justify-center rounded-xl', inverted ? 'bg-white/10 text-accent-100' : 'bg-accent-50 text-accent-700')}>
              <NamedIcon name={item.icon} className="h-6 w-6" />
            </span>
            <h3 className="mt-5 text-lg font-semibold">{item.title}</h3>
            {item.text && <p className={cn('mt-2 text-[15px] leading-relaxed', inverted ? 'text-white/75' : 'text-slate-600')}>{item.text}</p>}
          </div>
        ))}
      </div>
    </Section>
  )
}

export function StatsBlock({ block }: { block: BlockOf<'stats'> }) {
  const inverted = block.background === 'brand'
  return (
    <Section background={block.background}>
      <SectionHeading eyebrow={block.eyebrow} title={block.title} intro={block.intro} align="center" inverted={inverted} />
      <dl className="grid grid-cols-2 gap-6 lg:grid-cols-4">
        {(block.items ?? []).map((item) => (
          <div key={item.id ?? item.label} className="flex flex-col-reverse text-center">
            <dt className={cn('mt-2 text-sm font-medium', inverted ? 'text-white/75' : 'text-slate-600')}>{item.label}</dt>
            <dd className={cn('font-display text-4xl font-extrabold sm:text-5xl', inverted ? 'text-white' : 'text-brand')}>{item.value}</dd>
          </div>
        ))}
      </dl>
    </Section>
  )
}

export function TestimonialsBlock({ block }: { block: BlockOf<'testimonials'> }) {
  return (
    <Section background={block.background}>
      <SectionHeading eyebrow={block.eyebrow} title={block.title} intro={block.intro} align="center" inverted={block.background === 'brand'} />
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {(block.items ?? []).map((item) => (
          <figure key={item.id ?? item.author} className="flex flex-col rounded-card border border-slate-200 bg-white p-7 text-ink shadow-card">
            <Quote className="h-8 w-8 text-accent" aria-hidden="true" />
            <blockquote className="mt-4 flex-1 text-[15px] leading-relaxed text-slate-700">“{item.quote}”</blockquote>
            <figcaption className="mt-6 flex items-center gap-3">
              {item.photo ? (
                <MediaImage media={item.photo} size="thumbnail" className="h-11 w-11 rounded-full" sizes="44px" />
              ) : (
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand">
                  {item.author.charAt(0)}
                </span>
              )}
              <span>
                <span className="block font-semibold">{item.author}</span>
                {item.role && <span className="block text-sm text-slate-500">{item.role}</span>}
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </Section>
  )
}

export function FaqBlock({ block }: { block: BlockOf<'faq'> }) {
  const items = block.items ?? []
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((i) => ({ '@type': 'Question', name: i.question, acceptedAnswer: { '@type': 'Answer', text: i.answer } })),
  }
  return (
    <Section background={block.background}>
      <div className="mx-auto max-w-3xl">
        <SectionHeading eyebrow={block.eyebrow} title={block.title} intro={block.intro} align="center" inverted={block.background === 'brand'} />
        <div className="divide-y divide-slate-200 rounded-card border border-slate-200 bg-white text-ink">
          {items.map((item) => (
            <details key={item.id ?? item.question} className="group px-6">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-left font-semibold">
                {item.question}
                <ChevronDown className="h-5 w-5 shrink-0 text-slate-400 transition group-open:rotate-180" aria-hidden="true" />
              </summary>
              <p className="pb-5 leading-relaxed whitespace-pre-line text-slate-600">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
    </Section>
  )
}

export async function CtaBlock({ block, ctx }: { block: BlockOf<'cta'>; ctx: BlockContext }) {
  const buttons = buttonList(block.buttons, ctx)
  const settings = await getSettings(ctx.locale)
  const t = getDictionary(ctx.locale)
  const wa = block.showWhatsapp ? whatsappHref(settings.whatsapp, settings.whatsappMessage ?? undefined) : null
  return (
    <section className="py-14 sm:py-20">
      <div className="container-page">
        <div className="relative overflow-hidden rounded-[2rem] bg-brand px-6 py-12 text-center text-white sm:px-12 sm:py-16">
          <div aria-hidden="true" className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-accent/30 blur-3xl" />
          <div aria-hidden="true" className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="relative mx-auto max-w-2xl">
            {block.eyebrow && <p className="mb-2 text-sm font-semibold tracking-wider text-accent-100 uppercase">{block.eyebrow}</p>}
            {block.title && <h2 className="text-3xl font-bold text-white sm:text-4xl">{block.title}</h2>}
            {block.intro && <p className="mt-4 text-lg text-white/80">{block.intro}</p>}
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {buttons.map((b, i) => (
                <LinkButton key={b.href} href={b.href} newTab={b.newTab} size="lg" variant={i === 0 ? 'secondary' : 'light'}>
                  {b.label}
                </LinkButton>
              ))}
              {wa && (
                <a href={wa} target="_blank" rel="noopener noreferrer" className={buttonClasses('whatsapp', 'lg')}>
                  <WhatsAppIcon className="h-5 w-5" />
                  {t.common.whatsapp}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export function VideoBlock({ block }: { block: BlockOf<'video'> }) {
  const id = youtubeId(block.url)
  if (!id) return null
  return (
    <Section background={block.background}>
      <SectionHeading eyebrow={block.eyebrow} title={block.title} intro={block.intro} align="center" inverted={block.background === 'brand'} />
      <div className="mx-auto aspect-video max-w-4xl overflow-hidden rounded-card bg-ink shadow-lift">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}`}
          title={block.title || 'Video'}
          loading="lazy"
          allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="h-full w-full"
        />
      </div>
    </Section>
  )
}
