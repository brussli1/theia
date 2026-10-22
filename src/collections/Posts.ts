import type { CollectionConfig } from 'payload'

import { publishedOrStaff, staff } from '@/access'
import { slugField } from '@/fields/slug'
import { previewPath } from '@/lib/preview'

export const Posts: CollectionConfig = {
  slug: 'posts',
  labels: { singular: 'Nota del blog', plural: 'Blog y guías' },
  admin: {
    group: 'Contenido',
    useAsTitle: 'title',
    defaultColumns: ['title', 'publishedAt', '_status'],
    description: 'Guías de compra, novedades y artículos. Ayudan a que Google encuentre el sitio.',
    livePreview: { url: ({ data }) => previewPath('posts', data?.slug) },
    preview: (data) => previewPath('posts', data?.slug as string),
  },
  defaultSort: '-publishedAt',
  access: { read: publishedOrStaff, create: staff, update: staff, delete: staff },
  versions: {
    drafts: { autosave: { interval: 800 }, schedulePublish: true },
    maxPerDoc: 20,
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Contenido',
          fields: [
            { name: 'title', label: 'Título', type: 'text', required: true, localized: true },
            { name: 'excerpt', label: 'Resumen', type: 'textarea', localized: true },
            { name: 'cover', label: 'Imagen de portada', type: 'upload', relationTo: 'media' },
            { name: 'body', label: 'Contenido', type: 'richText', localized: true, required: true },
          ],
        },
        {
          label: 'Relacionados',
          fields: [
            {
              name: 'topic',
              label: 'Tema',
              type: 'select',
              defaultValue: 'guide',
              options: [
                { label: 'Guía de compra', value: 'guide' },
                { label: 'Novedades', value: 'news' },
                { label: 'Técnica y mantenimiento', value: 'technical' },
                { label: 'Eventos', value: 'events' },
              ],
            },
            {
              name: 'relatedProducts',
              label: 'Productos mencionados',
              type: 'relationship',
              relationTo: 'products',
              hasMany: true,
            },
          ],
        },
      ],
    },
    {
      name: 'publishedAt',
      label: 'Fecha de publicación',
      type: 'date',
      admin: { position: 'sidebar', date: { pickerAppearance: 'dayOnly' } },
      hooks: {
        beforeChange: [
          ({ value, siblingData }) =>
            value ?? (siblingData?._status === 'published' ? new Date().toISOString() : value),
        ],
      },
    },
    slugField('title'),
  ],
}
