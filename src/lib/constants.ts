/** Option lists shared by the admin (labels in Spanish) and the storefront. */

export const CERTIFICATIONS = [
  { label: 'FDA', value: 'fda' },
  { label: 'CE', value: 'ce' },
  { label: 'ISO 13485', value: 'iso' },
  { label: 'ANVISA', value: 'anvisa' },
  { label: 'DINAVISA', value: 'dinavisa' },
] as const

export const ORDER_STATUSES = [
  { label: 'Esperando pago', value: 'awaiting_payment' },
  { label: 'Pagado', value: 'paid' },
  { label: 'En preparación', value: 'processing' },
  { label: 'Enviado', value: 'shipped' },
  { label: 'Listo para retirar', value: 'ready_for_pickup' },
  { label: 'Entregado', value: 'delivered' },
  { label: 'Cancelado', value: 'cancelled' },
] as const

export const PAYMENT_METHODS = [
  { label: 'Transferencia bancaria', value: 'transfer' },
  { label: 'Tarjeta (Bancard)', value: 'card' },
  { label: 'PayPal', value: 'paypal' },
  { label: 'Western Union', value: 'western_union' },
] as const

export type PaymentMethod = (typeof PAYMENT_METHODS)[number]['value']

export const QUOTE_KINDS = [
  { label: 'Cotización de productos', value: 'products' },
  { label: 'Equipo usado', value: 'used' },
  { label: 'Alquiler', value: 'rental' },
  { label: 'Servicio técnico', value: 'service' },
  { label: 'Cotización general', value: 'quote' },
  { label: 'Contacto', value: 'contact' },
] as const

export type QuoteKind = (typeof QUOTE_KINDS)[number]['value']
