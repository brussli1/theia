import { createBreadcrumbsField, createParentField } from '@payloadcms/plugin-nested-docs'
import type { CollectionConfig } from 'payload'

import { anyone, staff } from '@/access'
import { slugField } from '@/fields/slug'

export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: { singular: 'Categoría', plural: 'Categorías' },
  admin: {
    group: 'Catálogo',
    useAsTitle: 'name',
    defaultColumns: ['name', 'parent', 'order', 'showInMenu'],
    listSearchableFields: ['name', 'slug'],
    description:
      'Las categorías ordenan el catálogo y forman el menú "Categorías". Para crear una subcategoría elegí una "Categoría superior".',
  },
  defaultSort: 'order',
  access: { read: anyone, create: staff, update: staff, delete: staff },
  fields: [
    { name: 'name', label: 'Nombre', type: 'text', required: true, localized: true },
    {
      name: 'description',
      label: 'Descripción corta',
      type: 'textarea',
      localized: true,
      admin: { description: 'Aparece arriba de los productos de la categoría.' },
    },
    { name: 'image', label: 'Imagen', type: 'upload', relationTo: 'media' },
    {
      name: 'order',
      label: 'Orden',
      type: 'number',
      defaultValue: 100,
      admin: { position: 'sidebar', description: 'Los números más bajos aparecen primero.' },
    },
    {
      name: 'showInMenu',
      label: 'Mostrar en el menú',
      type: 'checkbox',
      defaultValue: true,
      admin: { position: 'sidebar' },
    },
    createParentField('categories', {
      label: 'Categoría superior',
      admin: {
        position: 'sidebar',
        description: 'Dejala vacía para una categoría principal.',
      },
    }),
    createBreadcrumbsField('categories', {
      label: 'Ruta',
      admin: { hidden: true },
    }),
    slugField(),
  ],
}
