/**
 * Admin "Preview" / Live Preview links. They go through /next/preview, which
 * checks the editor's session and turns on Next.js draft mode before showing
 * the unpublished version of the page.
 */
const prefixes = {
  pages: '',
  products: '/productos',
  posts: '/blog',
  'used-equipment': '/usados',
} as const

export type PreviewCollection = keyof typeof prefixes

export function previewPath(collection: PreviewCollection, slug?: string | null): string | null {
  if (!slug) return null
  const path =
    collection === 'pages' && slug === 'inicio' ? '/' : `${prefixes[collection]}/${slug}`
  const params = new URLSearchParams({
    path,
    previewSecret: process.env.PREVIEW_SECRET || '',
  })
  return `/next/preview?${params.toString()}`
}
