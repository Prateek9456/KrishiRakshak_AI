# KrishiRakshak AI - SWC AI Engine

KrishiRakshak AI is a soil and water conservation decision-support system for
agricultural land. It combines a Flask geospatial analysis engine with a
Next.js dashboard so users can select a field location, choose a crop or land
use, and receive ICAR-based mechanical conservation recommendations with an
erosion risk summary.

The repository contains the deployed Python Flask analysis service, the
production Next.js web application, and an optional Streamlit frontend used for
legacy or prototype workflows.

## Live Services

| Service | Purpose | URL |
| --- | --- | --- |
| Flask engine | Geospatial factor extraction and conservation recommendations | `https://swc-ai-engine-clean.onrender.com` |
| Next.js web app | Authenticated dashboard, map pinning, analysis history, and results UI | Configure from `render.yaml` as `krishi-rakshak-web` |

Render free-tier services may sleep when idle. The first request after a cold
start can take longer than normal.

## What the System Does

- Accepts latitude, longitude, and land-use/crop input.
- Builds site factors for rainfall, slope, soil depth, soil drainage, and land
  use.
- Checks whether the selected location is arable agricultural land.
- Evaluates ICAR Table 4.1 mechanical soil and water conservation rules.
- Falls back from strict matches to relaxed and nearest-match recommendations
  when exact criteria are not available.
- Computes an erosion risk score and risk level.
- Shows results in a map-based web dashboard.
- Supports Google sign-in through NextAuth.
- Stores users, sessions, and analysis history in MySQL through Prisma.
- Provides health checks for both the web app and backend engine.

## Repository Layout

```text
.
|-- app.py                         Flask API entry point
|-- requirements.txt               Minimal Python runtime dependencies
|-- requirements.lock.txt          Locked Python dependency snapshot
|-- render.yaml                    Render blueprint for the Next.js web app
|-- DEPLOY_RENDER.md               Detailed Render deployment notes
|-- engine/                        Rule evaluation, risk scoring, explainers
|-- geo/                           Geospatial factor builders and sensors
|-- rules/                         ICAR conservation rule data
|-- tests/                         Python regression tests
|-- web/                           Production Next.js dashboard
|   |-- prisma/                    MySQL schema
|   |-- scripts/                   Database setup/check scripts
|   `-- src/                       App Router pages, API routes, components
`-- frontend/                      Optional Streamlit frontend
```

## Architecture

```text
User
  |
  v
Next.js dashboard in web/
  |-- Google login with NextAuth
  |-- Leaflet map and GPS/manual coordinate input
  |-- MySQL analysis history through Prisma
  |
  v
Next.js API route /api/analyze
  |
  v
Flask engine /analyze
  |-- geo.factor_builder.build_factors
  |-- geo.arable_classifier.is_arable_land
  |-- engine.rule_engine.evaluate_rules
  |-- engine.erosion_risk_engine.compute_erosion_risk
  |
  v
JSON recommendation response
```

The web app does not duplicate the conservation logic. It forwards analysis
requests to the Flask engine and stores the returned response for user history.

## Backend API

### Health Check

```http
GET /health
```

Successful response:

```json
{
  "status": "ok"
}
```

### Analyze Land

```http
POST /analyze
Content-Type: application/json
```

Request body:

```json
{
  "lat": 28.6139,
  "lon": 77.209,
  "land_use": "WHEAT"
}
```

Successful response:

```json
{
  "status": "OK",
  "input": {
    "lat": 28.6139,
    "lon": 77.209,
    "land_use": "WHEAT"
  },
  "factors": {
    "rainfall_mm": 750,
    "slope_percent": 4.2,
    "soil_depth": "MODERATE",
    "drainage": "GOOD",
    "land_use": "WHEAT"
  },
  "mechanical_measures": {
    "mode": "STRICT",
    "measures": ["Contour bunding"]
  },
  "erosion_risk": {
    "score": 0.42,
    "level": "MODERATE"
  }
}
```

Non-arable response:

```json
{
  "status": "NON_ARABLE",
  "message": "System works only for arable agricultural land",
  "reason": "Location is not classified as arable agricultural land",
  "input": {
    "lat": 28.6139,
    "lon": 77.209,
    "land_use": "WHEAT"
  }
}
```

Validation errors return `400`; unexpected backend errors return `500` with a
JSON error payload.

## Recommendation Modes

The rule engine returns one of three modes:

| Mode | Meaning |
| --- | --- |
| `STRICT` | The selected land use and all environmental constraints matched the ICAR rule. |
| `RELAXED` | Environmental constraints matched, but land-use matching was relaxed. |
| `NEAREST` | No direct rule matched, so the engine ranked nearby rules and returned the best available measures. |

## Local Backend Setup

Create and activate a virtual environment:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

Install dependencies:

```powershell
pip install -r requirements.txt
```

Run the Flask engine:

```powershell
python app.py
```

The backend starts on `0.0.0.0` using `PORT` when set, or port `10000` by
default.

