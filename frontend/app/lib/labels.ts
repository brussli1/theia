/** Shared status/kind → i18n-key mappings for orders and quotes (#14).
 * Server-only (imports api.ts, which reads next/headers). */
import type { Dictionary } from "./i18n";
import {
  ORDER_STATUS_AWAITING_PAYMENT,
  ORDER_STATUS_PAID,
  ORDER_STATUS_RECEIVED,
  QUOTE_KIND_PRODUCT,
  QUOTE_KIND_RENTAL,
  QUOTE_KIND_USED,
} from "./api";

/** Order status → dictionary key, or null when the status is unknown (it is
 * then rendered as-is). */
export function orderStatusKey(
  status: string,
): keyof Dictionary["order"] | null {
  switch (status) {
    case ORDER_STATUS_RECEIVED:
      return "statusReceived";
    case ORDER_STATUS_AWAITING_PAYMENT:
      return "statusAwaitingPayment";
    case ORDER_STATUS_PAID:
      return "statusPaid";
    default:
      return null;
  }
}

/** Quote kind → dictionary key, or null when the kind is unknown. */
export function quoteKindKey(kind: string): keyof Dictionary["quote"] | null {
  switch (kind) {
    case QUOTE_KIND_PRODUCT:
      return "kindProduct";
    case QUOTE_KIND_USED:
      return "kindUsed";
    case QUOTE_KIND_RENTAL:
      return "kindRental";
    default:
      return null;
  }
}
