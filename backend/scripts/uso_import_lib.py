"""Category plan, product mapping and image handling for the USO import.

Pure functions over the inventory JSON (produced by `uso_inventory.py`) and
the curated menu tree transcribed from the US Ophthalmic navigation.
"""

import html as html_lib
import re
import time
import unicodedata
from dataclasses import dataclass, field
from html.parser import HTMLParser
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


# Allowlisted fragment for Product.description_html (D1): the source's
# structure is bold lead-ins + sections, and everything else is either specs
# (tables, D2), cross-links (#iris-* blocks, D3) or marketing images (D8).
_DESCRIPTION_ALLOWED = {"p", "br", "strong", "em", "b", "i", "h3", "h4", "ul", "ol", "li", "a"}
# Containers whose children pass through without the wrapper element.
_DESCRIPTION_UNWRAP = {
    "div", "span", "section", "figure", "figcaption", "blockquote",
    "font", "center", "small", "sub", "sup", "u",
}
# Subtrees dropped entirely: scripts, tables (become specs or are dropped),
# media, forms, document metadata.
_DESCRIPTION_DROP = {
    "script", "style", "table", "thead", "tbody", "tfoot", "tr", "td", "th",
    "caption", "colgroup", "col", "img", "picture", "iframe", "video", "audio",
    "svg", "canvas", "object", "embed", "form", "input", "button", "select",
    "textarea", "head", "title", "meta", "link", "noscript", "template",
    "source", "track", "map", "area", "hr",
}
_VOID_TAGS = {"br", "img", "hr", "meta", "link", "input", "source", "track", "col", "area", "embed"}


def _safe_href(href: str) -> str | None:
    href = href.strip()
    # A local path, or an absolute http(s) URL. Scheme-relative URLs
    # ("//host/...") and every other scheme (javascript:, data:) are rejected.
    if href.startswith("/") and not href.startswith("//"):
        return href
    if href.startswith("http://") or href.startswith("https://"):
        return href
    return None


