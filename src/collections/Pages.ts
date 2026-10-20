import type { CollectionConfig } from 'payload'

import { publishedOrStaff, staff } from '@/access'
import { pageBlocks } from '@/blocks/config'
import { slugField } from '@/fields/slug'
import { previewPath } from '@/lib/preview'

/**
 * Free-form pages built from blocks: the home page (slug "inicio"), "Nosotros",
 * "Contacto", legal pages, etc. A page with slug "contacto" lives at /contacto.
 */
export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: { singular: 'Página', plural: 'Páginas' },
  admin: {
    group: 'Contenido',
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', '_status', 'updatedAt'],
    description:
      'Páginas del sitio armadas con secciones. La página con dirección "inicio" es la portada.',
    livePreview: { url: ({ data }) => previewPath('pages', data?.slug) },
    preview: (data) => previewPath('pages', data?.slug as string),
  },
  access: { read: publishedOrStaff, create: staff, update: staff, delete: staff },
  versions: {
    drafts: { autosave: { interval: 800 }, schedulePublish: true },
    maxPerDoc: 30,
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Contenido',
          fields: [
            { name: 'title', label: 'Título', type: 'text', required: true, localized: true },
            {
              name: 'layout',
              label: 'Secciones',
              labels: { singular: 'Sección', plural: 'Secciones' },
              type: 'blocks',
              blocks: pageBlocks,
              admin: {
                initCollapsed: true,
                description:
                  'Agregá, ordená (arrastrando) o quitá secciones. Usá "Vista previa en vivo" para ver los cambios.',
              },
            },
          ],
        },
      ],
    },
    {
      name: 'showTitle',
      label: 'Mostrar el título arriba de la página',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
        description: 'Desactivalo si la primera sección ya es una portada con título.',
      },
    },
    slugField('title'),
  ],
}
