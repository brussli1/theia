import type { CollectionConfig } from 'payload'

import { publishedOrStaff, staff } from '@/access'
import { slugField } from '@/fields/slug'
import { previewPath } from '@/lib/preview'

/**
 * Pre-owned equipment. Listed on /usados but never sold online: each listing
 * leads to a quote request or WhatsApp conversation.
 */
export const UsedEquipment: CollectionConfig = {
  slug: 'used-equipment',
  labels: { singular: 'Equipo usado', plural: 'Equipos usados' },
  admin: {
    group: 'Catálogo',
    useAsTitle: 'name',
    defaultColumns: ['name', 'brand', 'condition', 'saleStatus', '_status'],
    description: 'Equipos usados o reacondicionados. Se consultan por cotización o WhatsApp.',
    livePreview: { url: ({ data }) => previewPath('used-equipment', data?.slug) },
    preview: (data) => previewPath('used-equipment', data?.slug as string),
  },
  defaultSort: '-createdAt',
  access: { read: publishedOrStaff, create: staff, update: staff, delete: staff },
  versions: { drafts: true, maxPerDoc: 10 },
  fields: [
    { name: 'name', label: 'Nombre', type: 'text', required: true, localized: true },
    {
      type: 'row',
      fields: [
        { name: 'brand', label: 'Marca', type: 'relationship', relationTo: 'brands' },
        { name: 'model', label: 'Modelo', type: 'text' },
        { name: 'year', label: 'Año', type: 'number', min: 1980, max: 2100 },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'condition',
          label: 'Estado',
          type: 'select',
          required: true,
          defaultValue: 'good',
          options: [
            { label: 'Reacondicionado', value: 'refurbished' },
            { label: 'Excelente', value: 'excellent' },
            { label: 'Muy bueno', value: 'good' },
            { label: 'Funcional', value: 'fair' },
          ],
        },
        {
          name: 'saleStatus',
          label: 'Situación',
          type: 'select',
          required: true,
          defaultValue: 'available',
          options: [
            { label: 'Disponible', value: 'available' },
            { label: 'Reservado', value: 'reserved' },
            { label: 'Vendido', value: 'sold' },
          ],
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'priceUsd',
          label: 'Precio referencial (USD)',
          type: 'number',
          min: 0,
          admin: { description: 'Opcional. Si queda vacío se muestra "Consultar".' },
        },
        { name: 'priceGs', label: 'Precio referencial (Gs.)', type: 'number', min: 0 },
      ],
    },
    { name: 'images', label: 'Fotos', type: 'upload', relationTo: 'media', hasMany: true },
    { name: 'summary', label: 'Resumen', type: 'textarea', localized: true },
    { name: 'description', label: 'Descripción', type: 'richText', localized: true },
    {
      name: 'includes',
      label: 'Incluye',
      type: 'array',
      labels: { singular: 'Ítem', plural: 'Ítems' },
      fields: [{ name: 'item', label: 'Ítem', type: 'text', required: true, localized: true }],
    },
    slugField(),
  ],
}
