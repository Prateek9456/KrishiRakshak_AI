from pathlib import Path
import os
import requests

BASE_DATA_DIR = Path("data")
LANDCOVER_DIR = BASE_DATA_DIR / "landcover"

def ensure_landcover_data():
    """
    Ensure landcover GeoTIFFs exist at data/landcover/*.tif

    Downloads all .tif assets from a GitHub Release if missing.
    Safe to call multiple times.
    """

    # If files already exist, do nothing
    if LANDCOVER_DIR.exists() and list(LANDCOVER_DIR.glob("*.tif")):
        return

    release_api = os.environ.get("LANDCOVER_RELEASE_API")
    if not release_api:
        raise RuntimeError("LANDCOVER_RELEASE_API environment variable not set")

    # Strip newline / whitespace (Render UI sometimes adds it)
    release_api = release_api.strip()

    github_token = os.environ.get("GITHUB_TOKEN")

    headers = {
        "Accept": "application/vnd.github+json"
    }
    if github_token:
        headers["Authorization"] = f"Bearer {github_token}"

    BASE_DATA_DIR.mkdir(exist_ok=True)
    LANDCOVER_DIR.mkdir(exist_ok=True)

    print("📡 Fetching landcover release metadata...")
    resp = requests.get(release_api, headers=headers, timeout=30)
    resp.raise_for_status()

    assets = resp.json().get("assets", [])
    tif_assets = [a for a in assets if a["name"].lower().endswith(".tif")]

    if not tif_assets:
        raise RuntimeError("No .tif files found in GitHub Release assets")

    print(f"⬇️ Downloading {len(tif_assets)} landcover GeoTIFF files...")

    for asset in tif_assets:
        name = asset["name"]
        url = asset["browser_download_url"]
        dest = LANDCOVER_DIR / name

        if dest.exists():
            continue

        print(f"   → {name}")
        r = requests.get(url, headers=headers, stream=True, timeout=120)
        r.raise_for_status()

        with open(dest, "wb") as f:
            for chunk in r.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)

    if not list(LANDCOVER_DIR.glob("*.tif")):
        raise RuntimeError("Landcover bootstrap failed")

    print("✅ Landcover GeoTIFFs ready")
