"""Deterministic demo catalog, shared by the E2E demo seed and pytest setup."""

from datetime import datetime, timezone

CATEGORIES = [
    (1, "ANALYTICAL INSTRUMENTS", "analytical-instruments"),
    (2, "Auto-refractores", "auto-refractores"),
]

BRANDS = [
    (1, "Kowa", "kowa"),
    (2, "Huvitz", "huvitz"),
    (3, "HHOU", "hhou"),
]

# (id, name, slug, description, price_gs, price_usd, available, orderable,
#  certifications, images, specifications, category_id, brand_id, created_at)
PRODUCTS = [
    (
        1,
        "High Performance Digital Imaging System VK-2s",
        "high-performance-digital-imaging-system-vk-2s",
        "Fundus camera imaging system for retina clinics.",
        1000000,
        142.86,
        True,
        True,
        ["CE"],
        [
            "https://placehold.co/750x400?text=VK-2s+1",
            "https://placehold.co/750x400?text=VK-2s+2",
        ],
        [
            {"key": "Magnification", "value": "10x-16x"},
            {"key": "Camera", "value": "CCD"},
        ],
        1,
        1,
        datetime(2024, 1, 10, tzinfo=timezone.utc),
    ),
    (
        2,
        "HHOU 7040 Refraction Units",
        "hhou-7040-refraction-units",
        "Refraction unit with digital readout.",
        144524353,
        20646.34,
        True,
        False,
        [],
        ["https://placehold.co/750x400?text=HHOU+7040"],
        [
            {"key": "Type", "value": "Refraction unit"},
        ],
        1,
        3,
        datetime(2024, 2, 10, tzinfo=timezone.utc),
    ),
    (
        3,
        "Auto-refractor Huvitz HRK-1",
        "auto-refractor-huvitz-hrk-1",
        "Auto-refractor and keratometer.",
        6850,
        0.98,
        False,
        True,
        ["FDA"],
        ["https://placehold.co/750x400?text=HRK-1"],
        [
            {"key": "Measurement range", "value": "-20D to +20D"},
            {"key": "Keratometry", "value": "Yes"},
        ],
        2,
        2,
        datetime(2024, 3, 10, tzinfo=timezone.utc),
    ),
    (
        4,
        "Kowa VK-90 Fundus Camera",
        "kowa-vk-90-fundus-camera",
        "Handheld fundus camera.",
        50000000,
        7142.86,
        True,
        True,
        ["ISO"],
        [],
        [],
        1,
        1,
        datetime(2024, 4, 10, tzinfo=timezone.utc),
    ),
]

# (type, [(product_id, position), ...]) — admin-curated, ordered lists
COLLECTIONS = [
    ("carousel", [(1, 1), (2, 2)]),
    ("popular", [(1, 1), (4, 2)]),
    ("promo", [(2, 1)]),
]
