"""Visitor-location currency resolution.

Tracer-bullet implementation: a documented list of Paraguay's major IP
allocations decides Gs vs USD. Ticket #8 may replace this with a proper
GeoIP lookup without changing the endpoint contract.
"""

import ipaddress
from ipaddress import IPv4Address, IPv4Network

from fastapi import APIRouter, Request

router = APIRouter(prefix="/api/geo", tags=["geo"])

PARAGUAY_NETWORKS = [
    IPv4Network("181.120.0.0/13"),  # Tigo Paraguay
    IPv4Network("200.85.0.0/16"),   # Personal / Telecel
    IPv4Network("190.104.0.0/16"),
    IPv4Network("201.217.0.0/16"),
]


def client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        first = forwarded.split(",")[0].strip()
        if first:
            return first
    if request.client is not None:
        return request.client.host
    return ""


def is_paraguay(ip: str) -> bool:
    try:
        address = IPv4Address(ip)
    except ValueError:
        return False
    return any(address in network for network in PARAGUAY_NETWORKS)


@router.get("/currency")
async def currency(request: Request) -> dict:
    py = is_paraguay(client_ip(request))
    return {"currency": "PYG" if py else "USD"}
