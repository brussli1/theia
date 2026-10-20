import type { CollectionConfig } from 'payload'

import { admins, staff, staffOrOwnCustomer } from '@/access'
import { notifyQuoteCreated } from '@/lib/email/notify'
import { QUOTE_KINDS } from '@/lib/constants'

/** Every form on the site lands here: quotes, used, rentals, service, contact. */
export const QuoteRequests: CollectionConfig = {
  slug: 'quote-requests',
  labels: { singular: 'Solicitud', plural: 'Solicitudes y consultas' },
  admin: {
    group: 'Ventas',
    useAsTitle: 'reference',
    defaultColumns: ['reference', 'kind', 'name', 'company', 'status', 'createdAt'],
    listSearchableFields: ['reference', 'email', 'name', 'company'],
    description:
      'Pedidos de cotización y consultas que llegan desde el sitio. Marcá "Respondida" cuando contestes.',
  },
  defaultSort: '-createdAt',
  access: {
    read: staffOrOwnCustomer,
    create: () => false,
    update: staff,
    delete: admins,
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'reference',
          label: 'Referencia',
          type: 'text',
          required: true,
          unique: true,
          index: true,
          admin: { readOnly: true },
        },
        {
          name: 'kind',
          label: 'Tipo',
          type: 'select',
          required: true,
          options: [...QUOTE_KINDS],
          admin: { readOnly: true },
        },
        {
          name: 'status',
          label: 'Estado',
          type: 'select',
          required: true,
          defaultValue: 'new',
          options: [
            { label: 'Nueva', value: 'new' },
            { label: 'Respondida', value: 'responded' },
            { label: 'Ganada (se vendió)', value: 'won' },
            { label: 'Cerrada', value: 'closed' },
          ],
        },
      ],
    },
    {
      name: 'items',
      label: 'Productos consultados',
      type: 'array',
      admin: { readOnly: true },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'product', label: 'Producto', type: 'relationship', relationTo: 'products' },
            { name: 'name', label: 'Nombre', type: 'text', required: true },
            { name: 'quantity', label: 'Cantidad', type: 'number', defaultValue: 1 },
          ],
        },
      ],
    },
    {
      name: 'usedEquipment',
      label: 'Equipo usado consultado',
      type: 'relationship',
      relationTo: 'used-equipment',
      admin: { readOnly: true, condition: (data) => Boolean(data?.usedEquipment) },
    },
    {
      type: 'row',
      fields: [
        { name: 'name', label: 'Nombre', type: 'text', required: true },
        { name: 'email', label: 'E-mail', type: 'email', required: true },
        { name: 'phone', label: 'Teléfono / WhatsApp', type: 'text' },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'company', label: 'Clínica / empresa', type: 'text' },
        { name: 'city', label: 'Ciudad', type: 'text' },
        { name: 'country', label: 'País', type: 'text' },
      ],
    },
    { name: 'message', label: 'Mensaje', type: 'textarea', admin: { readOnly: true } },
    { name: 'customer', label: 'Cuenta del cliente', type: 'relationship', relationTo: 'customers' },
    {
      name: 'internalNotes',
      label: 'Notas internas',
      type: 'textarea',
      admin: { position: 'sidebar' },
      access: { read: ({ req: { user } }) => user?.collection === 'users' },
    },
    {
      name: 'locale',
      label: 'Idioma',
      type: 'select',
      defaultValue: 'es',
      options: [
        { label: 'Español', value: 'es' },
        { label: 'English', value: 'en' },
      ],
      admin: { position: 'sidebar', readOnly: true },
    },
  ],
  hooks: {
    afterChange: [notifyQuoteCreated],
  },
}
