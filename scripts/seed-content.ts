/**
 * Creates the starting content of the site: home page, institutional pages,
 * menus, footer, site settings and a few blog guides — in Spanish and English.
 *
 *   npm run seed                 # only creates what does not exist yet
 *   SEED_FORCE=1 npm run seed    # overwrites pages/globals with the defaults
 *
 * Every text here is a starting point for the team to review and edit in /admin.
 */
import config from '@payload-config'
import { getPayload, type Payload } from 'payload'

import { doc, h, p, ul } from './lexical'

type Lang = 'es' | 'en'
type Data = Record<string, unknown>
const FORCE = process.env.SEED_FORCE === '1'
const ctx = { skipNotifications: true }

const link = (label: string, url: string) => ({ type: 'custom', label, url, newTab: false })
const btn = (label: string, url: string) => ({ link: link(label, url) })

/** Puts the English strings onto the Spanish document, keeping ids so blocks line up. */
function overlay(base: unknown, en: unknown): unknown {
  if (Array.isArray(en)) {
    const b = Array.isArray(base) ? base : []
    return en.map((item, i) => overlay(b[i], item))
  }
  if (en && typeof en === 'object') {
    const b = base && typeof base === 'object' ? (base as Data) : {}
    const out: Data = { ...b }
    for (const [k, v] of Object.entries(en as Data)) out[k] = overlay(b[k], v)
    return out
  }
  return en
}

// ---------------------------------------------------------------- pages ----

