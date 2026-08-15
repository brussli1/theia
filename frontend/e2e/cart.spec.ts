import { expect, test } from "@playwright/test";

const VK_2S = "high-performance-digital-imaging-system-vk-2s";
const PY_FORWARDED_IP = "181.120.0.1";

test.describe("cart journey", () => {
  test("add from PDP, badge, subtotal in dollars for a foreign visitor", async ({ page }) => {
    await page.goto(`/productos/${VK_2S}`);
    await page.getByTestId("add-to-cart").click();
    await expect(page.getByTestId("cart-badge")).toHaveText("1");

    await page.goto("/carrito");
    await expect(page.getByText("High Performance Digital Imaging System VK-2s")).toBeVisible();
    await expect(page.getByTestId("cart-subtotal")).toContainText(/\$/);
    await expect(page.getByTestId("cart-subtotal")).toContainText(/142,86|142\.86/);
  });

  test("quantity updates change the subtotal", async ({ page }) => {
    await page.goto(`/productos/${VK_2S}`);
    await page.getByTestId("add-to-cart").click();
    await expect(page.getByTestId("cart-badge")).toHaveText("1");
    await page.goto("/carrito");

    await page.getByTestId("qty-plus").click();
    await expect(page.getByTestId("cart-badge")).toHaveText("2");
    await expect(page.getByTestId("cart-subtotal")).toContainText(/285,72|285\.72/);

    await page.getByTestId("qty-minus").click();
    await expect(page.getByTestId("cart-subtotal")).toContainText(/142,86|142\.86/);
  });

  test("cart persists across reloads", async ({ page }) => {
    await page.goto(`/productos/${VK_2S}`);
    await page.getByTestId("add-to-cart").click();
    await expect(page.getByTestId("cart-badge")).toHaveText("1");

    await page.reload();
    await expect(page.getByTestId("cart-badge")).toHaveText("1");
    await page.goto("/carrito");
    await expect(page.getByTestId("cart-subtotal")).toBeVisible();
  });

  test("removing the last item empties the cart", async ({ page }) => {
    await page.goto(`/productos/${VK_2S}`);
    await page.getByTestId("add-to-cart").click();
    await expect(page.getByTestId("cart-badge")).toHaveText("1");
    await page.goto("/carrito");

    await page.getByTestId("remove-item").click();
    await expect(page.getByTestId("cart-badge")).toHaveCount(0);
    await expect(page.getByText("Tu carrito está vacío.")).toBeVisible();
  });

  test("a Paraguayan visitor sees the subtotal in Guaraní", async ({ page }) => {
    await page.setExtraHTTPHeaders({ "x-forwarded-for": PY_FORWARDED_IP });
    await page.goto(`/productos/${VK_2S}`);
    await page.getByTestId("add-to-cart").click();
    await expect(page.getByTestId("cart-badge")).toHaveText("1");
    await page.goto("/carrito");

    await expect(page.getByTestId("cart-subtotal")).toContainText(/Gs/);
    await expect(page.getByTestId("cart-subtotal")).toContainText(/1\.000\.000/);
  });
});
