import { expect, test } from "@playwright/test";

test("PDP renders gallery, specs, badges, and visitor-currency price", async ({ page }) => {
  await page.goto("/productos/high-performance-digital-imaging-system-vk-2s");
  await expect(page.getByRole("heading", { name: /VK-2s/ })).toBeVisible();
  await expect(page.getByText("CE", { exact: true })).toBeVisible();
  await expect(page.getByText("Magnification")).toBeVisible();
  await expect(page.getByText("10x-16x")).toBeVisible();
  const price = page.getByTestId("price");
  await expect(price).toContainText(/\$/);
  await expect(price).not.toContainText(/Gs|₲/);
  await page.getByLabel("Imagen 2").click();
  await expect(page.getByLabel("Imagen 2")).toHaveClass(/border-slate-900/);
});

test("structured description renders the sanitized fragment with bold lead-ins", async ({
  page,
}) => {
  await page.goto("/productos/high-performance-digital-imaging-system-vk-2s");
  const description = page.getByTestId("structured-description");
  await expect(description).toBeVisible();
  await expect(description.locator("strong")).toContainText("ultra-widefield");
});

test("orderable product shows add-to-cart, not quote", async ({ page }) => {
  await page.goto("/productos/high-performance-digital-imaging-system-vk-2s");
  await expect(page.getByRole("button", { name: "Agregar al carrito" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Solicitar cotización" })).toHaveCount(0);
});

test("quote-only product shows quote action, not add-to-cart", async ({ page }) => {
  await page.goto("/productos/hhou-7040-refraction-units");
  await expect(page.getByRole("link", { name: "Solicitar cotización" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Agregar al carrito" })).toHaveCount(0);
});

test("unavailable product is clearly marked; actions follow orderability", async ({
  page,
}) => {
  await page.goto("/productos/auto-refractor-huvitz-hrk-1");
  await expect(page.getByText("Producto no disponible")).toBeVisible();
  await expect(page.getByRole("button", { name: "Agregar al carrito" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Solicitar cotización" })).toHaveCount(0);
});

test("listing card links to the PDP", async ({ page }) => {
  await page.goto("/productos");
  await page.getByText("High Performance Digital Imaging System VK-2s").click();
  await expect(page).toHaveURL(/\/productos\/high-performance-digital-imaging-system-vk-2s$/);
});

test("related section renders cross-links to existing targets", async ({ page }) => {
  await page.goto("/productos/high-performance-digital-imaging-system-vk-2s");
  const section = page.getByTestId("related-section");
  await expect(section).toBeVisible();
  await expect(section).toContainText("Relacionados");
  const category = section.getByRole("link", { name: "Auto-refractores" });
  await expect(category).toHaveAttribute("href", "/categorias/auto-refractores");
  const product = section.getByRole("link", { name: "HHOU 7040 Refraction Units" });
  await expect(product).toHaveAttribute("href", "/productos/hhou-7040-refraction-units");
});

test("no related section when the product has no cross-links", async ({ page }) => {
  await page.goto("/productos/kowa-vk-90-fundus-camera");
  await expect(page.getByTestId("related-section")).toHaveCount(0);
});