function homePage(l: Lang, img: { hero?: number; service?: number }) {
  const es = l === 'es'
  return {
    title: es ? 'Inicio' : 'Home',
    slug: 'inicio',
    showTitle: false,
    layout: [
      {
        blockType: 'hero',
        style: img.hero ? 'split' : 'simple',
        eyebrow: es ? 'Equipamiento oftalmológico profesional' : 'Professional ophthalmic equipment',
        title: es ? 'Tecnología para ver más lejos en cada consulta' : 'Technology that helps you see further in every exam',
        intro: es
          ? 'Equipos de diagnóstico, refracción, cirugía e insumos de marcas líderes, con asesoramiento especializado y servicio técnico propio en Paraguay.'
          : 'Diagnostic, refraction and surgical equipment and supplies from leading brands, with expert advice and in-house technical service in Paraguay.',
        image: img.hero,
        buttons: [btn(es ? 'Ver catálogo' : 'Browse catalog', '/productos'), btn(es ? 'Pedir cotización' : 'Request a quote', '/cotizacion')],
        highlights: es
          ? [{ text: 'Garantía oficial' }, { text: 'Servicio técnico propio' }, { text: 'Envíos a todo el país' }]
          : [{ text: 'Official warranty' }, { text: 'In-house service' }, { text: 'Nationwide shipping' }],
      },
      {
        blockType: 'categoryTiles',
        eyebrow: es ? 'Catálogo' : 'Catalog',
        title: es ? 'Explorá por categoría' : 'Shop by category',
        intro: es ? 'Todo lo que tu consultorio, clínica u óptica necesita.' : 'Everything your practice, clinic or optical store needs.',
      },
      {
        blockType: 'productShowcase',
        source: 'featured',
        limit: 8,
        eyebrow: es ? 'Selección' : 'Selection',
        title: es ? 'Equipos destacados' : 'Featured equipment',
        viewAll: link(es ? 'Ver todos' : 'View all', '/productos'),
        background: 'muted',
      },
      {
        blockType: 'features',
        eyebrow: es ? 'Por qué Theia' : 'Why Theia',
        title: es ? 'Más que un proveedor: un socio para tu práctica' : 'More than a supplier: a partner for your practice',
        items: es
          ? [
              { icon: 'handshake', title: 'Asesoramiento experto', text: 'Te ayudamos a elegir el equipo correcto según tu especialidad, volumen de pacientes y presupuesto.' },
              { icon: 'wrench', title: 'Servicio técnico', text: 'Instalación, calibración, mantenimiento preventivo y reparaciones con repuestos originales.' },
              { icon: 'graduation-cap', title: 'Capacitación', text: 'Entrenamos a tu equipo para que aproveche cada función desde el primer día.' },
              { icon: 'credit-card', title: 'Pagos flexibles', text: 'Tarjeta, transferencia, PayPal o Western Union, en guaraníes o dólares.' },
            ]
          : [
              { icon: 'handshake', title: 'Expert advice', text: 'We help you choose the right equipment for your specialty, patient volume and budget.' },
              { icon: 'wrench', title: 'Technical service', text: 'Installation, calibration, preventive maintenance and repairs with original parts.' },
              { icon: 'graduation-cap', title: 'Training', text: 'We train your team to get the most out of every feature from day one.' },
              { icon: 'credit-card', title: 'Flexible payments', text: 'Card, bank transfer, PayPal or Western Union, in guaraníes or US dollars.' },
            ],
      },
      ...(img.service
        ? [
            {
              blockType: 'mediaText',
              eyebrow: es ? 'Servicio técnico' : 'Technical service',
              title: es ? 'Tus equipos, siempre listos para atender' : 'Your equipment, always ready for patients',
              body: doc(
                p(
                  es
                    ? 'Un equipo detenido es una agenda detenida. Nuestro servicio técnico realiza mantenimiento preventivo, calibraciones y reparaciones para que tu consultorio no pare.'
                    : 'Idle equipment means an idle schedule. Our technical service handles preventive maintenance, calibration and repairs so your practice keeps running.',
                ),
                ul(
                  ...(es
                    ? ['Instalación y puesta en marcha', 'Mantenimiento preventivo programado', 'Diagnóstico y reparación', 'Repuestos y accesorios']
                    : ['Installation and setup', 'Scheduled preventive maintenance', 'Diagnosis and repair', 'Spare parts and accessories']),
                ),
              ),
              image: img.service,
              imagePosition: 'left',
              buttons: [btn(es ? 'Solicitar servicio' : 'Request service', '/servicio-tecnico')],
            },
          ]
        : []),
      {
        blockType: 'productShowcase',
        source: 'newest',
        limit: 4,
        eyebrow: es ? 'Novedades' : 'New arrivals',
        title: es ? 'Lo nuevo en el catálogo' : 'New in the catalog',
        viewAll: link(es ? 'Ver catálogo' : 'View catalog', '/productos?orden=newest'),
        background: 'muted',
      },
      { blockType: 'brandStrip', title: es ? 'Marcas con las que trabajamos' : 'Brands we work with' },
      { blockType: 'latestPosts', limit: 3, eyebrow: 'Blog', title: es ? 'Guías y novedades' : 'Guides and news', background: 'muted' },
      {
        blockType: 'cta',
        title: es ? '¿No encontrás lo que buscás?' : "Can't find what you need?",
        intro: es
          ? 'Conseguimos equipos a pedido. Contanos qué necesitás y te enviamos una propuesta.'
          : 'We source equipment on demand. Tell us what you need and we will send you a proposal.',
        buttons: [btn(es ? 'Pedir cotización' : 'Request a quote', '/cotizacion')],
        showWhatsapp: true,
      },
    ],
  }
}

function aboutPage(l: Lang) {
  const es = l === 'es'
  return {
    title: es ? 'Nosotros' : 'About us',
    slug: 'nosotros',
    showTitle: false,
    layout: [
      {
        blockType: 'hero',
        style: 'simple',
        eyebrow: 'Theia',
        title: es ? 'Equipamos a quienes cuidan la visión' : 'We equip the people who care for vision',
        intro: es
          ? 'Acercamos tecnología oftalmológica confiable a profesionales de Paraguay y la región, con acompañamiento antes, durante y después de la compra.'
          : 'We bring reliable ophthalmic technology to professionals in Paraguay and the region, with support before, during and after the purchase.',
      },
      {
        blockType: 'content',
        body: doc(
          h('h2', es ? 'Nuestra misión' : 'Our mission'),
          p(
            es
              ? 'Que cada oftalmólogo, optometrista y clínica tenga acceso a los equipos que necesita para diagnosticar y tratar mejor, con precios claros, asesoramiento honesto y un servicio técnico que responde.'
              : 'To give every ophthalmologist, optometrist and clinic access to the equipment they need to diagnose and treat better, with clear prices, honest advice and responsive technical service.',
          ),
          h('h2', es ? 'Cómo trabajamos' : 'How we work'),
          ul(
            ...(es
              ? [
                  '**Asesoramiento personalizado:** entendemos tu práctica antes de recomendar un equipo.',
                  '**Marcas reconocidas:** trabajamos con fabricantes con respaldo y repuestos disponibles.',
                  '**Postventa real:** instalación, capacitación, mantenimiento y garantía.',
                ]
              : [
                  '**Personal advice:** we understand your practice before recommending equipment.',
                  '**Recognized brands:** we work with manufacturers that offer support and spare parts.',
                  '**Real after-sales:** installation, training, maintenance and warranty.',
                ]),
          ),
        ),
      },
      {
        blockType: 'cta',
        title: es ? 'Hablemos de tu próximo equipo' : "Let's talk about your next equipment",
        buttons: [btn(es ? 'Contactar' : 'Contact us', '/contacto')],
        showWhatsapp: true,
      },
    ],
  }
}

