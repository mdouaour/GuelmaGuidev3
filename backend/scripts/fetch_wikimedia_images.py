from __future__ import annotations

import re
import sys
import time
from pathlib import Path
from urllib.parse import quote

import requests

COMMONS_API = "https://commons.wikimedia.org/w/api.php"
WIKIDATA_API = "https://www.wikidata.org/w/api.php"

SESSION = requests.Session()
SESSION.headers.update({
    "User-Agent": "GuelmaGuide/1.0 (https://guelma.guide; contact@guelma.guide) MediaWiki API client",
    "Accept": "application/json",
})

PLACES_DATA: list[dict] = [
    {"name": "Roman Theatre of Guelma", "lat": 36.4672, "lon": 7.4301},
    {"name": "Guelma Archaeological Museum", "lat": 36.4618, "lon": 7.4255},
    {"name": "Guelma Roman Museum", "lat": 36.4675, "lon": 7.4295},
    {"name": "El-Atik Mosque", "lat": 36.4605, "lon": 7.4228},
    {"name": "Byzantine City Walls", "lat": 36.4630, "lon": 7.4310},
    {"name": "Thibilis Roman Ruins", "lat": 36.2530, "lon": 7.5620},
    {"name": "Héliopolis Roman Pool", "lat": 36.5028, "lon": 7.4447},
    {"name": "Roknia Dolmens Necropolis", "lat": 36.5500, "lon": 7.2333},
    {"name": "Notre-Dame de Guelma Church", "lat": 36.4625, "lon": 7.4245},
    {"name": "Guelma Central Souk", "lat": 36.4610, "lon": 7.4230},
    {"name": "Place de la République", "lat": 36.4625, "lon": 7.4250},
    {"name": "Guelma War Memorial", "lat": 36.4630, "lon": 7.4260},
    {"name": "Ghar Hiraa Mosque", "lat": 36.4590, "lon": 7.4240},
    {"name": "Hammam Bradaa Roman Bath", "lat": 36.4650, "lon": 7.4250},
    {"name": "University 8 Mai 1945 Guelma", "lat": 36.4580, "lon": 7.4260},
    {"name": "Hammam Debagh Thermal Springs", "lat": 36.5041, "lon": 7.3234},
    {"name": "Hammam Maskhoutine (Bath of the Damned)", "lat": 36.4613, "lon": 7.2637},
    {"name": "Hammam Chellala Complex", "lat": 36.4615, "lon": 7.2640},
    {"name": "Hammam Debagh Spa Resort", "lat": 36.4610, "lon": 7.2635},
    {"name": "Hammam Ouled Ali", "lat": 36.4790, "lon": 7.3510},
    {"name": "Hammam Beni Salah", "lat": 36.4700, "lon": 7.3400},
    {"name": "Hammam N'Bail", "lat": 36.5200, "lon": 7.6500},
    {"name": "Aïn Abid Thermal Springs", "lat": 36.4200, "lon": 7.1800},
    {"name": "El-Arayes Rock Formations", "lat": 36.4985, "lon": 7.3280},
    {"name": "Bouhamdane Dam & Lake", "lat": 36.3736, "lon": 7.2945},
    {"name": "Barrage Melegue", "lat": 36.3833, "lon": 7.5500},
    {"name": "Oued Seybouse Valley", "lat": 36.4862, "lon": 7.4375},
    {"name": "Seybouse Riverside", "lat": 36.4620, "lon": 7.4300},
    {"name": "Mont Maouna", "lat": 36.4800, "lon": 7.3800},
    {"name": "Maouna Summit Viewpoint", "lat": 36.4890, "lon": 7.3820},
    {"name": "Djebel Houara", "lat": 36.5434, "lon": 7.5259},
    {"name": "Oued Zenati Hills", "lat": 36.3250, "lon": 7.3050},
    {"name": "Medjez Amar Forest", "lat": 36.4180, "lon": 7.4100},
    {"name": "Roum Echallaha Forest", "lat": 36.4000, "lon": 7.4800},
    {"name": "Forest of Ain Larbi", "lat": 36.3500, "lon": 7.5500},
    {"name": "Bouchgouf Eco Park", "lat": 36.5318, "lon": 7.4891},
    {"name": "Mermoura Viewpoint", "lat": 36.4752, "lon": 7.4452},
    {"name": "El Hadjar Lake", "lat": 36.5164, "lon": 7.4016},
    {"name": "Chaouch Bridge & Gorge", "lat": 36.5000, "lon": 7.3300},
    {"name": "Défilé d'Aïn Témouchent", "lat": 36.3700, "lon": 7.2800},
    {"name": "Guelta Zarga (Blue Lake)", "lat": 36.5167, "lon": 7.6333},
    {"name": "Tamlouka Mountain Village", "lat": 36.1500, "lon": 7.1333},
    {"name": "Municipal Sports Complex", "lat": 36.4589, "lon": 7.4311},
    {"name": "Stade Souidani Boudjemaa", "lat": 36.4550, "lon": 7.4300},
    {"name": "Belkheir Sports Arena", "lat": 36.4541, "lon": 7.4469},
    {"name": "University Sports Complex", "lat": 36.4570, "lon": 7.4280},
    {"name": "Olympic Swimming Pool of Guelma", "lat": 36.4575, "lon": 7.4330},
    {"name": "Guelma Botanical Garden", "lat": 36.4615, "lon": 7.4285},
    {"name": "Old Town Coffee Alley", "lat": 36.4609, "lon": 7.4232},
    {"name": "Hotel Guelma Palace", "lat": 36.4600, "lon": 7.4270},
    {"name": "Heliopolis (Azaba)", "lat": 36.5030, "lon": 7.4440},
    {"name": "Guelaât Bou Sbaâ", "lat": 36.5333, "lon": 7.4667},
    {"name": "Ain Makhlouf", "lat": 36.2333, "lon": 7.2500},
    {"name": "Bouchegouf", "lat": 36.5000, "lon": 7.7333},
    {"name": "Ben Djerrah", "lat": 36.3833, "lon": 7.6167},
    {"name": "Houari Boumedienne", "lat": 36.4333, "lon": 7.3667},
    {"name": "Oued Fragha", "lat": 36.4667, "lon": 7.8833},
    {"name": "Cevital Industrial Complex", "lat": 36.4700, "lon": 7.4500},
]


