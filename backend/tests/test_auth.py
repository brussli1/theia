"""Accounts (#14): register, log in, and the session token.

Tested at the HTTP seam (status codes, response shape, business rules) plus
unit tests of the password hash and JWT helpers at their own seam, where the
verification logic lives.
"""

import re

from helpers import REGISTER_PAYLOAD, auth_headers, register

from app.core.security import (
    create_token,
    decode_token,
    hash_password,
    verify_password,
)


def test_register_creates_account_and_returns_a_token(seeded):
    body = register(seeded)
    assert re.fullmatch(r"[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+", body["token"])
    assert body["user"]["id"] > 0
    assert body["user"]["email"] == "customer@example.com"
    assert body["user"]["name"] == "Juan Pérez"

    me = seeded.get("/api/auth/me", headers=auth_headers(body["token"]))
    assert me.status_code == 200
    assert me.json() == body["user"]


def test_register_normalizes_email(seeded):
    body = register(seeded, email="Customer@Example.COM")
    assert body["user"]["email"] == "customer@example.com"

    # The account then logs in with the same email in any case.
    login = seeded.post(
        "/api/auth/login",
        json={
            "email": "CUSTOMER@example.com",
            "password": REGISTER_PAYLOAD["password"],
        },
    )
    assert login.status_code == 200
    assert login.json()["user"]["email"] == "customer@example.com"


def test_register_rejects_duplicate_email(seeded):
    register(seeded)
    duplicate = seeded.post(
        "/api/auth/register",
        json={**REGISTER_PAYLOAD, "name": "Otra Persona"},
    )
    assert duplicate.status_code == 409
    case_variant = seeded.post(
        "/api/auth/register",
        json={**REGISTER_PAYLOAD, "email": "CUSTOMER@EXAMPLE.COM"},
    )
    assert case_variant.status_code == 409


def test_register_validates_payload(seeded):
    assert seeded.post(
        "/api/auth/register", json={**REGISTER_PAYLOAD, "email": "not-an-email"}
    ).status_code == 422
    assert seeded.post(
        "/api/auth/register", json={**REGISTER_PAYLOAD, "password": "short"}
    ).status_code == 422
    assert seeded.post(
        "/api/auth/register", json={**REGISTER_PAYLOAD, "name": ""}
    ).status_code == 422


def test_login_returns_a_token_for_correct_credentials(seeded):
    register(seeded)
    response = seeded.post(
        "/api/auth/login",
        json={"email": "customer@example.com", "password": REGISTER_PAYLOAD["password"]},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["user"]["email"] == "customer@example.com"
    assert seeded.get("/api/auth/me", headers=auth_headers(body["token"])).status_code == 200


def test_login_rejects_wrong_password_and_unknown_email(seeded):
    register(seeded)
    wrong_password = seeded.post(
        "/api/auth/login",
        json={"email": "customer@example.com", "password": "not-the-password"},
    )
    assert wrong_password.status_code == 401
    unknown = seeded.post(
        "/api/auth/login",
        json={"email": "nobody@example.com", "password": "whatever-123"},
    )
    assert unknown.status_code == 401


def test_me_requires_a_valid_token(seeded):
    assert seeded.get("/api/auth/me").status_code == 401
    assert seeded.get("/api/auth/me", headers=auth_headers("garbage")).status_code == 401
    token = register(seeded)["token"]
    assert (
        seeded.get("/api/auth/me", headers=auth_headers(token + "x")).status_code == 401
    )


def test_password_hash_roundtrip():
    stored = hash_password("secret-pass-123")
    assert stored != "secret-pass-123"
    assert verify_password("secret-pass-123", stored)
    assert not verify_password("other-password", stored)


def test_password_hashes_are_salted():
    assert hash_password("same-password") != hash_password("same-password")


def test_password_verify_rejects_malformed_hashes():
    for stored in ("", "not-a-hash", "md5$abc", "pbkdf2_sha256$abc"):
        assert not verify_password("anything", stored)
    # A four-part hash with undecodable salt/digest is rejected too.
    assert not verify_password(
        "anything", "pbkdf2_sha256$600000$!!!$!!!"
    )
    assert not verify_password(
        "anything", "pbkdf2_sha256$not-a-number$AAAA$AAAA"
    )


def test_token_roundtrip():
    claims = decode_token(create_token(42, "customer@example.com"))
    assert claims["sub"] == "42"
    assert claims["email"] == "customer@example.com"


def test_token_decode_rejects_bad_tokens():
    token = create_token(42, "customer@example.com")
    assert decode_token(token + "x") is None
    assert decode_token("garbage") is None
    assert decode_token("") is None
