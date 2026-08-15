import { expect, test } from "@playwright/test";

test("carousel renders and links to a product page", async ({ page }) => {
  await page.goto("/");
  const carousel = page.getByTestId("carousel");
  await expect(carousel).toBeVisible();
  await expect(carousel).toContainText("High Performance Digital Imaging System VK-2s");

  await page.getByTestId("carousel-slide").click();
  await expect(page).toHaveURL(/\/productos\/high-performance-digital-imaging-system-vk-2s$/);
});

test("carousel arrows cycle through the curated slides", async ({ page }) => {
  await page.goto("/");
  const carousel = page.getByTestId("carousel");
  await carousel.getByRole("button", { name: "Siguiente" }).click();
  await expect(carousel).toContainText("HHOU 7040 Refraction Units");
});

test("Lo Nuevo shows the newest products automatically", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Lo Nuevo" })).toBeVisible();
  const firstCard = page.getByTestId("product-card").first();
  await expect(firstCard).toContainText("Kowa VK-90 Fundus Camera");
});

test("Popular and Promociones show curated product lists", async ({ page }) => {
  await page.goto("/");
  const popular = page.getByRole("heading", { name: "Popular" }).locator("..");
  await expect(popular.getByText("High Performance Digital Imaging System VK-2s")).toBeVisible();
  await expect(popular.getByText("Kowa VK-90 Fundus Camera")).toBeVisible();
  await expect(popular.getByText("Auto-refractor Huvitz HRK-1")).toHaveCount(0);
  await expect(popular.getByText("HHOU 7040 Refraction Units")).toHaveCount(0);

  const promotions = page.getByRole("heading", { name: "Promociones" }).locator("..");
  await expect(promotions.getByText("HHOU 7040 Refraction Units")).toBeVisible();
});

test("homepage cards show the visitor currency", async ({ page }) => {
  await page.goto("/");
  const cardPrice = page.getByTestId("card-price").first();
  await expect(cardPrice).toContainText(/\$/);
});
