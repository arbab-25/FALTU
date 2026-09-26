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

The repo already contains `render.yaml` (Blueprint) with both services defined.

## 3. Deploy with the Blueprint (~5 min)

1. Go to **render.com** → sign in with GitHub.
2. **New +** → **Blueprint** → select the `arbab-25/FALTU` repo → **Connect**.
3. Render reads `render.yaml` and shows two services. When prompted for **DATABASE_URL**, paste your Neon connection string from step 1.
4. Click **Apply**. First deploys take ~3–5 minutes.
   - The API auto-creates all tables on Neon and seeds 2,850 demo users + 1,248 pickups in the background (check the API logs for `Cloud database seeded`).
5. Note your live URLs (Render shows them after deploy):
   - API: `https://kabadiwala-api.onrender.com` (docs at `/api/docs`)
   - Site: `https://kabadiwala-web.onrender.com`

## 4. Cross-check the URLs

`render.yaml` wires the two services together using the default names
(`kabadiwala-api` / `kabadiwala-web`). If Render appends a suffix to either
service name, update the URLs:

1. **Frontend → API:** Static site → **Environment** → `VITE_API_BASE_URL`
   → `https://<your-api-name>.onrender.com/api` → **Save & Deploy**.
2. **API → Frontend (CORS):** API service → **Environment** → edit the
   `cors` origins in `render.yaml`, or add env var `CORS_ORIGINS` with your
   live site URL.

> The Vite env var is baked in at **build time** — after changing it, trigger a
> **Manual Deploy → Deploy latest commit** on the static site.

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

The #1 cause: **two different apps claim the same Render service name.** The site at
`https://kabadiwala-api.onrender.com` may be serving a *different* project (check
`https://<api-name>.onrender.com/api/health` — our API always reports
`"code_version": "1.0.0-sih26229"`; if you get anything else, that service is not ours).

Fix (Render Dashboard):
1. Open the **kabadiwala-api** service → **Settings** → verify **Repo** = `arbab-25/FALTU`
   and **Branch** = `main`. If it points elsewhere, the name collision is the problem —
   **rename our service** (Settings → Name) to something unique like `faltu-sih-api`, then
   update `VITE_API_BASE_URL` on the frontend to `https://faltu-sih-api.onrender.com/api`
   and **Manual Deploy** the frontend.
2. Open **Environment** → confirm `DATABASE_URL` = your Neon `-pooler` string. If it's
   missing, the API silently falls back to a throwaway local SQLite disk.
3. **Manual Deploy → Deploy latest commit**, then check Logs for
   `backend ready | database: postgresql (ep-…neon.tech)`.
4. Visit `https://<api>.onrender.com/api/health` — you should see `code_version`,
   `database: postgresql (…)`, and non-zero `counts`. That is the source of truth.

The frontend now shows an amber banner automatically when the backend is unreachable or
running the wrong app — if you see it, the URL in the banner is what the frontend is
calling; make that service return `code_version: 1.0.0-sih26229`.

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
