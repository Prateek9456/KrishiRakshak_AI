from __future__ import annotations

from typing import Any

import folium
import pandas as pd
import streamlit as st
from streamlit_folium import st_folium

from location import BrowserLocation


def theme_palette(theme_mode: str) -> dict[str, str]:
    # USDA NASS Inspired Palette (Enforcing a clean, professional light theme)
    return {
        "bg": "#f5f7f5",
        "surface": "#ffffff",
        "surface_2": "#f0f4f1",
        "text": "#111827",
        "muted": "#4b5563",
        "border": "#e5e7eb",
        "accent": "#005a32",    # USDA Green
        "accent_2": "#003e21",  # Darker Forest Green
        "accent_blue": "#1d4ed8",
        "danger": "#dc2626",
        "warning": "#d97706",
        "map_filter": "none",
    }


def apply_theme(theme_mode: str = "light") -> None:
    palette = theme_palette(theme_mode)
    st.markdown(
        f"""
        <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        :root {{
            --swc-bg: {palette["bg"]};
            --swc-surface: {palette["surface"]};
            --swc-surface-2: {palette["surface_2"]};
            --swc-text: {palette["text"]};
            --swc-muted: {palette["muted"]};
            --swc-border: {palette["border"]};
            --swc-accent: {palette["accent"]};
            --swc-accent-2: {palette["accent_2"]};
            --swc-danger: {palette["danger"]};
            --swc-warning: {palette["warning"]};
            --swc-blue: {palette["accent_blue"]};
        }}
        
        /* Base Typography & Background */
        html, body, [class*="stApp"] {{
            background-color: var(--swc-bg) !important;
            color: var(--swc-text) !important;
            font-family: 'Inter', sans-serif !important;
            -webkit-font-smoothing: antialiased;
        }}
        
        .block-container {{
            padding-top: 2rem !important;
            max-width: 1400px !important;
        }}
        
        h1, h2, h3, h4, p, label, span {{
            font-family: 'Inter', sans-serif !important;
        }}
        
        /* Metric Cards */
        div[data-testid="stMetric"] {{
            border: 1px solid var(--swc-border);
            border-radius: 6px;
            padding: 1rem 1.25rem;
            background: var(--swc-surface);
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            border-top: 3px solid var(--swc-accent);
        }}
        div[data-testid="stMetric"] label {{
            color: var(--swc-muted) !important;
            font-size: 0.85rem !important;
            font-weight: 600 !important;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }}
        div[data-testid="stMetricValue"] {{
            font-size: 1.5rem !important;
            font-weight: 700 !important;
            color: var(--swc-text) !important;
        }}
        
        /* Buttons */
        .stButton > button,
        .stFormSubmitButton > button {{
            border-radius: 4px;
            border: 1px solid transparent;
            background-color: var(--swc-accent) !important;
            color: white !important;
            font-weight: 600 !important;
            padding: 0.6rem 1.5rem;
            box-shadow: 0 2px 4px rgba(0, 90, 50, 0.2);
            transition: all 0.2s ease;
        }}
        .stButton > button:hover,
        .stFormSubmitButton > button:hover {{
            background-color: var(--swc-accent-2) !important;
            box-shadow: 0 4px 6px rgba(0, 90, 50, 0.3);
        }}
        
        /* Inputs & Selects */
        [data-baseweb="select"] > div,
        .stTextInput input {{
            border-radius: 4px !important;
            background: var(--swc-surface) !important;
            border: 1px solid var(--swc-border) !important;
            color: var(--swc-text) !important;
            font-size: 0.95rem !important;
            box-shadow: 0 1px 2px rgba(0,0,0,0.03) !important;
        }}
        
        /* Sidebar */
        [data-testid="stSidebar"] {{
            background-color: var(--swc-surface) !important;
            border-right: 1px solid var(--swc-border);
            padding-top: 2rem;
        }}
        
        /* Custom USDA Cards */
        .swc-card {{
            border: 1px solid var(--swc-border);
            border-radius: 6px;
            padding: 1.5rem;
            background: var(--swc-surface);
            box-shadow: 0 2px 5px rgba(0,0,0,0.04);
            margin-bottom: 1rem;
        }}
        
        .swc-muted {{
            color: var(--swc-muted);
        }}
        
        /* Hero Header */
        .swc-hero {{
            border: 1px solid var(--swc-border);
            border-radius: 8px;
            padding: 2rem;
            background: linear-gradient(to right, #ffffff, #f0f4f1);
            border-left: 6px solid var(--swc-accent);
            box-shadow: 0 4px 6px rgba(0,0,0,0.04);
            margin-bottom: 2rem;
        }}
        .swc-hero h1 {{
            font-size: 2.2rem;
            font-weight: 700;
            margin: 0 0 0.5rem;
            color: var(--swc-accent-2);
            letter-spacing: -0.5px;
        }}
        .swc-hero p {{
            max-width: 800px;
            color: var(--swc-muted);
            font-size: 1.05rem;
            line-height: 1.6;
        }}
        
        .swc-kicker {{
            color: var(--swc-muted);
            text-transform: uppercase;
            font-size: 0.75rem;
            font-weight: 700;
            letter-spacing: 1px;
            margin-bottom: 0.25rem;
        }}
        
        .swc-grid {{
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 0.8rem;
            margin-top: 1rem;
        }}
        .swc-step {{
            border: 1px solid var(--swc-border);
            border-radius: 8px;
            padding: 0.9rem;
            background: color-mix(in srgb, var(--swc-surface-2) 88%, transparent);
        }}
        .swc-step strong {{
            color: var(--swc-text);
        }}
        .swc-step span {{
            display: block;
            color: var(--swc-muted);
            margin-top: 0.2rem;
            font-size: 0.9rem;
        }}
        .swc-panel {{
            border: 1px solid var(--swc-border);
            border-radius: 8px;
            padding: 1rem;
            background: var(--swc-surface);
            box-shadow: 0 14px 34px rgba(0,0,0,0.15);
            margin-bottom: 1rem;
        }}
        .swc-panel-title {{
            font-weight: 800;
            font-size: 1.05rem;
            margin-bottom: 0.3rem;
        }}
        .swc-panel-copy {{
            color: var(--swc-muted);
            margin-bottom: 0.8rem;
        }}
        .swc-login {{
            max-width: 860px;
            margin: 4vh auto 0;
            display: grid;
            grid-template-columns: 1.1fr 0.9fr;
            gap: 1rem;
            animation: swcFadeUp 520ms ease-out both;
        }}
        .swc-login-visual {{
            border: 1px solid var(--swc-border);
            border-radius: 8px;
            min-height: 360px;
            padding: 1.2rem;
            background:
                linear-gradient(150deg, color-mix(in srgb, var(--swc-accent) 24%, transparent), transparent 46%),
                linear-gradient(330deg, color-mix(in srgb, var(--swc-accent-2) 18%, transparent), transparent 40%),
                var(--swc-surface);
            box-shadow: 0 22px 56px rgba(0,0,0,0.28);
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }}
        .swc-login-visual h1 {{
            margin: 0;
            font-size: clamp(2.4rem, 6vw, 4.8rem);
            line-height: 0.95;
        }}
        .swc-login-card {{
            border: 1px solid var(--swc-border);
            border-radius: 8px;
            background: var(--swc-surface);
            padding: 1.2rem;
            box-shadow: 0 22px 56px rgba(0,0,0,0.22);
        }}
        .swc-transition {{
            min-height: 60vh;
            display: grid;
            place-items: center;
            text-align: center;
            animation: swcPulseIn 900ms ease both;
        }}
        .swc-transition-card {{
            border: 1px solid var(--swc-border);
            border-radius: 8px;
            background: var(--swc-surface);
            padding: 2rem;
            width: min(560px, 100%);
            box-shadow: 0 26px 64px rgba(0,0,0,0.24);
        }}
        .swc-progress {{
            height: 8px;
            border-radius: 999px;
            background: var(--swc-surface-2);
            overflow: hidden;
            margin-top: 1rem;
        }}
        .swc-progress span {{
            display: block;
            height: 100%;
            width: 100%;
            background: linear-gradient(90deg, var(--swc-accent), var(--swc-accent-2));
            animation: swcLoad 1.1s ease-in-out both;
        }}
        .swc-status-ok {{
            border-left: 5px solid var(--swc-accent);
        }}
        .swc-status-warn {{
            border-left: 5px solid var(--swc-warning);
        }}
        [data-testid="stDeckGlJsonChart"] {{
            border-radius: 8px;
            overflow: hidden;
            border: 1px solid var(--swc-border);
            filter: {palette["map_filter"]};
        }}
        iframe {{
            border-radius: 8px;
        }}
        .swc-map-toolbar {{
            border: 1px solid var(--swc-border);
            border-radius: 8px;
            padding: 0.8rem;
            background: color-mix(in srgb, var(--swc-surface-2) 88%, transparent);
            margin-bottom: 0.8rem;
        }}
        .swc-map-note {{
            color: var(--swc-muted);
            font-size: 0.92rem;
            margin: -0.2rem 0 0.8rem;
        }}
        @keyframes swcFadeUp {{
            from {{ opacity: 0; transform: translateY(16px); }}
            to {{ opacity: 1; transform: translateY(0); }}
        }}
        @keyframes swcPulseIn {{
            from {{ opacity: 0; transform: scale(0.98); }}
            to {{ opacity: 1; transform: scale(1); }}
        }}
        @keyframes swcLoad {{
            from {{ transform: translateX(-100%); }}
            to {{ transform: translateX(0); }}
        }}
        @media (max-width: 780px) {{
            .swc-grid, .swc-login {{
                grid-template-columns: 1fr;
            }}
            .swc-login {{
                margin-top: 1rem;
            }}
        }}
        </style>
        """,
        unsafe_allow_html=True,
    )


