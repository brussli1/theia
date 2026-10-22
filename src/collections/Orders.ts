import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload'

import { admins, staff, staffOrOwnCustomer } from '@/access'
import { ORDER_STATUSES, PAYMENT_METHODS } from '@/lib/constants'
import { notifyOrderChange } from '@/lib/email/notify'
import type { Order } from '@/payload-types'

/**
 * Staff confirm manual payments (transfer, Western Union) by moving the order
 * past "Esperando pago". Keep the payment status in step, so the customer's
 * order page stops showing payment instructions.
 */
const syncPaymentStatus: CollectionBeforeChangeHook<Order> = ({ data, originalDoc, operation }) => {
  if (operation !== 'update' || !originalDoc) return data
  const status = data.status ?? originalDoc.status
  const paymentStatus = data.paymentStatus ?? originalDoc.paymentStatus
  const leftAwaiting = originalDoc.status === 'awaiting_payment' && status !== 'awaiting_payment'
  if (leftAwaiting && status !== 'cancelled' && paymentStatus !== 'paid' && paymentStatus !== 'refunded') {
    return { ...data, paymentStatus: 'paid' }
  }
  return data
}

/**
 * Orders are created only by the checkout (server-side, prices read from the
 * database). Staff move them through their status; every status change e-mails
 * the customer.
 */
export const Orders: CollectionConfig = {
  slug: 'orders',
  labels: { singular: 'Pedido', plural: 'Pedidos' },
  admin: {
    group: 'Ventas',
    useAsTitle: 'orderNumber',
    defaultColumns: ['orderNumber', 'contactName', 'total', 'paymentMethod', 'status', 'createdAt'],
    listSearchableFields: ['orderNumber', 'email', 'contactName'],
    description:
      'Compras hechas en la tienda. Cambiá el "Estado" para avisar al cliente por e-mail (pagado, enviado, entregado…).',
  },
  defaultSort: '-createdAt',
  access: {
    read: staffOrOwnCustomer,
    create: () => false,
    update: staff,
    delete: admins,
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'orderNumber',
          label: 'N.º de pedido',
          type: 'text',
          required: true,
          unique: true,
          index: true,
          admin: { readOnly: true },
        },
        {
          name: 'status',
          label: 'Estado',
          type: 'select',
          required: true,
          defaultValue: 'awaiting_payment',
          options: [...ORDER_STATUSES],
        },
        {
          name: 'paymentStatus',
          label: 'Pago',
          type: 'select',
          required: true,
          defaultValue: 'pending',
          options: [
            { label: 'Pendiente', value: 'pending' },
            { label: 'Pagado', value: 'paid' },
            { label: 'Fallido', value: 'failed' },
            { label: 'Reembolsado', value: 'refunded' },
          ],
        },
      ],
    },
    {
      name: 'items',
      label: 'Productos',
      type: 'array',
      required: true,
      admin: { readOnly: true },
      fields: [
        { name: 'product', label: 'Producto', type: 'relationship', relationTo: 'products' },
        {
          type: 'row',
          fields: [
            { name: 'name', label: 'Nombre', type: 'text', required: true },
            { name: 'sku', label: 'Modelo', type: 'text' },
            { name: 'quantity', label: 'Cantidad', type: 'number', required: true, min: 1 },
          ],
        },
        {
          type: 'row',
          fields: [
            { name: 'unitPriceGs', label: 'Precio unitario Gs.', type: 'number', required: true },
            { name: 'unitPriceUsd', label: 'Precio unitario USD', type: 'number', required: true },
          ],
        },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'subtotalGs', label: 'Total Gs.', type: 'number', required: true, admin: { readOnly: true } },
        { name: 'subtotalUsd', label: 'Total USD', type: 'number', required: true, admin: { readOnly: true } },
        {
          name: 'total',
          label: 'Total cobrado',
          type: 'text',
          admin: { readOnly: true, description: 'Monto y moneda en que se cobra.' },
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Pago',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'paymentMethod',
              label: 'Forma de pago',
              type: 'select',
              required: true,
              options: [...PAYMENT_METHODS],
              admin: { readOnly: true },
            },
            {
              name: 'currency',
              label: 'Moneda del cobro',
              type: 'select',
              required: true,
              options: [
                { label: 'Guaraníes', value: 'PYG' },
                { label: 'Dólares', value: 'USD' },
              ],
              admin: { readOnly: true },
            },
            {
              name: 'paymentReference',
              label: 'Referencia del pago',
              type: 'text',
              admin: { description: 'N.º de transferencia, de giro o de la pasarela.' },
            },
          ],
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Cliente y facturación',
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'contactName', label: 'Nombre', type: 'text', required: true },
            { name: 'email', label: 'E-mail', type: 'email', required: true },
            { name: 'phone', label: 'Teléfono', type: 'text', required: true },
          ],
        },
        {
          type: 'row',
          fields: [
            { name: 'company', label: 'Clínica / empresa', type: 'text' },
            { name: 'taxId', label: 'RUC', type: 'text' },
            { name: 'legalName', label: 'Razón social', type: 'text' },
          ],
        },
        { name: 'customer', label: 'Cuenta del cliente', type: 'relationship', relationTo: 'customers' },
      ],
    },
    {
      type: 'collapsible',
      label: 'Entrega',
      fields: [
        {
          name: 'deliveryMethod',
          label: 'Modalidad',
          type: 'select',
          required: true,
          defaultValue: 'shipping',
          options: [
            { label: 'Envío', value: 'shipping' },
            { label: 'Retiro en local', value: 'pickup' },
          ],
        },
        {
          type: 'row',
          fields: [
            { name: 'address', label: 'Dirección', type: 'text' },
            { name: 'city', label: 'Ciudad', type: 'text' },
            { name: 'country', label: 'País', type: 'text' },
          ],
        },
        { name: 'trackingCode', label: 'Código de seguimiento del envío', type: 'text' },
        { name: 'customerNotes', label: 'Notas del cliente', type: 'textarea', admin: { readOnly: true } },
      ],
    },
    {
      name: 'internalNotes',
      label: 'Notas internas',
      type: 'textarea',
      admin: { position: 'sidebar', description: 'Solo las ve el equipo.' },
      access: { read: ({ req: { user } }) => user?.collection === 'users' },
    },
    {
      name: 'locale',
      label: 'Idioma del cliente',
      type: 'select',
      defaultValue: 'es',
      options: [
        { label: 'Español', value: 'es' },
        { label: 'English', value: 'en' },
      ],
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'accessToken',
      type: 'text',
      required: true,
      index: true,
      admin: { hidden: true },
      access: { read: ({ req: { user } }) => user?.collection === 'users' },
    },
  ],
  hooks: {
    beforeChange: [syncPaymentStatus],
    afterChange: [notifyOrderChange],
  },
}
