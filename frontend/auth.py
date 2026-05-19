from __future__ import annotations

import hashlib
import time
import uuid
from dataclasses import dataclass

import streamlit as st
from sqlalchemy import select

from database import initialize_database, is_database_configured, session_scope
from models import User, UserSession, utc_now
from config import auth_mode, google_auth_configured
from ui import render_login_opening, render_transition_screen


@dataclass(frozen=True)
class CurrentUser:
    id: int | None
    login_id: str
    email: str
    name: str | None
    picture_url: str | None
    auth_provider: str


def _identity_value(name: str) -> str | None:
    try:
        value = st.user.get(name)
        return str(value) if value else None
    except Exception:
        try:
            value = getattr(st.user, name, None)
            return str(value) if value else None
        except Exception:
            return None


def _is_google_user_logged_in() -> bool:
    try:
        return bool(getattr(st.user, "is_logged_in", False))
    except Exception:
        return bool(_identity_value("email") and _identity_value("sub"))


def authenticate_user() -> CurrentUser:
    mode = auth_mode()
    if mode == "demo":
        return authenticate_demo_user()

    if mode != "google":
        st.error(f"Unsupported auth mode: {mode}")
        st.stop()

    require_google_login()
    user = sync_google_user()
    if not st.session_state.get("google_transition_seen"):
        st.session_state["google_transition_seen"] = True
        render_transition_screen(user.name)
        time.sleep(1.1)
        st.rerun()
    return user


def require_google_login() -> None:
    if _is_google_user_logged_in():
        return

    render_login_opening("Google Sign-In")

    if not google_auth_configured():
        st.error("Google Sign-In is not configured yet.")
        st.write("Fill the `[auth]` section in `frontend/.streamlit/secrets.toml`.")
        st.info('For local testing, set `mode = "demo"` under `[auth]`.')
        st.stop()

    st.button("Continue with Google", type="primary", on_click=st.login)
    st.stop()


def sync_google_user() -> CurrentUser:
    email = _identity_value("email")
    google_sub = _identity_value("sub")
    name = _identity_value("name")
    picture_url = _identity_value("picture")

    if not email or not google_sub:
        st.error("Google did not return the required identity fields.")
        st.stop()

    if not is_database_configured():
        return CurrentUser(
            id=None,
            login_id=google_sub,
            email=email,
            name=name,
            picture_url=picture_url,
            auth_provider="google",
        )

    return sync_user_profile(
        login_id=google_sub,
        email=email,
        name=name,
        picture_url=picture_url,
        auth_provider="google",
    )


def authenticate_demo_user() -> CurrentUser:
    if st.session_state.get("just_authenticated"):
        render_transition_screen(st.session_state.get("demo_name"))
        time.sleep(1.1)
        st.session_state["just_authenticated"] = False
        st.rerun()

    render_login_opening("Demo Mode")

    if "demo_email" not in st.session_state:
        with st.form("demo_login_form"):
            name = st.text_input("Name", value="Demo User")
            email = st.text_input("Email", value="demo@example.com")
            submitted = st.form_submit_button("Continue", type="primary")

        if not submitted:
            st.stop()

        st.session_state["demo_name"] = name.strip() or "Demo User"
        st.session_state["demo_email"] = email.strip().lower() or "demo@example.com"
        st.session_state["just_authenticated"] = True
        st.rerun()

    email = st.session_state["demo_email"]
    name = st.session_state["demo_name"]
    login_id = f"demo:{email}"

    if not is_database_configured():
        return CurrentUser(
            id=None,
            login_id=login_id,
            email=email,
            name=name,
            picture_url=None,
            auth_provider="demo",
        )

    return sync_user_profile(
        login_id=login_id,
        email=email,
        name=name,
        picture_url=None,
        auth_provider="demo",
    )


def sync_user_profile(
    *,
    login_id: str,
    email: str,
    name: str | None,
    picture_url: str | None,
    auth_provider: str,
) -> CurrentUser:
    initialize_database()

    with session_scope() as session:
        user = session.scalar(select(User).where(User.google_sub == login_id))
        if user is None:
            user = session.scalar(select(User).where(User.email == email))

        now = utc_now()
        if user is None:
            user = User(
                google_sub=login_id,
                email=email,
                name=name,
                picture_url=picture_url,
                created_at=now,
                updated_at=now,
                last_login_at=now,
            )
            session.add(user)
        else:
            user.google_sub = login_id
            user.email = email
            user.name = name
            user.picture_url = picture_url
            user.updated_at = now
            user.last_login_at = now

        session.flush()
        touch_user_session(session, user.id, auth_provider)

        return CurrentUser(
            id=user.id,
            login_id=user.google_sub,
            email=user.email,
            name=user.name,
            picture_url=user.picture_url,
            auth_provider=auth_provider,
        )


def touch_user_session(session, user_id: int, auth_provider: str) -> None:
    if "frontend_session_token" not in st.session_state:
        st.session_state["frontend_session_token"] = uuid.uuid4().hex

    token = st.session_state["frontend_session_token"].encode("utf-8")
    token_hash = hashlib.sha256(token).hexdigest()
    now = utc_now()

    row = session.scalar(
        select(UserSession).where(UserSession.session_token_hash == token_hash)
    )
    if row is None:
        session.add(
            UserSession(
                user_id=user_id,
                session_token_hash=token_hash,
                auth_provider=auth_provider,
                started_at=now,
                last_seen_at=now,
            )
        )
    else:
        row.last_seen_at = now


def render_account_menu(user: CurrentUser) -> None:
    with st.sidebar:
        st.subheader("Account")
        if user.picture_url:
            st.image(user.picture_url, width=56)
        st.write(user.name or user.email)
        st.caption(user.email)
        st.caption(f"Login ID: {user.login_id}")

        if user.auth_provider == "demo":
            if st.button("Log out"):
                for key in (
                    "demo_email",
                    "demo_name",
                    "frontend_session_token",
                    "just_authenticated",
                    "last_response",
                    "current_location",
                ):
                    st.session_state.pop(key, None)
                st.rerun()
        else:
            st.button("Log out", on_click=st.logout)
