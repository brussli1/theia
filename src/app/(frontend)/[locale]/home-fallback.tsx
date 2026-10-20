import { RenderBlocks } from '@/blocks/RenderBlocks'
import type { LayoutBlock } from '@/blocks/types'
import type { Locale } from '@/i18n/config'
import type { Currency } from '@/lib/currency'

/**
 * Shown only until a page with the address "inicio" exists in the admin
 * (the content seed creates one), so a fresh install never shows a blank home.
 */
export function HomeFallback({ locale, currency }: { locale: Locale; currency: Currency }) {
  const es = locale === 'es'
  const blocks = [
    {
      blockType: 'hero',
      style: 'simple',
      title: es ? 'Equipos oftalmológicos para profesionales' : 'Ophthalmic equipment for professionals',
      intro: es
        ? 'Diagnóstico, refracción, cirugía e insumos de las mejores marcas, con servicio técnico propio.'
        : 'Diagnostics, refraction, surgery and supplies from leading brands, backed by in-house service.',
      buttons: [
        { link: { type: 'custom', url: '/productos', label: es ? 'Ver productos' : 'Browse products' } },
        { link: { type: 'custom', url: '/cotizacion', label: es ? 'Pedir cotización' : 'Request a quote' } },
      ],
    },
    { blockType: 'categoryTiles', title: es ? 'Explorá por categoría' : 'Shop by category' },
    { blockType: 'productShowcase', source: 'featured', limit: 8, title: es ? 'Destacados' : 'Featured', background: 'muted' },
  ] as unknown as LayoutBlock[]
  return <RenderBlocks blocks={blocks} ctx={{ locale, currency, titleShown: false }} />
}
