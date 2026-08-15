import { expect, test } from "@playwright/test";

// Content pages & SEO (#17). Read-only: the footer and content pages only
// render static copy, so this spec sorts mid-run without disturbing others.

const CONTENT_PAGES = [
  { path: "/soporte", heading: "Soporte técnico" },
  { path: "/contacto", heading: "Contacto" },
  { path: "/mapa", heading: "Mapa y ubicación" },
  { path: "/tos", heading: "Términos de uso" },
  { path: "/privacidad", heading: "Política de privacidad" },
  { path: "/usados", heading: "Equipamiento usado" },
  { path: "/alquiler", heading: "Alquiler de equipos" },
];

test("footer links to every content page", async ({ page }) => {
  await page.goto("/");
  const footer = page.getByTestId("footer");
  await expect(footer).toBeVisible();
  for (const { path } of CONTENT_PAGES) {
    await expect(footer.locator(`a[href="${path}"]`)).toBeVisible();
  }
});

for (const { path, heading } of CONTENT_PAGES) {
  test(`${path} renders its content with page metadata`, async ({ page }) => {
    await page.goto(path);
    await expect(
      page.getByRole("heading", { level: 1, name: heading }),
    ).toBeVisible();
    await expect(page).toHaveTitle(new RegExp(`${heading} — Theia`));
  });
}

test("soporte links to the contact channels", async ({ page }) => {
  await page.goto("/soporte");
  await expect(page.getByTestId("support-whatsapp")).toHaveAttribute("href", /wa\.me/);
  await expect(page.getByTestId("support-email")).toHaveAttribute("href", /mailto:td\.phakos@gmail\.com/);
});

test("contacto shows the business channels", async ({ page }) => {
  await page.goto("/contacto");
  const main = page.getByRole("main");
  await expect(main.getByText("td.phakos@gmail.com")).toBeVisible();
  await expect(main.getByText("+595 971 282 908")).toBeVisible();
  await expect(main.getByRole("link", { name: "Equipamiento usado" })).toHaveAttribute(
    "href",
    "/usados",
  );
  await expect(main.getByRole("link", { name: "Alquileres" })).toHaveAttribute(
    "href",
    "/alquiler",
  );
});

test("mapa embeds a map of Asunción", async ({ page }) => {
  await page.goto("/mapa");
  await expect(page.locator("iframe")).toHaveAttribute(
    "src",
    /google\.com\/maps/,
  );
});

test("usados drives to the quote flow with the used kind preselected", async ({ page }) => {
  await page.goto("/usados");
  await page.getByTestId("usados-cta").click();
  await expect(page).toHaveURL(/\/cotizacion\?tipo=used/);
  await expect(page.getByTestId("quote-kind-used")).toBeChecked();
  await expect(page.getByTestId("quote-product")).toHaveCount(0);
});

test("alquiler drives to the quote flow with the rental kind preselected", async ({ page }) => {
  await page.goto("/alquiler");
  await page.getByTestId("alquiler-cta").click();
  await expect(page).toHaveURL(/\/cotizacion\?tipo=rental/);
  await expect(page.getByTestId("quote-kind-rental")).toBeChecked();
  await expect(page.getByTestId("quote-product")).toHaveCount(0);
});

test("sitemap.xml lists the content and catalog routes", async ({ page }) => {
  const response = await page.goto("/sitemap.xml");
  expect(response?.status()).toBe(200);
  const body = await response?.text();
  for (const path of ["/soporte", "/contacto", "/mapa", "/tos", "/privacidad", "/usados", "/alquiler", "/productos"]) {
    expect(body).toContain(`<loc>http://localhost:3000${path}</loc>`);
  }
  expect(body).toContain("<loc>http://localhost:3000/productos/");
});

test("robots.txt allows crawling but blocks the admin panel", async ({ page }) => {
  const response = await page.goto("/robots.txt");
  expect(response?.status()).toBe(200);
  const body = await response?.text();
  expect(body).toContain("User-Agent: *");
  expect(body).toContain("Disallow: /admin/");
  expect(body).toContain("Sitemap: http://localhost:3000/sitemap.xml");
});
