import type { GlobalConfig } from 'payload'

import { anyone, staff } from '@/access'
import { linkField } from '@/fields/link'

export const Header: GlobalConfig = {
  slug: 'header',
  label: 'Encabezado y menú',
  admin: {
    group: 'Configuración',
    description:
      'Barra de anuncios y enlaces del menú principal. El menú "Productos" con las categorías se arma solo.',
  },
  access: { read: anyone, update: staff },
  fields: [
    {
      name: 'announcement',
      label: 'Barra de anuncio',
      type: 'group',
      fields: [
        { name: 'enabled', label: 'Mostrar', type: 'checkbox', defaultValue: true },
        {
          name: 'text',
          label: 'Texto',
          type: 'text',
          localized: true,
          defaultValue: 'Envíos a todo Paraguay y al exterior · Servicio técnico propio',
        },
        linkField({ name: 'link', label: 'Enlace (opcional)', withLabel: false }),
      ],
    },
    {
      name: 'navItems',
      label: 'Enlaces del menú',
      type: 'array',
      maxRows: 7,
      labels: { singular: 'Enlace', plural: 'Enlaces' },
      admin: { description: 'Aparecen después de "Productos".' },
      fields: [linkField({ name: 'link', label: 'Enlace', required: true })],
    },
  ],
}
