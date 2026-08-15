/** Shared status/kind → i18n-key mappings for orders and quotes (#14, #16).
 * Server-only (imports api.ts, which reads next/headers). */
import type { Dictionary } from "./i18n";
import {
  ORDER_STATUS_AWAITING_PAYMENT,
  ORDER_STATUS_DELIVERED,
  ORDER_STATUS_PAID,
  ORDER_STATUS_RECEIVED,
  ORDER_STATUS_SHIPPED,
  QUOTE_KIND_PRODUCT,
  QUOTE_KIND_RENTAL,
  QUOTE_KIND_USED,
  QUOTE_STATUS_CLOSED,
  QUOTE_STATUS_NEW,
  QUOTE_STATUS_RESPONDED,
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
    case ORDER_STATUS_SHIPPED:
      return "statusShipped";
    case ORDER_STATUS_DELIVERED:
      return "statusDelivered";
    default:
      return null;
  }
}

/** Quote status → dictionary key, or null when the status is unknown. */
export function quoteStatusKey(
  status: string,
): keyof Dictionary["quote"] | null {
  switch (status) {
    case QUOTE_STATUS_NEW:
      return "statusNew";
    case QUOTE_STATUS_RESPONDED:
      return "statusResponded";
    case QUOTE_STATUS_CLOSED:
      return "statusClosed";
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
