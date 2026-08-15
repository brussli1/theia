import { expect, test } from "@playwright/test";

test("listing renders products with brands and prices", async ({ page }) => {
  await page.goto("/productos");
  await expect(page.getByRole("heading", { name: "Productos" })).toBeVisible();
  await expect(page.getByText("High Performance Digital Imaging System VK-2s")).toBeVisible();
  await expect(page.getByText("Auto-refractor Huvitz HRK-1")).toBeVisible();
  await expect(
    page.getByTestId("product-card").getByText(/Kowa/).first()
  ).toBeVisible();
});

test("quote-only and unavailable products are labelled", async ({ page }) => {
  await page.goto("/productos");
  const quoteOnly = page.getByText("Solo cotización");
  await expect(quoteOnly).toBeVisible();
  const unavailable = page.getByText("No disponible");
  await expect(unavailable).toBeVisible();
});

test("search narrows the results", async ({ page }) => {
  await page.goto("/productos");
  await page.getByPlaceholder("Nombre o descripción").fill("refraction");
  await page.getByRole("button", { name: "Aplicar" }).click();
  await expect(page.getByText("HHOU 7040 Refraction Units")).toBeVisible();
  await expect(page.getByText("High Performance Digital Imaging System VK-2s")).toHaveCount(0);
});

test("filtering by category works", async ({ page }) => {
  await page.goto("/productos");
  await page.getByLabel("Categoría").selectOption("auto-refractores");
  await page.getByRole("button", { name: "Aplicar" }).click();
  await expect(page.getByText("Auto-refractor Huvitz HRK-1")).toBeVisible();
  await expect(page.getByText("High Performance Digital Imaging System VK-2s")).toHaveCount(0);
});
