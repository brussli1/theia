import type { Locale } from "./i18n";

export type Currency = "PYG" | "USD";

/** A product line the cart will total: price in both currencies and a quantity. */
export type PriceLine = {
  priceGs: number;
  priceUsd: string;
  quantity: number;
};

const PYG_LOCALE = "es-PY";

function numberFormat(currency: Currency, locale: Locale): Intl.NumberFormat {
  if (currency === "PYG") {
    return new Intl.NumberFormat(PYG_LOCALE, {
      style: "currency",
      currency: "PYG",
      maximumFractionDigits: 0,
    });
  }
  return new Intl.NumberFormat(locale === "en" ? "en-US" : PYG_LOCALE, {
    style: "currency",
    currency: "USD",
    currencyDisplay: "narrowSymbol",
  });
}

export function formatAmount(amount: number, currency: Currency, locale: Locale): string {
  return numberFormat(currency, locale).format(amount);
}

export function formatPrice(
  priceGs: number,
  priceUsd: string,
  currency: Currency,
  locale: Locale,
): string {
  const amount = currency === "PYG" ? priceGs : Number(priceUsd);
  return formatAmount(amount, currency, locale);
}

/** Total of the given lines in the visitor's currency, for cart subtotals. */
export function totalIn(lines: PriceLine[], currency: Currency): number {
  if (currency === "PYG") {
    return lines.reduce((sum, line) => sum + line.priceGs * line.quantity, 0);
  }
  const raw = lines.reduce((sum, line) => sum + Number(line.priceUsd) * line.quantity, 0);
  return Math.round(raw * 100) / 100;
}
