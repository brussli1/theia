"""Category plan, product mapping and image handling for the USO import.

Pure functions over the inventory JSON (produced by `uso_inventory.py`) and
the curated menu tree transcribed from the US Ophthalmic navigation.
"""

import html as html_lib
import re
import time
import unicodedata
from dataclasses import dataclass, field
from pathlib import Path
from typing import Callable

from scripts.uso_inventory_lib import fetch_items


@dataclass
class MenuNode:
    name: str
    handle: str | None = None
    children: list["MenuNode"] = field(default_factory=list)


def group(name: str, handle: str | None, children: list[MenuNode]) -> MenuNode:
    return MenuNode(name=name, handle=handle, children=children)


def leaf(name: str, handle: str) -> MenuNode:
    return MenuNode(name=name, handle=handle)


# The USO navigation tree (curated): top-level groups → subgroups → leaf
# collections. Handles are the Shopify collection handles.
USO_MENU: list[MenuNode] = [
    group("Exam Room Essentials", "exam-room-essentials", [
        group("Refraction", None, [
            leaf("Autorefractors", "autorefractors"),
            leaf("Refractors", "refractors"),
        ]),
        group("Furniture", None, [
            leaf("Stands", "stands"),
            leaf("Chairs", "chairs"),
            leaf("Refraction Units", "refraction-units"),
            leaf("Accessories", "accessories-furniture"),
        ]),
        group("Slit Lamps", None, [
            leaf("Imaging", "imaging"),
            leaf("Conventional", "conventional"),
            leaf("Tonometers", "tonometers-slitlamps"),
        ]),
        group("Portable", None, [
            leaf("Autorefractors", "portable-autorefractors"),
            leaf("Retinal Cameras", "portable-retinal-cameras"),
            leaf("Slit Lamps", "portable-slit-lamps"),
            leaf("Lensmeters", "portable-lensmeters"),
            leaf("Keratometers", "keratometer"),
            leaf("Tonometers", "handheld-tonometers"),
        ]),
        group("Posterior Segment", None, [
            leaf("BIO", "bio"),
            leaf("Lenses", "ezer-lenses"),
            leaf("Accessories", "accessories-posterior-segment"),
        ]),
        group("Handheld", None, [
            leaf("Ophthalmoscopes", "ophthalmoscopes"),
            leaf("Retinoscopes", "retinoscopes"),
            leaf("Otoscopes", "otoscopes"),
            leaf("Sets", "sets"),
            leaf("Handles", "handles"),
            leaf("Chargers", "chargers"),
            leaf("Wall Units", "wall-units"),
            leaf("Transilluminators", "transilluminators"),
        ]),
        group("Diagnostic Aids", None, [
            leaf("Prism", "prism"),
            leaf("Retinoscopy", "retinoscopy"),
            leaf("Ishihara", "ishihara"),
            leaf("Occluders", "occluders"),
            leaf("Cross Cylinder", "cross-cylinder"),
            leaf("Trial Frames", "trial-frames"),
            leaf("Accessories", "accessories-1"),
        ]),
    ]),
    group("Specialized Equipment", "specialized-equipment", [
        leaf("Dry Eye", "dry-eye"),
        group("Retinal Cameras", None, [
            leaf("Retinal Cameras", "retinal-cameras"),
            leaf("Lenses", "lenses-retinal-cameras"),
            leaf("Accessories", "accessories-retinal-cameras"),
        ]),
        group("Tonometers", None, [
            leaf("Non-Contact", "non-contact"),
            leaf("Applanation", "applanation"),
            leaf("Handheld", "handheld-tonometers"),
        ]),
        group("Visual Field", None, [
            leaf("Desktop", "visual-field-desktop"),
            leaf("Handheld", "visual-field-hand-held"),
        ]),
        leaf("Ultrasounds", "ultrasounds"),
        leaf("OCT", "oct"),
        leaf("Biometer", "biometer"),
        leaf("Topographer", "topographer"),
    ]),
    group("Surgical", "surgical", [
        leaf("Biometer", "biometer"),
        leaf("Stretchers", "stretchers"),
        leaf("Stools", "stools"),
        group("Binocular Loupes", None, [
            leaf("Binocular Loupes", "binocularloupes"),
            leaf("Binocular Loupes with Illumination", "binocular-loupes-with-illumination"),
        ]),
        group("Headlights", None, [
            leaf("Headlights", "headlights"),
            leaf("Headlights with Frame", "headlights-with-frame"),
        ]),
        leaf("Camera", "camera-surgical"),
        leaf("Sterilization", "sterilization-surgical-instruments"),
    ]),
    group("Optical", "optical", [
        group("Automatic Edgers", None, [
            leaf("Edgers", "edgers"),
            leaf("Tracers", "tracers"),
            leaf("Blockers", "blockers"),
            leaf("Drillers", "drillers"),
            leaf("Accessories", "accessories-optical"),
        ]),
        group("Finishing", None, [
            leaf("Autogroovers", "autogroovers"),
            leaf("Lens Drilling", "lens-drilling"),
            leaf("Autopolishers", "autopolishers"),
            leaf("Manual Edgers", "manual-edgers"),
        ]),
        group("Lensmeters", None, [
            leaf("Digital Lensmeters", "digital-lensmeters"),
            leaf("Manual Lensmeters", "manual-lensmeters"),
            leaf("Portable Lensmeters", "portable-lensmeters"),
        ]),
        group("Dispensing", None, [
            leaf("Pupillometers", "pupillometers"),
            leaf("Frame Heaters", "frame-heaters"),
            leaf("Photochromic Lens Tester", "photochromic-lens-tester"),
            leaf("Frame Cleaner", "frame-cleaner"),
        ]),
        group("Hand Tools", None, [
            leaf("Screwdrivers", "screwdrivers"),
            leaf("Wrenches", "wrenches"),
            leaf("Pliers", "pliers"),
            leaf("Tool Kits", "tool-kits"),
            leaf("Benches & Racks", "benches-racks"),
            leaf("Small Tools", "small-tools"),
            leaf("Measurements", "measurements"),
            leaf("Tweezers", "tweezers"),
            leaf("Screws & Pad Kits", "screws-pad-kits"),
            leaf("Storage & Organizers", "storage-organizers"),
            leaf("Miscellaneous", "miscellaneous"),
            leaf("Lab Supplies", "lab-supplies"),
        ]),
    ]),
    group("Special", "current-offers", [
        leaf("Open Box", "clearance-open-box"),
        leaf("Current Offers", "current-offers"),
    ]),
]


