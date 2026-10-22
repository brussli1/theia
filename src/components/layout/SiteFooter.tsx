import { Clock, Mail, MapPin, Phone } from 'lucide-react'
import Link from 'next/link'

import { localePath, type Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { getFooter, getSettings } from '@/lib/data'
import { resolveHref, whatsappHref } from '@/lib/links'
import { Logo } from './Logo'
import { Newsletter } from './Newsletter'
import { SocialIcon } from './SocialIcon'

export async function SiteFooter({ locale }: { locale: Locale }) {
  const [footer, settings] = await Promise.all([getFooter(locale), getSettings(locale)])
  const t = getDictionary(locale)
  const siteName = settings.siteName || 'Theia'
  const wa = whatsappHref(settings.whatsapp, settings.whatsappMessage ?? undefined)

  const methods = settings.payments ?? {}
  const paymentLabels = [
    methods.card && 'Visa · Mastercard · Bancard',
    methods.transfer && t.checkout.methods.transfer,
    methods.paypal && 'PayPal',
    methods.westernUnion && 'Western Union',
  ].filter(Boolean) as string[]

  return (
    <footer className="mt-auto bg-ink text-slate-300">
      {footer.newsletter && (
        <div className="border-b border-white/10">
          <div className="container-page flex flex-col gap-6 py-10 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-display text-xl font-semibold text-white">{t.footer.newsletterTitle}</p>
              <p className="mt-1 text-sm text-slate-400">{t.footer.newsletterText}</p>
            </div>
            <Newsletter />
          </div>
        </div>
      )}
      <div className="container-page grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Logo logo={null} name={siteName} inverted />
          {footer.about && <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">{footer.about}</p>}
          {(settings.social?.length ?? 0) > 0 && (
            <ul className="mt-6 flex gap-2">
              {settings.social!.map((s) => (
                <li key={s.id ?? s.url}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.network}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-slate-300 transition hover:bg-accent hover:text-white"
                  >
                    <SocialIcon network={s.network} />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
        {(footer.columns ?? []).map((col) => (
          <nav key={col.id ?? col.title} aria-label={col.title} className="lg:col-span-2">
            <p className="font-display text-sm font-semibold tracking-wider text-white uppercase">{col.title}</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {(col.links ?? []).map((l) => {
                const href = resolveHref(l.link, locale)
                if (!href || !l.link?.label) return null
                return (
                  <li key={l.id ?? href}>
                    <Link href={href} className="text-slate-400 transition hover:text-white">
                      {l.link.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
        ))}
        <div className="lg:col-span-2 lg:col-start-11">
          <p className="font-display text-sm font-semibold tracking-wider text-white uppercase">{t.footer.contact}</p>
          <ul className="mt-4 space-y-3 text-sm">
            {wa && (
              <li>
                <a href={wa} target="_blank" rel="noopener noreferrer" className="flex gap-2 text-slate-400 hover:text-white">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0" />
                  {settings.phone || settings.whatsapp}
                </a>
              </li>
            )}
            {settings.email && (
              <li>
                <a href={`mailto:${settings.email}`} className="flex gap-2 break-all text-slate-400 hover:text-white">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0" />
                  {settings.email}
                </a>
              </li>
            )}
            {settings.address && (
              <li className="flex gap-2 text-slate-400">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                {settings.address}
              </li>
            )}
            {settings.hours && (
              <li className="flex gap-2 text-slate-400">
                <Clock className="mt-0.5 h-4 w-4 shrink-0" />
                {settings.hours}
              </li>
            )}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-3 py-6 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} {siteName}. {t.footer.rights} {footer.legal}
          </p>
          {paymentLabels.length > 0 && (
            <p>
              {t.footer.payments}: {paymentLabels.join(' · ')}
            </p>
          )}
          <Link href={localePath(locale, '/seguimiento')} className="hover:text-white">
            {t.track.title}
          </Link>
        </div>
      </div>
    </footer>
  )
}
