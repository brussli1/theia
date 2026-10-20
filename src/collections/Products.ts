import type { CollectionConfig } from 'payload'

import { publishedOrStaff, staff } from '@/access'
import { slugField } from '@/fields/slug'
import { CERTIFICATIONS } from '@/lib/constants'
import { previewPath } from '@/lib/preview'

export const Products: CollectionConfig = {
  slug: 'products',
  labels: { singular: 'Producto', plural: 'Productos' },
  admin: {
    group: 'Catálogo',
    useAsTitle: 'name',
    defaultColumns: ['name', 'brand', 'purchaseMode', 'priceUsd', 'availability', '_status'],
    listSearchableFields: ['name', 'sku', 'slug'],
    description:
      'Equipos e insumos del catálogo. "Comprar online" necesita precio; "Solo cotización" muestra el botón para pedir precio.',
    livePreview: { url: ({ data }) => previewPath('products', data?.slug) },
    preview: (data) => previewPath('products', data?.slug as string),
  },
  defaultSort: '-createdAt',
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
          label: 'General',
          fields: [
            { name: 'name', label: 'Nombre', type: 'text', required: true, localized: true },
            {
              type: 'row',
              fields: [
                {
                  name: 'sku',
                  label: 'Modelo / código',
                  type: 'text',
                  admin: { width: '33%' },
                },
                {
                  name: 'brand',
                  label: 'Marca',
                  type: 'relationship',
                  relationTo: 'brands',
                  admin: { width: '33%' },
                },
                {
                  name: 'categories',
                  label: 'Categorías',
                  type: 'relationship',
                  relationTo: 'categories',
                  hasMany: true,
                  admin: { width: '34%' },
                },
              ],
            },
            {
              name: 'images',
              label: 'Fotos',
              type: 'upload',
              relationTo: 'media',
              hasMany: true,
              admin: {
                description:
                  'La primera foto es la principal. Arrastrá para cambiar el orden. Fondo blanco recomendado.',
              },
            },
            {
              name: 'summary',
              label: 'Resumen',
              type: 'textarea',
              localized: true,
              admin: {
                description:
                  'Una o dos frases. Se muestra junto al precio y en los resultados de Google.',
              },
            },
            {
              name: 'description',
              label: 'Descripción completa',
              type: 'richText',
              localized: true,
            },
          ],
        },
        {
          label: 'Precio y venta',
          fields: [
            {
              name: 'purchaseMode',
              label: 'Cómo se vende',
              type: 'radio',
              required: true,
              defaultValue: 'quote',
              options: [
                { label: 'Comprar online (carrito)', value: 'buy' },
                { label: 'Solo cotización', value: 'quote' },
              ],
              admin: { layout: 'horizontal' },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'priceGs',
                  label: 'Precio en guaraníes (Gs.)',
                  type: 'number',
                  min: 0,
                  admin: { width: '50%', description: 'Sin puntos. Ej.: 15000000' },
                  validate: (value: number | null | undefined, { siblingData }: { siblingData: Record<string, unknown> }) =>
                    siblingData?.purchaseMode === 'buy' && !(Number(value) > 0)
                      ? 'Para vender online cargá el precio en guaraníes.'
                      : true,
                },
                {
                  name: 'priceUsd',
                  label: 'Precio en dólares (USD)',
                  type: 'number',
                  min: 0,
                  admin: { width: '50%', step: 0.01, description: 'Ej.: 2150.00' },
                  validate: (value: number | null | undefined, { siblingData }: { siblingData: Record<string, unknown> }) =>
                    siblingData?.purchaseMode === 'buy' && !(Number(value) > 0)
                      ? 'Para vender online cargá el precio en dólares.'
                      : true,
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'availability',
                  label: 'Disponibilidad',
                  type: 'select',
                  required: true,
                  defaultValue: 'available',
                  options: [
                    { label: 'En stock', value: 'available' },
                    { label: 'Por pedido', value: 'on_order' },
                    { label: 'No disponible', value: 'unavailable' },
                  ],
                  admin: { width: '50%' },
                },
                {
                  name: 'leadTime',
                  label: 'Plazo de entrega',
                  type: 'text',
                  localized: true,
                  admin: { width: '50%', description: 'Opcional. Ej.: "Entrega en 30 días"' },
                },
              ],
            },
            {
              name: 'warranty',
              label: 'Garantía',
              type: 'text',
              localized: true,
              admin: { description: 'Ej.: "12 meses de garantía oficial"' },
            },
          ],
        },
        {
          label: 'Ficha técnica',
          fields: [
            {
              name: 'certifications',
              label: 'Certificaciones',
              type: 'select',
              hasMany: true,
              options: [...CERTIFICATIONS],
            },
            {
              name: 'specifications',
              label: 'Especificaciones',
              labels: { singular: 'Especificación', plural: 'Especificaciones' },
              type: 'array',
              admin: {
                description: 'Filas de la tabla técnica. Ej.: "Rango de esfera" — "-25D a +22D".',
                initCollapsed: true,
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'label',
                      label: 'Característica',
                      type: 'text',
                      required: true,
                      localized: true,
                    },
                    { name: 'value', label: 'Valor', type: 'text', required: true, localized: true },
                  ],
                },
              ],
            },
            {
              name: 'downloads',
              label: 'Descargas (folletos, manuales)',
              labels: { singular: 'Archivo', plural: 'Archivos' },
              type: 'array',
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'label', label: 'Nombre', type: 'text', required: true, localized: true },
                    { name: 'file', label: 'Archivo', type: 'upload', relationTo: 'media', required: true },
                  ],
                },
              ],
            },
            {
              name: 'videoUrl',
              label: 'Video (YouTube)',
              type: 'text',
              admin: { description: 'Pegá el enlace del video de YouTube.' },
            },
          ],
        },
        {
          label: 'Relacionados',
          fields: [
            {
              name: 'relatedProducts',
              label: 'Productos relacionados',
              type: 'relationship',
              relationTo: 'products',
              hasMany: true,
              filterOptions: ({ id }) => ({ id: { not_equals: id } }),
              admin: {
                description:
                  'Si lo dejás vacío se muestran automáticamente productos de la misma categoría.',
              },
            },
          ],
        },
      ],
    },
    {
      name: 'featured',
      label: 'Producto destacado',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar', description: 'Aparece en "Destacados" de la página de inicio.' },
    },
    slugField(),
  ],
}
