import { cookies } from "next/headers";
import { LOCALE_COOKIE } from "./cookie";

export type Locale = "es" | "en";

export const LOCALES: Locale[] = ["es", "en"];

export const DEFAULT_LOCALE: Locale = "es";

const es = {
  meta: {
    title: "Theia — Equipos oftalmológicos",
    description:
      "Catálogo y tienda online de equipos oftalmológicos, para profesionales en Paraguay y el exterior.",
  },
  header: {
    products: "Productos",
  },
  listing: {
    productsCount: (count: number) => `${count} productos`,
  },
  card: {
    noImage: "Sin imagen",
    quoteOnly: "Solo cotización",
    unavailable: "No disponible",
  },
  grid: {
    empty: "No se encontraron productos.",
  },
  pagination: {
    previous: "← Anterior",
    next: "Siguiente →",
    pageOf: (page: number, pages: number) => `Página ${page} de ${pages}`,
  },
  filters: {
    search: "Buscar",
    searchPlaceholder: "Nombre o descripción",
    category: "Categoría",
    all: "Todas",
    brand: "Marca",
    certification: "Certificación",
    any: "Cualquiera",
    priceMin: "Precio mín. (Gs)",
    priceMax: "Precio máx. (Gs)",
    sort: "Ordenar",
    newest: "Más recientes",
    priceAsc: "Precio: menor a mayor",
    priceDesc: "Precio: mayor a menor",
    apply: "Aplicar",
  },
  product: {
    unavailable: "Producto no disponible",
    addToCart: "Agregar al carrito",
    added: "Agregado al carrito",
    requestQuote: "Solicitar cotización",
    description: "Descripción",
    specifications: "Especificaciones",
    noImage: "Sin imagen",
    image: "Imagen",
  },
  home: {
    loNuevo: "Lo Nuevo",
    popular: "Popular",
    promotions: "Promociones",
    previous: "Anterior",
    next: "Siguiente",
  },
  cart: {
    title: "Carrito",
    empty: "Tu carrito está vacío.",
    subtotal: "Subtotal",
    quantity: "Cantidad",
    remove: "Quitar",
    continueShopping: "Seguir comprando",
    checkout: "Finalizar compra",
    trackOrder: "¿Ya hiciste un pedido? Rastrear su estado",
  },
  checkout: {
    title: "Finalizar compra",
    email: "Email",
    emailPlaceholder: "tucorreo@ejemplo.com",
    phone: "Teléfono",
    phonePlaceholder: "+595 981 000 000",
    delivery: "Entrega",
    deliveryLocal: "Local (Paraguay)",
    deliveryInternational: "Internacional",
    name: "Nombre y apellido",
    namePlaceholder: "Juan Pérez",
    address: "Dirección",
    addressPlaceholder: "Av. Mariscal López 1234",
    city: "Ciudad",
    cityPlaceholder: "Asunción",
    region: "Departamento / Región (opcional)",
    postalCode: "Código postal (opcional)",
    country: "País",
    notes: "Notas (opcional)",
    notesPlaceholder: "Instrucciones de entrega, horarios…",
    summary: "Resumen del pedido",
    subtotal: "Subtotal",
    placeOrder: "Confirmar pedido",
    empty: "Tu carrito está vacío. Agregá productos antes de finalizar la compra.",
    cartUnavailable: "No se pudo cargar el resumen del pedido.",
    errorEmpty: "Tu carrito está vacío.",
    errorUnavailable:
      "Uno o más productos de tu carrito ya no están disponibles. Revisá tu carrito antes de continuar.",
    errorGeneric: "No se pudo procesar el pedido. Inténtalo de nuevo.",
  },
  order: {
    confirmationTitle: "¡Gracias por tu pedido!",
    confirmationSubtitle:
      "Recibimos tu pedido. Te contactaremos por email o WhatsApp para coordinar el pago y la entrega.",
    number: "Número de pedido",
    status: "Estado",
    statusReceived: "Recibido",
    items: "Productos",
    subtotal: "Subtotal",
    shipping: "Datos de envío",
    contact: "Contacto",
    deliveryLocal: "Entrega local (Paraguay)",
    deliveryInternational: "Entrega internacional",
    notFound: "No encontramos ese pedido.",
    notFoundHint: "Verificá el número de pedido y el email, o consultá con nuestro equipo.",
    track: "Rastrear pedido",
    trackHint: "Ingresá el número de pedido y el email con el que compraste.",
    trackNumber: "Número de pedido",
    trackNumberPlaceholder: "TH-XXXXXXXX",
    trackEmail: "Email",
    trackButton: "Ver estado",
    backHome: "Volver al inicio",
    quantity: "Cantidad",
  },
  catalogError: "No se pudo cargar el catálogo.",
};

