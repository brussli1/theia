import type { TextField } from 'payload'

import { slugify } from '@/lib/slugify'

/**
 * URL slug, filled automatically from another field (usually the name) the
 * first time a document is saved. Editors rarely need to touch it; changing it
 * changes the page address.
 */
export function slugField(sourceField = 'name'): TextField {
  return {
    name: 'slug',
    label: 'Dirección (URL)',
    type: 'text',
    index: true,
    unique: true,
    required: true,
    admin: {
      position: 'sidebar',
      description:
        'Se completa sola a partir del nombre. Cambiarla cambia la dirección de la página.',
    },
    hooks: {
      beforeValidate: [
        ({ value, data, originalDoc }) => {
          if (typeof value === 'string' && value.trim()) return slugify(value)
          const source = data?.[sourceField] ?? originalDoc?.[sourceField]
          if (typeof source === 'string' && source.trim()) return slugify(source)
          return value
        },
      ],
    },
  }
}
