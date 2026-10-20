import type { Payload } from 'payload'
import React from 'react'

import './dashboard.scss'

type Props = { payload: Payload }

const shortcuts = [
  { href: '/admin/collections/products/create', title: 'Nuevo producto', text: 'Cargar un equipo con fotos y precio.' },
  { href: '/admin/collections/pages', title: 'Editar páginas', text: 'Portada, Nosotros, Contacto y más.' },
  { href: '/admin/collections/orders', title: 'Ver pedidos', text: 'Confirmar pagos y avisar envíos.' },
  { href: '/admin/collections/quote-requests', title: 'Ver solicitudes', text: 'Cotizaciones y consultas recibidas.' },
  { href: '/admin/globals/settings', title: 'Datos de la empresa', text: 'Teléfono, WhatsApp, colores y pagos.' },
  { href: '/admin/globals/header', title: 'Menú y anuncio', text: 'Enlaces del menú y barra superior.' },
]

/** Welcome panel shown above the collection cards on the admin home. */
export async function Dashboard({ payload }: Props) {
  const [awaiting, paidToShip, newQuotes, products] = await Promise.all([
    payload.count({ collection: 'orders', where: { status: { equals: 'awaiting_payment' } } }),
    payload.count({ collection: 'orders', where: { status: { in: ['paid', 'processing'] } } }),
    payload.count({ collection: 'quote-requests', where: { status: { equals: 'new' } } }),
    payload.count({ collection: 'products', where: { _status: { equals: 'published' } } }),
  ])

  const stats = [
    { label: 'Pedidos esperando pago', value: awaiting.totalDocs, href: '/admin/collections/orders?where[status][equals]=awaiting_payment' },
    { label: 'Pedidos para preparar/enviar', value: paidToShip.totalDocs, href: '/admin/collections/orders?where[status][in]=paid,processing' },
    { label: 'Solicitudes nuevas', value: newQuotes.totalDocs, href: '/admin/collections/quote-requests?where[status][equals]=new' },
    { label: 'Productos publicados', value: products.totalDocs, href: '/admin/collections/products' },
  ]

  return (
    <div className="theia-dashboard">
      <div className="theia-dashboard__intro">
        <h2>¡Hola! Bienvenido al panel de Theia</h2>
        <p>
          Desde acá manejás todo el sitio sin programar. Cada cambio se guarda como borrador hasta
          que tocás <strong>Publicar</strong>. Usá <strong>Vista previa en vivo</strong> para verlo
          antes. ¿Dudas? Consultá la guía del editor (docs/guia-del-editor.md).
        </p>
        <a className="theia-dashboard__site" href="/" target="_blank" rel="noreferrer">
          Ver el sitio ↗
        </a>
      </div>
      <div className="theia-dashboard__stats">
        {stats.map((stat) => (
          <a key={stat.label} href={stat.href} className="theia-dashboard__stat">
            <span className="theia-dashboard__value">{stat.value}</span>
            <span>{stat.label}</span>
          </a>
        ))}
      </div>
      <div className="theia-dashboard__shortcuts">
        {shortcuts.map((s) => (
          <a key={s.href} href={s.href} className="theia-dashboard__shortcut">
            <strong>{s.title}</strong>
            <span>{s.text}</span>
          </a>
        ))}
      </div>
    </div>
  )
}