def call_api(url: str, params: dict) -> dict:
    params.setdefault("format", "json")
    resp = SESSION.get(url, params=params, timeout=15)
    resp.raise_for_status()
    return resp.json()


def geosearch_images(lat: float, lon: float, radius: int = 500) -> list[str]:
    """Find images on Commons near coordinates (namespace 6 = File)."""
    data = call_api(COMMONS_API, {
        "action": "query",
        "list": "geosearch",
        "gscoord": f"{lat}|{lon}",
        "gsradius": radius,
        "gsnamespace": 6,
        "gslimit": 10,
    })
    return [p["title"] for p in data.get("query", {}).get("geosearch", []) if "title" in p]


def search_commons(query: str, limit: int = 5) -> list[str]:
    """Search Commons for files by keyword."""
    data = call_api(COMMONS_API, {
        "action": "query",
        "list": "search",
        "srsearch": query,
        "srnamespace": 6,
        "srlimit": limit,
    })
    return [p["title"] for p in data.get("query", {}).get("search", []) if "title" in p]


def search_wikidata(query: str) -> dict | None:
    """Search Wikidata entity for image (P18) and coordinates (P625)."""
    data = call_api(WIKIDATA_API, {
        "action": "wbsearchentities",
        "search": query,
        "language": "en",
        "limit": 3,
    })
    results = data.get("search", [])
    for r in results:
        eid = r.get("id")
        if not eid:
            continue
        # Fetch entity data
        url = f"https://www.wikidata.org/wiki/Special:EntityData/{eid}.json"
        try:
            resp = SESSION.get(url, timeout=10)
            resp.raise_for_status()
            edata = resp.json()
        except Exception:
            continue
        entity = edata.get("entities", {}).get(eid, {})
        claims = entity.get("claims", {})
        result = {}
        if "P18" in claims:
            for claim in claims["P18"]:
                val = claim.get("mainsnak", {}).get("datavalue", {}).get("value", {})
                if isinstance(val, str):
                    result["image"] = val
                    break
                if isinstance(val, dict):
                    result["image"] = val.get("value") or val.get("id", "")
                    break
        if "P625" in claims:
            for claim in claims["P625"]:
                val = claim.get("mainsnak", {}).get("datavalue", {}).get("value", {})
                if isinstance(val, dict):
                    result["lat"] = val.get("latitude")
                    result["lon"] = val.get("longitude")
                    break
        if result:
            return result
    return None


def file_title_to_url(file_title: str) -> str:
    """Convert a Commons file title (e.g. 'File:Foo.jpg') to a direct URL."""
    clean = re.sub(r"^File:", "", file_title).strip()
    encoded = quote(clean.replace(" ", "_"))
    return f"https://commons.wikimedia.org/wiki/Special:FilePath/{encoded}"


def fetch_images_for_place(name: str, lat: float, lon: float) -> list[str]:
    found = []

    # Strategy 1: Commons geosearch by coordinates
    titles = geosearch_images(lat, lon, radius=300)
    for t in titles:
        found.append(file_title_to_url(t))
        if len(found) >= 3:
            break

    # Strategy 2: Wikidata lookup for P18 (image property)
    wd = search_wikidata(f"{name} Guelma")
    if wd and wd.get("image"):
        url = file_title_to_url(f"File:{wd['image']}")
        if url not in found:
            found.insert(0, url)

    # Strategy 3: Broader geosearch
    if not found:
        titles = geosearch_images(lat, lon, radius=1000)
        for t in titles:
            url = file_title_to_url(t)
            if url not in found:
                found.append(url)
                if len(found) >= 3:
                    break

    # Strategy 4: Commons keyword search on place name + Guelma
    if not found:
        for q in [name, f"{name} Guelma", f"{name} Algeria"]:
            titles = search_commons(q, limit=3)
            for t in titles:
                url = file_title_to_url(t)
                if url not in found:
                    found.append(url)
                    if len(found) >= 3:
                        break
            if found:
                break

    return found[:5]


def main():
    total = len(PLACES_DATA)
    results = []

    for i, p in enumerate(PLACES_DATA, 1):
        name = p["name"]
        lat, lon = p["lat"], p["lon"]
        print(f"[{i}/{total}] {name}...", end=" ", flush=True)

        images = fetch_images_for_place(name, lat, lon)
        results.append({"name": name, "images": images})
        print(f"{len(images)} images")
        time.sleep(0.3)

    # Generate the images dict for the seed file
    print("\n" + "=" * 60)
    print("PLACES WITH IMAGES (for seed file)")
    print("=" * 60)
    images_by_name = {r["name"]: r["images"] for r in results}

    for r in results:
        if r["images"]:
            print(f'    "{r["name"]}": {r["images"]},')

    print(f"\n{'=' * 60}")
    found = sum(1 for r in results if r["images"])
    print(f"{found}/{total} places have images")
    print(f"{total - found}/{total} still need images")

    # Save to JSON for later use
    import json
    out = Path(__file__).resolve().parent / "wikimedia_images_output.json"
    with open(out, "w") as f:
        json.dump(images_by_name, f, indent=2, ensure_ascii=False)
    print(f"\nSaved to {out}")


if __name__ == "__main__":
    main()
