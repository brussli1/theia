def test_categories_listed(seeded):
    body = seeded.get("/api/categories").json()
    assert [facet["name"] for facet in body] == [
        "ANALYTICAL INSTRUMENTS",
        "Auto-refractores",
    ]
    by_slug = {facet["slug"]: facet for facet in body}
    assert by_slug["analytical-instruments"]["name"] == "ANALYTICAL INSTRUMENTS"
    assert by_slug["auto-refractores"]["name"] == "Auto-refractores"


def test_brands_listed(seeded):
    body = seeded.get("/api/brands").json()
    assert [facet["name"] for facet in body] == ["HHOU", "Huvitz", "Kowa"]
    by_slug = {facet["slug"]: facet for facet in body}
    assert by_slug["kowa"]["name"] == "Kowa"
    assert by_slug["huvitz"]["name"] == "Huvitz"
    assert by_slug["hhou"]["name"] == "HHOU"
