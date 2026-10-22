import type { DefaultTypedEditorState, SerializedLinkNode } from '@payloadcms/richtext-lexical'
import {
  LinkJSXConverter,
  RichText as LexicalRichText,
  type JSXConvertersFunction,
} from '@payloadcms/richtext-lexical/react'

import { cn } from '@/lib/cn'

const routes: Record<string, string> = {
  pages: '',
  products: '/productos',
  categories: '/categorias',
  brands: '/marcas',
  posts: '/blog',
}

const internalDocToHref = ({ linkNode }: { linkNode: SerializedLinkNode }) => {
  const doc = linkNode.fields.doc
  if (!doc || typeof doc.value !== 'object' || !doc.value) return '/'
  const slug = (doc.value as { slug?: string }).slug ?? ''
  if (doc.relationTo === 'pages' && slug === 'inicio') return '/'
  return `${routes[doc.relationTo] ?? ''}/${slug}`
}

const converters: JSXConvertersFunction = ({ defaultConverters }) => ({
  ...defaultConverters,
  ...LinkJSXConverter({ internalDocToHref }),
})

export function RichText({ data, className }: { data?: DefaultTypedEditorState | null | unknown; className?: string }) {
  if (!data || typeof data !== 'object' || !('root' in data)) return null
  return (
    <LexicalRichText
      data={data as DefaultTypedEditorState}
      converters={converters}
      className={cn('prose-theia', className)}
    />
  )
}