function contactPage(l: Lang) {
  const es = l === 'es'
  return {
    title: es ? 'Contacto' : 'Contact',
    slug: 'contacto',
    showTitle: true,
    layout: [
      {
        blockType: 'contactInfo',
        intro: es ? 'Escribinos por el medio que prefieras. Respondemos en el día hábil.' : 'Reach us however you prefer. We reply within one business day.',
        showMap: true,
        form: 'contact',
      },
    ],
  }
}

function servicePage(l: Lang) {
  const es = l === 'es'
  return {
    title: es ? 'Servicio técnico' : 'Technical service',
    slug: 'servicio-tecnico',
    showTitle: false,
    layout: [
      {
        blockType: 'hero',
        style: 'simple',
        eyebrow: es ? 'Servicio técnico' : 'Technical service',
        title: es ? 'Mantenimiento y reparación de equipos oftalmológicos' : 'Ophthalmic equipment maintenance and repair',
        intro: es
          ? 'Técnicos capacitados, repuestos originales y tiempos de respuesta pensados para que tu consultorio no se detenga.'
          : 'Trained technicians, original parts and response times designed to keep your practice running.',
      },
      {
        blockType: 'features',
        items: es
          ? [
              { icon: 'package', title: 'Instalación', text: 'Puesta en marcha, configuración y verificación en tu consultorio.' },
              { icon: 'clock', title: 'Mantenimiento preventivo', text: 'Planes periódicos que alargan la vida útil y evitan paradas.' },
              { icon: 'wrench', title: 'Reparación', text: 'Diagnóstico y reparación con repuestos originales.' },
              { icon: 'badge-check', title: 'Calibración', text: 'Mediciones precisas y confiables, como el primer día.' },
            ]
          : [
              { icon: 'package', title: 'Installation', text: 'Setup, configuration and verification at your practice.' },
              { icon: 'clock', title: 'Preventive maintenance', text: 'Periodic plans that extend service life and prevent downtime.' },
              { icon: 'wrench', title: 'Repair', text: 'Diagnosis and repair with original parts.' },
              { icon: 'badge-check', title: 'Calibration', text: 'Accurate, reliable measurements, like day one.' },
            ],
        background: 'muted',
      },
      {
        blockType: 'form',
        kind: 'service',
        title: es ? 'Solicitá una visita técnica' : 'Request a service visit',
        intro: es ? 'Contanos el equipo, la marca, el modelo y qué está pasando.' : 'Tell us the equipment, brand, model and what is happening.',
      },
    ],
  }
}

