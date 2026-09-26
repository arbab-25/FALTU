"""Service: smart collector matching.

Weighted scoring (weights are internal; the customer-facing UI shows only a
simple "Recommended" badge and a 0–100 score in admin/debug contexts):

    score = distance 0.40 + availability 0.25 + material match 0.20 + rating 0.15
"""
import math

from ..database import db, row_dict
from .catalog import COLLECTOR_MATERIALS

WEIGHTS = {"distance": 0.40, "availability": 0.25, "material": 0.20, "rating": 0.15}
MAX_DISTANCE_KM = 15.0


def _haversine_km(lat1, lng1, lat2, lng2) -> float:
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lng2 - lng1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def _active_load(conn, collector_id: int) -> int:
    row = conn.execute(
        "SELECT COUNT(*) AS n FROM pickup_requests WHERE collector_id=? "
        "AND status IN ('accepted','on_the_way')",
        (collector_id,),
    ).fetchone()
    return int(row["n"]) if row else 0


def score_collectors(
    customer_lat: float,
    customer_lng: float,
    categories: list[str],
    limit: int = 8,
    exclude_ids: set[int] | None = None,
) -> list[dict]:
    exclude = exclude_ids or set()
    cats = set(categories or COLLECTOR_MATERIALS)

    with db() as conn:
        rows = conn.execute(
            "SELECT u.id, u.name, u.zone, c.business_name, c.rating, c.completed_pickups,"
            " c.vehicle, c.available, c.materials, c.eta_minutes, l.lat, l.lng"
            " FROM collectors c JOIN users u ON u.id=c.user_id"
            " JOIN collector_locations l ON l.collector_id=c.user_id"
            " WHERE u.role='collector'"
        ).fetchall()
        loads = {r["id"]: _active_load(conn, r["id"]) for r in rows}

    results = []
    for row in rows:
        d = row_dict(row)
        dist = _haversine_km(customer_lat, customer_lng, d["lat"], d["lng"])
        if dist > MAX_DISTANCE_KM:
            continue
        accepted = [m.strip() for m in (d["materials"] or "").split(",") if m.strip()]
        match = len(cats & set(accepted)) / max(len(cats), 1)

        d_score = max(0.0, 1.0 - dist / MAX_DISTANCE_KM)
        a_score = 1.0 if d["available"] else 0.0
        m_score = min(1.0, match)
        r_score = (float(d["rating"] or 4.0) - 3.0) / 2.0  # 3–5★ → 0–1

        score = (
            WEIGHTS["distance"] * d_score
            + WEIGHTS["availability"] * a_score
            + WEIGHTS["material"] * m_score
            + WEIGHTS["rating"] * r_score
        )
        load = loads.get(d["id"], 0)
        if load >= 3:
            score *= 0.7  # discourage overloading busy collectors
        results.append({
            "collector_id": d["id"],
            "name": d["business_name"] or d["name"],
            "owner": d["name"],
            "zone": d["zone"],
            "distance_km": round(dist, 2),
            "rating": float(d["rating"] or 4.0),
            "completed_pickups": d["completed_pickups"],
            "available": bool(d["available"]),
            "materials": accepted,
            "vehicle": d["vehicle"],
            "eta_minutes": max(8, int(dist * 6 + 10)) if d["available"] else None,
            "score": round(min(1.0, score), 4),
        })

    results.sort(key=lambda x: (-x["score"], x["distance_km"]))
    if exclude:
        results = [r for r in results if r["collector_id"] not in exclude]
    return results[:limit]