def render_theme_selector() -> str:
    with st.sidebar:
        st.subheader("Appearance")
        return st.radio(
            "Theme",
            options=["dark", "light"],
            format_func=lambda value: value.title(),
            horizontal=True,
            key="theme_mode",
        )


def render_header() -> None:
    st.markdown(
        """
        <div class="swc-hero">
            <div class="swc-kicker">ICAR-inspired decision support</div>
            <h1>SWC-AI-ENGINE</h1>
            <p>
                Capture a field location, choose the land-use context, and get
                soil and water conservation recommendations from the deployed
                geospatial Flask engine.
            </p>
            <div class="swc-grid">
                <div class="swc-step"><strong>1. Locate</strong><span>Use browser GPS to place the field on the map.</span></div>
                <div class="swc-step"><strong>2. Classify</strong><span>Select crop or non-arable land-use context.</span></div>
                <div class="swc-step"><strong>3. Decide</strong><span>View erosion risk and suggested SWC measures.</span></div>
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def render_backend_status(is_healthy: bool, backend_url: str) -> None:
    label = "Backend online" if is_healthy else "Backend unavailable"
    st.sidebar.metric("API", label)
    st.sidebar.caption(backend_url)


def render_location_picker(gps_location: BrowserLocation | None) -> BrowserLocation | None:
    st.markdown(
        """
        <div class="swc-panel">
            <div class="swc-panel-title">Field Location</div>
            <div class="swc-panel-copy">
                Select your location source. You can use your live GPS coordinates or manually drop a pin on the map.
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    source_type = st.radio(
        "Location Source",
        ["Live GPS", "Manual Map Pin"],
        horizontal=True,
        label_visibility="collapsed"
    )

    if source_type == "Live GPS":
        if gps_location is None:
            st.info("Allow location access in the browser to use Live GPS.")
            return None

        col1, col2, col3 = st.columns(3)
        col1.metric("Latitude", f"{gps_location.latitude:.6f}")
        col2.metric("Longitude", f"{gps_location.longitude:.6f}")
        accuracy = (
            f"{gps_location.accuracy_m:.0f} m" if gps_location.accuracy_m is not None else "Unknown"
        )
        col3.metric("Source", "Live GPS", accuracy)

        points = pd.DataFrame(
            [{"lat": gps_location.latitude, "lon": gps_location.longitude, "size": 80}]
        )
        st.map(points, latitude="lat", longitude="lon", size="size", zoom=13, height=400)
        
        return gps_location

    else:
        # Manual Map Pin mode
        if "manual_lat" not in st.session_state:
            st.session_state.manual_lat = gps_location.latitude if gps_location else 20.5937
        if "manual_lon" not in st.session_state:
            st.session_state.manual_lon = gps_location.longitude if gps_location else 78.9629

        current_lat = st.session_state.manual_lat
        current_lon = st.session_state.manual_lon

        zoom = 13 if gps_location else 4

        m = folium.Map(location=[current_lat, current_lon], zoom_start=zoom)

        folium.TileLayer('cartodbpositron', name='Light Map').add_to(m)
        folium.TileLayer('cartodbdark_matter', name='Dark Map').add_to(m)
        folium.TileLayer(
            tiles='https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            attr='Esri',
            name='Satellite (Terrain)',
            overlay=False,
        ).add_to(m)

        folium.LayerControl().add_to(m)

        folium.Marker(
            [current_lat, current_lon],
            tooltip="Selected Location",
            icon=folium.Icon(color="green", icon="leaf")
        ).add_to(m)

        map_data = st_folium(m, height=400, use_container_width=True, key="manual_location_picker")

        if map_data and map_data.get("last_clicked"):
            lat = map_data["last_clicked"]["lat"]
            lon = map_data["last_clicked"]["lng"]
            if current_lat != lat or current_lon != lon:
                st.session_state.manual_lat = lat
                st.session_state.manual_lon = lon
                st.rerun()

        col1, col2, col3 = st.columns(3)
        col1.metric("Latitude", f"{st.session_state.manual_lat:.6f}")
        col2.metric("Longitude", f"{st.session_state.manual_lon:.6f}")
        col3.metric("Source", "Map Pin", "Unknown")

        return BrowserLocation(
            latitude=st.session_state.manual_lat,
            longitude=st.session_state.manual_lon,
            accuracy_m=None,
            source="Map Pin"
        )


def render_land_use_help() -> None:
    st.markdown(
        """
        <div class="swc-panel">
            <div class="swc-panel-title">Land Use</div>
            <div class="swc-panel-copy">
                Choose the closest crop or land-cover context. Non-arable options
                help demonstrate the early-exit behavior when the raster classifier
                detects forest, urban, water, or barren land.
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def render_response(response: dict[str, Any]) -> None:
    status = response.get("status")

    if status == "NON_ARABLE":
        st.markdown(
            f"""
            <div class="swc-hero" style="border-left-color: var(--swc-warning);">
                <div class="swc-kicker" style="color: var(--swc-warning);">Analysis Complete</div>
                <h1 style="color: var(--swc-warning); font-size: 1.8rem;">Non-Arable Land Detected</h1>
                <p><strong>System Note:</strong> The SWC-AI-ENGINE is calibrated for arable agricultural land. 
                The selected location and land cover context indicate <strong>{response.get("reason", "Unknown")}</strong>.</p>
            </div>
            """,
            unsafe_allow_html=True,
        )
        with st.expander("View Detailed Technical Analysis"):
            st.json(response)
        return

    if status != "OK":
        st.error(response.get("message", "Unexpected backend response"))
        with st.expander("View Detailed Technical Analysis"):
            st.json(response)
        return

    factors = response.get("factors", {})
    measures = response.get("mechanical_measures", {})
    erosion = response.get("erosion_risk", {})

    st.markdown(
        f"""
        <div class="swc-hero" style="border-left-color: var(--swc-accent);">
            <div class="swc-kicker">Recommended Conservation Measure</div>
            <h1 style="color: var(--swc-accent-2); font-size: 2.2rem; margin-bottom: 0.2rem;">
                {measures.get("measures", ["No specific mechanical measure required."])[0]}
            </h1>
            <p><strong>Erosion Risk Level:</strong> {erosion.get("level", "Unknown")} (Score: {erosion.get("score", "Unknown")})</p>
        </div>
        """,
        unsafe_allow_html=True,
    )

    if len(measures.get("measures", [])) > 1:
        st.subheader("Alternative Measures")
        for measure in measures.get("measures", [])[1:]:
            st.markdown(f"• **{measure}**")

    st.subheader("Environmental Factors")
    f1, f2, f3, f4 = st.columns(4)
    f1.metric("Rainfall", f"{factors.get('rainfall_mm', 0)} mm")
    f2.metric("Slope", f"{factors.get('slope_percent', 0)}%")
    f3.metric("Soil Depth", factors.get("soil_depth", "Unknown"))
    f4.metric("Drainage", factors.get("drainage", "Unknown"))

    st.write("")
    with st.expander("View Detailed Technical Analysis"):
        st.json(response)


def render_history(rows: list[Any]) -> None:
    if not rows:
        return

    with st.sidebar:
        st.subheader("Recent Analyses")
        for row in rows:
            st.caption(f"{row.land_use} | {row.backend_status}")
            st.write(f"{row.latitude:.4f}, {row.longitude:.4f}")


def render_login_opening(mode_label: str) -> None:
    st.markdown(
        f"""
        <div class="swc-login">
            <div class="swc-login-visual">
                <div>
                    <div class="swc-kicker">Secure field intelligence</div>
                    <h1>SWC-AI-ENGINE</h1>
                </div>
                <p class="swc-muted">
                    Sign in to save analysis history, GPS context, selected land use,
                    erosion risk, and recommended conservation measures.
                </p>
            </div>
            <div class="swc-login-card">
                <div class="swc-kicker">{mode_label}</div>
                <h2>Start Analysis</h2>
                <p class="swc-muted">Your workspace opens after authentication.</p>
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def render_transition_screen(name: str | None) -> None:
    display_name = name or "User"
    st.markdown(
        f"""
        <div class="swc-transition">
            <div class="swc-transition-card">
                <div class="swc-kicker">Session Ready</div>
                <h1>Welcome, {display_name}</h1>
                <p class="swc-muted">Preparing your field analysis workspace.</p>
                <div class="swc-progress"><span></span></div>
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )
