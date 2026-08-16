from helpers import admin_headers


def test_categories_listed(seeded):
    body = seeded.get("/api/categories").json()
    assert [facet["name"] for facet in body] == [
        "ANALYTICAL INSTRUMENTS",
        "Auto-refractores",
    ]
    by_slug = {facet["slug"]: facet for facet in body}
    assert by_slug["analytical-instruments"]["name"] == "ANALYTICAL INSTRUMENTS"
    assert by_slug["auto-refractores"]["name"] == "Auto-refractores"
    assert isinstance(by_slug["auto-refractores"]["id"], int)
    assert by_slug["auto-refractores"]["parent_id"] is None


def test_categories_include_parent_id(seeded):
    headers = admin_headers(seeded)
    parent = seeded.post(
        "/api/admin/categories",
        json={"name": "Exam Room Essentials"},
        headers=headers,
    )
    assert parent.status_code == 201
    child = seeded.post(
        "/api/admin/categories",
        json={"name": "Autorefractors", "parent_id": parent.json()["id"]},
        headers=headers,
    )
    assert child.status_code == 201

    body = seeded.get("/api/categories").json()
    by_slug = {facet["slug"]: facet for facet in body}
    assert by_slug["exam-room-essentials"]["parent_id"] is None
    assert by_slug["autorefractors"]["parent_id"] == parent.json()["id"]


def test_brands_listed(seeded):
    body = seeded.get("/api/brands").json()
    assert [facet["name"] for facet in body] == ["HHOU", "Huvitz", "Kowa"]
    by_slug = {facet["slug"]: facet for facet in body}
    assert by_slug["kowa"]["name"] == "Kowa"
    assert by_slug["huvitz"]["name"] == "Huvitz"
    assert by_slug["hhou"]["name"] == "HHOU"