function rentalPage(l: Lang) {
  const es = l === 'es'
  return {
    title: es ? 'Alquiler de equipos' : 'Equipment rental',
    slug: 'alquiler',
    showTitle: false,
    layout: [
      {
        blockType: 'hero',
        style: 'simple',
        eyebrow: es ? 'Alquiler' : 'Rental',
        title: es ? 'Alquiler de equipos oftalmológicos' : 'Ophthalmic equipment rental',
        intro: es
          ? 'Para campañas, jornadas quirúrgicas, reemplazos temporales o para probar antes de comprar.'
          : 'For outreach campaigns, surgical days, temporary replacements or to try before you buy.',
      },
      {
        blockType: 'content',
        body: doc(
          h('h2', es ? '¿Cómo funciona?' : 'How does it work?'),
          ul(
            ...(es
              ? ['Contanos qué equipo necesitás, por cuánto tiempo y dónde.', 'Te enviamos disponibilidad, condiciones y presupuesto.', 'Coordinamos la entrega, la instalación y el retiro.']
              : ['Tell us which equipment you need, for how long and where.', 'We send availability, terms and a quote.', 'We arrange delivery, installation and pickup.']),
          ),
        ),
      },
      { blockType: 'form', kind: 'rental', title: es ? 'Consultá disponibilidad' : 'Check availability', background: 'muted' },
    ],
  }
}

function faqPage(l: Lang) {
  const es = l === 'es'
  return {
    title: es ? 'Preguntas frecuentes' : 'Frequently asked questions',
    slug: 'preguntas-frecuentes',
    showTitle: true,
    layout: [
      {
        blockType: 'faq',
        items: es
          ? [
              { question: '¿Cómo compro un equipo?', answer: 'Los productos con precio se compran online: agregalos al carrito y finalizá la compra. Los equipos con “Precio a consultar” se agregan a la cotización y te respondemos con una propuesta.' },
              { question: '¿Qué formas de pago aceptan?', answer: 'Tarjetas de crédito y débito (Bancard), transferencia bancaria, PayPal y Western Union. Los pagos con tarjeta se cobran en guaraníes y PayPal en dólares.' },
              { question: '¿Emiten factura legal?', answer: 'Sí. Al finalizar la compra podés cargar tu RUC y razón social.' },
              { question: '¿Hacen envíos?', answer: 'Sí, a todo Paraguay y al exterior. El costo y el plazo se coordinan después de la compra según el destino y el equipo. También podés retirar en nuestro local.' },
              { question: '¿Los equipos tienen garantía?', answer: 'Todos los equipos nuevos tienen garantía oficial. El plazo se indica en cada producto.' },
              { question: '¿Ofrecen instalación y capacitación?', answer: 'Sí. Nuestro servicio técnico instala los equipos y capacita a tu equipo de trabajo.' },
            ]
          : [
              { question: 'How do I buy equipment?', answer: 'Products with a price can be bought online: add them to the cart and check out. Items marked “Price on request” go to your quote list and we reply with a proposal.' },
              { question: 'Which payment methods do you accept?', answer: 'Credit and debit cards (Bancard), bank transfer, PayPal and Western Union. Card payments are charged in guaraníes and PayPal in US dollars.' },
              { question: 'Do you issue invoices?', answer: 'Yes. At checkout you can enter your tax ID (RUC) and legal name.' },
              { question: 'Do you ship?', answer: 'Yes, across Paraguay and abroad. Cost and timing are arranged after purchase depending on destination and equipment. You can also pick up at our store.' },
              { question: 'Is there a warranty?', answer: 'All new equipment comes with an official warranty. The term is shown on each product.' },
              { question: 'Do you offer installation and training?', answer: 'Yes. Our technical service installs the equipment and trains your staff.' },
            ],
      },
      {
        blockType: 'cta',
        title: es ? '¿Tenés otra pregunta?' : 'Have another question?',
        buttons: [btn(es ? 'Escribinos' : 'Contact us', '/contacto')],
        showWhatsapp: true,
      },
    ],
  }
}