def slugify(text: str) -> str:
    decomposed = unicodedata.normalize("NFKD", text.strip().lower())
    plain = "".join(char for char in decomposed if not unicodedata.combining(char))
    return re.sub(r"[^a-z0-9]+", "-", plain).strip("-")


def unique_slug(base: str, taken: set[str]) -> str:
    candidate = base
    suffix = 2
    while candidate in taken:
        candidate = f"{base}-{suffix}"
        suffix += 1
    taken.add(candidate)
    return candidate


@dataclass
class CategoryPlanRow:
    name: str
    slug: str
    parent_slug: str | None
    handle: str | None


@dataclass
class CategoryPlan:
    rows: list[CategoryPlanRow]
    leaf_slugs: dict[str, str]
    parent_slugs: dict[str, str]


def build_category_plan(menu: list[MenuNode]) -> CategoryPlan:
    """Flattens the menu into insertion-ordered category rows.

    Leaf collections claim their Shopify handle as the category slug first
    (nice URLs), grouping nodes slugify their name and dedupe against those.
    """
    taken: set[str] = set()
    leaf_slugs: dict[str, str] = {}
    parent_slugs: dict[str, str] = {}
    rows: list[CategoryPlanRow] = []

    def collect_leaves(nodes: list[MenuNode]) -> list[MenuNode]:
        found: list[MenuNode] = []
        for node in nodes:
            if node.children:
                found.extend(collect_leaves(node.children))
            elif node.handle:
                found.append(node)
        return found

    # A handle that appears in several places in the menu (e.g. "biometer"
    # under both Specialized and Surgical) maps to ONE category; the later
    # leaves become menu aliases sharing the first leaf's slug.
    leaves = collect_leaves(menu)
    for node in leaves:
        slug = unique_slug(node.handle, taken)
        leaf_slugs.setdefault(node.handle, slug)
    leaf_slug_order = [leaf_slugs[node.handle] for node in leaves]

    leaf_index = 0

    def walk(nodes: list[MenuNode], parent_slug: str | None) -> None:
        nonlocal leaf_index
        for node in nodes:
            if node.children:
                slug = unique_slug(slugify(node.name) or "group", taken)
                if node.handle:
                    parent_slugs[node.handle] = slug
                rows.append(CategoryPlanRow(node.name, slug, parent_slug, node.handle))
                walk(node.children, slug)
            elif node.handle:
                rows.append(
                    CategoryPlanRow(
                        node.name, leaf_slug_order[leaf_index], parent_slug, node.handle
                    )
                )
                leaf_index += 1

    walk(menu, None)
    return CategoryPlan(rows=rows, leaf_slugs=leaf_slugs, parent_slugs=parent_slugs)


