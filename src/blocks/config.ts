import type { Block, Field } from 'payload'

import { linkField } from '@/fields/link'

/**
 * Page-builder blocks. Each one is a section an editor can add, reorder or
 * remove on any page (including the home page). The matching React component
 * lives in src/blocks/render.
 */

export const ICON_OPTIONS = [
  { label: 'Escudo (garantía)', value: 'shield-check' },
  { label: 'Camión (envíos)', value: 'truck' },
  { label: 'Llave (servicio técnico)', value: 'wrench' },
  { label: 'Medalla (calidad)', value: 'award' },
  { label: 'Auricular (soporte)', value: 'headset' },
  { label: 'Birrete (capacitación)', value: 'graduation-cap' },
  { label: 'Tarjeta (pagos)', value: 'credit-card' },
  { label: 'Ojo', value: 'eye' },
  { label: 'Microscopio', value: 'microscope' },
  { label: 'Estetoscopio', value: 'stethoscope' },
  { label: 'Reloj', value: 'clock' },
  { label: 'Globo (internacional)', value: 'globe' },
  { label: 'Caja', value: 'package' },
  { label: 'Sello de verificación', value: 'badge-check' },
  { label: 'Apretón de manos', value: 'handshake' },
] as const

const heading = (defaults?: { title?: string }): Field[] => [
  {
    name: 'eyebrow',
    label: 'Antetítulo',
    type: 'text',
    localized: true,
    admin: { description: 'Texto pequeño sobre el título (opcional).' },
  },
  {
    name: 'title',
    label: 'Título',
    type: 'text',
    localized: true,
    defaultValue: defaults?.title,
  },
  { name: 'intro', label: 'Texto introductorio', type: 'textarea', localized: true },
]

const background: Field = {
  name: 'background',
  label: 'Fondo de la sección',
  type: 'select',
  defaultValue: 'white',
  options: [
    { label: 'Blanco', value: 'white' },
    { label: 'Gris claro', value: 'muted' },
    { label: 'Color de marca', value: 'brand' },
  ],
}

export const HeroBlock: Block = {
  slug: 'hero',
  labels: { singular: 'Portada (hero)', plural: 'Portadas' },
  imageAltText: 'Gran título con imagen y botones',
  fields: [
    {
      name: 'style',
      label: 'Estilo',
      type: 'select',
      defaultValue: 'split',
      options: [
        { label: 'Texto e imagen lado a lado', value: 'split' },
        { label: 'Imagen de fondo a todo el ancho', value: 'background' },
        { label: 'Solo texto (simple)', value: 'simple' },
      ],
    },
    ...heading(),
    { name: 'image', label: 'Imagen', type: 'upload', relationTo: 'media' },
    {
      name: 'buttons',
      label: 'Botones',
      type: 'array',
      maxRows: 2,
      labels: { singular: 'Botón', plural: 'Botones' },
      fields: [linkField({ name: 'link', label: 'Botón' })],
    },
    {
      name: 'highlights',
      label: 'Puntos destacados',
      type: 'array',
      maxRows: 4,
      labels: { singular: 'Punto', plural: 'Puntos' },
      admin: { description: 'Frases cortas con tilde debajo de los botones (opcional).' },
      fields: [{ name: 'text', label: 'Texto', type: 'text', required: true, localized: true }],
    },
  ],
}

export const ContentBlock: Block = {
  slug: 'content',
  labels: { singular: 'Texto', plural: 'Textos' },
  fields: [
    { name: 'body', label: 'Contenido', type: 'richText', localized: true, required: true },
    {
      name: 'width',
      label: 'Ancho',
      type: 'select',
      defaultValue: 'narrow',
      options: [
        { label: 'Angosto (lectura)', value: 'narrow' },
        { label: 'Ancho completo', value: 'wide' },
      ],
    },
    background,
  ],
}

