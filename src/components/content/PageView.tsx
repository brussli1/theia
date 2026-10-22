import { RenderBlocks } from '@/blocks/RenderBlocks'
import type { Locale } from '@/i18n/config'
import type { Currency } from '@/lib/currency'
import type { Page } from '@/payload-types'

/** A CMS page: optional title band, then the editor's sections. */
export function PageView({ page, locale, currency }: { page: Page; locale: Locale; currency: Currency }) {
  const titleShown = page.showTitle !== false
  return (
    <>
      {titleShown && (
        <div className="border-b border-slate-100 bg-gradient-to-b from-brand-50 to-white">
          <div className="container-page py-12 sm:py-16">
            <h1 className="text-4xl font-bold sm:text-5xl">{page.title}</h1>
          </div>
        </div>
      )}
      <RenderBlocks blocks={page.layout} ctx={{ locale, currency, titleShown }} />
    </>
  )
}
