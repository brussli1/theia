import { NextResponse, type NextRequest } from 'next/server'

import { defaultLocale } from '@/i18n/config'
import { CURRENCY_COOKIE } from '@/lib/currency'
import { defaultCurrency } from '@/lib/geo'

/**
 * Locale routing: Spanish pages are served at the root ("/productos") and
 * internally rewritten to the [locale] segment ("/es/productos"); English
 * pages live under "/en". It also remembers the visitor's currency.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  // "/es/..." is never a public address: send it to the root version.
  if (pathname === `/${defaultLocale}` || pathname.startsWith(`/${defaultLocale}/`)) {
    const url = request.nextUrl.clone()
    url.pathname = pathname.slice(defaultLocale.length + 1) || '/'
    return NextResponse.redirect(url, 308)
  }

  const isEnglish = pathname === '/en' || pathname.startsWith('/en/')
  // Lets pages without params (not-found) know the language.
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-theia-locale', isEnglish ? 'en' : defaultLocale)
  const response = isEnglish
    ? NextResponse.next({ request: { headers: requestHeaders } })
    : NextResponse.rewrite(new URL(`/${defaultLocale}${pathname === '/' ? '' : pathname}${search}`, request.url), {
        request: { headers: requestHeaders },
      })

  if (!request.cookies.get(CURRENCY_COOKIE)) {
    response.cookies.set(CURRENCY_COOKIE, defaultCurrency(request.headers), {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    })
  }
  return response
}

export const config = {
  // Everything except the admin, the API, Next internals, preview routes and files.
  matcher: ['/((?!api|admin|_next|next/|.*\\..*).*)'],
}
