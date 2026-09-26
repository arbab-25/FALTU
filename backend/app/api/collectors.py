"""Collector-facing endpoints: dashboard, earnings, routes and directory."""
from fastapi import APIRouter, Depends, HTTPException, Query

from ..database import db, row_dict
from ..deps import get_current_user, require_roles
from ..schemas import RouteOptimizeRequest
from ..services.route_optimizer import optimize_route

router = APIRouter(prefix="/collectors", tags=["collectors"])


@router.get("/me")
def me(user: dict = Depends(require_roles("collector"))):
    return {"profile": user}


@router.get("/dashboard")
def dashboard(user: dict = Depends(require_roles("collector"))):
    with db() as conn:
        stats = conn.execute(
            "SELECT COUNT(*) n, COALESCE(SUM(actual_weight),0) w, COALESCE(SUM(final_value),0) v"
            " FROM pickup_requests WHERE collector_id=? AND status='completed'",
            (user["id"],)).fetchone()
        active = conn.execute(
            "SELECT COUNT(*) n FROM pickup_requests WHERE collector_id=?"
            " AND status IN ('accepted','on_the_way','collected')",
            (user["id"],)).fetchone()
        pending = conn.execute(
            "SELECT COUNT(*) n FROM pickup_requests WHERE status='pending' AND zone=?",
            (user.get("zone"),)).fetchone()
        month = conn.execute(
            "SELECT COALESCE(SUM(total_amount),0) v, COALESCE(SUM(total_weight),0) w"
            " FROM transactions WHERE collector_id=? AND created_at>=date('now','start of month')",
            (user["id"],)).fetchone()  # date('now','start of month') translated for PG in pgcompat.q
        today = conn.execute(
            "SELECT COALESCE(SUM(total_amount),0) v, COALESCE(SUM(total_weight),0) w,"
            " COUNT(*) n FROM transactions WHERE collector_id=? AND date(created_at)=date('now')",
            (user["id"],)).fetchone()
        by_material = conn.execute(
            "SELECT category, SUM(actual_weight) w FROM pickup_items"
            " WHERE actual_weight IS NOT NULL AND pickup_id IN"
            " (SELECT id FROM pickup_requests WHERE collector_id=?)"
            " GROUP BY category", (user["id"],)).fetchall()
        daily = conn.execute(
            "SELECT date(created_at) d, SUM(total_amount) v, SUM(total_weight) w"
            " FROM transactions WHERE collector_id=? GROUP BY d ORDER BY d DESC LIMIT 14",
            (user["id"],)).fetchall()
        rating = conn.execute(
            "SELECT AVG(stars) s FROM ratings WHERE collector_id=?", (user["id"],)).fetchone()

    def num(v):
        return round(v or 0, 1)

    return {
        "completed_pickups": stats["n"],
        "weight_collected_kg": num(stats["w"]),
        "lifetime_earnings": round(stats["v"] or 0, 2),
        "active_pickups": active["n"],
        "pending_in_zone": pending["n"],
        "month_earnings": round(month["v"] or 0, 2),
        "month_weight_kg": num(month["w"]),
        "today_earnings": round(today["v"] or 0, 2),
        "today_weight_kg": num(today["w"]),
        "today_pickups": today["n"],
        "avg_daily_kg": num(stats["w"] / max(1, 92)),
        "avg_rating": round(rating["s"] or 0, 1),
        "materials_breakdown": [
            {"category": r["category"], "weight": num(r["w"])} for r in by_material],
        "daily": [{"date": r["d"], "value": round(r["v"] or 0, 0),
                   "weight": num(r["w"])} for r in reversed(daily)],
        "demo_note": "Demo earnings data for SIH prototype.",
    }


@router.get("/nearby")
def nearby(
    lat: float = Query(...), lng: float = Query(...), limit: int = Query(default=12, le=30),
    user: dict = Depends(get_current_user),
):
    from ..services.collector_matcher import score_collectors

    recs = score_collectors(lat, lng, [], limit=limit)
    with db() as conn:
        centers = [row_dict(r) for r in conn.execute("SELECT * FROM recycling_centers").fetchall()]
    return {"collectors": recs, "recycling_centers": centers}


@router.post("/route")
def route(body: RouteOptimizeRequest, user: dict = Depends(require_roles("collector"))):
    with db() as conn:
        owned = conn.execute(
            f"SELECT COUNT(*) n FROM pickup_requests WHERE id IN "
            f"({','.join('?' * len(body.pickup_ids))}) AND collector_id=?",
            (*body.pickup_ids, user["id"])).fetchone()
    if owned["n"] != len(body.pickup_ids):
        raise HTTPException(403, "Route includes pickups not assigned to you")
    return optimize_route(body.pickup_ids)


@router.get("/customers")
def customers(user: dict = Depends(require_roles("collector"))):
    with db() as conn:
        rows = conn.execute(
            "SELECT u.id, u.name, u.zone, COUNT(p.id) pickups, SUM(p.final_value) value,"
            " MAX(p.completed_at) last_pickup"
            " FROM pickup_requests p JOIN users u ON u.id=p.customer_id"
            " WHERE p.collector_id=? AND p.status='completed'"
            " GROUP BY u.id ORDER BY value DESC LIMIT 30", (user["id"],)).fetchall()
    return {"customers": [row_dict(r) for r in rows]}


@router.get("")
def directory(
    zone: str | None = Query(default=None),
    user: dict = Depends(get_current_user),
):
    with db() as conn:
        q = ("SELECT u.id, u.name, u.zone, u.phone, c.business_name, c.rating,"
             " c.completed_pickups, c.vehicle, c.available, c.materials, c.verified,"
             " l.lat, l.lng FROM collectors c"
             " JOIN users u ON u.id=c.user_id"
             " JOIN collector_locations l ON l.collector_id=c.user_id")
        params: list = []
        if zone:
            q += " WHERE u.zone=?"
            params.append(zone)
        rows = conn.execute(q + " ORDER BY c.rating DESC LIMIT 200", params).fetchall()
    return {"collectors": [row_dict(r) for r in rows]}