Example local request:

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri http://localhost:10000/analyze `
  -ContentType "application/json" `
  -Body '{"lat":28.6139,"lon":77.209,"land_use":"WHEAT"}'
```

## Local Web App Setup

Install Node dependencies:

```powershell
cd web
npm install
```

Create `web/.env.local`:

```env
BACKEND_URL=http://localhost:10000
DATABASE_URL=mysql://USER:PASSWORD@HOST:3306/swc_ai_engine
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=replace-with-a-long-random-secret
GOOGLE_CLIENT_ID=replace-with-google-client-id
GOOGLE_CLIENT_SECRET=replace-with-google-client-secret
AUTH_MODE=google
NEXT_PUBLIC_AUTH_MODE=google
ANALYZE_TIMEOUT_SECONDS=240
HEALTH_TIMEOUT_SECONDS=60
HEALTH_RETRIES=3
```

Generate Prisma client and initialize the database:

```powershell
npm run db:setup
```

Start the web app:

```powershell
npm run dev
```

Open `http://localhost:3000`.

## MySQL Schema

The Next.js app uses Prisma with MySQL and manages these core tables:

| Table | Purpose |
| --- | --- |
| `users` | Google-authenticated user profile records |
| `user_sessions` | Session audit records |
| `analysis_requests` | Saved analysis inputs, backend responses, measures, and risk summaries |

For production, `DATABASE_URL` must point to a cloud MySQL-compatible database.
Do not use `localhost` for Render deployment.

## Google OAuth

Create a Google OAuth web client in Google Cloud Console.

For local development, add:

```text
http://localhost:3000/api/auth/callback/google
```

For Render production, add:

```text
https://YOUR-RENDER-SERVICE.onrender.com/api/auth/callback/google
```

Set the same client ID and secret in the web app environment variables.

## Render Deployment

The Flask backend is already deployed separately at:

```text
https://swc-ai-engine-clean.onrender.com
```

The included `render.yaml` deploys the Next.js app from `web/`.

Blueprint settings:

| Setting | Value |
| --- | --- |
| Service name | `krishi-rakshak-web` |
| Runtime | Node |
| Region | Singapore |
| Root directory | `web` |
| Build command | `npm install && npm run build` |
| Start command | `npm start` |
| Health check path | `/api/health` |

Required production secrets:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Cloud MySQL connection string |
| `NEXTAUTH_URL` | Public Render URL for the web app |
| `NEXTAUTH_SECRET` | NextAuth session encryption secret |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |

Provided defaults in `render.yaml`:

| Variable | Default |
| --- | --- |
| `BACKEND_URL` | `https://swc-ai-engine-clean.onrender.com` |
| `ANALYZE_TIMEOUT_SECONDS` | `240` |
| `HEALTH_TIMEOUT_SECONDS` | `60` |
| `HEALTH_RETRIES` | `3` |
| `AUTH_MODE` | `google` |
| `NEXT_PUBLIC_AUTH_MODE` | `google` |
| `NODE_VERSION` | `20` |

See `DEPLOY_RENDER.md` for a step-by-step deployment checklist.

## Optional Streamlit Frontend

The `frontend/` directory contains a Streamlit UI that can call the Flask API.
It is useful for prototype workflows or Python-only deployments, but the
primary production web application is `web/`.

Run it locally:

```powershell
pip install -r frontend/requirements.txt
streamlit run frontend/app.py
```

Configure secrets in `frontend/.streamlit/secrets.toml`. Do not commit real
secrets.

## Testing

Run backend tests:

```powershell
pytest
```

Run the Next.js production build:

```powershell
cd web
npm run build
```

Useful web checks:

```powershell
npm run db:check
npm run lint
```

## Development Notes

- Keep the Flask API response contract stable because the web app depends on
  it.
- Add or update tests when changing rule logic, sensor behavior, or response
  shapes.
- Keep secrets out of Git. Use `.env.local`, Render secrets, or Streamlit
  secrets files.
- Treat `python-flask` as the deployed backend source branch when synchronizing
  deployment fixes.
- Use `main` for the GitHub-facing integrated project state.

## Troubleshooting

| Issue | Likely Cause | Fix |
| --- | --- | --- |
| First analysis request is slow | Render service is waking from sleep | Wait and retry; timeouts are intentionally long |
| Google login shows redirect error | OAuth callback URL mismatch | Add the exact `/api/auth/callback/google` production URL |
| Web app cannot save history | Database is unreachable or not initialized | Check `DATABASE_URL`, then run `npm run db:setup` |
| Render build fails on Prisma | Prisma cannot generate client | Ensure `DATABASE_URL` is set before build |
| Backend health is offline | Flask service is sleeping or unavailable | Open `/health` on the backend URL and retry |
| Analysis returns validation error | Missing or invalid input JSON | Send numeric `lat`, numeric `lon`, and a `land_use` string |

## License

No license file is currently included. Add a license before distributing or
accepting external contributions.
