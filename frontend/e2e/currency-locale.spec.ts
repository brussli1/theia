import { expect, test } from "@playwright/test";

const PY_FORWARDED_IP = "181.120.0.1";

test.describe("visitor currency", () => {
  test("a Paraguayan visitor sees Guaraní prices", async ({ page }) => {
    await page.setExtraHTTPHeaders({ "x-forwarded-for": PY_FORWARDED_IP });
    await page.goto("/productos");
    const cardPrice = page.getByTestId("card-price").first();
    await expect(cardPrice).toContainText(/Gs|₲/);
    await expect(cardPrice).not.toContainText(/\$/);
    await page.goto("/productos/high-performance-digital-imaging-system-vk-2s");
    await expect(page.getByTestId("price")).toContainText(/Gs|₲/);
  });

  test("a foreign visitor sees dollar prices", async ({ page }) => {
    await page.setExtraHTTPHeaders({ "x-forwarded-for": "8.8.8.8" });
    await page.goto("/productos");
    const cardPrice = page.getByTestId("card-price").first();
    await expect(cardPrice).toContainText(/\$/);
    await expect(cardPrice).not.toContainText(/Gs|₲/);
  });
});

test.describe("locale switcher", () => {
  test("toggles the storefront between Spanish and English", async ({ page }) => {
    const headerNav = page.getByRole("banner").getByRole("navigation");
    await page.goto("/productos");
    await expect(headerNav.getByRole("link", { name: "Productos" })).toBeVisible();
    await expect(page).toHaveTitle(/Productos — Theia/);

    await switchTo("English", "en");
    await expect(headerNav.getByRole("link", { name: "Products" })).toBeVisible();
    await expect(page).toHaveTitle(/Products — Theia/);

    await switchTo("Español", "es");
    await expect(headerNav.getByRole("link", { name: "Productos" })).toBeVisible();

    async function switchTo(label: string, lang: "es" | "en") {
      await expect
        .poll(async () => {
          await page.getByRole("button", { name: label }).click();
          return page.locator("html").getAttribute("lang");
        }, { timeout: 10_000 })
        .toBe(lang);
    }
  });
});
