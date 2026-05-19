# SWC-AI-ENGINE Frontend

This is the Python-only Streamlit frontend for the existing Flask backend.
The backend API response contract is not duplicated or changed here.

## What This App Does

- Authenticates users with Google through Streamlit OIDC.
- Supports local demo login before Google OAuth is ready.
- Stores user profiles and analysis history in MySQL.
- Requests browser GPS location through a Streamlit component.
- Sends `lat`, `lon`, and `land_use` to the deployed Flask `/analyze` endpoint.
- Displays quick results, recommended measures, and raw backend JSON.

## Local Setup

From the project root:

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r frontend/requirements.txt
```

Create a local secrets file:

```bash
copy frontend\.streamlit\secrets.toml.example frontend\.streamlit\secrets.toml
```

Then edit `frontend/.streamlit/secrets.toml`.

## Google OAuth Setup

For local testing before Google OAuth is ready, see:

```text
frontend/AUTH_SETUP.md
```

Create a Google OAuth web client and add this local redirect URI:

```text
http://localhost:8501/oauth2callback
```

For production, add the deployed Streamlit redirect URI:

```text
https://your-frontend-domain/oauth2callback
```

Use this provider metadata URL:

```text
https://accounts.google.com/.well-known/openid-configuration
```

## MySQL Setup

Create a database:

```sql
CREATE DATABASE swc_ai_engine CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Use a SQLAlchemy URL like:

```text
mysql+pymysql://user:password@host:3306/swc_ai_engine
```

The Streamlit app creates these tables automatically on first run:

- `users`
- `user_sessions`
- `analysis_requests`

For production migrations later, add Alembic before changing schemas.

## Run Locally

```bash
streamlit run frontend/app.py
```

The app calls the deployed backend by default:

```text
https://swc-ai-engine-clean.onrender.com
```

The first request can be slow if Render is waking the service. The frontend
uses a longer analysis timeout and shows a retry-friendly message instead of a
raw exception.

You can override it in secrets:

```toml
[backend]
url = "https://swc-ai-engine-clean.onrender.com"
```

## Production Start Command

```bash
streamlit run frontend/app.py --server.port $PORT --server.address 0.0.0.0
```

## Required Production Secrets

- Google OAuth client ID
- Google OAuth client secret
- Streamlit auth cookie secret
- MySQL database URL
- Backend API URL

Do not commit `frontend/.streamlit/secrets.toml`.
