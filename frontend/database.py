from __future__ import annotations

from contextlib import contextmanager
from typing import Any, Iterator

import streamlit as st
from sqlalchemy import create_engine, inspect, select, text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

from config import database_url
from models import AnalysisRequest, Base


def is_database_configured() -> bool:
    return database_url(required=False) is not None


@st.cache_resource(show_spinner=False)
def get_engine() -> Engine:
    return create_engine(
        database_url(required=True),
        pool_pre_ping=True,
        pool_recycle=280,
        future=True,
    )


@st.cache_resource(show_spinner=False)
def get_session_factory() -> sessionmaker[Session]:
    return sessionmaker(
        bind=get_engine(),
        autoflush=False,
        autocommit=False,
        expire_on_commit=False,
        future=True,
    )


def initialize_database() -> None:
    engine = get_engine()
    Base.metadata.create_all(engine)
    ensure_analysis_schema(engine)
    ensure_analysis_history_view(engine)


def ensure_analysis_schema(engine: Engine) -> None:
    inspector = inspect(engine)
    if "analysis_requests" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("analysis_requests")}
    missing_columns = {
        "recommendation_mode": "ALTER TABLE analysis_requests ADD COLUMN recommendation_mode VARCHAR(32) NULL",
        "recommended_measures": "ALTER TABLE analysis_requests ADD COLUMN recommended_measures JSON NULL",
        "erosion_risk_level": "ALTER TABLE analysis_requests ADD COLUMN erosion_risk_level VARCHAR(32) NULL",
        "erosion_risk_score": "ALTER TABLE analysis_requests ADD COLUMN erosion_risk_score FLOAT NULL",
    }

    with engine.begin() as connection:
        for column_name, statement in missing_columns.items():
            if column_name not in columns:
                connection.execute(text(statement))


def ensure_analysis_history_view(engine: Engine) -> None:
    statement = """
    CREATE OR REPLACE VIEW analysis_history_view AS
    SELECT
        ar.id AS analysis_id,
        u.id AS user_id,
        u.google_sub AS google_login_id,
        u.email AS user_email,
        u.name AS user_name,
        ar.latitude AS access_latitude,
        ar.longitude AS access_longitude,
        ar.land_use AS land_use,
        ar.recommendation_mode AS recommendation_mode,
        ar.recommended_measures AS erosion_control_measures,
        ar.erosion_risk_level AS erosion_risk_level,
        ar.erosion_risk_score AS erosion_risk_score,
        ar.backend_status AS backend_status,
        ar.created_at AS analyzed_at
    FROM analysis_requests ar
    JOIN users u ON u.id = ar.user_id
    """

    with engine.begin() as connection:
        connection.execute(text(statement))


@contextmanager
def session_scope() -> Iterator[Session]:
    session = get_session_factory()()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def save_analysis(
    *,
    user_id: int | None,
    lat: float,
    lon: float,
    land_use: str,
    response: dict[str, Any],
) -> int | None:
    if user_id is None or not is_database_configured():
        return None

    mechanical_measures = response.get("mechanical_measures") or {}
    erosion_risk = response.get("erosion_risk") or {}

    initialize_database()
    with session_scope() as session:
        row = AnalysisRequest(
            user_id=user_id,
            latitude=lat,
            longitude=lon,
            land_use=land_use,
            backend_status=response.get("status"),
            recommendation_mode=mechanical_measures.get("mode"),
            recommended_measures=mechanical_measures.get("measures"),
            erosion_risk_level=erosion_risk.get("level"),
            erosion_risk_score=erosion_risk.get("score"),
            response_json=response,
        )
        session.add(row)
        session.flush()
        return row.id


def recent_analyses(user_id: int | None, limit: int = 5) -> list[AnalysisRequest]:
    if user_id is None or not is_database_configured():
        return []

    initialize_database()
    with session_scope() as session:
        statement = (
            select(AnalysisRequest)
            .where(AnalysisRequest.user_id == user_id)
            .order_by(AnalysisRequest.created_at.desc())
            .limit(limit)
        )
        return list(session.scalars(statement))