function shippingPage(l: Lang) {
  const es = l === 'es'
  return {
    title: es ? 'Envíos y garantía' : 'Shipping & warranty',
    slug: 'envios-y-garantia',
    showTitle: true,
    layout: [
      {
        blockType: 'content',
        body: doc(
          h('h2', es ? 'Envíos' : 'Shipping'),
          p(
            es
              ? 'Enviamos a todo Paraguay y al exterior. Una vez confirmado el pedido coordinamos con vos el medio de envío, el costo y el plazo según el destino y el tamaño del equipo. También podés retirar tu pedido en nuestro local.'
              : 'We ship across Paraguay and abroad. Once your order is confirmed we agree on carrier, cost and timing based on destination and equipment size. You can also pick up your order at our store.',
          ),
          h('h2', es ? 'Garantía' : 'Warranty'),
          p(
            es
              ? 'Los equipos nuevos cuentan con garantía oficial del fabricante. El plazo y las condiciones se indican en cada producto y en la factura. La garantía cubre defectos de fabricación y no cubre daños por mal uso, golpes o instalaciones no autorizadas.'
              : 'New equipment carries the manufacturer’s official warranty. Term and conditions are shown on each product and on the invoice. It covers manufacturing defects, not damage from misuse, impacts or unauthorized installation.',
          ),
          h('h2', es ? 'Cambios y devoluciones' : 'Returns'),
          p(
            es
              ? 'Si recibiste un producto dañado o distinto al pedido, avisanos dentro de las 48 horas de recibido y lo solucionamos.'
              : 'If you received a damaged or wrong product, let us know within 48 hours of delivery and we will fix it.',
          ),
        ),
      },
    ],
  }
}

function termsPage(l: Lang) {
  const es = l === 'es'
  return {
    title: es ? 'Términos y condiciones' : 'Terms and conditions',
    slug: 'terminos',
    showTitle: true,
    layout: [
      {
        blockType: 'content',
        body: doc(
          p(es ? '**Texto de referencia: revisalo con tu asesor legal antes de publicarlo.**' : '**Reference text: review it with your legal advisor before publishing.**'),
          h('h2', es ? '1. Alcance' : '1. Scope'),
          p(es ? 'Estos términos regulan el uso de este sitio y las compras realizadas en él.' : 'These terms govern the use of this site and purchases made on it.'),
          h('h2', es ? '2. Precios y pagos' : '2. Prices and payments'),
          p(
            es
              ? 'Los precios se expresan en guaraníes y en dólares estadounidenses y pueden cambiar sin previo aviso. El pedido se confirma cuando se acredita el pago.'
              : 'Prices are shown in guaraníes and US dollars and may change without notice. An order is confirmed once payment is received.',
          ),
          h('h2', es ? '3. Productos de uso profesional' : '3. Professional-use products'),
          p(
            es
              ? 'Los equipos ofrecidos están destinados a profesionales de la salud visual. El comprador es responsable de su uso conforme a las normas vigentes.'
              : 'The equipment offered is intended for eye-care professionals. The buyer is responsible for using it in accordance with applicable regulations.',
          ),
          h('h2', es ? '4. Entregas, garantía y devoluciones' : '4. Delivery, warranty and returns'),
          p(es ? 'Ver la página “Envíos y garantía”.' : 'See the “Shipping & warranty” page.'),
        ),
      },
    ],
  }
}

function privacyPage(l: Lang) {
  const es = l === 'es'
  return {
    title: es ? 'Política de privacidad' : 'Privacy policy',
    slug: 'privacidad',
    showTitle: true,
    layout: [
      {
        blockType: 'content',
        body: doc(
          p(es ? '**Texto de referencia: revisalo con tu asesor legal antes de publicarlo.**' : '**Reference text: review it with your legal advisor before publishing.**'),
          p(
            es
              ? 'Usamos los datos que nos das (nombre, e-mail, teléfono, empresa, RUC y dirección) solo para procesar pedidos, responder consultas y, si te suscribís, enviarte novedades. No vendemos ni compartimos tus datos con terceros, salvo con los proveedores necesarios para cobrar y enviar tu pedido.'
              : 'We use the data you give us (name, e-mail, phone, company, tax ID and address) only to process orders, answer inquiries and, if you subscribe, send you news. We do not sell or share your data with third parties, except the providers needed to charge and ship your order.',
          ),
          p(
            es
              ? 'Podés pedir acceder, corregir o borrar tus datos escribiéndonos a nuestro e-mail de contacto.'
              : 'You can ask to access, correct or delete your data by writing to our contact e-mail.',
          ),
        ),
      },
    ],
  }
}

// ---------------------------------------------------------------- posts ----

