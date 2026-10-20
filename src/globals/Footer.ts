import type { GlobalConfig } from 'payload'

import { anyone, staff } from '@/access'
import { linkField } from '@/fields/link'

export const Footer: GlobalConfig = {
  slug: 'footer',
  label: 'Pie de página',
  admin: { group: 'Configuración' },
  access: { read: anyone, update: staff },
  fields: [
    {
      name: 'about',
      label: 'Texto sobre la empresa',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'columns',
      label: 'Columnas de enlaces',
      type: 'array',
      maxRows: 4,
      labels: { singular: 'Columna', plural: 'Columnas' },
      fields: [
        { name: 'title', label: 'Título', type: 'text', required: true, localized: true },
        {
          name: 'links',
          label: 'Enlaces',
          type: 'array',
          fields: [linkField({ name: 'link', label: 'Enlace', required: true })],
        },
      ],
    },
    {
      name: 'newsletter',
      label: 'Mostrar suscripción al boletín',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'legal',
      label: 'Texto legal (línea inferior)',
      type: 'text',
      localized: true,
      admin: { description: 'Ej.: razón social y RUC.' },
    },
  ],
}
