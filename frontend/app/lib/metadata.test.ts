import { describe, expect, it } from "vitest";
import { pageMetadata } from "./metadata";

describe("pageMetadata", () => {
  it("sets the title and description", () => {
    const meta = pageMetadata({
      locale: "es",
      title: "Soporte técnico — Theia",
      description: "Instalación y mantenimiento de equipos oftalmológicos.",
      path: "/soporte",
    });
    expect(meta.title).toBe("Soporte técnico — Theia");
    expect(meta.description).toBe("Instalación y mantenimiento de equipos oftalmológicos.");
  });

  it("builds the canonical and Open Graph url from the site URL", () => {
    const meta = pageMetadata({
      locale: "es",
      title: "Contacto — Theia",
      description: "Contactate con Theia.",
      path: "/contacto",
    });
    expect(meta.alternates?.canonical).toBe("http://localhost:3000/contacto");
    expect(meta.openGraph?.url).toBe("http://localhost:3000/contacto");
    expect(meta.openGraph).toMatchObject({ siteName: "Theia", type: "website" });
  });

  it("maps the locale to the Open Graph locale", () => {
    const es = pageMetadata({
      locale: "es",
      title: "Contacto — Theia",
      description: "Contactate con Theia.",
      path: "/contacto",
    });
    const en = pageMetadata({
      locale: "en",
      title: "Contact — Theia",
      description: "Reach Theia.",
      path: "/contacto",
    });
    expect(es.openGraph?.locale).toBe("es_PY");
    expect(en.openGraph?.locale).toBe("en_US");
  });

  it("marks pages noindex on request", () => {
    const meta = pageMetadata({
      locale: "es",
      title: "Carrito — Theia",
      description: "Tu carrito.",
      path: "/carrito",
      noIndex: true,
    });
    expect(meta.robots).toEqual({ index: false, follow: false });
  });

  it("keeps only absolute image urls for Open Graph", () => {
    const meta = pageMetadata({
      locale: "es",
      title: "Producto — Theia",
      description: "Un equipo.",
      path: "/productos/ejemplo",
      images: ["http://localhost:8000/media/a.jpg", "/media/b.jpg"],
    });
    expect(meta.openGraph?.images).toEqual([{ url: "http://localhost:8000/media/a.jpg" }]);
  });

  it("truncates long descriptions", () => {
    const meta = pageMetadata({
      locale: "es",
      title: "Título",
      description: "x".repeat(300),
      path: "/x",
    });
    expect(meta.description).toBe(`${"x".repeat(159)}…`);
  });
});
