import { LogOut } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { LoginForm, ProfileForm, RegisterForm } from '@/components/account/AccountForms'
import { formatDate } from '@/components/content/PostCard'
import { Button } from '@/components/ui/Button'
import { localePath } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { logout } from '@/lib/actions/account'
import { formatPrice } from '@/lib/currency'
import { first, resolveLocale, type LocaleParams, type SearchParams } from '@/lib/params'
import { getPayloadClient } from '@/lib/payload'
import { buildMetadata } from '@/lib/seo'
import { getCustomer } from '@/lib/session'

type Props = { params: LocaleParams; searchParams: SearchParams }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await resolveLocale(params)
  return buildMetadata({ locale, path: '/cuenta', title: getDictionary(locale).account.title, noIndex: true })
}

export default async function AccountPage({ params, searchParams }: Props) {
  const { locale } = await resolveLocale(params)
  const t = getDictionary(locale)
  const customer = await getCustomer()
  const returnTo = first((await searchParams).volver)

  if (!customer) {
    return (
      <div className="container-page py-12">
        <h1 className="text-3xl font-bold sm:text-4xl">{t.account.title}</h1>
        <p className="mt-2 text-slate-600">{t.account.benefits}</p>
        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <section className="rounded-card border border-slate-200 p-6 sm:p-8">
            <h2 className="mb-6 text-xl font-semibold">{t.account.login}</h2>
            <LoginForm returnTo={returnTo} />
          </section>
          <section className="rounded-card border border-slate-200 bg-slate-50 p-6 sm:p-8">
            <h2 className="mb-6 text-xl font-semibold">{t.account.register}</h2>
            <RegisterForm returnTo={returnTo} />
          </section>
        </div>
      </div>
    )
  }

  const payload = await getPayloadClient()
  const [orders, quotes] = await Promise.all([
    payload.find({ collection: 'orders', depth: 0, limit: 50, sort: '-createdAt', showHiddenFields: true, where: { customer: { equals: customer.id } } }),
    payload.find({ collection: 'quote-requests', depth: 0, limit: 50, sort: '-createdAt', where: { customer: { equals: customer.id } } }),
  ])

  return (
    <div className="container-page py-12" data-testid="account-dashboard">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold sm:text-4xl">{t.account.hello(customer.name.split(' ')[0])}</h1>
          <p className="mt-1 text-slate-600">{customer.email}</p>
        </div>
        <form action={logout.bind(null, locale)}>
          <Button type="submit" variant="outline" size="sm">
            <LogOut className="h-4 w-4" /> {t.account.logout}
          </Button>
        </form>
      </div>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">{t.account.orders}</h2>
        {orders.docs.length ? (
          <div className="mt-4 overflow-x-auto rounded-card border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-medium">{t.account.reference}</th>
                  <th className="px-4 py-3 font-medium">{t.account.date}</th>
                  <th className="px-4 py-3 font-medium">{t.account.status}</th>
                  <th className="px-4 py-3 text-right font-medium">{t.account.total}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.docs.map((o) => (
                  <tr key={o.id}>
                    <td className="px-4 py-3">
                      <Link href={`${localePath(locale, `/pedido/${o.orderNumber}`)}?t=${o.accessToken}`} className="font-semibold text-accent-700 hover:underline">
                        {o.orderNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(o.createdAt, locale)}</td>
                    <td className="px-4 py-3">{t.order.statuses[o.status]}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {o.currency === 'PYG' ? formatPrice(o.subtotalGs, 'PYG', locale) : formatPrice(o.subtotalUsd, 'USD', locale)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-3 text-slate-500">{t.account.noOrders}</p>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">{t.account.quotes}</h2>
        {quotes.docs.length ? (
          <ul className="mt-4 divide-y divide-slate-100 rounded-card border border-slate-200">
            {quotes.docs.map((q) => (
              <li key={q.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                <span>
                  <span className="font-semibold">{q.reference}</span>
                  <span className="ml-2 text-slate-500">{formatDate(q.createdAt, locale)}</span>
                  {q.items?.length ? <span className="ml-2 text-slate-600">· {q.items.map((i) => i.name).join(', ')}</span> : null}
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium">{t.account.quoteStatuses[q.status]}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-slate-500">{t.account.noQuotes}</p>
        )}
      </section>

      <section className="mt-10 max-w-3xl rounded-card border border-slate-200 p-6 sm:p-8">
        <h2 className="mb-6 text-xl font-semibold">{t.account.profile}</h2>
        <ProfileForm customer={customer} />
      </section>
    </div>
  )
}
