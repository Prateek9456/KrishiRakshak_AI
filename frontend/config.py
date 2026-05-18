from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path
from typing import Any

import streamlit as st


DEFAULT_BACKEND_URL = "https://swc-ai-engine-clean.onrender.com"
LOCAL_SECRETS_PATH = Path(__file__).parent / ".streamlit" / "secrets.toml"

LAND_USE_OPTIONS = {
    "Field crops": [
        ("WHEAT", "Wheat"),
        ("PADDY", "Paddy / Rice"),
        ("MAIZE", "Maize"),
        ("SMALL_MILLETS", "Small millets"),
        ("PULSES", "Pulses"),
        ("OILSEEDS", "Oilseeds"),
        ("COARSE_GRAINS", "Coarse grains"),
        ("OATS", "Oats"),
        ("BARLEY", "Barley"),
        ("COVER_CROP", "Cover crop"),
    ],
    "Horticulture": [
        ("ROOT_CROPS", "Root crops"),
        ("VEGETABLES", "Vegetables"),
        ("POTATO", "Potato"),
        ("TAPIOCA", "Tapioca"),
        ("GINGER", "Ginger"),
        ("TURMERIC", "Turmeric"),
        ("PAPAYA", "Papaya"),
        ("BANANA", "Banana"),
    ],
    "Plantation and spices": [
        ("TEA", "Tea"),
        ("COFFEE", "Coffee"),
        ("ARECANUT", "Arecanut"),
        ("COCONUT", "Coconut"),
        ("BLACK_PEPPER", "Black pepper"),
        ("NUTMEG", "Nutmeg"),
        ("CINNAMON", "Cinnamon"),
        ("SPICES", "Mixed spices"),
    ],
    "Non-arable check": [
        ("BARREN_LAND", "Barren land"),
        ("BARE_GROUND", "Bare ground"),
        ("FOREST", "Forest / trees"),
        ("BUILT_UP", "Built-up / urban"),
        ("WATERBODY", "Waterbody"),
    ],
}

LAND_USES = [code for options in LAND_USE_OPTIONS.values() for code, _ in options]
LAND_USE_LABELS = {
    code: f"{label} ({code})"
    for options in LAND_USE_OPTIONS.values()
    for code, label in options
}


def _secret(section: str, key: str, env_name: str, default: Any = None) -> Any:
    env_value = os.getenv(env_name)
    if env_value:
        return env_value

    try:
        section_values = st.secrets.get(section, {})
        if key in section_values:
            return section_values[key]
    except Exception:
        pass

    file_secrets = _local_secrets()
    if section in file_secrets and key in file_secrets[section]:
        return file_secrets[section][key]

    return default


@lru_cache(maxsize=1)
def _local_secrets() -> dict[str, Any]:
    if not LOCAL_SECRETS_PATH.exists():
        return {}

    try:
        import tomllib
    except ModuleNotFoundError:
        import tomli as tomllib

    with LOCAL_SECRETS_PATH.open("rb") as file:
        return tomllib.load(file)


def backend_url() -> str:
    return str(
        _secret("backend", "url", "BACKEND_URL", DEFAULT_BACKEND_URL)
    ).rstrip("/")


def analyze_timeout_seconds() -> int:
    value = _secret("backend", "analyze_timeout_seconds", "ANALYZE_TIMEOUT_SECONDS", 240)
    try:
        return int(value)
    except (TypeError, ValueError):
        return 240


def auth_mode() -> str:
    return str(_secret("auth", "mode", "AUTH_MODE", "google")).lower()


def auth_value(key: str) -> str | None:
    value = _secret("auth", key, f"AUTH_{key.upper()}")
    return str(value) if value else None


def google_auth_configured() -> bool:
    required_values = {
        "client_id": auth_value("client_id"),
        "client_secret": auth_value("client_secret"),
        "cookie_secret": auth_value("cookie_secret"),
        "redirect_uri": auth_value("redirect_uri"),
        "server_metadata_url": auth_value("server_metadata_url"),
    }

    if not all(required_values.values()):
        return False

    placeholder_fragments = {
        "replace-with",
        "google-oauth-client",
        "long-random-secret",
    }
    return not any(
        any(fragment in value for fragment in placeholder_fragments)
        for value in required_values.values()
        if value
    )


def database_url(required: bool = False) -> str | None:
    url = _secret("database", "url", "DATABASE_URL")
    if required and not url:
        raise RuntimeError(
            "DATABASE_URL is not configured. Add it to Streamlit secrets "
            "or set the DATABASE_URL environment variable."
        )
    return str(url) if url else None
