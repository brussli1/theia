import type { CollectionConfig } from 'payload'

import { staff } from '@/access'

export const Subscribers: CollectionConfig = {
  slug: 'subscribers',
  labels: { singular: 'Suscriptor', plural: 'Suscriptores' },
  admin: {
    group: 'Ventas',
    useAsTitle: 'email',
    defaultColumns: ['email', 'locale', 'createdAt'],
    description: 'Personas que se anotaron al boletín desde el pie de página.',
  },
  access: { read: staff, create: staff, update: staff, delete: staff },
  fields: [
    { name: 'email', label: 'E-mail', type: 'email', required: true, unique: true },
    {
      name: 'locale',
      label: 'Idioma',
      type: 'select',
      defaultValue: 'es',
      options: [
        { label: 'Español', value: 'es' },
        { label: 'English', value: 'en' },
      ],
    },
  ],
}
