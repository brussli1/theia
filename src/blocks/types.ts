import type { Locale } from '@/i18n/config'
import type { Currency } from '@/lib/currency'
import type { Page } from '@/payload-types'

export type LayoutBlock = NonNullable<Page['layout']>[number]
export type BlockOf<T extends LayoutBlock['blockType']> = Extract<LayoutBlock, { blockType: T }>

export type BlockContext = {
  locale: Locale
  currency: Currency
  /** True for the first section when the page shows no separate title. */
  isFirst: boolean
}