export const MediaTextBlock: Block = {
  slug: 'mediaText',
  labels: { singular: 'Imagen + texto', plural: 'Imagen + texto' },
  fields: [
    ...heading(),
    { name: 'body', label: 'Texto', type: 'richText', localized: true },
    { name: 'image', label: 'Imagen', type: 'upload', relationTo: 'media', required: true },
    {
      name: 'imagePosition',
      label: 'Posición de la imagen',
      type: 'radio',
      defaultValue: 'right',
      options: [
        { label: 'Izquierda', value: 'left' },
        { label: 'Derecha', value: 'right' },
      ],
    },
    {
      name: 'buttons',
      label: 'Botones',
      type: 'array',
      maxRows: 2,
      fields: [linkField({ name: 'link', label: 'Botón' })],
    },
    background,
  ],
}

export const FeaturesBlock: Block = {
  slug: 'features',
  labels: { singular: 'Beneficios / servicios', plural: 'Beneficios / servicios' },
  fields: [
    ...heading(),
    {
      name: 'items',
      label: 'Ítems',
      type: 'array',
      minRows: 1,
      labels: { singular: 'Ítem', plural: 'Ítems' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'icon', label: 'Ícono', type: 'select', options: [...ICON_OPTIONS] },
            { name: 'title', label: 'Título', type: 'text', required: true, localized: true },
          ],
        },
        { name: 'text', label: 'Texto', type: 'textarea', localized: true },
      ],
    },
    background,
  ],
}

export const ProductShowcaseBlock: Block = {
  slug: 'productShowcase',
  labels: { singular: 'Productos', plural: 'Productos' },
  fields: [
    ...heading(),
    {
      name: 'source',
      label: '¿Qué productos mostrar?',
      type: 'select',
      defaultValue: 'featured',
      options: [
        { label: 'Productos destacados', value: 'featured' },
        { label: 'Los más nuevos', value: 'newest' },
        { label: 'De una categoría', value: 'category' },
        { label: 'De una marca', value: 'brand' },
        { label: 'Elegidos a mano', value: 'manual' },
      ],
    },
    {
      name: 'category',
      label: 'Categoría',
      type: 'relationship',
      relationTo: 'categories',
      admin: { condition: (_, s) => s?.source === 'category' },
    },
    {
      name: 'brand',
      label: 'Marca',
      type: 'relationship',
      relationTo: 'brands',
      admin: { condition: (_, s) => s?.source === 'brand' },
    },
    {
      name: 'products',
      label: 'Productos',
      type: 'relationship',
      relationTo: 'products',
      hasMany: true,
      admin: { condition: (_, s) => s?.source === 'manual' },
    },
    { name: 'limit', label: 'Cantidad máxima', type: 'number', defaultValue: 8, min: 1, max: 24 },
    linkField({ name: 'viewAll', label: 'Botón "Ver todos" (opcional)' }),
    background,
  ],
}

export const CategoryTilesBlock: Block = {
  slug: 'categoryTiles',
  labels: { singular: 'Categorías', plural: 'Categorías' },
  fields: [
    ...heading(),
    {
      name: 'categories',
      label: 'Categorías',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      admin: { description: 'Vacío = se muestran las categorías principales automáticamente.' },
    },
    background,
  ],
}

export const BrandStripBlock: Block = {
  slug: 'brandStrip',
  labels: { singular: 'Franja de marcas', plural: 'Franjas de marcas' },
  fields: [
    ...heading(),
    {
      name: 'brands',
      label: 'Marcas',
      type: 'relationship',
      relationTo: 'brands',
      hasMany: true,
      admin: { description: 'Vacío = se muestran las marcas marcadas como destacadas.' },
    },
    background,
  ],
}

export const StatsBlock: Block = {
  slug: 'stats',
  labels: { singular: 'Cifras', plural: 'Cifras' },
  fields: [
    ...heading(),
    {
      name: 'items',
      label: 'Cifras',
      type: 'array',
      maxRows: 4,
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'value', label: 'Número', type: 'text', required: true, admin: { description: 'Ej.: 15+' } },
            { name: 'label', label: 'Descripción', type: 'text', required: true, localized: true },
          ],
        },
      ],
    },
    background,
  ],
}

