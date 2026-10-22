import { Clock, Mail, MapPin, Phone } from 'lucide-react'

import { RequestForm } from '@/components/forms/RequestForm'
import { WhatsAppIcon } from '@/components/layout/WhatsAppButton'
import { Section, SectionHeading } from '@/components/ui/Section'
import { getDictionary } from '@/i18n/dictionaries'
import { getSettings } from '@/lib/data'
import { whatsappHref } from '@/lib/links'
import { getCustomer } from '@/lib/session'
import type { BlockContext, BlockOf } from '../types'

export async function FormBlock({ block, ctx }: { block: BlockOf<'form'>; ctx: BlockContext }) {
  const t = getDictionary(ctx.locale)
  const customer = await getCustomer()
  const kind = (block.kind ?? 'contact') as 'contact' | 'service' | 'rental' | 'used' | 'quote'
  return (
    <Section background={block.background}>
      <div className="mx-auto max-w-3xl">
        <SectionHeading eyebrow={block.eyebrow} title={block.title || t.forms.titles[kind]} intro={block.intro} inverted={block.background === 'brand'} />
        <div className="rounded-card border border-slate-200 bg-white p-6 text-ink shadow-card sm:p-8">
          <RequestForm
            kind={kind}
            prefill={customer ? { name: customer.name, email: customer.email, phone: customer.phone ?? undefined, company: customer.company ?? undefined } : undefined}
          />
        </div>
      </div>
    </Section>
  )
}

export async function ContactInfoBlock({ block, ctx }: { block: BlockOf<'contactInfo'>; ctx: BlockContext }) {
  const settings = await getSettings(ctx.locale)
  const t = getDictionary(ctx.locale)
  const wa = whatsappHref(settings.whatsapp, settings.whatsappMessage ?? undefined)
  const mapQuery = settings.mapQuery || settings.address
  const items = [
    wa && { icon: <WhatsAppIcon className="h-5 w-5" />, label: t.common.whatsapp, value: settings.phone || settings.whatsapp, href: wa },
    settings.phone && { icon: <Phone className="h-5 w-5" />, label: t.common.phone, value: settings.phone, href: `tel:${settings.phone.replace(/\s/g, '')}` },
    settings.email && { icon: <Mail className="h-5 w-5" />, label: t.common.email, value: settings.email, href: `mailto:${settings.email}` },
    settings.address && { icon: <MapPin className="h-5 w-5" />, label: ctx.locale === 'es' ? 'Dirección' : 'Address', value: settings.address },
    settings.hours && { icon: <Clock className="h-5 w-5" />, label: ctx.locale === 'es' ? 'Horario' : 'Opening hours', value: settings.hours },
  ].filter(Boolean) as { icon: React.ReactNode; label: string; value: string; href?: string }[]

  return (
    <Section>
      <SectionHeading eyebrow={block.eyebrow} title={block.title} intro={block.intro} />
      <div className="grid gap-8 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-2">
          <ul className="space-y-4">
            {items.map((item) => (
              <li key={item.label} className="flex gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-50 text-accent-700">{item.icon}</span>
                <span>
                  <span className="block text-sm text-slate-500">{item.label}</span>
                  {item.href ? (
                    <a href={item.href} target={item.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="font-semibold text-ink hover:text-brand">
                      {item.value}
                    </a>
                  ) : (
                    <span className="font-semibold text-ink">{item.value}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
          {block.showMap && mapQuery && (
            <div className="aspect-[4/3] overflow-hidden rounded-card border border-slate-200">
              <iframe
                title={ctx.locale === 'es' ? 'Mapa de ubicación' : 'Location map'}
                src={`https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-full w-full border-0"
              />
            </div>
          )}
        </div>
        {block.form !== 'none' && (
          <div className="rounded-card border border-slate-200 bg-white p-6 shadow-card sm:p-8 lg:col-span-3">
            <h3 className="mb-6 text-xl font-semibold">{t.forms.titles.contact}</h3>
            <RequestForm kind="contact" />
          </div>
        )}
      </div>
    </Section>
  )
}
