import { describe, expect, it } from "vitest";
import { formatAmount, formatPrice, totalIn } from "./currency";
import type { Locale } from "./i18n";

const es: Locale = "es";
const en: Locale = "en";

describe("formatPrice", () => {
  it("renders Guaraní with the es-PY canonical format, in both locales", () => {
    expect(formatPrice(1_000_000, "142.86", "PYG", es)).toBe("Gs.\u00A01.000.000");
    expect(formatPrice(1_000_000, "142.86", "PYG", en)).toBe("Gs.\u00A01.000.000");
  });

  it("renders US dollars in the visitor's locale", () => {
    expect(formatPrice(1_000_000, "142.86", "USD", es)).toBe("$\u00A0142,86");
    expect(formatPrice(1_000_000, "142.86", "USD", en)).toBe("$142.86");
  });

  it("never bleeds the currency symbol across currencies", () => {
    const pyg = formatPrice(1_000_000, "142.86", "PYG", es);
    const usd = formatPrice(1_000_000, "142.86", "USD", en);
    expect(pyg).not.toContain("$");
    expect(usd).not.toContain("Gs");
    expect(usd).not.toContain("₲");
  });
});

describe("formatAmount", () => {
  it("formats a computed amount in the given currency", () => {
    expect(formatAmount(2_500_000, "PYG", es)).toBe("Gs.\u00A02.500.000");
    expect(formatAmount(285.72, "USD", en)).toBe("$285.72");
  });
});

describe("totalIn", () => {
  const items = [
    { priceGs: 1_000_000, priceUsd: "142.86", quantity: 2 },
    { priceGs: 500_000, priceUsd: "71.43", quantity: 1 },
  ];

  it("sums price_gs times quantity for Guaraní", () => {
    expect(totalIn(items, "PYG")).toBe(2_500_000);
  });

  it("sums price_usd times quantity for dollars", () => {
    expect(totalIn(items, "USD")).toBe(357.15);
  });

  it("rounds dollar totals to two decimals", () => {
    const thirds = [{ priceGs: 0, priceUsd: "0.1", quantity: 3 }];
    expect(totalIn(thirds, "USD")).toBe(0.3);
  });

  it("totals to zero with no items", () => {
    expect(totalIn([], "PYG")).toBe(0);
    expect(totalIn([], "USD")).toBe(0);
  });
});
