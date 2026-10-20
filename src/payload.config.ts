import { postgresAdapter } from '@payloadcms/db-postgres'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { nestedDocsPlugin } from '@payloadcms/plugin-nested-docs'
import { redirectsPlugin } from '@payloadcms/plugin-redirects'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { en } from '@payloadcms/translations/languages/en'
import { es } from '@payloadcms/translations/languages/es'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Brands } from './collections/Brands'
import { Categories } from './collections/Categories'
import { Customers } from './collections/Customers'
import { Media } from './collections/Media'
import { Orders } from './collections/Orders'
import { Pages } from './collections/Pages'
import { Posts } from './collections/Posts'
import { Products } from './collections/Products'
import { QuoteRequests } from './collections/QuoteRequests'
import { Subscribers } from './collections/Subscribers'
import { UsedEquipment } from './collections/UsedEquipment'
import { Users } from './collections/Users'
import { Footer } from './globals/Footer'
import { Header } from './globals/Header'
import { SiteSettings } from './globals/SiteSettings'
import { bootstrapAdmin } from './lib/bootstrap'
import { migrations } from './migrations'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const serverURL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

const email = process.env.SMTP_HOST
  ? nodemailerAdapter({
      defaultFromAddress: process.env.EMAIL_FROM_ADDRESS || 'ventas@theia.com.py',
      defaultFromName: process.env.EMAIL_FROM_NAME || 'Theia',
      transportOptions: {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: process.env.SMTP_USER
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
          : undefined,
      },
    })
  : // Without SMTP, e-mails are written to the server log (development).
    nodemailerAdapter({
      defaultFromAddress: process.env.EMAIL_FROM_ADDRESS || 'ventas@theia.test',
      defaultFromName: process.env.EMAIL_FROM_NAME || 'Theia',
      transportOptions: { jsonTransport: true },
      skipVerify: true,
    })

export default buildConfig({
  serverURL,
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: ' · Panel Theia',
      icons: [{ rel: 'icon', type: 'image/svg+xml', url: '/favicon.svg' }],
    },
    components: {
      graphics: {
        Logo: '@/admin/Graphics#Logo',
        Icon: '@/admin/Graphics#Icon',
      },
      beforeDashboard: ['@/admin/Dashboard#Dashboard'],
      beforeLogin: ['@/admin/BeforeLogin#BeforeLogin'],
    },
    importMap: { baseDir: path.resolve(dirname) },
    livePreview: {
      breakpoints: [
        { label: 'Celular', name: 'mobile', width: 390, height: 844 },
        { label: 'Tablet', name: 'tablet', width: 820, height: 1180 },
        { label: 'Computadora', name: 'desktop', width: 1440, height: 900 },
      ],
    },
  },
  i18n: {
    supportedLanguages: { es, en },
    fallbackLanguage: 'es',
  },
  localization: {
    locales: [
      { label: 'Español', code: 'es' },
      { label: 'English', code: 'en' },
    ],
    defaultLocale: 'es',
    fallback: true,
  },
  collections: [
    Products,
    Categories,
    Brands,
    UsedEquipment,
    Orders,
    QuoteRequests,
    Customers,
    Subscribers,
    Pages,
    Posts,
    Media,
    Users,
  ],
  globals: [SiteSettings, Header, Footer],
  editor: lexicalEditor(),
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URL || '' },
    prodMigrations: migrations,
  }),
  email,
  secret: process.env.PAYLOAD_SECRET || '',
  sharp,
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  graphQL: { disable: true },
  plugins: [
    nestedDocsPlugin({
      collections: ['categories'],
      generateLabel: (_, doc) => String(doc.name ?? ''),
      generateURL: (docs) => docs.reduce((url, doc) => `${url}/${doc.slug}`, ''),
    }),
    seoPlugin({
      collections: ['pages', 'products', 'posts'],
      uploadsCollection: 'media',
      tabbedUI: true,
      generateTitle: ({ doc }) => (doc?.title || doc?.name ? `${doc.title || doc.name} | Theia` : 'Theia'),
      generateDescription: ({ doc }) => doc?.summary || doc?.excerpt || '',
    }),
    redirectsPlugin({
      collections: ['pages', 'products', 'categories', 'posts'],
      overrides: {
        labels: { singular: 'Redirección', plural: 'Redirecciones' },
        admin: {
          group: 'Configuración',
          description:
            'Envía una dirección vieja a una nueva (por ejemplo, si cambiaste la dirección de un producto).',
        },
      },
    }),
  ],
  onInit: async (payload) => {
    await bootstrapAdmin(payload)
  },
})
