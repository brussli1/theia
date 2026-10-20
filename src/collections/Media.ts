import type { CollectionConfig } from 'payload'
import path from 'path'
import { fileURLToPath } from 'url'

import { anyone, staff } from '@/access'

const dirname = path.dirname(fileURLToPath(import.meta.url))

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Imagen o archivo', plural: 'Imágenes y archivos' },
  folders: true,
  admin: {
    group: 'Contenido',
    description:
      'Biblioteca de imágenes y documentos (PDF). Subí fotos claras, idealmente de al menos 1200 px de ancho.',
  },
  access: {
    read: anyone,
    create: staff,
    update: staff,
    delete: staff,
  },
  fields: [
    {
      name: 'alt',
      label: 'Descripción de la imagen',
      type: 'text',
      localized: true,
      admin: {
        description:
          'Qué se ve en la imagen. Ayuda a Google y a personas con lectores de pantalla.',
      },
    },
  ],
  upload: {
    staticDir: process.env.MEDIA_DIR || path.resolve(dirname, '../../media'),
    adminThumbnail: 'thumbnail',
    focalPoint: true,
    mimeTypes: ['image/*', 'application/pdf', 'video/mp4'],
    imageSizes: [
      { name: 'thumbnail', width: 320 },
      { name: 'card', width: 720 },
      { name: 'large', width: 1600 },
    ],
  },
}