class _DescriptionSanitizer(HTMLParser):
    """Rebuilds the source fragment with an allowlist: unknown container tags
    unwrap their children, dangerous subtrees (scripts, tables, media, the
    #iris-* cross-link blocks) are dropped entirely, and `a` keeps only a
    local or http(s) href plus rel=noopener."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.out: list[str] = []
        self.open: list[str] = []
        self.drop_depth = 0

    def _start_drop(self) -> None:
        if self.drop_depth == 0:
            self.drop_depth = 1

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if self.drop_depth:
            if tag not in _VOID_TAGS:
                self.drop_depth += 1
                # Guard against unbalanced source markup (an unclosed table or
                # iris block): past this depth the drop is treated as closed
                # so the rest of the fragment is not swallowed.
                if self.drop_depth > 64:
                    self.drop_depth = 0
            return
        attr_map = {key: (value or "") for key, value in attrs}
        if attr_map.get("id", "").startswith("iris-"):
            self._start_drop()
            return
        if tag in _DESCRIPTION_DROP:
            if tag not in _VOID_TAGS:
                self._start_drop()
        elif tag in _DESCRIPTION_UNWRAP:
            return
        elif tag == "a":
            href = _safe_href(attr_map.get("href", ""))
            if href is None:
                return
            self.out.append(f'<a href="{html_lib.escape(href, quote=True)}" rel="noopener">')
            self.open.append(tag)
        elif tag in _DESCRIPTION_ALLOWED:
            self.out.append(f"<{tag}>")
            if tag not in _VOID_TAGS:
                self.open.append(tag)

    def handle_startendtag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if self.drop_depth or tag not in _DESCRIPTION_ALLOWED:
            return
        self.out.append(f"<{tag}>")

    def handle_endtag(self, tag: str) -> None:
        if self.drop_depth:
            if tag not in _VOID_TAGS:
                self.drop_depth -= 1
            return
        if tag in self.open:
            while self.open and self.open[-1] != tag:
                self.out.append(f"</{self.open.pop()}>")
            self.out.append(f"</{self.open.pop()}>")

    def handle_data(self, data: str) -> None:
        if not self.drop_depth:
            self.out.append(html_lib.escape(data))

    def finish(self) -> str:
        while self.open:
            self.out.append(f"</{self.open.pop()}>")
        return "".join(self.out)


def sanitize_description_html(html: str) -> str:
    """The structured description fragment (D1): allowlisted tags only, with
    tables, media and the #iris-* cross-link blocks stripped. Tables never
    render inside the description — they become specifications or are dropped."""
    if not html:
        return ""
    parser = _DescriptionSanitizer()
    parser.feed(html)
    return parser.finish().strip()


def clean_alt(alt: str) -> str:
    """The descriptive part of a Shopify image alt.

    The source repeats its store-wide marketing boilerplate after a pipe, so
    only the first segment is product-descriptive; the rest is dropped.
    """
    if not alt:
        return ""
    segment = alt.split("|")[0]
    segment = re.sub(r"\s*,\s*,\s*", ", ", segment)
    return re.sub(r"\s+", " ", segment).strip(" ,")


class _TableWalker(HTMLParser):
    """Extracts key/value rows from genuine two-column tables.

    A row is a specification row when it has exactly two non-empty cells, the
    key cell is a short single-line label (no bullet lists, no sentence
    punctuation, no embedded images or marketing spans) and the value cell
    carries real content. Layout rows (separators, 1-cell rows, title_table /
    explain_table marketing rows) fall through.
    """

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.rows: list[list[tuple[str, str]]] = []
        self._table_depth = 0
        self._row: list[tuple[str, str]] | None = None
        self._cell_html: list[str] | None = None
        self._cell_text: list[str] | None = None

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag == "table":
            self._table_depth += 1
        elif tag == "tr" and self._table_depth == 1:
            self._row = []
        elif tag in ("td", "th") and self._table_depth == 1 and self._row is not None:
            self._cell_html = []
            self._cell_text = []
        elif self._cell_html is not None:
            self._cell_html.append(f"<{tag}>")

    def handle_startendtag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if self._cell_html is not None:
            self._cell_html.append(f"<{tag}>")

    def handle_endtag(self, tag: str) -> None:
        if tag == "table":
            self._table_depth = max(0, self._table_depth - 1)
        elif tag == "tr" and self._table_depth == 1 and self._row is not None:
            self.rows.append(self._row)
            self._row = None
        elif tag in ("td", "th") and self._table_depth == 1 and self._row is not None:
            if self._cell_html is not None and self._cell_text is not None:
                self._row.append(("".join(self._cell_html), "".join(self._cell_text)))
                self._cell_html = None
                self._cell_text = None
        elif self._cell_html is not None:
            self._cell_html.append(f"</{tag}>")

    def handle_data(self, data: str) -> None:
        if self._cell_text is not None:
            self._cell_text.append(data)


def extract_specifications(html: str) -> list[dict]:
    """Key/value pairs from genuine two-column tables in the source fragment
    (D2): [{key, value}] in row order, deduplicated by key. 1-cell layout
    tables and title_table/explain_table marketing rows produce nothing."""
    if not html:
        return []
    walker = _TableWalker()
    walker.feed(html)
    specs: list[dict] = []
    seen: set[str] = set()
    for cells in walker.rows:
        if len(cells) != 2:
            continue
        (html_key, text_key), (html_value, text_value) = cells
        if "<img" in html_key or "<br" in html_key:
            continue
        if "title_table" in html_key or "explain_table" in html_key:
            continue
        if "<img" in html_value or "title_table" in html_value or "explain_table" in html_value:
            continue
        key = re.sub(r"\s+", " ", text_key).strip()
        value = re.sub(r"\s+", " ", text_value).strip()
        if not key or not value:
            continue
        if len(key) > 120 or key[-1] in ".!?":
            continue
        if key.startswith(("▪", "*")):
            continue
        if key.lower() in seen:
            continue
        seen.add(key.lower())
        specs.append({"key": key, "value": value})
    return specs


def available_options(product: dict) -> str | None:
    """The deduplicated variant option values as one line for the specs table
    (D4); None when the product has no real options.

    Real option names from the source's `options` array win; products whose
    option name is the Shopify default "Title" fall back to the variant
    titles (dropping the "Default Title" placeholder).
    """
    values: list[str] = []
    for option in product.get("options") or []:
        name = (option.get("name") or "").strip().lower()
        if not name or name == "title":
            continue
        for value in option.get("values") or []:
            value = value.strip()
            if value and value not in values:
                values.append(value)
    if not values:
        for variant in product.get("variants") or []:
            value = (variant.get("title") or "").strip()
            if value and value.lower() != "default title" and value not in values:
                values.append(value)
    return ", ".join(values) if values else None


# Cross-link URL shapes inside the #iris-* blocks (D3): categories, products
# and buyer-guide articles. The quote CTA (/pages/get-a-quote) and any other
# path shapes are not cross-links and are dropped.
_CROSS_LINK_KINDS = (
    ("related_categories", "/collections/"),
    ("related_products", "/products/"),
    ("related_articles", "/blogs/articles/"),
)


def extract_cross_links(html: str) -> dict:
    """Slugs and handles from the source's #iris-related / #iris-compare
    cross-link blocks (D3): {related_categories, related_products,
    related_articles}, each deduplicated in source order. Returns all three
    keys (possibly empty) so the PDP can decide from presence."""
    if not html:
        return {"related_categories": [], "related_products": [], "related_articles": []}
    result: dict[str, list[str]] = {
        "related_categories": [],
        "related_products": [],
        "related_articles": [],
    }
    blocks = re.findall(
        r'<div[^>]*id="iris-related".*?</div>|<p[^>]*id="iris-compare"[^>]*>.*?</p>',
        html,
        re.S,
    )
    for block in blocks:
        for href in re.findall(r'href=["\']([^"\']+)["\']', block):
            href = href.strip()
            for key, prefix in _CROSS_LINK_KINDS:
                if href.startswith(prefix):
                    value = re.split(r"[?#]", href[len(prefix):])[0].strip()
                    if value and value not in result[key]:
                        result[key].append(value)
                    break
    return result


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
