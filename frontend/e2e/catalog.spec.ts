import { expect, test } from "@playwright/test";

test("mega-menu hover reveals leaf categories and navigates", async ({ page }) => {
  await page.goto("/productos");
  if ((await page.getByTestId("menu-trigger-exam-room-essentials").count()) === 0) {
    test.skip(true, "imported category tree not present (run scripts.uso_import)");
  }
  await page.getByTestId("menu-trigger-exam-room-essentials").hover();
  const panel = page.getByTestId("menu-panel-exam-room-essentials");
  await expect(panel).toBeVisible();
  await panel.getByRole("link", { name: "Autorefractors", exact: true }).first().click();
  await expect(page).toHaveURL(/\/categorias\/autorefractors$/);
});

test("mega-menu opens on keyboard focus", async ({ page }) => {
  await page.goto("/productos");
  if ((await page.getByTestId("menu-trigger-optical").count()) === 0) {
    test.skip(true, "imported category tree not present (run scripts.uso_import)");
  }
  await page.getByTestId("menu-trigger-optical").focus();
  const panel = page.getByTestId("menu-panel-optical");
  await expect(panel).toBeVisible();
  await panel.getByRole("link", { name: "Edgers", exact: true }).click();
  await expect(page).toHaveURL(/\/categorias\/edgers$/);
});

test("childless categories stay plain header links", async ({ page }) => {
  await page.goto("/productos");
  await expect(page.getByRole("link", { name: "Auto-refractores" })).toBeVisible();
  await page.getByRole("link", { name: "Auto-refractores" }).click();
  await expect(page).toHaveURL(/\/categorias\/auto-refractores$/);
});

test("parent category page lists its child categories", async ({ page }) => {
  await page.goto("/categorias/exam-room-essentials");
  if ((await page.getByTestId("child-category-link").count()) === 0) {
    test.skip(true, "imported category tree not present (run scripts.uso_import)");
  }
  await expect(page.getByRole("heading", { name: "Exam Room Essentials" })).toBeVisible();
  await expect(page.getByTestId("child-category-link")).toHaveCount(7);
  await page.getByRole("link", { name: "Refraction" }).click();
  await expect(page).toHaveURL(/\/categorias\/refraction$/);
});

test("subgroup category page lists its leaf children", async ({ page }) => {
  await page.goto("/categorias/refraction");
  if ((await page.getByTestId("child-category-link").count()) === 0) {
    test.skip(true, "imported category tree not present (run scripts.uso_import)");
  }
  await expect(page.getByTestId("child-category-link")).toHaveCount(2);
  await expect(page.getByRole("link", { name: "Autorefractors" })).toBeVisible();
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
