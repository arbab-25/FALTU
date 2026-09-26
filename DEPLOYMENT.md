# Deploying Kabadiwala Connect — Render + Neon Postgres

This guide takes the prototype from local SQLite to a live cloud deployment:

| Piece | Service | Notes |
|---|---|---|
| API (`/api/*`) | Render **Web Service** (Python, free plan) | auto-seeds the cloud DB on first boot |
| Website | Render **Static Site** (Vite build) | SPA rewrite included in `render.yaml` |
| Database | **Neon** Postgres free tier | serverless, zero-config SSL |

---

## 1. Create the Neon database (~2 min)

1. Sign up at **neon.tech** (GitHub login works).
2. **Create project** → name it `kabadiwala` (region: closest to you, e.g. `Singapore` or `Frankfurt`).
3. Open the dashboard → **Connection string** → choose **psycopg2 / generic** format. It looks like:
   ```
   postgresql://user:password@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require
   ```
4. **Keep the `-pooler` hostname** — Neon's pooled endpoint is the right choice for Render free instances.
5. Copy the string for step 3.

## 2. Push this repo (done)

The repo already contains `render.yaml` — a **single-service blueprint**: one
Render web service serves BOTH the built frontend and the API from the same
origin. There is no CORS, no build-time API URL, and no second service that
can drift out of sync. (The earlier two-service design is exactly what caused
"backend and frontend not in sync" — it has been removed.)

## 3. Deploy with the Blueprint (~5 min)

1. Go to **render.com** → sign in with GitHub.
2. **New +** → **Blueprint** → select the `arbab-25/FALTU` repo → **Connect**.
3. Render reads `render.yaml` and shows **one service: `kabadiwala-sih`**.
   When prompted for **DATABASE_URL**, paste your Neon connection string (the
   `-pooler` one, with `?sslmode=require`).
4. Click **Apply**. First deploy takes ~5 minutes (installs Python deps,
   builds the frontend, starts the API).
   - The API auto-creates all tables on Neon and seeds 2,850 demo users +
     1,248 pickups in the background (check Logs for `Cloud database seeded`).
5. Your ONE live URL (shown after deploy):
   - App + API: `https://kabadiwala-sih.onrender.com`
   - Diagnostics: `https://kabadiwala-sih.onrender.com/api/health`
   - API docs: `https://kabadiwala-sih.onrender.com/api/docs`

## 4. Verify the deploy (30 seconds)

Open `/api/health` on your service URL. You must see:

```json
{
  "app": "Kabadiwala Connect",
  "code_version": "1.0.0-sih26229",
  "database": "postgresql (ep-…neon.tech)",
  "database_ok": true,
  "counts": { "users": 2855 }
}
```

If `database` says `sqlite`, `DATABASE_URL` did not reach the service — set it
in **Environment** and Manual Deploy. If health shows a different
`code_version`, the service is running foreign code — delete that service.

## 5. Demo the live site

Use the same demo accounts (seeded into Neon automatically):

| Role | Email | Password |
|---|---|---|
| Customer | `customer@demo.com` | `demo123` |
| Collector | `collector@demo.com` | `demo123` |
| Recycler | `recycler@demo.com` | `demo123` |
| Admin | `admin@demo.com` | `demo123` |

---

## Local vs cloud behavior

| | Local (default) | Cloud (Render) |
|---|---|---|
| Database | SQLite file `kabadiwala.db` | Neon Postgres via `DATABASE_URL` |
| Schema | created on startup | created on startup (translated for PG) |
| Demo data | `python backend/run.py --seed` | auto-seeded on first boot (advisory-locked) |
| Dependencies | `requirements.txt` | same + `psycopg2-binary` |

## Troubleshooting

### "Backend not working / data not stored / frontend out of sync"

**This architecture is now impossible by construction:** one service serves both
the app and the API, so they can never disagree. If you previously created the
two-service blueprint (`kabadiwala-api` + `kabadiwala-web`), **delete both
services** and redeploy from the current `render.yaml`.

Quick checks that still matter:
1. `https://<service>.onrender.com/api/health` must report
   `"code_version": "1.0.0-sih26229"` — anything else means the service is
   running foreign code (delete it).
2. `"database"` must say `postgresql (ep-…neon.tech)` and `database_ok: true`
   — if it says `sqlite`, `DATABASE_URL` is missing from the service's
   **Environment** (that is exactly the "data not stored in Neon" symptom:
   the backend was writing to a throwaway local disk).
3. After any **Environment** change: **Manual Deploy → Deploy latest commit**.

| Symptom | Fix |
|---|---|
| API logs show `OperationalError: SSL required` | Your Neon URL lacks `sslmode=require` — the code adds it automatically, but verify you copied the full string. |
| `password authentication failed` | Re-copy the connection string from Neon; avoid trailing spaces/quotes. |
| Frontend loads but API calls fail (CORS error in console) | The API service name doesn't match `cors.allowedOrigins` in `render.yaml` — update and redeploy. |
| Demo data missing on the live site | Check API logs for `Cloud database seeded`; Neon cold-start can delay it ~30s. Refresh after a minute. |
| Free instance asleep (502 on first request) | Render free tiers sleep after ~15 min idle; first request wakes them (~30–60 s). For judging, open the site a minute early. |
| Want a fresh demo dataset | In Neon → SQL editor: `TRUNCATE users CASCADE;` then restart the API service. |

## Cost

Everything above runs on free tiers: Render free web service + static site,
Neon free project (0.5 GB). For a hackathon demo this is enough; upgrade only
if you need no-sleep uptime.
