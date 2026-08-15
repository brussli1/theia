import { expect, test } from "@playwright/test";

test("navigation surfaces categories from the API", async ({ page }) => {
  await page.goto("/productos");
  await expect(page.getByRole("link", { name: "ANALYTICAL INSTRUMENTS" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Auto-refractores" })).toBeVisible();
  await page.getByRole("link", { name: "Auto-refractores" }).click();
  await expect(page).toHaveURL(/\/categorias\/auto-refractores$/);
});

test("category page lists only its products", async ({ page }) => {
  await page.goto("/categorias/auto-refractores");
  await expect(page.getByRole("heading", { name: "Auto-refractores" })).toBeVisible();
  await expect(page.getByText("Auto-refractor Huvitz HRK-1")).toBeVisible();
  await expect(page.getByText("High Performance Digital Imaging System VK-2s")).toHaveCount(0);
  await expect(page.getByText("1 productos")).toBeVisible();
});

test("brand page lists only its products", async ({ page }) => {
  await page.goto("/marcas/kowa");
  await expect(page.getByRole("heading", { name: "Kowa" })).toBeVisible();
  await expect(page.getByText("High Performance Digital Imaging System VK-2s")).toBeVisible();
  await expect(page.getByText("Kowa VK-90 Fundus Camera")).toBeVisible();
  await expect(page.getByText("Auto-refractor Huvitz HRK-1")).toHaveCount(0);
  await expect(page.getByText("2 productos")).toBeVisible();
});

test("unknown category and brand slugs return 404", async ({ page }) => {
  await page.goto("/categorias/no-existe");
  await expect(page.getByText("404")).toBeVisible();
  await page.goto("/marcas/no-existe");
  await expect(page.getByText("404")).toBeVisible();
});
