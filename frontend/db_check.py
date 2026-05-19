from __future__ import annotations

import os
import sys
from pathlib import Path
from urllib.parse import urlparse

from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError

from database import ensure_analysis_history_view, ensure_analysis_schema
from models import Base


def load_database_url() -> str | None:
    url = os.getenv("DATABASE_URL")
    if url:
        return url

    secrets_path = Path(__file__).parent / ".streamlit" / "secrets.toml"
    if not secrets_path.exists():
        return None

    try:
        import tomllib
    except ModuleNotFoundError:
        import tomli as tomllib

    with secrets_path.open("rb") as file:
        secrets = tomllib.load(file)

    return secrets.get("database", {}).get("url")


def main() -> int:
    database_url = load_database_url()
    if not database_url:
        print("DATABASE_URL not found.")
        print("Add it to frontend/.streamlit/secrets.toml under [database].")
        return 1

    parsed = urlparse(database_url)
    if parsed.hostname in {"host", "HOST"} or "USERNAME:PASSWORD" in database_url:
        print("DATABASE_URL still contains placeholder values.")
        print("Edit frontend/.streamlit/secrets.toml with your real MySQL host, user, and password.")
        return 1

    try:
        engine = create_engine(database_url, pool_pre_ping=True, future=True)
        with engine.connect() as connection:
            version = connection.execute(text("SELECT VERSION()")).scalar_one()

        Base.metadata.create_all(engine)
        ensure_analysis_schema(engine)
        ensure_analysis_history_view(engine)
    except SQLAlchemyError as exc:
        print("MySQL connection failed.")
        print(str(exc))
        return 1

    print("MySQL connection OK.")
    print(f"Server version: {version}")
    print("Required tables and analysis_history_view are present or were created.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
