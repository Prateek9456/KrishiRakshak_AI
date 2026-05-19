# MySQL Setup For SWC-AI-ENGINE Frontend

This guide connects the Streamlit frontend to MySQL.

The Flask backend does not need to change.

## What MySQL Stores

The database stores frontend user data only:

- Google user profile
- frontend session records
- analysis history

It does not replace the Flask backend or rule engine.

## Step 1: Create A Database

Open MySQL Workbench, phpMyAdmin, or a MySQL terminal and run:

```sql
CREATE DATABASE swc_ai_engine
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
```

## Step 2: Create A User

For local development, replace `your_password_here` with your own password:

```sql
CREATE USER 'swc_user'@'localhost' IDENTIFIED BY 'your_password_here';
GRANT ALL PRIVILEGES ON swc_ai_engine.* TO 'swc_user'@'localhost';
FLUSH PRIVILEGES;
```

If your MySQL provider gives you a username/password already, skip this step.

## Step 3: Add The Database URL

Create the real Streamlit secrets file if it does not exist:

```powershell
copy frontend\.streamlit\secrets.toml.example frontend\.streamlit\secrets.toml
```

Edit `frontend/.streamlit/secrets.toml`.

For local MySQL:

```toml
[database]
url = "mysql+pymysql://swc_user:your_password_here@localhost:3306/swc_ai_engine"
```

For a cloud MySQL provider:

```toml
[database]
url = "mysql+pymysql://USERNAME:PASSWORD@HOST:3306/DATABASE_NAME"
```

If the password contains special characters like `@`, `#`, `:`, `/`, or `%`,
URL-encode it before putting it in the URL.

## Step 4: Test The Connection

Run:

```powershell
python frontend\db_check.py
```

Expected output:

```text
MySQL connection OK.
Server version: ...
Required tables are present or were created.
```

The checker creates these tables:

- `users`
- `user_sessions`
- `analysis_requests`

It also creates this readable joined view:

- `analysis_history_view`

## Step 5: Run The Frontend

```powershell
streamlit run frontend/app.py
```

Then open:

```text
http://localhost:8501
```

## Common Errors

`Access denied for user`

The username or password is wrong, or the user does not have permission for the database.

`Unknown database 'swc_ai_engine'`

The database was not created yet.

`Can't connect to MySQL server`

MySQL is not running, the host is wrong, or a cloud firewall is blocking your IP.

`No module named pymysql`

Install frontend dependencies:

```powershell
python -m pip install -r frontend\requirements.txt
```

## Where To See The Stored Data

In MySQL Workbench, open:

```text
Schemas > swc_ai_engine > Views > analysis_history_view
```

Right-click `analysis_history_view`, then choose:

```text
Select Rows - Limit 1000
```

This view shows the exact fields most useful for your project:

- Google login ID
- user email
- user name
- GPS latitude
- GPS longitude
- selected land use
- recommended erosion control measures
- erosion risk level
- erosion risk score
- analysis time

You can also run:

```sql
USE swc_ai_engine;

SELECT *
FROM analysis_history_view
ORDER BY analyzed_at DESC;
```
