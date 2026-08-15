"""Composition of the notification for a QuoteRequest.

Pure functions over the stored request, so both channels share one source of
truth for the text. Messages are in Spanish — Theia's business language —
regardless of the visitor's locale.
"""

from app.models.quote import QUOTE_KIND_PRODUCT, QUOTE_KIND_RENTAL, QUOTE_KIND_USED, QuoteRequest
from app.notifications.base import QuoteMessage

_KIND_LABELS = {
    QUOTE_KIND_PRODUCT: "Producto",
    QUOTE_KIND_USED: "Equipamiento usado",
    QUOTE_KIND_RENTAL: "Alquiler",
}


def kind_label(kind: str) -> str:
    return _KIND_LABELS.get(kind, kind)


def _lines(quote: QuoteRequest) -> list[str]:
    lines = [
        f"Tipo: {kind_label(quote.kind)}",
        f"Referencia: {quote.reference}",
    ]
    if quote.product_name:
        lines.append(f"Producto: {quote.product_name}")
    lines += [
        f"Nombre: {quote.name}",
        f"Email: {quote.email}",
        f"Teléfono: {quote.phone}",
    ]
    if quote.message:
        lines.append(f"Mensaje: {quote.message}")
    return lines


def compose_quote_message(quote: QuoteRequest) -> QuoteMessage:
    """The composed message for both channels."""
    heading = f"Nueva solicitud de cotización {quote.reference}"
    lines = _lines(quote)
    return QuoteMessage(
        whatsapp_text=heading + "\n" + "\n".join(lines),
        subject=heading,
        email_body="\n".join([heading, "—" * 30, *lines]),
    )
