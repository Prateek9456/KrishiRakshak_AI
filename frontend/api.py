from __future__ import annotations

from typing import Any

import requests
from requests import Response


class BackendApiError(RuntimeError):
    pass


class BackendTimeoutError(BackendApiError):
    pass


def check_health(base_url: str) -> bool:
    try:
        response = requests.get(f"{base_url}/health", timeout=10)
        return response.status_code == 200
    except requests.RequestException:
        return False


def analyze_land(
    *,
    base_url: str,
    lat: float,
    lon: float,
    land_use: str,
    timeout_seconds: int = 240,
    attempts: int = 2,
) -> dict[str, Any]:
    payload = {
        "lat": lat,
        "lon": lon,
        "land_use": land_use,
    }

    response: Response | None = None
    for attempt in range(1, attempts + 1):
        try:
            response = requests.post(
                f"{base_url}/analyze",
                json=payload,
                timeout=timeout_seconds,
            )
            response.raise_for_status()
            break
        except requests.ReadTimeout as exc:
            if attempt == attempts:
                raise BackendTimeoutError(
                    "The backend took too long to respond. Render may be waking up, "
                    "or live geospatial APIs may be slow. Please try Analyze again."
                ) from exc
        except requests.RequestException as exc:
            raise BackendApiError(f"Backend request failed: {exc}") from exc

    if response is None:
        raise BackendApiError("Backend did not return a response")

    try:
        return response.json()
    except ValueError as exc:
        raise BackendApiError("Backend returned non-JSON response") from exc
