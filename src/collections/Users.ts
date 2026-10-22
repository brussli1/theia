import type { CollectionConfig } from 'payload'

import { adminField, admins, isAdminUser, isStaffUser } from '@/access'

/** People who manage the site from /admin. */
export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Usuario del panel', plural: 'Usuarios del panel' },
  auth: {
    tokenExpiration: 60 * 60 * 24 * 7,
  },
  admin: {
    group: 'Configuración',
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'role'],
    description:
      'Personas que pueden entrar a este panel. "Administrador" puede todo; "Editor" maneja catálogo, contenido, pedidos y solicitudes.',
  },
  access: {
    admin: ({ req: { user } }) => isStaffUser(user),
    create: admins,
    delete: admins,
    read: ({ req: { user } }) => {
      if (isAdminUser(user)) return true
      if (isStaffUser(user)) return { id: { equals: user!.id } }
      return false
    },
    update: ({ req: { user } }) => {
      if (isAdminUser(user)) return true
      if (isStaffUser(user)) return { id: { equals: user!.id } }
      return false
    },
  },
  fields: [
    { name: 'name', label: 'Nombre', type: 'text', required: true },
    {
      name: 'role',
      label: 'Rol',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      options: [
        { label: 'Administrador', value: 'admin' },
        { label: 'Editor', value: 'editor' },
      ],
      access: { update: adminField, create: adminField },
      saveToJWT: true,
    },
  ],
}
