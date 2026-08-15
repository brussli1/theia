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
    subtitle: "Plataforma de venta de equipos oftalmológicos",
    viewProducts: "Ver productos",
    backend: "Backend",
    database: "Base de datos",
  },
  cart: {
    title: "Carrito",
    empty: "Tu carrito está vacío.",
    subtotal: "Subtotal",
    quantity: "Cantidad",
    remove: "Quitar",
    continueShopping: "Seguir comprando",
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
    subtitle: "Storefront platform for ophthalmological equipment",
    viewProducts: "View products",
    backend: "Backend",
    database: "Database",
  },
  cart: {
    title: "Cart",
    empty: "Your cart is empty.",
    subtotal: "Subtotal",
    quantity: "Quantity",
    remove: "Remove",
    continueShopping: "Continue shopping",
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
