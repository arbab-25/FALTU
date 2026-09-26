# ♻ Kabadiwala Connect

**Smart India Hackathon 2026 — Problem Statement SIH26229**
*"Kabadiwala Connect – Bringing the Informal Collector into the Formal Recycling Chain."*

> **Connecting Waste. Empowering People. Building a Circular Future.**
> *Turn Waste Into Value.*

A full-stack prototype that connects **households**, **informal waste collectors (kabadiwalas)**, **recycling facilities** and **administrators** into one organized, transparent recycling ecosystem — from waste identification to impact tracking.

```
HOUSEHOLD → WASTE ID → VALUE → PICKUP → COLLECTOR → WEIGHING
         → DIGITAL TRANSACTION → SORTING / RECYCLING → IMPACT
```

---

## ✨ What makes this prototype work

**It is a *connected* platform, not static pages.** Every action flows through the system:

| Action | Automatically updates |
|---|---|
| Customer creates a pickup | Collector's request feed (visible instantly) |
| Collector accepts | Customer's tracking timeline + notification |
| Collector completes with real weights | Transaction + digital receipt |
| Transaction created | Customer history, collector earnings, impact stats |
| Impact stats | Admin analytics, recycler supply view, presentation mode |

---

## 🧠 AI / Intelligence Layer (modular & replaceable)

| Service | File | Purpose |
|---|---|---|
| A. Waste Classification | `backend/app/services/waste_classifier.py` | image + categories → material weights & confidence |
| B. Value Estimation | `backend/app/services/value_estimator.py` | weight × reference rates → transparent breakdown |
| C. Smart Collector Matching | `backend/app/services/collector_matcher.py` | distance .40 + availability .25 + material .20 + rating .15 |
| D. Route Optimization | `backend/app/services/route_optimizer.py` | nearest-neighbour ordering, km/minutes saved |

> ⚠ **Prototype notice:** the classifier is a deterministic **demo engine — not a trained model**. The public API matches what a real vision service would expose, so it can be swapped without touching the rest of the code (see `ai_provider.py`).

---

## 🚀 Quick Start

### 1. Backend (Python 3.11+)

```bash
python -m pip install -r requirements.txt
python backend/run.py            # auto-seeds demo data on first run
# optional flags:
python backend/run.py --seed --fresh   # rebuild demo database from scratch
```

API docs: **http://127.0.0.1:8000/api/docs**

> ☁ **Deploying?** The same code runs on **Render + Neon Postgres** — set `DATABASE_URL`
> to your Neon connection string and the backend switches dialects, migrates its schema
> and seeds demo data automatically. Full guide: [DEPLOYMENT.md](DEPLOYMENT.md).

### 2. Frontend (Node 18+)

```bash
npm install
npm run dev:frontend             # http://localhost:5173
```

Or run both together:

```bash
npm run dev
```

### 3. Sign in

Use the one-click demo cards on the login page, or:

| Role | Email | Password |
|---|---|---|
| Customer | `customer@demo.com` | `demo123` |
| Collector | `collector@demo.com` | `demo123` |
| Recycler | `recycler@demo.com` | `demo123` |
| Admin | `admin@demo.com` | `demo123` |

---

## 🎬 3-Minute Judge Demo Flow

1. **Landing page** — problem → solution → AI → empowerment story
2. Click **Schedule a Pickup** (auto-logs in as customer, jumps to wizard)
3. Select materials → **Use AI Waste Estimator** (upload a photo, or "No photo? Estimate anyway")
4. Show detected materials, weights, ₹ value, confidence
5. **Find Collector** → map + ranked collectors ("Recommended" badge)
6. Confirm → **tracking timeline** goes live
7. Switch: login page → **Kabadiwala** demo card
8. Accept the request → **Complete Pickup** (enter actual weights, payment method)
9. **Digital receipt** generated — download/share
10. Switch: **Admin** demo card → city-wide analytics
11. **Presentation Mode** (admin sidebar) — projection-ready KPI screen

Everything runs locally with zero external services or API keys.

---

## 🏗 Architecture

```
/frontend          React 18 + TypeScript + Vite + Tailwind + Recharts
  /src
    /components    shared UI (map, flow diagram, receipt, timeline, KPI cards)
    /pages         landing, customer, collector, recycler, admin, presentation
    /layouts       authenticated dashboard shell (role-aware sidebar)
    /services      typed API client
    /context       auth, language (EN/हिं/ગુ), notifications
    /types         shared domain types
/backend           Python FastAPI + SQLite (stdlib-only persistence)
  /app
    /api           auth, pickups, waste, collectors, impact, admin, notifications
    /services      AI layer: classifier, value estimator, matcher, route optimizer
    /database.py   schema + connection management
    /seed.py       deterministic demo data (Ahmedabad)
  run.py           launcher (auto-seed, --seed, --fresh flags)
```

## 🗄 Database Schema

`users` (all roles) · `collectors` · `recyclers` · `waste_items` · `pickup_requests` · `pickup_items` · `transactions` · `collector_locations` · `recycling_centers` · `notifications` · `ratings` · `impact_records` · `route_assignments`

**Dual-dialect persistence:** SQLite for the local demo, PostgreSQL (Neon/Render/Supabase) in the cloud — selected automatically by `DATABASE_URL`, with query translation in `backend/app/pgcompat.py`.

## 🔌 API Overview

