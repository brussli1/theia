import { expect, test } from "@playwright/test";

test("mega-menu hover reveals leaf categories and navigates", async ({ page }) => {
  await page.goto("/productos");
  const banner = page.getByRole("banner");
  if ((await banner.getByTestId("menu-trigger-exam-room-essentials").count()) === 0) {
    test.skip(true, "imported category tree not present (run scripts.uso_import)");
  }
  await banner.getByTestId("menu-trigger-exam-room-essentials").hover();
  const panel = banner.getByTestId("menu-panel-exam-room-essentials");
  await expect(panel).toBeVisible();
  await panel.getByRole("link", { name: "Autorefractors", exact: true }).first().click();
  await expect(page).toHaveURL(/\/categorias\/autorefractors$/);
  await expect(page.getByRole("heading", { name: "Autorefractors" })).toBeVisible();
  await expect(page.getByTestId("product-card").first()).toBeVisible();
});

test("mega-menu opens on keyboard focus", async ({ page }) => {
  await page.goto("/productos");
  const banner = page.getByRole("banner");
  if ((await banner.getByTestId("menu-trigger-optical").count()) === 0) {
    test.skip(true, "imported category tree not present (run scripts.uso_import)");
  }
  await banner.getByTestId("menu-trigger-optical").focus();
  const panel = banner.getByTestId("menu-panel-optical");
  await expect(panel).toBeVisible();
  await panel.getByRole("link", { name: "Edgers", exact: true }).click();
  await expect(page).toHaveURL(/\/categorias\/edgers$/);
  await expect(page.getByRole("heading", { name: "Edgers" })).toBeVisible();
});

test("mega-menu opens by tap on a mobile viewport", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.goto("/productos");
  const banner = page.getByRole("banner");
  if ((await banner.getByTestId("menu-trigger-specialized-equipment").count()) === 0) {
    await context.close();
    test.skip(true, "imported category tree not present (run scripts.uso_import)");
  }
  await banner.getByTestId("menu-trigger-specialized-equipment").tap();
  const panel = banner.getByTestId("menu-panel-specialized-equipment");
  await expect(panel).toBeVisible();
  await panel.getByRole("link", { name: "Dry Eye", exact: true }).click();
  await expect(page).toHaveURL(/\/categorias\/dry-eye$/);
  await context.close();
});

test("childless categories stay plain header links", async ({ page }) => {
  await page.goto("/productos");
  const banner = page.getByRole("banner");
  await expect(banner.getByRole("link", { name: "Auto-refractores" })).toBeVisible();
  await banner.getByRole("link", { name: "Auto-refractores" }).click();
  await expect(page).toHaveURL(/\/categorias\/auto-refractores$/);
});

test("parent category page lists its child categories", async ({ page }) => {
  await page.goto("/categorias/exam-room-essentials");
  const main = page.getByRole("main");
  if ((await main.getByTestId("child-category-link").count()) === 0) {
    test.skip(true, "imported category tree not present (run scripts.uso_import)");
  }
  await expect(main.getByRole("heading", { name: "Exam Room Essentials" })).toBeVisible();
  await expect(main.getByTestId("child-category-link")).toHaveCount(7);
  await main.getByRole("link", { name: "Refraction" }).click();
  await expect(page).toHaveURL(/\/categorias\/refraction$/);
});

test("subgroup category page lists its leaf children", async ({ page }) => {
  await page.goto("/categorias/refraction");
  const main = page.getByRole("main");
  if ((await main.getByTestId("child-category-link").count()) === 0) {
    test.skip(true, "imported category tree not present (run scripts.uso_import)");
  }
  await expect(main.getByTestId("child-category-link")).toHaveCount(2);
  await expect(main.getByRole("link", { name: "Autorefractors" })).toBeVisible();
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
