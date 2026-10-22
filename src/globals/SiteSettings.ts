import type { GlobalConfig } from 'payload'

import { admins, anyone } from '@/access'

const hexColor = (value: string | null | undefined) =>
  !value || /^#[0-9a-fA-F]{6}$/.test(value) ? true : 'Usá un color en formato #RRGGBB, ej.: #0B3B5C'

/** Business identity, contact channels and payment options in one place. */
export const SiteSettings: GlobalConfig = {
  slug: 'settings',
  label: 'Configuración del sitio',
  admin: {
    group: 'Configuración',
    description: 'Datos de la empresa, contacto, colores y formas de pago. Se usan en todo el sitio.',
  },
  access: { read: anyone, update: admins },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Empresa y marca',
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'siteName', label: 'Nombre del sitio', type: 'text', required: true, defaultValue: 'Theia' },
                {
                  name: 'tagline',
                  label: 'Lema',
                  type: 'text',
                  localized: true,
                  defaultValue: 'Equipos oftalmológicos para profesionales',
                },
              ],
            },
            {
              name: 'description',
              label: 'Descripción para Google',
              type: 'textarea',
              localized: true,
              admin: { description: 'Se usa cuando una página no tiene una descripción propia.' },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'logo',
                  label: 'Logo',
                  type: 'upload',
                  relationTo: 'media',
                  admin: { description: 'Opcional. Sin logo se muestra el nombre con la marca de Theia.' },
                },
                {
                  name: 'shareImage',
                  label: 'Imagen para compartir en redes',
                  type: 'upload',
                  relationTo: 'media',
                  admin: { description: '1200 × 630 px recomendado.' },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'primaryColor',
                  label: 'Color principal',
                  type: 'text',
                  defaultValue: '#0B3B5C',
                  validate: hexColor,
                  admin: { description: 'Azul profundo por defecto.' },
                },
                {
                  name: 'accentColor',
                  label: 'Color de acento',
                  type: 'text',
                  defaultValue: '#0E9F9A',
                  validate: hexColor,
                  admin: { description: 'Turquesa por defecto. Se usa en botones y detalles.' },
                },
              ],
            },
          ],
        },
        {
          label: 'Contacto',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'whatsapp',
                  label: 'WhatsApp (solo números, con código de país)',
                  type: 'text',
                  defaultValue: '595971282908',
                  admin: { description: 'Ej.: 595971282908' },
                },
                { name: 'phone', label: 'Teléfono visible', type: 'text', defaultValue: '+595 971 282 908' },
                { name: 'email', label: 'E-mail de contacto', type: 'email', defaultValue: 'ventas@theia.com.py' },
              ],
            },
            { name: 'address', label: 'Dirección', type: 'text', localized: true, defaultValue: 'Asunción, Paraguay' },
            {
              name: 'hours',
              label: 'Horario de atención',
              type: 'text',
              localized: true,
              defaultValue: 'Lunes a viernes de 8:00 a 18:00 · Sábados de 8:00 a 12:00',
            },
            {
              name: 'mapQuery',
              label: 'Ubicación para el mapa',
              type: 'text',
              admin: {
                description: 'Dirección o nombre del lugar tal como lo buscarías en Google Maps.',
              },
            },
            {
              name: 'whatsappMessage',
              label: 'Mensaje inicial de WhatsApp',
              type: 'text',
              localized: true,
              defaultValue: 'Hola Theia, quisiera hacer una consulta.',
            },
            {
              name: 'social',
              label: 'Redes sociales',
              type: 'array',
              labels: { singular: 'Red', plural: 'Redes' },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'network',
                      label: 'Red',
                      type: 'select',
                      required: true,
                      options: [
                        { label: 'Instagram', value: 'instagram' },
                        { label: 'Facebook', value: 'facebook' },
                        { label: 'LinkedIn', value: 'linkedin' },
                        { label: 'YouTube', value: 'youtube' },
                        { label: 'TikTok', value: 'tiktok' },
                        { label: 'X / Twitter', value: 'x' },
                      ],
                    },
                    { name: 'url', label: 'Dirección', type: 'text', required: true },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Ventas y pagos',
          fields: [
            {
              name: 'notificationEmails',
              label: 'E-mails que reciben avisos de pedidos y solicitudes',
              type: 'text',
              admin: { description: 'Separá varios con comas.' },
            },
            {
              name: 'payments',
              label: 'Formas de pago habilitadas',
              type: 'group',
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'transfer', label: 'Transferencia bancaria', type: 'checkbox', defaultValue: true },
                    { name: 'card', label: 'Tarjeta (Bancard)', type: 'checkbox', defaultValue: true },
                    { name: 'paypal', label: 'PayPal', type: 'checkbox', defaultValue: true },
                    { name: 'westernUnion', label: 'Western Union', type: 'checkbox', defaultValue: true },
                  ],
                },
              ],
            },
            {
              name: 'transferInstructions',
              label: 'Datos para transferencia bancaria',
              type: 'textarea',
              localized: true,
              admin: { description: 'Banco, titular, número de cuenta, RUC… Se muestran al cliente al finalizar la compra.' },
            },
            {
              name: 'westernUnionInstructions',
              label: 'Datos para Western Union',
              type: 'textarea',
              localized: true,
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'pickupEnabled',
                  label: 'Permitir retiro en local',
                  type: 'checkbox',
                  defaultValue: true,
                },
                {
                  name: 'shippingNote',
                  label: 'Aviso sobre envíos',
                  type: 'text',
                  localized: true,
                  defaultValue: 'El costo de envío se coordina después de la compra.',
                },
              ],
            },
          ],
        },
        {
          label: 'Analítica',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'gaId',
                  label: 'Google Analytics (ID de medición)',
                  type: 'text',
                  admin: { description: 'Ej.: G-XXXXXXX. Opcional.' },
                },
                {
                  name: 'metaPixelId',
                  label: 'Meta Pixel (ID)',
                  type: 'text',
                  admin: { description: 'Opcional.' },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