export const TestimonialsBlock: Block = {
  slug: 'testimonials',
  labels: { singular: 'Testimonios', plural: 'Testimonios' },
  fields: [
    ...heading(),
    {
      name: 'items',
      label: 'Testimonios',
      type: 'array',
      fields: [
        { name: 'quote', label: 'Testimonio', type: 'textarea', required: true, localized: true },
        {
          type: 'row',
          fields: [
            { name: 'author', label: 'Nombre', type: 'text', required: true },
            { name: 'role', label: 'Cargo / clínica', type: 'text', localized: true },
          ],
        },
        { name: 'photo', label: 'Foto', type: 'upload', relationTo: 'media' },
      ],
    },
    background,
  ],
}

export const FaqBlock: Block = {
  slug: 'faq',
  labels: { singular: 'Preguntas frecuentes', plural: 'Preguntas frecuentes' },
  fields: [
    ...heading(),
    {
      name: 'items',
      label: 'Preguntas',
      type: 'array',
      labels: { singular: 'Pregunta', plural: 'Preguntas' },
      fields: [
        { name: 'question', label: 'Pregunta', type: 'text', required: true, localized: true },
        { name: 'answer', label: 'Respuesta', type: 'textarea', required: true, localized: true },
      ],
    },
    background,
  ],
}

export const CtaBlock: Block = {
  slug: 'cta',
  labels: { singular: 'Llamado a la acción', plural: 'Llamados a la acción' },
  fields: [
    ...heading(),
    {
      name: 'buttons',
      label: 'Botones',
      type: 'array',
      maxRows: 2,
      fields: [linkField({ name: 'link', label: 'Botón' })],
    },
    {
      name: 'showWhatsapp',
      label: 'Agregar botón de WhatsApp',
      type: 'checkbox',
      defaultValue: true,
    },
  ],
}

export const ContactInfoBlock: Block = {
  slug: 'contactInfo',
  labels: { singular: 'Datos de contacto', plural: 'Datos de contacto' },
  fields: [
    ...heading(),
    {
      name: 'showMap',
      label: 'Mostrar mapa',
      type: 'checkbox',
      defaultValue: true,
      admin: { description: 'Usa la dirección cargada en "Configuración del sitio".' },
    },
    {
      name: 'form',
      label: 'Formulario al lado',
      type: 'select',
      defaultValue: 'contact',
      options: [
        { label: 'Ninguno', value: 'none' },
        { label: 'Contacto', value: 'contact' },
      ],
    },
  ],
}

export const FormBlock: Block = {
  slug: 'form',
  labels: { singular: 'Formulario', plural: 'Formularios' },
  fields: [
    ...heading(),
    {
      name: 'kind',
      label: 'Tipo de formulario',
      type: 'select',
      required: true,
      defaultValue: 'contact',
      options: [
        { label: 'Contacto general', value: 'contact' },
        { label: 'Servicio técnico', value: 'service' },
        { label: 'Alquiler de equipos', value: 'rental' },
        { label: 'Equipos usados (comprar o vender)', value: 'used' },
        { label: 'Cotización general', value: 'quote' },
      ],
      admin: {
        description: 'Las respuestas llegan a "Solicitudes" y por e-mail al equipo de ventas.',
      },
    },
    background,
  ],
}

export const VideoBlock: Block = {
  slug: 'video',
  labels: { singular: 'Video', plural: 'Videos' },
  fields: [
    ...heading(),
    { name: 'url', label: 'Enlace de YouTube', type: 'text', required: true },
    background,
  ],
}

export const LatestPostsBlock: Block = {
  slug: 'latestPosts',
  labels: { singular: 'Últimas notas del blog', plural: 'Últimas notas del blog' },
  fields: [
    ...heading(),
    { name: 'limit', label: 'Cantidad', type: 'number', defaultValue: 3, min: 1, max: 9 },
    background,
  ],
}

export const pageBlocks: Block[] = [
  HeroBlock,
  ContentBlock,
  MediaTextBlock,
  FeaturesBlock,
  ProductShowcaseBlock,
  CategoryTilesBlock,
  BrandStripBlock,
  StatsBlock,
  TestimonialsBlock,
  FaqBlock,
  CtaBlock,
  ContactInfoBlock,
  FormBlock,
  VideoBlock,
  LatestPostsBlock,
]