def fetch_collection_membership(
    get_json: Callable[[str], dict],
    collections: list[dict],
    cooldown: float = 30.0,
    rounds: int = 3,
) -> tuple[dict[int, list[str]], int, list[str]]:
    """Maps product_id -> collection handles it belongs to.

    This store exposes no /collects.json, so membership is crawled per
    collection via /collections/<handle>/products.json. The store rate-limits
    aggressively, so failed collections are retried in further rounds after a
    cooldown. Returns the mapping, the number of still-failed collections,
    and their handles.
    """
    mapping: dict[int, list[str]] = {}
    pending = [c.get("handle") for c in collections if c.get("handle")]
    for round_number in range(rounds):
        still_pending: list[str] = []
        for handle in pending:
            try:
                products = fetch_items(
                    get_json, f"/collections/{handle}/products.json", "products"
                )
            except Exception:
                still_pending.append(handle)
                continue
            for product in products:
                product_id = int(product.get("id") or 0)
                if product_id:
                    mapping.setdefault(product_id, []).append(handle)
        pending = still_pending
        if not pending or round_number == rounds - 1:
            break
        time.sleep(cooldown)
    return mapping, len(pending), pending


def assign_category(collection_handles: list[str], plan: CategoryPlan) -> str | None:
    """Menu leaf wins; a top-level group collection is the fallback."""
    for handle in collection_handles:
        if handle in plan.leaf_slugs:
            return plan.leaf_slugs[handle]
    for handle in collection_handles:
        if handle in plan.parent_slugs:
            return plan.parent_slugs[handle]
    return None


def brand_from_vendor(vendor: str) -> str | None:
    vendor = (vendor or "").strip()
    if not vendor or vendor.lower() in {"us ophthalmic", "uso ophthalmic"}:
        return None
    return vendor


def html_to_text(html: str) -> str:
    if not html:
        return ""
    text = re.sub(r"<[^>]+>", " ", html)
    text = re.sub(r"\s+", " ", html_lib.unescape(text)).strip()
    return re.sub(r"\s+([.,;:!?)])", r"\1", text)


def image_extension(url: str) -> str:
    match = re.search(r"\.(jpe?g|png|webp|gif)(\?|$)", url.lower())
    return f".{match.group(1)}" if match else ".jpg"


def image_destinations(
    handle: str, urls: list[str]
) -> list[tuple[str, Path]]:
    """(source URL, relative media path) per image, under shopify/<handle>/."""
    return [
        (url, Path("shopify") / handle / f"{index}{image_extension(url)}")
        for index, url in enumerate(urls)
    ]


@dataclass
class ImportReport:
    imported_products: int
    imported_categories: int
    imported_brands: int
    uncategorized: int
    image_failures: int
    skipped_existing: bool = False
    uncategorized_handles: list[str] = field(default_factory=list)
    image_gap_count: int = 0
    image_gap_handles: list[str] = field(default_factory=list)
