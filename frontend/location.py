from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import streamlit as st


@dataclass(frozen=True)
class BrowserLocation:
    latitude: float
    longitude: float
    accuracy_m: float | None = None
    source: str = "Selected"


def _read_coord(raw: dict[str, Any], *names: str) -> float | None:
    for name in names:
        value = raw.get(name)
        if value is not None:
            return float(value)
    return None


def request_browser_location() -> BrowserLocation | None:
    try:
        from streamlit_geolocation import streamlit_geolocation
    except ImportError:
        st.error(
            "GPS support requires streamlit-geolocation. Install frontend requirements."
        )
        return None

    raw = streamlit_geolocation()
    if not raw:
        return None

    latitude = _read_coord(raw, "latitude", "lat")
    longitude = _read_coord(raw, "longitude", "lon", "lng")
    accuracy = _read_coord(raw, "accuracy", "accuracy_m")

    if latitude is None or longitude is None:
        return None

    return BrowserLocation(
        latitude=latitude,
        longitude=longitude,
        accuracy_m=accuracy,
        source="Live GPS",
    )
