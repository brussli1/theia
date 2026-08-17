# USO image gap fill: per-vendor sourcing report (#28)

- **Ticket:** #28 (part of #25) — the 106 imageless products get source images so every catalog product has a gallery.
- **Date:** 2026-08-16
- **Method:** Primary sources only — official vendor sites/catalogs (neitz.co.jp, adaptica.com, hardkernel.com) and usophthalmic.com itself (Ezer is USO's own brand; ezerusa.com redirects there). Each candidate image URL was verified with an HTTP HEAD/GET returning 200 + `image/*`. Anything not verifiable on a primary source is marked **unverified**.
- **Artifacts:** the machine-readable map is `backend/uso_image_sourcing.json` (gitignored); `backend/scripts/uso_fill_images.py` consumes it (patches the inventory, downloads media, updates imported rows).

## Outcome

**15 of 106 handles filled** with verified primary-source images (14%) — the full devices and saleable accessories. **91 handles unverified**: they are internal Ezer/USO service spare parts (PCB assemblies, cable harnesses, motor/gear/mechanical assemblies, LCDs, O-rings, springs, caps) whose own USO product pages render the Shopify `no-image` placeholder and which no vendor publishes.

## Verified sources (15)

| Handle | Product | Image source (primary) | Alt |
|---|---|---|---|
| `neitz-ez-oph-1800` | Neitz EZ-OPH-1800 direct ophthalmoscope | USO `/products/ez-oph-1800` (same-model Ezer page, 9-img gallery) | EZ-OPH-1800 Direct Ophthalmoscope |
| `neitz-ophthalmoscope-handheld-direct-*` (x2) | Neitz BXα-13 handheld direct ophthalmoscope | neitz.co.jp official BXα-13 product page | Neitz BXα-13 Handheld Direct Ophthalmoscope |
| `ntz-oph-bxa-rcusb-led` | Neitz BXα-RC-USB-LED ophthalmoscope | neitz.co.jp official product page (exact model) | Neitz BXα-RC-USB-LED Ophthalmoscope |
| `ntz-frame` | NTZ loupe frame (BLS-1 NEO) | USO `/products/ntz-nsi-iii` (loupe system page) | NTZ-NSI-III LED Headlight with Loupe Frame |
| `ntz-headband` | NTZ headband | USO `/products/ntz-headlight-iii` gallery | NTZ-NSI-III headband |
| `belt-hook` | Belt Hook NTZ-NSI-III | USO `/products/ntz-headlight-iii` gallery | NTZ-NSI-III headlight system with belt hook |
| `ezer-panorama-ultra-widefield-retinal-camera-1` | Ezer Panorama ultra-widefield retinal camera | USO sibling page `/products/ezer-panorama-ultra-widefield-retinal-camera` | Ezer Panorama Ultra-Widefield Retinal Camera |
| `erk-bh-wifi-set` | ERK-BH WiFi set | USO `/products/erk-bh` (27-img gallery) | Ezer ERK-BH Autorefractor Keratometer |
| `iineer-system` | iiNEER system | USO sibling page `/products/iineersystem` (13 imgs) | iiNEER System |
| `tele-eye-care` | Tele Eye Care | USO sibling page `/products/telecare` (2 imgs) | Tele Eye Care system |
| `2win-app-for-kaleidos` | 2WIN-APP for Kaleidos | USO `/products/2win-4` gallery | Adaptica 2WIN |
| `ez-bulb-ret2600` | 2.5V otoscope bulb | USO `/products/ez-bulb-oto-oph-1800-ll` (bulb family page) | Ezer EZ-BULB replacement lamp bulb |
| `vs-chair-control-foot-pedal` | VS-Chair control foot pedal | USO `/products/foot-switch-eru-2600` (dedicated foot-switch page) | ERU-2600 Foot Switch |
| `odroid-c4` | ODROID-C4 (PCB for iiNEER/EDC systems) | hardkernel.com official product page | ODROID-C4 |

Notes:
- The two `neitz-ophthalmoscope-handheld-direct-*` handles are near-duplicate listings of the same BXα-13 model; both take the manufacturer's official image.
- `vs-chair-control-foot-pedal`'s own USO page is imageless; the dedicated `foot-switch-eru-2600` product page (same chair family) supplies the image.
- Alt text: taken from the source page where meaningful, else the product title (matching the import's `clean_alt` fallback contract).

## Unverified (91)

All are internal Ezer/USO service spare parts. Their own USO product pages exist (live SKU/price) but carry the Shopify `no-image` placeholder, the USO spare-parts collections (`spare-parts-ezer`, `spare-parts-neitz`, `spare-parts-luxvision`, `spare-parts-adaptica`, `spare-parts-girlas`, `spare-parts-frey`, `spare-parts` = Huvitz) don't list them, web searches for the exact part numbers return no retail listings, and the manufacturers (huvitz.com behind an anti-bot challenge, schioppa.com PDF-only catalogs) publish no parts images.

Breakdown by kind (handle patterns):

- **PCB assemblies (12):** `*epcb*` — e.g. D8-RBH-100, C6-MAIN-110D, AA-BIF-V102, G3 ERY-310, M2-SCG-101, V1-CMOS-100A, V1-SLD-V300, L3 ETD-410, D6 RJB-820, G3 EGB-310, I1 LED B/D MBL-301, XX mini PC.
- **Cable harnesses (9):** `*ehar*` — step-motor tilt, PC-IF, BIF, CAN 20m, ECM-to-clamp, EGB-to-SBG, SMPS-to-EPW, FRI-to-FRM, 20P-20P.
- **Assemblies (27):** `*massy*` — joystick, LCD, motor, lens, chart, printer, headrest, feeler, gear idler, chuck shaft, patient-respond button, etc. (D8, W2, A5, B4, M2, A8, A3, M0, J2, L2, G3, G4, GA, J0, A9, 2A, G8, XX, H0).
- **Mechanicals (27):** `*mp*`, `*a*`-suffixed numbered parts — chin rest pole, wheel lock plate, worm wheel bracket, zoom gears, spring, marker pen, grooving wheel clamp, shaft covers, wavewasher, dust caps, head rest rubber, clamp piston, chuck shafts, slide plates, idler holders, roller shafts, rail rollers, protective windows (D8), polishing stick, O-ring.
- **Vendor-specific spares with no public image (16):** `cp-13` (Huvitz), `5711` (VS-Tavola button), `3800`/`3913` (Schioppa Avantech 150 casters), `sd_card_software` (EDC-BH), `79990010175-a` (CPU cooler), `powersupplyesl9000c`, `d-eb00-c44` (BT dongle), `602050` (L-102 LED), `5301-5303` (phoropter bracket caps), `tn1010-243-01`, `6430tmt4s36-a`/`580-c06m1-002` (stepping motors), `a-asl0-c34` (joystick), `ahe-y00-05a` (PD sensor), `72050010029-a` (HRK-1 LCD).

## Follow-ups / decisions

- **Not investigated:** asking USO directly for service-part photos, or photographing physical stock — out of scope for a research ticket; would be an owner-side action.
- The rendered-page specs crawl follow-up (see HANDOFF.md) is the natural place to also re-check these 91: if a part later gains a public listing, add it to `uso_image_sourcing.json` and re-run the fill.
- `uso_imageless.json` is regenerated by the import; after this fill the import report will still list these 91 as image-gap products (their inventory entries carry images only for the 15 filled handles).
