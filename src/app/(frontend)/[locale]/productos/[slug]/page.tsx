import { BadgeCheck, FileText, Headset, ShieldCheck, Truck, Wrench } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, permanentRedirect } from 'next/navigation'

import { Gallery, type GalleryImage } from '@/components/product/Gallery'
import { Price } from '@/components/product/Price'
import { ProductActions } from '@/components/product/ProductActions'
import { ProductGrid } from '@/components/product/ProductCard'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { RichText } from '@/components/ui/RichText'
import { localePath } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { cn } from '@/lib/cn'
import { CERTIFICATIONS } from '@/lib/constants'
import { getCategoryBySlug, getProduct, getRelatedProducts } from '@/lib/data'
import { isMedia, mediaSrc } from '@/lib/media'
import { resolveLocale, type LocaleParams } from '@/lib/params'
import { findRedirect } from '@/lib/redirects'
import { buildMetadata, jsonLd } from '@/lib/seo'
import { getCurrency, isDraft } from '@/lib/session'
import { youtubeId } from '@/lib/video'
import type { Category } from '@/payload-types'

type Props = { params: LocaleParams<{ slug: string }> }

const SITE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await resolveLocale(params)
  const product = await getProduct(slug, locale)
  if (!product) return {}
  return buildMetadata({
    locale,
    path: `/productos/${slug}`,
    title: product.name,
    description: product.summary,
    image: product.images?.[0],
    meta: product.meta,
  })
}

