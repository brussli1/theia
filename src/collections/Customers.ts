import type { CollectionConfig } from 'payload'

import { admins, staffOrSelfCustomer } from '@/access'
import { passwordResetEmail } from '@/lib/email/templates'

/** Storefront accounts. Optional: guests can buy and ask for quotes too. */
export const Customers: CollectionConfig = {
  slug: 'customers',
  labels: { singular: 'Cliente', plural: 'Clientes' },
  auth: {
    tokenExpiration: 60 * 60 * 24 * 30,
    maxLoginAttempts: 10,
    lockTime: 10 * 60 * 1000,
    forgotPassword: {
      generateEmailSubject: () => 'Restablecer tu contraseña — Theia',
      generateEmailHTML: (args) => passwordResetEmail(args?.token ?? ''),
    },
  },
  admin: {
    group: 'Ventas',
    useAsTitle: 'email',
    defaultColumns: ['email', 'name', 'company', 'phone', 'createdAt'],
    description: 'Clientes que crearon una cuenta en la tienda.',
  },
  access: {
    admin: () => false,
    create: () => true,
    read: staffOrSelfCustomer,
    update: staffOrSelfCustomer,
    delete: admins,
  },
  fields: [
    { name: 'name', label: 'Nombre y apellido', type: 'text', required: true },
    {
      type: 'row',
      fields: [
        { name: 'phone', label: 'Teléfono / WhatsApp', type: 'text' },
        { name: 'company', label: 'Clínica / empresa', type: 'text' },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'taxId', label: 'RUC', type: 'text' },
        { name: 'legalName', label: 'Razón social', type: 'text' },
      ],
    },
    {
      name: 'address',
      label: 'Dirección de envío guardada',
      type: 'group',
      fields: [
        { name: 'line', label: 'Dirección', type: 'text' },
        {
          type: 'row',
          fields: [
            { name: 'city', label: 'Ciudad', type: 'text' },
            { name: 'country', label: 'País', type: 'text', defaultValue: 'Paraguay' },
          ],
        },
      ],
    },
    {
      name: 'locale',
      label: 'Idioma preferido',
      type: 'select',
      defaultValue: 'es',
      options: [
        { label: 'Español', value: 'es' },
        { label: 'English', value: 'en' },
      ],
      admin: { position: 'sidebar' },
    },
  ],
}
