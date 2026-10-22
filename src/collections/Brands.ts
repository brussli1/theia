import type { CollectionConfig } from 'payload'

import { anyone, staff } from '@/access'
import { slugField } from '@/fields/slug'

export const Brands: CollectionConfig = {
  slug: 'brands',
  labels: { singular: 'Marca', plural: 'Marcas' },
  admin: {
    group: 'Catálogo',
    useAsTitle: 'name',
    defaultColumns: ['name', 'country', 'featured'],
    description: 'Fabricantes de los equipos. Las marcas con logo se muestran en la página de inicio.',
  },
  defaultSort: 'name',
  access: { read: anyone, create: staff, update: staff, delete: staff },
  fields: [
    { name: 'name', label: 'Nombre', type: 'text', required: true },
    { name: 'logo', label: 'Logo', type: 'upload', relationTo: 'media' },
    { name: 'description', label: 'Descripción', type: 'textarea', localized: true },
    {
      type: 'row',
      fields: [
        { name: 'country', label: 'País de origen', type: 'text', localized: true },
        { name: 'website', label: 'Sitio web', type: 'text' },
      ],
    },
    {
      name: 'featured',
      label: 'Marca destacada',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar', description: 'Se muestra en la franja de marcas.' },
    },
    slugField(),
  ],
}