function posts(l: Lang) {
  const es = l === 'es'
  return [
    {
      slug: 'como-elegir-un-autorrefractometro',
      topic: 'guide',
      title: es ? 'Cómo elegir un autorrefractómetro para tu consultorio' : 'How to choose an autorefractor for your practice',
      excerpt: es
        ? 'Queratometría, pupila pequeña, conectividad y tamaño: los puntos clave antes de decidir.'
        : 'Keratometry, small-pupil mode, connectivity and footprint: the key points before you decide.',
      body: doc(
        p(
          es
            ? 'El autorrefractómetro es uno de los equipos más usados del consultorio. Elegir bien ahorra tiempo en cada paciente durante años.'
            : 'The autorefractor is one of the most used devices in a practice. Choosing well saves time with every patient for years.',
        ),
        h('h2', es ? '1. ¿Necesitás queratometría?' : '1. Do you need keratometry?'),
        p(
          es
            ? 'Los modelos con queratómetro integrado (autorrefractoqueratómetros) son ideales si adaptás lentes de contacto o hacés evaluaciones prequirúrgicas.'
            : 'Models with built-in keratometry (auto ref-keratometers) are ideal if you fit contact lenses or do pre-surgical assessments.',
        ),
        h('h2', es ? '2. Medición en pupila pequeña' : '2. Small-pupil measurement'),
        p(es ? 'Importante para pacientes mayores o con cataratas.' : 'Important for elderly patients or those with cataracts.'),
        h('h2', es ? '3. Conectividad' : '3. Connectivity'),
        p(
          es
            ? 'Verificá que exporte datos a tu foróptero digital o a tu sistema de historias clínicas.'
            : 'Check that it can export data to your digital phoropter or electronic records system.',
        ),
        h('h2', es ? '4. Espacio y ergonomía' : '4. Space and ergonomics'),
        p(es ? 'Medí tu mesa de trabajo y considerá la altura del paciente y del operador.' : 'Measure your workstation and consider patient and operator height.'),
        p(es ? '¿Dudas? Pedinos asesoramiento sin compromiso.' : 'Questions? Ask us for advice, no strings attached.'),
      ),
    },
    {
      slug: 'mantenimiento-preventivo-equipos-oftalmologicos',
      topic: 'technical',
      title: es ? 'Mantenimiento preventivo: cómo cuidar tus equipos oftalmológicos' : 'Preventive maintenance: how to care for your ophthalmic equipment',
      excerpt: es
        ? 'Rutinas simples de limpieza y control que evitan fallas y alargan la vida útil.'
        : 'Simple cleaning and checking routines that prevent failures and extend service life.',
      body: doc(
        p(
          es
            ? 'Un mantenimiento preventivo regular evita paradas inesperadas y mantiene la precisión de tus mediciones.'
            : 'Regular preventive maintenance prevents unexpected downtime and keeps your measurements accurate.',
        ),
        h('h2', es ? 'Rutina diaria' : 'Daily routine'),
        ul(
          ...(es
            ? ['Limpiá apoyamentón y apoyafrente después de cada paciente.', 'Cubrí los equipos al terminar la jornada.', 'Revisá que las lentes y ventanas de medición estén limpias.']
            : ['Clean chin and forehead rests after each patient.', 'Cover equipment at the end of the day.', 'Check that lenses and measuring windows are clean.']),
        ),
        h('h2', es ? 'Cada 6 a 12 meses' : 'Every 6 to 12 months'),
        p(
          es
            ? 'Programá una revisión técnica con calibración. Nuestro servicio técnico puede armar un plan a medida para tu consultorio.'
            : 'Schedule a technical check with calibration. Our technical service can set up a tailored plan for your practice.',
        ),
      ),
    },
  ]
}

// ---------------------------------------------------------------- globals ----

