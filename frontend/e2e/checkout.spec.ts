import { expect, test } from "@playwright/test";

const VK_2S = "high-performance-digital-imaging-system-vk-2s";
const CUSTOMER = {
  email: "cliente@ejemplo.com",
  phone: "+595 981 000 000",
  name: "Juan Pérez",
  address: "Av. Mariscal López 1234",
  city: "Asunción",
  country: "Paraguay",
};

async function fillCheckoutForm(page: import("@playwright/test").Page) {
  await page.getByTestId("checkout-email").fill(CUSTOMER.email);
  await page.getByTestId("checkout-phone").fill(CUSTOMER.phone);
  await page.getByTestId("checkout-name").fill(CUSTOMER.name);
  await page.getByTestId("checkout-address").fill(CUSTOMER.address);
  await page.getByTestId("checkout-city").fill(CUSTOMER.city);
  await page.getByTestId("checkout-country").fill(CUSTOMER.country);
}

test.describe("guest checkout journey", () => {
  test("check out a cart and see the order confirmation", async ({ page }) => {
    await page.goto(`/productos/${VK_2S}`);
    await page.getByTestId("add-to-cart").click();
    await expect(page.getByTestId("cart-badge")).toHaveText("1");

    await page.goto("/carrito");
    await expect(page.getByTestId("cart-subtotal")).toContainText(/142,86|142\.86/);
    await page.getByTestId("go-to-checkout").click();

    await expect(page.getByTestId("checkout-subtotal")).toContainText(/142,86|142\.86/);
    // All three payment methods are offered; Western Union is the default.
    await expect(page.getByTestId("payment-paypal")).toBeVisible();
    await expect(page.getByTestId("payment-western-union")).toBeChecked();
    await expect(page.getByTestId("payment-card")).toBeVisible();
    await fillCheckoutForm(page);
    await page.getByTestId("place-order").click();

    await expect(page).toHaveURL(/\/pedido\/TH-[A-Z2-9]{8}/);
    await expect(page.getByTestId("order-number")).toContainText(/TH-[A-Z2-9]{8}/);
    await expect(page.getByTestId("order-status")).toHaveText("Esperando pago");
    await expect(page.getByTestId("order-item")).toContainText(
      "High Performance Digital Imaging System VK-2s",
    );
    await expect(page.getByTestId("order-subtotal")).toContainText(/142,86|142\.86/);
    await expect(page.getByText(CUSTOMER.address)).toBeVisible();

    // Western Union: the order waits for payment and shows the instructions.
    await expect(page.getByTestId("payment-method")).toContainText("Western Union");
    await expect(page.getByTestId("payment-amount")).toContainText(/Gs\.?\s*1\.000\.000/);
    await expect(page.getByTestId("wu-instructions")).toBeVisible();

    // The cart was consumed by the order.
    await expect(page.getByTestId("cart-badge")).toHaveCount(0);
    await page.goto("/carrito");
    await expect(page.getByText("Tu carrito está vacío.")).toBeVisible();
  });

  test("paying by PayPal redirects and confirms the order as paid", async ({ page }) => {
    await page.goto(`/productos/${VK_2S}`);
    await page.getByTestId("add-to-cart").click();
    await expect(page.getByTestId("cart-badge")).toHaveText("1");
    await page.goto("/carrito");
    await page.getByTestId("go-to-checkout").click();
    await fillCheckoutForm(page);
    await page.getByTestId("payment-paypal").check();
    await page.getByTestId("place-order").click();

    // Sandbox gateway: the buyer is sent to the payment page and comes back
    // to the order page, which confirms the payment as paid.
    await expect(page).toHaveURL(/\/pedido\/TH-[A-Z2-9]{8}/);
    await expect(page.getByTestId("order-status")).toHaveText("Pagado");
    await expect(page.getByTestId("payment-method")).toContainText("PayPal");
  });

  test("an order status can be tracked later with number and email", async ({ page }) => {
    await page.goto(`/productos/${VK_2S}`);
    await page.getByTestId("add-to-cart").click();
    await expect(page.getByTestId("cart-badge")).toHaveText("1");
    await page.goto("/carrito");
    await page.getByTestId("go-to-checkout").click();
    await fillCheckoutForm(page);
    await page.getByTestId("place-order").click();
    await expect(page).toHaveURL(/\/pedido\/TH-[A-Z2-9]{8}/);
    const orderNumber = await page.getByTestId("order-number").textContent();

    await page.goto("/pedido");
    await page.getByTestId("track-number").fill(orderNumber!.trim());
    await page.getByTestId("track-email").fill(CUSTOMER.email);
    await page.getByTestId("track-submit").click();

    await expect(page).toHaveURL(/\/pedido\/TH-[A-Z2-9]{8}/);
    await expect(page.getByTestId("order-status")).toHaveText("Esperando pago");
    await expect(page.getByTestId("order-item")).toContainText(
      "High Performance Digital Imaging System VK-2s",
    );
  });

  test("a wrong email cannot see an order", async ({ page }) => {
    await page.goto(`/productos/${VK_2S}`);
    await page.getByTestId("add-to-cart").click();
    await expect(page.getByTestId("cart-badge")).toHaveText("1");
    await page.goto("/carrito");
    await page.getByTestId("go-to-checkout").click();
    await fillCheckoutForm(page);
    await page.getByTestId("place-order").click();
    await expect(page).toHaveURL(/\/pedido\/TH-[A-Z2-9]{8}/);
    const orderNumber = await page.getByTestId("order-number").textContent();

    await page.goto(`/pedido/${orderNumber!.trim()}?email=otro%40ejemplo.com`);
    await expect(page.getByText("No encontramos ese pedido.")).toBeVisible();
  });
});
