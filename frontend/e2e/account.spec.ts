import { expect, test } from "@playwright/test";

const VK_2S = "high-performance-digital-imaging-system-vk-2s";
const CUSTOMER = {
  name: "Juan Pérez",
  phone: "+595 981 000 000",
  address: "Av. Mariscal López 1234",
  city: "Asunción",
  country: "Paraguay",
};

/** Unique per run: accounts persist in the E2E database across tests. */
function uniqueEmail() {
  return `cuenta-${Date.now()}@ejemplo.com`;
}

async function register(page: import("@playwright/test").Page, email: string) {
  await page.goto("/cuenta");
  await page.getByTestId("register-name").fill(CUSTOMER.name);
  await page.getByTestId("register-email").fill(email);
  await page.getByTestId("register-password").fill("secret-pass-123");
  await page.getByTestId("register-submit").click();
  // The dashboard (logout button) proves the session cookie reached the
  // browser; the URL is already /cuenta, so it cannot be used as the wait.
  await expect(page.getByTestId("account-logout")).toBeVisible();
}

async function placeOrder(page: import("@playwright/test").Page, email: string) {
  await page.goto(`/productos/${VK_2S}`);
  await page.getByTestId("add-to-cart").click();
  await expect(page.getByTestId("cart-badge")).toHaveText("1");
  await page.goto("/carrito");
  await page.getByTestId("go-to-checkout").click();
  await page.getByTestId("checkout-email").fill(email);
  await page.getByTestId("checkout-phone").fill(CUSTOMER.phone);
  await page.getByTestId("checkout-name").fill(CUSTOMER.name);
  await page.getByTestId("checkout-address").fill(CUSTOMER.address);
  await page.getByTestId("checkout-city").fill(CUSTOMER.city);
  await page.getByTestId("checkout-country").fill(CUSTOMER.country);
  await page.getByTestId("place-order").click();
  await expect(page).toHaveURL(/\/pedido\/TH-[A-Z2-9]{8}/);
  return (await page.getByTestId("order-number").textContent())!.trim();
}

test("register shows an empty account, and logout returns to the forms", async ({ page }) => {
  const email = uniqueEmail();
  await register(page, email);

  await expect(page.getByText("Hola, Juan Pérez")).toBeVisible();
  await expect(page.getByTestId("account-empty-orders")).toBeVisible();
  await expect(page.getByTestId("account-empty-quotes")).toBeVisible();

  await page.getByTestId("account-logout").click();
  await expect(page).toHaveURL(/\/cuenta/);
  await expect(page.getByTestId("login-form")).toBeVisible();
  await expect(page.getByTestId("register-form")).toBeVisible();
});

test("login with wrong credentials shows an error", async ({ page }) => {
  const email = uniqueEmail();
  await register(page, email);
  await page.getByTestId("account-logout").click();
  await expect(page.getByTestId("login-form")).toBeVisible();

  await page.getByTestId("login-email").fill(email);
  await page.getByTestId("login-password").fill("wrong-password");
  await page.getByTestId("login-submit").click();
  await expect(page.getByTestId("login-error")).toHaveText(
    "Email o contraseña incorrectos.",
  );
});

test("a signed-in customer sees their order and quote history", async ({ page }) => {
  const email = uniqueEmail();
  await register(page, email);
  const orderNumber = await placeOrder(page, email);

  // A quote placed while signed in also lands in history.
  await page.goto("/cotizacion");
  await page.getByTestId("quote-kind-used").check();
  await page.getByTestId("quote-name").fill(CUSTOMER.name);
  await page.getByTestId("quote-email").fill(email);
  await page.getByTestId("quote-phone").fill(CUSTOMER.phone);
  await page.getByTestId("quote-submit").click();
  await expect(page).toHaveURL(/\/cotizacion\/QT-[A-Z2-9]{8}/);

  await page.goto("/cuenta");
  await expect(page.getByTestId("account-order")).toContainText(orderNumber);
  await expect(page.getByTestId("account-order")).toContainText("Esperando pago");
  await expect(page.getByTestId("account-quote")).toContainText(/QT-[A-Z2-9]{8}/);

  // The history rows open the order and quote pages.
  await page.getByTestId("account-order-link").click();
  await expect(page.getByTestId("order-number")).toContainText(orderNumber);
  await page.goto("/cuenta");
  await page.getByTestId("account-quote-link").click();
  await expect(page.getByTestId("quote-reference")).toContainText(/QT-[A-Z2-9]{8}/);
});

test("logging in after logout restores the history", async ({ page }) => {
  const email = uniqueEmail();
  await register(page, email);
  const orderNumber = await placeOrder(page, email);

  await page.goto("/cuenta");
  await expect(page.getByTestId("account-order")).toContainText(orderNumber);
  await page.getByTestId("account-logout").click();
  await expect(page.getByTestId("login-form")).toBeVisible();

  await page.getByTestId("login-email").fill(email);
  await page.getByTestId("login-password").fill("secret-pass-123");
  await page.getByTestId("login-submit").click();
  await expect(page.getByTestId("account-logout")).toBeVisible();
  await expect(page.getByTestId("account-order")).toContainText(orderNumber);
});

test("guest checkout still works without an account", async ({ page }) => {
  const email = `invitado-${Date.now()}@ejemplo.com`;
  const orderNumber = await placeOrder(page, email);
  await expect(page.getByTestId("order-status")).toHaveText("Esperando pago");

  // An anonymous visitor browsing /cuenta sees the login/register forms only.
  await page.goto("/cuenta");
  await expect(page.getByTestId("login-form")).toBeVisible();
  await expect(page.getByTestId("account-logout")).toHaveCount(0);
  await expect(page.getByText(orderNumber)).toHaveCount(0);
});