function settings(l: Lang) {
  const es = l === 'es'
  return {
    siteName: 'Theia',
    tagline: es ? 'Equipos oftalmológicos para profesionales' : 'Ophthalmic equipment for professionals',
    description: es
      ? 'Tienda online de equipos oftalmológicos en Paraguay: diagnóstico, refracción, cirugía e insumos de marcas líderes, con servicio técnico propio.'
      : 'Online store for ophthalmic equipment in Paraguay: diagnostics, refraction, surgery and supplies from leading brands, with in-house technical service.',
    primaryColor: '#0B3B5C',
    accentColor: '#0E9F9A',
    whatsapp: '595971282908',
    phone: '+595 971 282 908',
    email: 'td.phakos@gmail.com',
    address: 'Asunción, Paraguay',
    hours: es ? 'Lunes a viernes de 8:00 a 18:00 · Sábados de 8:00 a 12:00' : 'Monday to Friday 8:00–18:00 · Saturday 8:00–12:00',
    mapQuery: 'Asunción, Paraguay',
    whatsappMessage: es ? 'Hola Theia, quisiera hacer una consulta.' : 'Hi Theia, I have a question.',
    notificationEmails: 'td.phakos@gmail.com',
    payments: { transfer: true, card: true, paypal: true, westernUnion: true },
    transferInstructions: es
      ? 'En breve te enviamos los datos bancarios por WhatsApp o e-mail. Indicá tu número de pedido al transferir.'
      : 'We will send you the bank details by WhatsApp or e-mail shortly. Include your order number with the transfer.',
    westernUnionInstructions: es
      ? 'En breve te enviamos los datos del beneficiario. Al enviar el giro, compartinos el número de control (MTCN).'
      : 'We will send you the beneficiary details shortly. After sending, share the control number (MTCN) with us.',
    pickupEnabled: true,
    shippingNote: es ? 'El costo de envío se coordina después de la compra.' : 'Shipping cost is arranged after purchase.',
  }
}

function header(l: Lang) {
  const es = l === 'es'
  return {
    announcement: {
      enabled: true,
      text: es ? 'Envíos a todo Paraguay y al exterior · Servicio técnico propio' : 'Shipping across Paraguay and abroad · In-house technical service',
      link: { type: 'custom', url: '/envios-y-garantia' },
    },
    navItems: [
      { link: link(es ? 'Marcas' : 'Brands', '/marcas') },
      { link: link(es ? 'Usados' : 'Used', '/usados') },
      { link: link(es ? 'Servicio técnico' : 'Service', '/servicio-tecnico') },
      { link: link(es ? 'Alquiler' : 'Rental', '/alquiler') },
      { link: link('Blog', '/blog') },
      { link: link(es ? 'Contacto' : 'Contact', '/contacto') },
    ],
  }
}

function footer(l: Lang) {
  const es = l === 'es'
  return {
    about: es
      ? 'Equipos oftalmológicos para profesionales de Paraguay y la región. Asesoramiento, venta, alquiler y servicio técnico.'
      : 'Ophthalmic equipment for professionals in Paraguay and the region. Advice, sales, rental and technical service.',
    newsletter: true,
    columns: [
      {
        title: es ? 'Tienda' : 'Shop',
        links: [
          { link: link(es ? 'Productos' : 'Products', '/productos') },
          { link: link(es ? 'Marcas' : 'Brands', '/marcas') },
          { link: link(es ? 'Equipos usados' : 'Used equipment', '/usados') },
          { link: link(es ? 'Pedir cotización' : 'Request a quote', '/cotizacion') },
        ],
      },
      {
        title: es ? 'Servicios' : 'Services',
        links: [
          { link: link(es ? 'Servicio técnico' : 'Technical service', '/servicio-tecnico') },
          { link: link(es ? 'Alquiler de equipos' : 'Equipment rental', '/alquiler') },
          { link: link(es ? 'Seguimiento de pedido' : 'Track your order', '/seguimiento') },
          { link: link(es ? 'Mi cuenta' : 'My account', '/cuenta') },
        ],
      },
      {
        title: es ? 'Empresa' : 'Company',
        links: [
          { link: link(es ? 'Nosotros' : 'About us', '/nosotros') },
          { link: link('Blog', '/blog') },
          { link: link(es ? 'Preguntas frecuentes' : 'FAQ', '/preguntas-frecuentes') },
          { link: link(es ? 'Contacto' : 'Contact', '/contacto') },
        ],
      },
      {
        title: 'Legal',
        links: [
          { link: link(es ? 'Términos y condiciones' : 'Terms and conditions', '/terminos') },
          { link: link(es ? 'Privacidad' : 'Privacy', '/privacidad') },
          { link: link(es ? 'Envíos y garantía' : 'Shipping & warranty', '/envios-y-garantia') },
        ],
      },
    ],
    legal: '',
  }
}

