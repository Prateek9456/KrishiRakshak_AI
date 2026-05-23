import math
import requests
import numpy as np
from io import BytesIO
from PIL import Image

# ------------------------------------------------------------------
# CONFIG
# ------------------------------------------------------------------

MAPBOX_TOKEN = "pk.eyJ1IjoicHJhdGVlazk0NTYiLCJhIjoiY21qaTkwZjd0MDNtNzNmcjB1Y2I4NGFqMSJ9.Whh4fHjS_jpVx95gqtGayA"
DEFAULT_ZOOM = 12  # ICAR-appropriate landform scale


# ------------------------------------------------------------------
# TILE & ELEVATION UTILITIES
# ------------------------------------------------------------------

def latlon_to_tile(lat, lon, zoom):
    """
    Convert latitude/longitude to Mapbox tile coordinates.
    """
    lat_rad = math.radians(lat)
    n = 2 ** zoom
    xtile = int((lon + 180.0) / 360.0 * n)
    ytile = int(
        (1.0 - math.log(math.tan(lat_rad) + 1 / math.cos(lat_rad)) / math.pi)
        / 2.0
        * n
    )
    return xtile, ytile


def latlon_to_tile_pixel(lat, lon, zoom, tile_size=256):
    """
    Convert latitude/longitude to the tile and exact pixel inside that tile.
    """
    lat_rad = math.radians(lat)
    n = 2 ** zoom
    x = (lon + 180.0) / 360.0 * n
    y = (
        1.0 - math.log(math.tan(lat_rad) + 1 / math.cos(lat_rad)) / math.pi
    ) / 2.0 * n

    xtile = int(x)
    ytile = int(y)
    px = int((x - xtile) * tile_size)
    py = int((y - ytile) * tile_size)
    return xtile, ytile, px, py


def rgb_to_elevation(r, g, b):
    """
    Decode Mapbox Terrain-RGB pixel to elevation (meters).
    """
    r = int(r)
    g = int(g)
    b = int(b)
    return (r * 256 * 256 + g * 256 + b) * 0.1 - 10000


# ------------------------------------------------------------------
# MAIN SLOPE FUNCTION
# ------------------------------------------------------------------

def fetch_slope_percent(lat, lon, zoom=DEFAULT_ZOOM):
    """
    Compute landform-scale slope (%) live from Mapbox Terrain-RGB tiles.

    Method:
    - Fetch terrain tile
    - Decode elevations
    - Compute slope over a local neighborhood
    - Average slopes to remove micro-relief noise

    This matches ICAR slope interpretation.
    """

    x, y, px, py = latlon_to_tile_pixel(lat, lon, zoom)

    url = (
        f"https://api.mapbox.com/v4/mapbox.terrain-rgb/"
        f"{zoom}/{x}/{y}.pngraw?access_token={MAPBOX_TOKEN}"
    )

    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()

        img = Image.open(BytesIO(response.content))
        arr = np.array(img)

        height, width, _ = arr.shape
        cx = min(max(px, 2), width - 3)
        cy = min(max(py, 2), height - 3)

        # Pixel resolution in meters (Web Mercator)
        resolution = 156543.03 * math.cos(math.radians(lat)) / (2 ** zoom)

        slopes = []

        # Sample a 5x5 grid around the center pixel
        for dx in range(-2, 3):
            for dy in range(-2, 3):
                try:
                    zc = rgb_to_elevation(*arr[cy + dy, cx + dx][:3])
                    zx = rgb_to_elevation(*arr[cy + dy, cx + dx + 1][:3])
                    zy = rgb_to_elevation(*arr[cy + dy + 1, cx + dx][:3])

                    dzdx = (zx - zc) / resolution
                    dzdy = (zy - zc) / resolution

                    slope_rad = math.atan(math.sqrt(dzdx ** 2 + dzdy ** 2))
                    slopes.append(math.tan(slope_rad) * 100)

                except IndexError:
                    continue

        if not slopes:
            raise ValueError("Slope sampling failed")

        slope_percent = sum(slopes) / len(slopes)

        return round(float(slope_percent), 2)

    except Exception as e:
        print("Slope API failed:", e)

        # Conservative ICAR-safe fallback
        return 5.0