| Method & Path | Purpose |
|---|---|
| `POST /api/auth/login` / `refresh` | simulated session tokens (HMAC-signed) |
| `POST /api/waste/analyze` | AI waste estimation (multipart: image optional) |
| `POST /api/waste/estimate` | transparent value breakdown |
| `GET /api/waste/catalog` / `guidelines` / `prices` | reference data |
| `POST /api/pickups` | create pickup request |
| `GET /api/pickups?scope=mine&status=…` | role-scoped lists |
| `POST /api/pickups/recommend` | smart matching (scored) |
| `POST /api/pickups/{id}/accept` | collector assigns self |
| `PATCH /api/pickups/{id}/status` | accepted → on_the_way → collected |
| `POST /api/pickups/{id}/complete` | final weights → transaction + receipt + impact |
| `GET /api/pickups/{id}/receipt` | digital receipt |
| `GET /api/collectors/nearby` · `POST /api/collectors/route` | map data, route optimization |
| `GET /api/collectors/dashboard` | earnings analytics |
| `GET /api/impact` · `/impact/mine` · `/impact/public` | estimated impact + methodology |
| `GET /api/admin/analytics` | city-wide KPIs & charts |
| `GET /api/presentation` | projection-mode metrics |

Full interactive docs at `/api/docs` (Swagger UI).

## 📊 Demo Data (deterministic)

Seeded Ahmedabad environment: **2,700 households · 146 collectors · 5 recyclers · 5 recycling centers · 1,248 pickups** with realistic Indian names, zones (Navrangpura, Satellite, Maninagar…) and 78% completion rate. The four demo accounts carry their own pickup history, active pickups and notifications so the story works instantly.

All environmental figures are **estimates**: `CO₂e avoided = weight × per-material emission factor` (factors stored in `backend/app/services/catalog.py`, tune freely).

## 🔐 Security (prototype-appropriate)

- PBKDF2 password hashing (120k iterations)
- HMAC-signed session tokens with expiry
- Role-based access control on every endpoint
- Pydantic validation on all inputs
- Upload restrictions: type allowlist, 8 MB cap, safe filenames, files deleted after analysis
- No secrets in frontend; `.env.example` documents every variable

## ✅ Quality Pipelines (all green)

Every cycle is validated with real tooling — run these yourself:

| Pipeline | Command | Latest result |
|---|---|---|
| TypeScript (strict) | `npx tsc --noEmit` | 0 errors |
| Security lint (Python) | `bandit -r backend/app` | 0 issues (all severities) |
| Dependency audit (npm) | `npm audit --omit=dev` | 0 vulnerabilities |
| Dependency consistency | `pip check` | no broken requirements |
| Dead code / imports | `pyflakes backend/app` | clean |
| API regression suite | `python backend/selftest.py [--base URL]` | **32/32 PASS** on SQLite **and** Neon Postgres |
| Accessibility (WCAG 2.1 AA) | axe-core audit of live pages | 0 violations (landing, login, dashboards) |
| Production build | `npm run build` | clean; vendor-split bundles (react 166 kB / app 199 kB / charts 422 kB gzip ≈ 216 kB total) |
| End-to-end journey | scripted login → pickup → accept → complete → receipt → impact | verified on both dialects |

**Cloud-database performance work** (measured against real Neon Postgres):

- Seeding: ~6,300 individual inserts → multi-row batched `insert_rows` (2,850 users in **2.6 s**, full seed **~103 s**)
- Matching/route: per-row N+1 queries → single grouped / `IN` queries (**37.7 s → ~2 s** from a remote client; the residual is client↔Neon RTT, not server work)
- Connections: per-request open/close → persistent thread-local connections with health-check reconnect (was ~4.5 s/request; on co-located hosts like Render it's milliseconds)

The two remaining `npm audit` moderates are in `react-router` (SSR open-redirect / deserialization) and do not apply: this app is a static SPA with no SSR and no navigation to user-supplied URLs. Upgrade to v7 is tracked under future scope.

## 🌍 Accessibility & i18n

Semantic HTML, ARIA labels, keyboard navigation, focus rings, ESC-closable dialogs, responsive from 390 px to 4K. Language switcher: **English / हिन्दी / ગુજરાતી** via a translation architecture (`LanguageContext`), not hard-coded strings.

## ⚠ Limitations (honest scope)

- AI classification is a demo engine, not a trained model
- Map is a stylized SVG visualization, not GPS/tile-based
- Sessions are simulated; no real KYC/payments (UPI is a payment *label* in the demo)
- Single-city demo dataset; no real-time GPS tracking
- Environmental figures are indicative estimates, not audited values

## 🔭 Future Scope

1. Real computer-vision model behind the classifier seam
2. Live GPS tracking & real routing APIs (OSRM / Google)
3. Dynamic market-linked material prices
4. UPI payment integration
5. Municipal / government dashboards & verification
6. Recycler onboarding + verification workflow
7. Demand forecasting for collection planning
8. Collector credit scoring from transaction history
9. IoT-enabled smart bins
10. Multi-city expansion

## 🏆 SIH Reference

- **Problem statement ID:** SIH26229
- **Theme:** Clean & Green Technology
- **Title:** *Kabadiwala Connect – Bringing the Informal Collector into the Formal Recycling Chain*

---

*"Don't just collect waste. Connect the entire recycling ecosystem."*
