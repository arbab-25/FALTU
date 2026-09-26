"""Deterministic demo seed: builds the full Ahmedabad demo city.

Works on SQLite (local) and PostgreSQL/Neon (cloud).
Run:  python backend/run.py --seed [--fresh]
"""
import random
from datetime import datetime, timedelta

from .config import DEMO_CITY_CENTER, IS_POSTGRES
from .database import db, init_db, insert_id, insert_rows
from .security import hash_password
from .services.catalog import MATERIALS
from .services.demo_data import (COLLECTOR_BUSINESSES, PAYMENTS, VEHICLES, ZONES,
                                 float_between, jitter, rand_address, rand_name,
                                 rand_phone, rand_zone)

START_DATE = datetime(2026, 6, 1)

N_CUSTOMERS = 2_700
N_COLLECTORS = 146
N_RECYCLERS = 5
N_PICKUPS = 1_248
N_CENTERS = 5

CAT_POOL = ["paper", "cardboard", "plastic", "metal", "glass", "e-waste", "mixed"]


def seed(fresh: bool = False) -> None:
    init_db()
    random.seed(26229)
    with db() as conn:
        if fresh and not IS_POSTGRES:
            for table in ["route_assignments", "impact_records", "ratings", "notifications",
                          "transactions", "pickup_items", "pickup_requests", "recycling_centers",
                          "collector_locations", "recyclers", "collectors", "waste_items", "users"]:
                conn.execute(f"DROP TABLE IF EXISTS {table}")
            init_db()

        if IS_POSTGRES:
            conn.execute("SELECT pg_advisory_xact_lock(26229)")
            have = conn.execute("SELECT COUNT(*) AS n FROM users").fetchone()
            count = int(have["n"] if not isinstance(have, dict) else have.get("n", 0))
        else:
            count = conn.execute("SELECT COUNT(*) AS n FROM users").fetchone()["n"]
        if count > 0:
            print("Database already seeded — skipping (use --fresh locally to rebuild).")
            return

        pw = hash_password("demo123")

        # Demo account users (fixed identities for the judging flow).
        demo_users = [
            ("Ananya Sharma", "customer@demo.com", "customer", "B-402 Sunshine Residency, "
             "Prahladnagar Road, Satellite, Ahmedabad", "Satellite", 23.0230, 72.5089),
            ("Ramesh Kumar", "collector@demo.com", "collector", "12 New Colony, "
             "Navrangpura, Ahmedabad", "Navrangpura", 23.0348, 72.5593),
            ("Prakriti Materials LLP", "recycler@demo.com", "recycler",
             "Plot 14, GIDC Vatva, Ahmedabad", "Vatva", 22.9900, 72.6400),
            ("City Admin", "admin@demo.com", "admin", "Kabadiwala Connect HQ, "
             "CG Road, Ahmedabad", "Central", 23.0300, 72.5570),
        ]
        ids = {}
        for name, email, role, addr, zone, lat, lng in demo_users:
            ids[role] = insert_id(
                conn,
                "INSERT INTO users (name, email, password_hash, role, phone, address, zone,"
                " lat, lng) VALUES (?,?,?,?,?,?,?,?,?)",
                (name, email, pw, role, rand_phone(), addr, zone, lat, lng))

        conn.execute(
            "INSERT INTO collectors (user_id, business_name, rating, completed_pickups,"
            " kg_collected, earnings, verified, vehicle, available, materials, eta_minutes)"
            " VALUES (?,?,?,?,?,?,?,?,?,?,?)",
            (ids["collector"], "Ramesh Recycling Services", 4.8, 1248, 3840.0,
             0.0, 1, "Auto-rickshaw", 1, "Paper,Plastic,Metal,Cardboard,E-waste", 18))
        conn.execute("INSERT INTO collector_locations (collector_id, lat, lng, zone) "
                     "VALUES (?,?,?,?)", (ids["collector"], 23.0332, 72.5580, "Navrangpura"))
        conn.execute("INSERT INTO recyclers (user_id, facility_name, capacity_tons) "
                     "VALUES (?,?,?)", (ids["recycler"], "Prakriti Materials LLP", 120))

        # Waste items catalog
        for cat in MATERIALS:
            conn.execute(
                "INSERT INTO waste_items (name, category, rate_per_kg, co2_factor, icon)"
                " VALUES (?,?,?,?,?)",
                (MATERIALS[cat]["name"], cat, MATERIALS[cat]["rate"], MATERIALS[cat]["co2"],
                 MATERIALS[cat]["icon"]))

        # Recycling centers (demo locations around Ahmedabad)
        centers = [
            ("Prakriti Materials LLP — Vatva", "Vatva", 22.9905, 72.6388),
            ("GreenCycle MRF — Chandkheda", "Chandkheda", 23.1105, 72.5850),
            ("EcoSort Facility — Narol", "Narol", 22.9600, 72.6100),
            ("Ahmedabad Waste Hub — Pirana", "Pirana", 22.9650, 72.6280),
            ("Surya Recycling — Odhav", "Odhav", 23.0300, 72.6550),
        ]
        for name, zone, lat, lng in centers:
            conn.execute(
                "INSERT INTO recycling_centers (name, zone, lat, lng, accepted) VALUES (?,?,?,?,?)",
                (name, zone, lat, lng, "Paper,Plastic,Metal,Cardboard,E-waste,Glass"))

        # Customers — pre-built then batch-inserted (critical for cloud round-trips)
        customer_rows = []
        for i in range(N_CUSTOMERS):
            zone, zlat, zlng = rand_zone()
            lat, lng = jitter(zlat, zlng)
            customer_rows.append((rand_name(), f"household{i + 1:04d}@demo.ahmedabad", pw,
                                  "customer", rand_phone(), rand_address(zone), zone, lat, lng))
        insert_rows(conn, "users", ["name", "email", "password_hash", "role", "phone",
                                    "address", "zone", "lat", "lng"], customer_rows)
        rows = conn.execute(
            "SELECT id, lat, lng, zone FROM users WHERE role='customer'").fetchall()

        def _val(r, k):
            return r[k] if not isinstance(r, dict) else r.get(k)

        customer_ids = [(_val(r, "id"), _val(r, "lat"), _val(r, "lng"), _val(r, "zone"))
                        for r in rows]

        # Collectors — batch-inserted users, then collector profiles
        user_rows = []
        profile_rows = []
        for i in range(N_COLLECTORS):
            if i < len(COLLECTOR_BUSINESSES):
                biz = COLLECTOR_BUSINESSES[i]
                person = rand_name()
            else:
                biz = f"{rand_name()} Scrap Services"
                person = biz.split(" Scrap")[0]
            email = f"collector{i + 1:03d}@demo.ahmedabad"
            zone, zlat, zlng = rand_zone()
            lat, lng = jitter(zlat, zlng, 0.015)
            user_rows.append((person, email, pw, "collector", rand_phone(),
                              rand_address(zone), zone, lat, lng))
            mats = random.sample(
                ["Paper", "Plastic", "Metal", "Cardboard", "E-waste", "Glass"],
                k=random.randint(3, 6))
            profile_rows.append({
                "email": email, "biz": biz, "rating": float_between(4.0, 5.0, 1),
                "pickups": random.randint(120, 1300), "kg": float_between(900, 4200, 0),
                "earn": float_between(18000, 95000, 0),
                "verified": 1 if random.random() > 0.08 else 0,
                "vehicle": random.choice(VEHICLES),
                "available": 1 if random.random() > 0.25 else 0,
                "mats": ",".join(mats), "eta": random.randint(12, 40),
                "lat": lat, "lng": lng, "zone": zone,
            })
        insert_rows(conn, "users", ["name", "email", "password_hash", "role", "phone",
                                    "address", "zone", "lat", "lng"], user_rows)
        email_map = {r["email"]: None for r in profile_rows}
        for r in conn.execute(
                "SELECT id, email, lat, lng, zone FROM users WHERE role='collector'").fetchall():
            email_map[_val(r, "email")] = (_val(r, "id"), _val(r, "lat"), _val(r, "lng"),
                                           _val(r, "zone"))
        insert_rows(conn, "collectors", ["user_id", "business_name", "rating",
                                         "completed_pickups", "kg_collected", "earnings",
                                         "verified", "vehicle", "available", "materials",
                                         "eta_minutes"],
                    [(email_map[p["email"]][0], p["biz"], p["rating"], p["pickups"], p["kg"],
                      p["earn"], p["verified"], p["vehicle"], p["available"], p["mats"], p["eta"])
                     for p in profile_rows])
        insert_rows(conn, "collector_locations", ["collector_id", "lat", "lng", "zone"],
                    [(email_map[p["email"]][0], p["lat"], p["lng"], p["zone"])
                     for p in profile_rows])
        collector_ids = [email_map[p["email"]] for p in profile_rows]

        # Recyclers
        recycler_ids = []
        for i in range(N_RECYCLERS):
            name = rand_name() if i else "Prakriti Materials LLP"
            email = f"recycler{i + 1}@demo.ahmedabad"
            rid = insert_id(
                conn,
                "INSERT INTO users (name, email, password_hash, role, phone, address, zone,"
                " lat, lng) VALUES (?,?,?,?,?,?,?,?,?)",
                (name, email, pw, "recycler", rand_phone(),
                 f"Plot {random.randint(2, 60)}, GIDC Phase-II, Ahmedabad",
                 random.choice(ZONES)[0], 22.99, 72.64))
            conn.execute(
                "INSERT INTO recyclers (user_id, facility_name, capacity_tons) VALUES (?,?,?)",
                (rid, name, float_between(40, 150, 0)))
            recycler_ids.append(rid)

        # Pickup history — 3 batched passes instead of ~5,000 round-trips.
        statuses = (["completed"] * 975 + ["pending"] * 90 + ["accepted"] * 55 +
                    ["on_the_way"] * 45 + ["collected"] * 43 + ["cancelled"] * 40)
        random.shuffle(statuses)

        pickup_rows = []   # pickup_requests tuples
        item_rows = []     # (code, category, weight, actual|None, rate)
        tx_rows = []       # transactions tuples
        for i, status in enumerate(statuses):
            cust_id, clat, clng, zone = random.choice(customer_ids)
            created = START_DATE + timedelta(
                days=random.randint(0, 115), hours=random.randint(7, 19),
                minutes=random.randint(0, 59))
            code = f"KC-2026-{1000 + i:05d}"
            cats = random.sample(CAT_POOL, k=random.randint(1, 3))
            est_weight = float_between(4, 45, 1)
            est_min = float_between(80, 900, 0)
            est_max = round(est_min * 1.2, 0)

            col_id = None
            accepted_at = completed_at = actual_w = final_v = None
            payment = None
            if status != "pending":
                col_id = random.choice(collector_ids)[0]
                accepted_at = (created + timedelta(minutes=random.randint(5, 90))).isoformat(" ")
            if status in ("collected", "completed"):
                actual_w = round(est_weight * random.uniform(0.85, 1.15), 1)
            if status == "completed":
                completed_at = (created + timedelta(hours=random.randint(2, 30))).isoformat(" ")
                final_v = float_between(90, 1400, 2)
                payment = random.choice(PAYMENTS)

            pickup_rows.append((code, cust_id, col_id, status, rand_address(zone), zone,
                                clat, clng, est_weight, actual_w, est_min, est_max,
                                final_v, payment, None, None, created.isoformat(" "),
                                accepted_at, completed_at, None))
            per = est_weight / len(cats)
            for c in cats:
                w = round(actual_w / len(cats), 1) if actual_w else None
                m = MATERIALS[c]
                item_rows.append((code, c, round(per, 1), w, m["rate"],
                                  round(w * m["rate"], 2) if w else None))
            if status == "completed":
                tx_rows.append((code, cust_id, col_id, actual_w, final_v, payment,
                                f"RCPT-{code.split('-')[-1]}", completed_at))

        insert_rows(conn, "pickup_requests",
                    ["code", "customer_id", "collector_id", "status", "address", "zone",
                     "lat", "lng", "estimated_weight", "actual_weight", "estimated_value_min",
                     "estimated_value_max", "final_value", "payment_method", "notes",
                     "ai_confidence", "created_at", "accepted_at", "completed_at",
                     "recycler_id"], pickup_rows)

        # Map codes → ids once, then batch-insert children (no per-row subqueries).
        code_id = {}
        for r in conn.execute("SELECT id, code FROM pickup_requests").fetchall():
            code_id[r["code"] if not isinstance(r, dict) else r.get("code")] = \
                r["id"] if not isinstance(r, dict) else r.get("id")

        item_final = [(code_id[code], c, ew, aw, rate, amt)
                      for (code, c, ew, aw, rate, amt) in item_rows]
        insert_rows(conn, "pickup_items",
                    ["pickup_id", "category", "estimated_weight", "actual_weight",
                     "rate_per_kg", "amount"], item_final)
        tx_final = [(code_id[code], cust, col, tw, ta, pay, rc, ca)
                    for (code, cust, col, tw, ta, pay, rc, ca) in tx_rows]
        insert_rows(conn, "transactions",
                    ["pickup_id", "customer_id", "collector_id", "total_weight",
                     "total_amount", "payment_method", "receipt_code", "created_at"], tx_final)

        # Impact records derive from the completed pickups' items (batched).
        conn.execute(
            "INSERT INTO impact_records (pickup_id, category, weight, co2_avoided,"
            " water_saved, energy_saved)"
            " SELECT p.pickup_id, p.category, p.actual_weight,"
            "        ROUND(CAST(p.actual_weight * w.co2_factor AS numeric), 2),"
            "        ROUND(CAST(p.actual_weight * w.co2_factor * 8 AS numeric), 1),"
            "        ROUND(CAST(p.actual_weight * w.co2_factor * 3 AS numeric), 1)"
            " FROM pickup_items p JOIN pickup_requests r ON r.id = p.pickup_id"
            " JOIN waste_items w ON w.category = p.category"
            " WHERE r.status = 'completed' AND p.actual_weight IS NOT NULL")

        # ---- Demo-account story: give the demo collector & customer real history ----
        demo_col = ids["collector"]
        demo_cust = ids["customer"]
        completed_rows = conn.execute(
            "SELECT id FROM pickup_requests WHERE status='completed' LIMIT 300").fetchall()

        def _id(r):
            return r["id"] if not isinstance(r, dict) else r.get("id")

        chosen = [_id(r) for r in random.sample(list(completed_rows), min(90, len(list(completed_rows))))]
        marks = ",".join("?" * len(chosen))
        conn.execute(f"UPDATE pickup_requests SET collector_id=? WHERE id IN ({marks})",
                     (demo_col, *chosen))
        conn.execute(f"UPDATE transactions SET collector_id=? WHERE pickup_id IN ({marks})",
                     (demo_col, *chosen))

        cust_rows = conn.execute(
            "SELECT id FROM pickup_requests WHERE status='completed' AND customer_id<>? LIMIT 100",
            (demo_cust,)).fetchall()
        cchosen = [_id(r) for r in random.sample(list(cust_rows), min(6, len(list(cust_rows))))]
        cmarks = ",".join("?" * len(cchosen))
        conn.execute(f"UPDATE pickup_requests SET customer_id=? WHERE id IN ({cmarks})",
                     (demo_cust, *cchosen))
        conn.execute(f"UPDATE transactions SET customer_id=? WHERE pickup_id IN ({cmarks})",
                     (demo_cust, *cchosen))

        # Two live pickups on the demo collector's route (tracking + route demo).
        for st in ("accepted", "on_the_way"):
            zone, zlat, zlng = "Satellite", 23.0276, 72.5073
            lat, lng = jitter(zlat, zlng, 0.008)
            pid = insert_id(
                conn,
                "INSERT INTO pickup_requests (code, customer_id, collector_id, status, address,"
                " zone, lat, lng, estimated_weight, estimated_value_min, estimated_value_max,"
                " created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,datetime('now'))",
                (f"KC-2026-{1000 + N_PICKUPS + 1 + (st == 'on_the_way'):05d}", demo_cust,
                 demo_col, st, rand_address(zone), zone, lat, lng,
                 float_between(6, 14, 1), 120, 190))
            for c in ("cardboard", "plastic"):
                conn.execute(
                    "INSERT INTO pickup_items (pickup_id, category, estimated_weight, rate_per_kg)"
                    " VALUES (?,?,?,?)", (pid, c, 4.0, MATERIALS[c]["rate"]))

        # Notifications for the four demo accounts.
        demo_notifications = {
            ids["customer"]: [
                ("Collector Ramesh accepted your pickup", "Pickup #KC-2026-01182 · expected in ~18 min", "success"),
                ("Your pickup is arriving in approximately 10 minutes", "Ramesh Recycling Services is on the way", "info"),
                ("Pickup KC-2026-01109 completed", "₹214.50 paid · receipt available", "success"),
                ("You recycled 7.5 kg this week", "Keep it up — that's 9.1 kg CO₂e avoided", "impact"),
            ],
            ids["collector"]: [
                ("New pickup request nearby", "KC-2026-01182 · Satellite · ~1.2 km away", "info"),
                ("Pickup KC-2026-01097 completed", "₹168 earned · updated balance", "success"),
                ("You're a 4.8★ collector this month", "Great work keeping Ahmedabad clean", "impact"),
            ],
            ids["recycler"]: [
                ("New material intake logged", "320 kg mixed recyclables from GreenCycle MRF", "info"),
                ("Weekly supply report ready", "Paper +8%, Plastic +12% vs last week", "impact"),
            ],
            ids["admin"]: [
                ("Weekly impact report ready", "48.7 t diverted · 31.2 t CO₂e avoided (est.)", "impact"),
                ("3 new collectors awaiting verification", "Navkar Waste Traders and 2 others", "info"),
            ],
        }
        for uid, notes in demo_notifications.items():
            for title, body, kind in notes:
                conn.execute(
                    "INSERT INTO notifications (user_id, title, body, kind, read, created_at)"
                    " VALUES (?,?,?,?,0,datetime('now'))", (uid, title, body, kind))

        # Rating rows sprinkled on some completed pickups.
        rated = conn.execute(
            "SELECT id, customer_id, collector_id FROM pickup_requests WHERE status='completed'"
            " LIMIT 400").fetchall()
        for r in rated:
            if random.random() < 0.7:
                conn.execute(
                    "INSERT INTO ratings (pickup_id, customer_id, collector_id, stars, comment)"
                    " VALUES (?,?,?,?,?)",
                    (_id(r), r["customer_id"], r["collector_id"],
                     random.choice([4, 5, 5, 5, 4, 3]), "Smooth pickup, fair price."))

    print(f"Seeded demo database: {N_CUSTOMERS} customers, {N_COLLECTORS} collectors, "
          f"{N_RECYCLERS} recyclers, {N_PICKUPS} pickups, {N_CENTERS} recycling centers.")


if __name__ == "__main__":
    seed()
