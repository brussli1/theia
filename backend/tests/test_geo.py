from fastapi.testclient import TestClient


def currency_for(client: TestClient, forwarded: str | None = None) -> str:
    headers = {"x-forwarded-for": forwarded} if forwarded else {}
    response = client.get("/api/geo/currency", headers=headers)
    assert response.status_code == 200
    return response.json()["currency"]


def test_paraguay_ip_resolves_to_pyg(seeded):
    assert currency_for(seeded, "181.120.10.1") == "PYG"
    assert currency_for(seeded, "200.85.5.5") == "PYG"
    assert currency_for(seeded, "190.104.2.2") == "PYG"
    assert currency_for(seeded, "201.217.9.9") == "PYG"


def test_foreign_ip_resolves_to_usd(seeded):
    assert currency_for(seeded, "8.8.8.8") == "USD"
    assert currency_for(seeded, "1.1.1.1") == "USD"


def test_forwarded_header_wins_over_peer(seeded):
    assert currency_for(seeded, "181.120.3.3, 10.0.0.1") == "PYG"


def test_first_forwarded_entry_wins(seeded):
    assert currency_for(seeded, "8.8.4.4, 181.120.1.1") == "USD"


def test_missing_forwarded_header_falls_back_to_peer(seeded):
    assert currency_for(seeded) == "USD"


def test_invalid_ip_falls_back_to_usd(seeded):
    assert currency_for(seeded, "not-an-ip") == "USD"
