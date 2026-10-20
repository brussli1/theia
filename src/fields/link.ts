import type { Field, GroupField } from 'payload'

/**
 * A link an editor can point either at an internal page/product/category or
 * at any address (including WhatsApp or e-mail links).
 */
export function linkField({
  name = 'link',
  label = 'Enlace',
  withLabel = true,
  required = false,
}: { name?: string; label?: string; withLabel?: boolean; required?: boolean } = {}): GroupField {
  const fields: Field[] = [
    {
      type: 'row',
      fields: [
        {
          name: 'type',
          label: 'Tipo de enlace',
          type: 'radio',
          defaultValue: 'internal',
          options: [
            { label: 'Página del sitio', value: 'internal' },
            { label: 'Dirección personalizada', value: 'custom' },
          ],
          admin: { layout: 'horizontal', width: '50%' },
        },
        {
          name: 'newTab',
          label: 'Abrir en pestaña nueva',
          type: 'checkbox',
          admin: { width: '50%', style: { alignSelf: 'flex-end' } },
        },
      ],
    },
    {
      name: 'reference',
      label: 'Destino',
      type: 'relationship',
      relationTo: ['pages', 'products', 'categories', 'brands', 'posts'],
      required,
      admin: { condition: (_, sibling) => sibling?.type === 'internal' },
    },
    {
      name: 'url',
      label: 'Dirección',
      type: 'text',
      required,
      admin: {
        condition: (_, sibling) => sibling?.type === 'custom',
        description: 'Ej.: /productos, https://wa.me/595…, mailto:ventas@…',
      },
    },
  ]
  if (withLabel) {
    fields.unshift({
      name: 'label',
      label: 'Texto del enlace',
      type: 'text',
      localized: true,
      required,
    })
  }
  return { name, label, type: 'group', fields }
}
