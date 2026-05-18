from __future__ import annotations

import streamlit as st

from api import BackendApiError, BackendTimeoutError, analyze_land, check_health
from auth import authenticate_user, render_account_menu
from config import LAND_USE_LABELS, LAND_USES, analyze_timeout_seconds, backend_url
from database import is_database_configured, recent_analyses, save_analysis
from location import request_browser_location
from ui import (
    apply_theme,
    render_backend_status,
    render_header,
    render_history,
    render_land_use_help,
    render_location_picker,
    render_response,
    render_theme_selector,
)


def main() -> None:
    st.set_page_config(
        page_title="SWC-AI-ENGINE",
        page_icon="SWC",
        layout="wide",
    )
    theme_mode = render_theme_selector()
    apply_theme(theme_mode)

    current_user = authenticate_user()
    render_account_menu(current_user)

    api_base_url = backend_url()
    render_backend_status(check_health(api_base_url), api_base_url)

    if not is_database_configured():
        st.sidebar.warning("Database is not configured. Results will not be saved.")
    else:
        render_history(recent_analyses(current_user.id))

    render_header()

    main_col1, main_col2 = st.columns([1.3, 1], gap="large")

    with main_col1:
        gps_location = request_browser_location()
        location = render_location_picker(gps_location)

    with main_col2:
        render_land_use_help()
        land_use = st.selectbox(
            "Crop or land-cover type",
            LAND_USES,
            index=LAND_USES.index("WHEAT"),
            format_func=lambda code: LAND_USE_LABELS.get(code, code),
        )

        analyze_disabled = location is None
        st.write("")
        if st.button("Analyze Land", type="primary", disabled=analyze_disabled, use_container_width=True):
            with st.spinner("Analyzing live rainfall, terrain, landcover, and ICAR rules..."):
                try:
                    response = analyze_land(
                        base_url=api_base_url,
                        lat=location.latitude,
                        lon=location.longitude,
                        land_use=land_use,
                        timeout_seconds=analyze_timeout_seconds(),
                    )
                except BackendTimeoutError as exc:
                    st.warning(str(exc))
                    st.info(
                        "Tip: click Analyze Land once more. Render services can be slow "
                        "on the first request after being idle."
                    )
                except BackendApiError as exc:
                    st.error(str(exc))
                else:
                    save_analysis(
                        user_id=current_user.id,
                        lat=location.latitude,
                        lon=location.longitude,
                        land_use=land_use,
                        response=response,
                    )
                    st.session_state["last_response"] = response

    if "last_response" in st.session_state:
        st.divider()
        render_response(st.session_state["last_response"])


if __name__ == "__main__":
    main()