const en: typeof es = {
  meta: {
    title: "Theia — Ophthalmological equipment",
    description:
      "E-commerce catalog and storefront for ophthalmological equipment, sold to professionals in Paraguay and abroad.",
  },
  header: {
    products: "Products",
  },
  listing: {
    productsCount: (count: number) => `${count} products`,
  },
  card: {
    noImage: "No image",
    quoteOnly: "Quote only",
    unavailable: "Unavailable",
  },
  grid: {
    empty: "No products found.",
  },
  pagination: {
    previous: "← Previous",
    next: "Next →",
    pageOf: (page: number, pages: number) => `Page ${page} of ${pages}`,
  },
  filters: {
    search: "Search",
    searchPlaceholder: "Name or description",
    category: "Category",
    all: "All",
    brand: "Brand",
    certification: "Certification",
    any: "Any",
    priceMin: "Min. price (Gs)",
    priceMax: "Max. price (Gs)",
    sort: "Sort",
    newest: "Newest",
    priceAsc: "Price: low to high",
    priceDesc: "Price: high to low",
    apply: "Apply",
  },
  product: {
    unavailable: "Product unavailable",
    addToCart: "Add to cart",
    added: "Added to cart",
    requestQuote: "Request a quote",
    description: "Description",
    specifications: "Specifications",
    noImage: "No image",
    image: "Image",
  },
  home: {
    loNuevo: "New arrivals",
    popular: "Popular",
    promotions: "Promotions",
    previous: "Previous",
    next: "Next",
  },
  cart: {
    title: "Cart",
    empty: "Your cart is empty.",
    subtotal: "Subtotal",
    quantity: "Quantity",
    remove: "Remove",
    continueShopping: "Continue shopping",
    checkout: "Checkout",
    trackOrder: "Already ordered? Track your order",
  },
  checkout: {
    title: "Checkout",
    email: "Email",
    emailPlaceholder: "you@example.com",
    phone: "Phone",
    phonePlaceholder: "+595 981 000 000",
    delivery: "Delivery",
    deliveryLocal: "Local (Paraguay)",
    deliveryInternational: "International",
    name: "Full name",
    namePlaceholder: "Juan Pérez",
    address: "Address",
    addressPlaceholder: "Av. Mariscal López 1234",
    city: "City",
    cityPlaceholder: "Asunción",
    region: "Region (optional)",
    postalCode: "Postal code (optional)",
    country: "Country",
    notes: "Notes (optional)",
    notesPlaceholder: "Delivery instructions, schedule…",
    summary: "Order summary",
    subtotal: "Subtotal",
    placeOrder: "Place order",
    empty: "Your cart is empty. Add products before checking out.",
    cartUnavailable: "The order summary could not be loaded.",
    errorEmpty: "Your cart is empty.",
    errorUnavailable:
      "One or more products in your cart are no longer available. Review your cart before continuing.",
    errorGeneric: "The order could not be processed. Please try again.",
  },
  order: {
    confirmationTitle: "Thank you for your order!",
    confirmationSubtitle:
      "We received your order. We'll contact you by email or WhatsApp to arrange payment and delivery.",
    number: "Order number",
    status: "Status",
    statusReceived: "Received",
    items: "Items",
    subtotal: "Subtotal",
    shipping: "Shipping details",
    contact: "Contact",
    deliveryLocal: "Local delivery (Paraguay)",
    deliveryInternational: "International delivery",
    notFound: "We couldn't find that order.",
    notFoundHint: "Check the order number and email, or reach out to our team.",
    track: "Track order",
    trackHint: "Enter the order number and the email used at checkout.",
    trackNumber: "Order number",
    trackNumberPlaceholder: "TH-XXXXXXXX",
    trackEmail: "Email",
    trackButton: "View status",
    backHome: "Back to home",
    quantity: "Quantity",
  },
  catalogError: "The catalog could not be loaded.",
};

export type Dictionary = typeof es;

export const dictionaries: Record<Locale, Dictionary> = { es, en };

/** Server-side locale from the `lang` cookie. Do not call from client components. */
export function getLocale(): Locale {
  const value = cookies().get(LOCALE_COOKIE)?.value;
  return value === "en" ? "en" : DEFAULT_LOCALE;
}

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
