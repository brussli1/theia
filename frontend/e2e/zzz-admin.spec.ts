import { expect, test } from "@playwright/test";

const ADMIN = { email: "admin@theia.test", password: "admin-secret-pass-123" };
const VK_2S = "High Performance Digital Imaging System VK-2s";
const UNIQUE = `admin-e2e-${Date.now()}`;

/** The E2E backend bootstraps this account at startup (e2e_server.sh). */
async function adminLogin(page: import("@playwright/test").Page) {
  await page.goto("/admin");
  await expect(page.getByTestId("login-form")).toBeVisible();
  await page.getByTestId("login-email").fill(ADMIN.email);
  await page.getByTestId("login-password").fill(ADMIN.password);
  await page.getByTestId("login-submit").click();
  // The login redirects from /admin to /admin, so the URL cannot be the
  // wait; the dashboard renders only for an admin session.
  await expect(page.getByTestId("admin-dashboard")).toBeVisible();
}

test("admin login gates the panel and customers are denied", async ({ page }) => {
  await page.goto("/admin");
  await expect(page.getByTestId("login-form")).toBeVisible();

  // A signed-in customer sees the denial, not the panel.
  await page.goto("/cuenta");
  await page.getByTestId("register-name").fill("Cliente");
  await page.getByTestId("register-email").fill(`${UNIQUE}@ejemplo.com`);
  await page.getByTestId("register-password").fill("secret-pass-123");
  await page.getByTestId("register-submit").click();
  await expect(page.getByTestId("account-logout")).toBeVisible();
  await page.goto("/admin");
  await expect(page.getByText("No tenés permisos de administración.")).toBeVisible();
  await expect(page.getByTestId("admin-dashboard")).toHaveCount(0);
});

test("admin can create, edit and deactivate a product", async ({ page }) => {
  await adminLogin(page);

  await page.getByTestId("admin-nav-products").click();
  await page.getByTestId("admin-new-product").click();
  await expect(page.getByTestId("admin-product-form")).toBeVisible();

  const name = `${UNIQUE} Refractómetro`;
  await page.getByTestId("admin-product-name").fill(name);
  await page.getByTestId("admin-product-description").fill("Equipo de prueba E2E.");
  await page.getByTestId("admin-product-price-gs").fill("12345678");
  await page.getByTestId("admin-product-price-usd").fill("1763.67");
  await page.getByTestId("admin-product-certifications").fill("CE, fda");
  await page.getByTestId("admin-product-category").selectOption({ label: "Auto-refractores" });
  await page.getByTestId("admin-product-brand").selectOption({ label: "Huvitz" });

  // One specification row, then save; the action lands back on the list.
  await page.getByTestId("admin-spec-add").click();
  await page.getByTestId("admin-spec-key").fill("Type");
  await page.getByTestId("admin-spec-value").fill("Auto");
  await page.getByTestId("admin-product-save").click();

  const row = page.getByTestId("admin-product-row").filter({ hasText: name });
  await expect(row).toBeVisible();
  await expect(row.getByTestId("admin-product-status")).toHaveText("Disponible");

  // Edit: rename and deactivate from the row.
  await row.getByTestId("admin-edit-product").click();
  await expect(page.getByTestId("admin-product-form")).toBeVisible();
  await expect(page.getByTestId("admin-product-name")).toHaveValue(name);
  await page.getByTestId("admin-product-name").fill(`${name} Pro`);
  await page.getByTestId("admin-product-available").uncheck();
  await page.getByTestId("admin-product-save").click();

  const editedRow = page.getByTestId("admin-product-row").filter({ hasText: `${name} Pro` });
  await expect(editedRow).toBeVisible();
  await expect(editedRow.getByTestId("admin-product-status")).toHaveText("No disponible");

  // Reactivate via the row toggle.
  await editedRow.getByTestId("admin-toggle-availability").click();
  await expect(editedRow.getByTestId("admin-product-status")).toHaveText("Disponible");

  // The storefront reflects the reactivated product.
  await page.goto("/");
  await page.getByRole("link", { name: `${name} Pro` }).first().click();
  await expect(page.getByText(`${name} Pro`, { exact: true }).first()).toBeVisible();
});

