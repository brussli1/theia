import { expect, test } from "@playwright/test";

const QUOTE_ONLY_SLUG = "hhou-7040-refraction-units";
const CUSTOMER = {
  name: "Juan Pérez",
  email: "cliente@ejemplo.com",
  phone: "+595 981 000 000",
};

async function fillQuoteForm(page: import("@playwright/test").Page) {
  await page.getByTestId("quote-name").fill(CUSTOMER.name);
  await page.getByTestId("quote-email").fill(CUSTOMER.email);
  await page.getByTestId("quote-phone").fill(CUSTOMER.phone);
}

test("request a quote for a quote-only product from its PDP", async ({ page }) => {
  await page.goto(`/productos/${QUOTE_ONLY_SLUG}`);
  await page.getByRole("link", { name: "Solicitar cotización" }).click();
  await expect(page).toHaveURL(/\/cotizacion\?producto=/);

  // The product comes preselected from the PDP; the picker lists only
  // quote-only products.
  await expect(page.getByTestId("quote-kind-product")).toBeChecked();
  await expect(page.getByTestId("quote-product")).toHaveValue(QUOTE_ONLY_SLUG);

  await fillQuoteForm(page);
  await page.getByTestId("quote-message").fill("¿Cuál es el precio con instalación?");
  await page.getByTestId("quote-submit").click();

  await expect(page).toHaveURL(/\/cotizacion\/QT-[A-Z2-9]{8}/);
  await expect(page.getByTestId("quote-reference")).toContainText(/QT-[A-Z2-9]{8}/);
  await expect(page.getByTestId("quote-status")).toHaveText("Nueva");
  await expect(page.getByTestId("quote-details")).toContainText(
    "HHOU 7040 Refraction Units",
  );
  await expect(page.getByTestId("quote-details")).toContainText(
    "¿Cuál es el precio con instalación?",
  );

  // The request reaches Theia by the fallback channels as well.
  await expect(page.getByTestId("quote-whatsapp")).toHaveAttribute("href", /wa\.me/);
  await expect(page.getByTestId("quote-email-link")).toHaveAttribute("href", /mailto:/);
});

test("request a quote for used equipment and for a rental", async ({ page }) => {
  await page.goto("/cotizacion");
  await page.getByTestId("quote-kind-used").check();
  await fillQuoteForm(page);
  await page.getByTestId("quote-message").fill("Busco un retinógrafo usado.");
  await page.getByTestId("quote-submit").click();

  await expect(page).toHaveURL(/\/cotizacion\/QT-[A-Z2-9]{8}/);
  await expect(page.getByTestId("quote-kind")).toHaveText("Equipamiento usado");
  await expect(page.getByTestId("quote-details")).toContainText(
    "Busco un retinógrafo usado.",
  );

  await page.goto("/cotizacion");
  await page.getByTestId("quote-kind-rental").check();
  await fillQuoteForm(page);
  await page.getByTestId("quote-submit").click();
  await expect(page).toHaveURL(/\/cotizacion\/QT-[A-Z2-9]{8}/);
  await expect(page.getByTestId("quote-kind")).toHaveText("Alquiler");
});

test("a wrong email cannot see a quote request", async ({ page }) => {
  await page.goto("/cotizacion");
  await page.getByTestId("quote-kind-rental").check();
  await fillQuoteForm(page);
  await page.getByTestId("quote-submit").click();
  await expect(page).toHaveURL(/\/cotizacion\/QT-[A-Z2-9]{8}/);
  const reference = (await page.getByTestId("quote-reference").textContent())!.trim();

  await page.goto(`/cotizacion/${reference}?email=otro%40ejemplo.com`);
  await expect(page.getByText("No encontramos esa solicitud.")).toBeVisible();
});
