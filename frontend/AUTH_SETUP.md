# Authentication Setup

The frontend supports two authentication modes:

- `demo` for local testing
- `google` for production Google Sign-In

The Flask backend does not change.

## Local Demo Mode

Use this first if you want to test GPS, land-use dropdown, backend results, and MySQL storage before creating Google OAuth credentials.

Edit `frontend/.streamlit/secrets.toml`:

```toml
[auth]
mode = "demo"
redirect_uri = "http://localhost:8501/oauth2callback"
cookie_secret = "replace-with-a-long-random-secret"
client_id = "replace-with-google-oauth-client-id"
client_secret = "replace-with-google-oauth-client-secret"
server_metadata_url = "https://accounts.google.com/.well-known/openid-configuration"
```

Then run:

```powershell
streamlit run frontend/app.py
```

Demo users are stored in MySQL with login IDs like:

```text
demo:demo@example.com
```

## Google Sign-In Mode

When you are ready for real authentication, create a Google OAuth web client.

In Google Cloud Console:

1. Create or open a project.
2. Go to `APIs & Services`.
3. Open `OAuth consent screen`.
4. Configure app name, support email, and developer contact.
5. Go to `Credentials`.
6. Create `OAuth client ID`.
7. Choose `Web application`.
8. Add this authorized redirect URI for local development:

```text
http://localhost:8501/oauth2callback
```

For production, add:

```text
https://your-frontend-domain/oauth2callback
```

Then edit `frontend/.streamlit/secrets.toml`:

```toml
[auth]
mode = "google"
redirect_uri = "http://localhost:8501/oauth2callback"
cookie_secret = "use-a-long-random-secret"
client_id = "your-google-client-id"
client_secret = "your-google-client-secret"
server_metadata_url = "https://accounts.google.com/.well-known/openid-configuration"
```

## What Gets Stored

In Google mode, the `users.google_sub` column stores the Google login ID.

In demo mode, the same column stores a demo login ID.

The readable MySQL view is:

```sql
SELECT *
FROM analysis_history_view
ORDER BY analyzed_at DESC;
```