test("admin can manage categories and brands", async ({ page }) => {
  await adminLogin(page);

  const categoryName = `${UNIQUE} Categoría`;
  await page.getByTestId("admin-nav-categories").click();
  await page.getByTestId("admin-category-create-name").fill(categoryName);
  await page.getByTestId("admin-category-create-submit").click();

  // The created row renders its name as the input's defaultValue, so the
  // row is locatable by the value attribute; Playwright's filter() has no
  // value matcher, hence the CSS selector.
  const categoryRow = page
    .getByTestId("admin-category")
    .locator("li", { has: page.locator(`input[data-testid="admin-category-name"][value="${categoryName}"]`) });
  await expect(categoryRow.getByTestId("admin-category-name")).toHaveValue(categoryName);

  // Rename in place.
  const renamedName = `${categoryName} 2`;
  await categoryRow.getByTestId("admin-category-name").fill(renamedName);
  await categoryRow.getByTestId("admin-category-save").click();
  const renamedRow = page
    .getByTestId("admin-category")
    .locator("li", { has: page.locator(`input[data-testid="admin-category-name"][value="${renamedName}"]`) });
  await expect(renamedRow.getByTestId("admin-category-name")).toHaveValue(renamedName);

  // Delete with the confirmation dialog.
  page.on("dialog", (dialog) => dialog.accept());
  await renamedRow.getByTestId("admin-category-delete").click();
  await expect(renamedRow).toHaveCount(0);

  const brandName = `${UNIQUE} Marca`;
  await page.getByTestId("admin-nav-brands").click();
  await page.getByTestId("admin-brand-create-name").fill(brandName);
  await page.getByTestId("admin-brand-create-submit").click();
  const brandRow = page
    .getByTestId("admin-brand")
    .locator("li", { has: page.locator(`input[data-testid="admin-brand-name"][value="${brandName}"]`) });
  await expect(brandRow.getByTestId("admin-brand-name")).toHaveValue(brandName);
});

test("admin can curate a collection and the homepage follows", async ({ page }) => {
  await adminLogin(page);

  await page.getByTestId("admin-nav-collections").click();
  const carousel = page.getByTestId("admin-collection-carousel");
  const orderItems = carousel.getByTestId("admin-collection-order-item");

  // Wait for the section to render: count() polls nothing, so it must not
  // run against the pre-render shell (it would see an empty list and skip).
  await expect(carousel.getByTestId("admin-collection-save")).toBeVisible();

  // Clear the carousel first so the order is deterministic; wait for each
  // removal to land so clicks never race the React re-render.
  for (let remaining = await orderItems.count(); remaining > 0; ) {
    await carousel.getByTestId("admin-collection-remove").first().click();
    await expect(orderItems).toHaveCount(remaining - 1);
    remaining -= 1;
  }

  const vkRow = carousel
    .getByTestId("admin-collection-available")
    .locator("li")
    .filter({ hasText: VK_2S });
  await vkRow.getByTestId("admin-collection-add").click();
  await carousel.getByTestId("admin-collection-save").click();
  await expect(carousel.getByTestId("admin-collection-order-item")).toContainText(VK_2S);

  // The homepage carousel reflects the curated list.
  await page.goto("/");
  await expect(page.getByRole("heading", { name: VK_2S }).first()).toBeVisible();
});

test("admin can upload a product image", async ({ page }) => {
  await adminLogin(page);

  await page.getByTestId("admin-nav-products").click();
  await page.getByTestId("admin-new-product").click();

  const name = `${UNIQUE} Con Imagen`;
  await page.getByTestId("admin-product-name").fill(name);
  await page.getByTestId("admin-product-price-gs").fill("1000000");
  await page.getByTestId("admin-product-price-usd").fill("142.86");

  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64",
  );
  await page.getByTestId("admin-image-file").setInputFiles({
    name: "pixel.png",
    mimeType: "image/png",
    buffer: png,
  });
  await page.getByTestId("admin-image-upload").click();
  await expect(page.getByTestId("admin-image-list").locator("img")).toHaveCount(1);

  await page.getByTestId("admin-product-save").click();
  const row = page.getByTestId("admin-product-row").filter({ hasText: name });
  await expect(row).toBeVisible();

  // The uploaded image renders on the storefront page.
  await page.goto("/");
  await page.getByRole("link", { name }).first().click();
  await expect(page.locator("img[src*='/media/']").first()).toBeVisible();
});
