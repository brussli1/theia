import { localePath, type Locale } from '@/i18n/config'
import { getCategoryTree, getHeader, getSettings } from '@/lib/data'
import { resolveHref } from '@/lib/links'
import { getCustomer } from '@/lib/session'
import { HeaderClient, type MenuCategory, type NavLink } from './HeaderClient'
import { Logo } from './Logo'

/** Loads everything the header needs on the server, then hands off to the interactive part. */
export async function SiteHeader({ locale }: { locale: Locale }) {
  const [header, settings, tree, customer] = await Promise.all([
    getHeader(locale),
    getSettings(locale),
    getCategoryTree(locale),
    getCustomer(),
  ])

  const categories: MenuCategory[] = tree
    .filter((c) => c.showInMenu !== false)
    .map((c) => ({
      name: c.name,
      href: localePath(locale, `/categorias/${c.slug}`),
      children: c.children
        .filter((s) => s.showInMenu !== false)
        .slice(0, 12)
        .map((s) => ({ name: s.name, href: localePath(locale, `/categorias/${s.slug}`) })),
    }))

  const nav: NavLink[] = (header.navItems ?? []).flatMap((item) => {
    const href = resolveHref(item.link, locale)
    return href && item.link?.label ? [{ label: item.link.label, href, newTab: Boolean(item.link.newTab) }] : []
  })

  const announcement =
    header.announcement?.enabled && header.announcement.text
      ? { text: header.announcement.text, href: resolveHref(header.announcement.link, locale) }
      : null

  return (
    <HeaderClient
      logo={<Logo logo={settings.logo} name={settings.siteName || 'Theia'} />}
      categories={categories}
      nav={nav}
      announcement={announcement}
      customerName={customer?.name?.split(' ')[0] ?? null}
    />
  )
}