export default async function ProductPage({ params }: Props) {
  const { locale, slug } = await resolveLocale(params)
  const draft = await isDraft()
  const product = await getProduct(slug, locale, draft)
  if (!product) {
    const target = await findRedirect(`/productos/${slug}`)
    if (target) permanentRedirect(localePath(locale, target))
    notFound()
  }

  const [currency, related] = await Promise.all([getCurrency(), getRelatedProducts(product, locale)])
  const t = getDictionary(locale)
  const brand = typeof product.brand === 'object' && product.brand ? product.brand : null
  const categories = (product.categories ?? []).filter((c): c is Category => typeof c === 'object' && c !== null)
  const primaryCategory = categories[0]
  const trail = primaryCategory ? (await getCategoryBySlug(primaryCategory.slug ?? '', locale))?.trail ?? [] : []
  const availability = product.availability ?? 'available'
  const mode = product.purchaseMode === 'buy' && (product.priceGs ?? 0) > 0 && (product.priceUsd ?? 0) > 0 ? 'buy' : 'quote'
  const path = `/productos/${slug}`

  const images: GalleryImage[] = (product.images ?? []).filter(isMedia).map((m) => ({
    src: mediaSrc(m.sizes?.large?.url || m.url)!,
    thumb: mediaSrc(m.sizes?.thumbnail?.url || m.url)!,
    alt: m.alt || product.name,
  }))
  const video = youtubeId(product.videoUrl)
  const specs = product.specifications ?? []
  const downloads = (product.downloads ?? []).filter((d) => isMedia(d.file))
  const certs = (product.certifications ?? []).map((c) => CERTIFICATIONS.find((x) => x.value === c)?.label ?? c)

  const structured = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    sku: product.sku || undefined,
    description: product.summary || undefined,
    image: images.map((i) => `${SITE_URL}${i.src}`),
    brand: brand ? { '@type': 'Brand', name: brand.name } : undefined,
    category: primaryCategory?.name,
    offers:
      mode === 'buy'
        ? {
            '@type': 'Offer',
            url: `${SITE_URL}${localePath(locale, path)}`,
            priceCurrency: currency,
            price: currency === 'PYG' ? product.priceGs : product.priceUsd,
            availability:
              availability === 'available'
                ? 'https://schema.org/InStock'
                : availability === 'on_order'
                  ? 'https://schema.org/PreOrder'
                  : 'https://schema.org/OutOfStock',
          }
        : undefined,
  }
  const crumbs = [
    { label: t.nav.home, href: localePath(locale, '/') },
    { label: t.nav.products, href: localePath(locale, '/productos') },
    ...trail.map((c) => ({ label: c.name, href: localePath(locale, `/categorias/${c.slug}`) })),
    { label: product.name },
  ]
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.label,
      item: c.href ? `${SITE_URL}${c.href}` : undefined,
    })),
  }

  const trust = [
    { icon: ShieldCheck, text: product.warranty || t.product.trust.warranty },
    { icon: Wrench, text: t.product.trust.service },
    { icon: Truck, text: t.product.trust.shipping },
    { icon: Headset, text: t.product.trust.advice },
  ]

  return (
    <div className="container-page py-8 sm:py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(structured)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(breadcrumbLd)} />
      <Breadcrumbs items={crumbs} />

      <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:gap-14">
        <Gallery images={images} name={product.name} />

        <div>
          {brand && (
            <Link href={localePath(locale, `/marcas/${brand.slug}`)} className="text-sm font-semibold tracking-wide text-accent-700 uppercase hover:underline">
              {brand.name}
            </Link>
          )}
          <h1 className="mt-2 text-3xl leading-tight font-bold sm:text-4xl">{product.name}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
            {product.sku && (
              <span>
                {t.product.sku}: <span className="font-medium text-slate-700">{product.sku}</span>
              </span>
            )}
            <span
              className={cn(
                'inline-flex items-center gap-1.5 font-medium',
                availability === 'available' && 'text-emerald-700',
                availability === 'on_order' && 'text-amber-700',
                availability === 'unavailable' && 'text-slate-500',
              )}
            >
              <span className="h-2 w-2 rounded-full bg-current" aria-hidden="true" />
              {t.product.availability[availability]}
              {product.leadTime ? ` · ${product.leadTime}` : ''}
            </span>
          </div>

          {product.summary && <p className="mt-5 text-lg leading-relaxed text-slate-600">{product.summary}</p>}

          <div className="mt-6 rounded-card border border-slate-200 bg-slate-50/60 p-5 sm:p-6">
            <Price product={{ ...product, purchaseMode: mode }} currency={currency} locale={locale} className="text-3xl" />
            {mode === 'buy' && <p className="mt-1 text-xs text-slate-500">{t.product.taxNote}</p>}
            {availability === 'unavailable' && <p className="mt-2 text-sm text-slate-600">{t.product.unavailableNote}</p>}
            <div className="mt-5">
              <ProductActions
                productId={product.id}
                productName={product.name}
                mode={mode}
                available={availability !== 'unavailable'}
                pageUrl={`${SITE_URL}${localePath(locale, path)}`}
              />
            </div>
          </div>

          {certs.length > 0 && (
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="text-sm text-slate-500">{t.product.certifications}:</span>
              {certs.map((c) => (
                <span key={c} className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200">
                  <BadgeCheck className="h-3.5 w-3.5" /> {c}
                </span>
              ))}
            </div>
          )}

          <ul className="mt-6 grid grid-cols-2 gap-3 text-sm text-slate-600">
            {trust.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-2">
                <Icon className="h-5 w-5 shrink-0 text-accent" aria-hidden="true" /> {text}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-14 grid gap-10 lg:grid-cols-3">
        <div className="space-y-12 lg:col-span-2">
          {product.description && (
            <section>
              <h2 className="text-2xl font-bold">{t.product.description}</h2>
              <RichText data={product.description} className="mt-4" />
            </section>
          )}
          {video && (
            <section>
              <h2 className="text-2xl font-bold">{t.product.video}</h2>
              <div className="mt-4 aspect-video overflow-hidden rounded-card bg-ink">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${video}`}
                  title={product.name}
                  loading="lazy"
                  allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="h-full w-full"
                />
              </div>
            </section>
          )}
        </div>
        <aside className="space-y-8">
          {specs.length > 0 && (
            <section>
              <h2 className="text-xl font-bold">{t.product.specifications}</h2>
              <dl className="mt-4 divide-y divide-slate-200 overflow-hidden rounded-card border border-slate-200 text-sm">
                {specs.map((s) => (
                  <div key={s.id ?? s.label} className="grid grid-cols-5 gap-3 px-4 py-3 odd:bg-slate-50/70">
                    <dt className="col-span-2 font-medium text-slate-600">{s.label}</dt>
                    <dd className="col-span-3 text-ink">{s.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
          {downloads.length > 0 && (
            <section>
              <h2 className="text-xl font-bold">{t.product.downloads}</h2>
              <ul className="mt-4 space-y-2">
                {downloads.map((d) => (
                  <li key={d.id ?? d.label}>
                    <a
                      href={isMedia(d.file) ? mediaSrc(d.file.url)! : '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 text-sm font-medium hover:border-accent hover:text-accent-700"
                    >
                      <FileText className="h-5 w-5 text-accent" aria-hidden="true" /> {d.label}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {categories.length > 0 && (
            <section>
              <h2 className="text-xl font-bold">{t.nav.categories}</h2>
              <ul className="mt-4 flex flex-wrap gap-2">
                {categories.map((c) => (
                  <li key={c.id}>
                    <Link href={localePath(locale, `/categorias/${c.slug}`)} className="inline-block rounded-full border border-slate-200 px-3 py-1.5 text-sm hover:border-accent hover:text-accent-700">
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>

      {related.length > 0 && (
        <section className="mt-16 border-t border-slate-200 pt-12">
          <h2 className="text-2xl font-bold">{t.product.related}</h2>
          <div className="mt-6">
            <ProductGrid products={related} locale={locale} currency={currency} />
          </div>
        </section>
      )}
    </div>
  )
}