// ---------------------------------------------------------------- runner ----

async function upsert(payload: Payload, collection: 'pages' | 'posts', build: (l: Lang) => Data & { slug: string }) {
  const es = build('es')
  const { docs } = await payload.find({ collection, where: { slug: { equals: es.slug } }, limit: 1, depth: 0, draft: true })
  let id = docs[0]?.id
  if (id && !FORCE) {
    payload.logger.info(`Keeping existing ${collection}/${es.slug}`)
    return
  }
  const data = { ...es, _status: 'published' }
  const saved = id
    ? await payload.update({ collection, id, locale: 'es', data: data as never, context: ctx })
    : await payload.create({ collection, locale: 'es', data: data as never, context: ctx })
  id = saved.id
  const merged = overlay(saved, { ...build('en'), _status: 'published' }) as Data
  await payload.update({ collection, id, locale: 'en', data: merged as never, context: ctx })
  payload.logger.info(`Seeded ${collection}/${es.slug}`)
}

async function seedGlobal(payload: Payload, slug: 'settings' | 'header' | 'footer', build: (l: Lang) => Data) {
  const current = (await payload.findGlobal({ slug, depth: 0 })) as unknown as Data
  const untouched = slug === 'settings' ? !current.transferInstructions : !((current.navItems as unknown[] | undefined)?.length || (current.columns as unknown[] | undefined)?.length)
  if (!untouched && !FORCE) {
    payload.logger.info(`Keeping existing global ${slug}`)
    return
  }
  const saved = await payload.updateGlobal({ slug, locale: 'es', data: build('es') as never, context: ctx })
  await payload.updateGlobal({ slug, locale: 'en', data: overlay(saved, build('en')) as never, context: ctx })
  payload.logger.info(`Seeded global ${slug}`)
}

async function pickImage(payload: Payload, slugs: string[]): Promise<number | undefined> {
  for (const slug of slugs) {
    const { docs } = await payload.find({ collection: 'products', where: { slug: { equals: slug } }, limit: 1, depth: 0 })
    const first = docs[0]?.images?.[0]
    if (first) return typeof first === 'object' ? first.id : first
  }
  const { docs } = await payload.find({ collection: 'products', where: { images: { exists: true } }, limit: 1, depth: 0, sort: '-createdAt' })
  const first = docs[0]?.images?.[0]
  return first ? (typeof first === 'object' ? first.id : first) : undefined
}

async function run() {
  const payload = await getPayload({ config })

  // Highlight a few products with photos on the home page until the team picks its own.
  const featured = await payload.count({ collection: 'products', where: { featured: { equals: true } } })
  if (!featured.totalDocs) {
    const { docs } = await payload.find({
      collection: 'products',
      where: { and: [{ images: { exists: true } }, { _status: { equals: 'published' } }] },
      limit: 8,
      depth: 0,
      sort: '-updatedAt',
    })
    for (const d of docs) await payload.update({ collection: 'products', id: d.id, data: { featured: true }, context: ctx })
  }

  const hero = await pickImage(payload, ['ezer-panorama-ultra-widefield-retinal-camera', 'vs-verona', 'lrk-7800-new'])
  const service = await pickImage(payload, ['hmb-1', 'ucs-3000', 'vs-tavola-base'])

  await seedGlobal(payload, 'settings', settings)
  await seedGlobal(payload, 'header', header)
  await seedGlobal(payload, 'footer', footer)
  await upsert(payload, 'pages', (l) => homePage(l, { hero, service }))
  for (const build of [aboutPage, contactPage, servicePage, rentalPage, faqPage, shippingPage, termsPage, privacyPage]) {
    await upsert(payload, 'pages', build)
  }
  for (const [i] of posts('es').entries()) {
    await upsert(payload, 'posts', (l) => ({ ...posts(l)[i], publishedAt: new Date(Date.now() - i * 86400000 * 7).toISOString() }))
  }
  payload.logger.info('Content seed finished.')
  process.exit(0)
}

try {
  await run()
} catch (err) {
  console.error(err)
  process.exit(1)
}
