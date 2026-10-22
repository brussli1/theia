import { Fragment } from 'react'

import { ContentBlock, CtaBlock, FaqBlock, FeaturesBlock, MediaTextBlock, StatsBlock, TestimonialsBlock, VideoBlock } from './render/Basic'
import { BrandStripBlock, CategoryTilesBlock, LatestPostsBlock, ProductShowcaseBlock } from './render/Commerce'
import { ContactInfoBlock, FormBlock } from './render/Forms'
import { HeroBlock } from './render/Hero'
import type { BlockContext, LayoutBlock } from './types'

/** Renders the sections an editor arranged on a page, in order. */
export function RenderBlocks({
  blocks,
  ctx,
}: {
  blocks: LayoutBlock[] | null | undefined
  ctx: Omit<BlockContext, 'isFirst'> & { titleShown: boolean }
}) {
  if (!blocks?.length) return null
  return (
    <>
      {blocks.map((block, index) => {
        const c: BlockContext = { locale: ctx.locale, currency: ctx.currency, isFirst: index === 0 && !ctx.titleShown }
        const key = block.id ?? `${block.blockType}-${index}`
        switch (block.blockType) {
          case 'hero':
            return <HeroBlock key={key} block={block} ctx={c} />
          case 'content':
            return <ContentBlock key={key} block={block} />
          case 'mediaText':
            return <MediaTextBlock key={key} block={block} ctx={c} />
          case 'features':
            return <FeaturesBlock key={key} block={block} />
          case 'productShowcase':
            return <ProductShowcaseBlock key={key} block={block} ctx={c} />
          case 'categoryTiles':
            return <CategoryTilesBlock key={key} block={block} ctx={c} />
          case 'brandStrip':
            return <BrandStripBlock key={key} block={block} ctx={c} />
          case 'stats':
            return <StatsBlock key={key} block={block} />
          case 'testimonials':
            return <TestimonialsBlock key={key} block={block} />
          case 'faq':
            return <FaqBlock key={key} block={block} />
          case 'cta':
            return <CtaBlock key={key} block={block} ctx={c} />
          case 'contactInfo':
            return <ContactInfoBlock key={key} block={block} ctx={c} />
          case 'form':
            return <FormBlock key={key} block={block} ctx={c} />
          case 'video':
            return <VideoBlock key={key} block={block} />
          case 'latestPosts':
            return <LatestPostsBlock key={key} block={block} ctx={c} />
          default:
            return <Fragment key={key} />
        }
      })}
    </>
  )
}
