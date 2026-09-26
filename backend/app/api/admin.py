"""Admin + recycler + presentation endpoints."""
from fastapi import APIRouter, Depends, HTTPException

from ..database import db, row_dict
from ..deps import get_current_user, require_roles
from ..seed import seed

router = APIRouter(tags=["admin"])


@router.get("/admin/analytics")
def analytics(user: dict = Depends(require_roles("admin"))):
    with db() as conn:
        users = conn.execute("SELECT role, COUNT(*) n FROM users GROUP BY role").fetchall()
        pickups = conn.execute(
            "SELECT status, COUNT(*) n FROM pickup_requests GROUP BY status").fetchall()
        completed = conn.execute(
            "SELECT COUNT(*) n, COALESCE(SUM(actual_weight),0) w FROM pickup_requests"
            " WHERE status='completed'").fetchone()
        earnings = conn.execute(
            "SELECT COALESCE(SUM(total_amount),0) v FROM transactions").fetchone()
        collectors = conn.execute(
            "SELECT COUNT(*) n FROM collectors WHERE available=1").fetchone()
        impact = conn.execute(
            "SELECT COALESCE(SUM(co2_avoided),0) c, COALESCE(SUM(weight),0) w"
            " FROM impact_records").fetchone()
        material_mix = conn.execute(
            "SELECT category, SUM(actual_weight) w FROM pickup_items"
            " WHERE actual_weight IS NOT NULL GROUP BY category ORDER BY w DESC").fetchall()
        daily = conn.execute(
            "SELECT date(created_at) d, COUNT(*) n, COALESCE(SUM(total_amount),0) v"
            " FROM transactions GROUP BY d ORDER BY d DESC LIMIT 30").fetchall()
        zones = conn.execute(
            "SELECT zone, COUNT(*) n FROM pickup_requests WHERE zone IS NOT NULL"
            " GROUP BY zone ORDER BY n DESC LIMIT 12").fetchall()

    role_map = {r["role"]: r["n"] for r in users}
    status_map = {r["status"]: r["n"] for r in pickups}
    total_pickups = sum(status_map.values())

    return {
        "kpi": {
            "total_users": sum(role_map.values()),
            "customers": role_map.get("customer", 0),
            "collectors": role_map.get("collector", 0),
            "recyclers": role_map.get("recycler", 0),
            "active_collectors": collectors["n"],
            "total_pickups": total_pickups,
            "waste_diverted_kg": round(completed["w"], 0),
            "co2_avoided_kg": round(impact["c"], 0),
            "collector_earnings": round(earnings["v"], 0),
            "recycling_rate": round(100 * status_map.get("completed", 0) / max(total_pickups, 1), 1),
        },
        "pickup_status": status_map,
        "material_mix": [{"category": r["category"], "weight": round(r["w"], 1)} for r in material_mix],
        "daily_transactions": [{"date": r["d"], "count": r["n"], "value": round(r["v"], 0)}
                               for r in reversed(daily)],
        "zone_demand": [{"zone": r["zone"], "pickups": r["n"]} for r in zones],
        "demo_note": "All figures are demo data for SIH26229.",
    }


@router.get("/admin/pickups")
def admin_pickups(
    status: str | None = None, limit: int = 200,
    user: dict = Depends(require_roles("admin")),
):
    with db() as conn:
        q = ("SELECT p.*, cu.name AS customer_name, co.name AS collector_name"
             " FROM pickup_requests p JOIN users cu ON cu.id=p.customer_id"
             " LEFT JOIN users co ON co.id=p.collector_id")
        params: list = []
        if status:
            q += " WHERE p.status=?"
            params.append(status)
        q += " ORDER BY p.created_at DESC LIMIT ?"
        params.append(limit)
        rows = [row_dict(r) for r in conn.execute(q, params).fetchall()]
        for p in rows:
            p["items"] = [row_dict(r) for r in conn.execute(
                "SELECT * FROM pickup_items WHERE pickup_id=?", (p["id"],)).fetchall()]
    return {"pickups": rows}


@router.post("/admin/seed")
def run_seed(user: dict = Depends(require_roles("admin"))):
    seed(fresh=False)
    return {"ok": True, "message": "Demo data ensured."}


@router.get("/recycler/overview")
def recycler_overview(user: dict = Depends(require_roles("recycler"))):
    with db() as conn:
        by_cat = conn.execute(
            "SELECT category, SUM(actual_weight) w FROM pickup_items"
            " WHERE actual_weight IS NOT NULL GROUP BY category").fetchall()
        month = conn.execute(
            "SELECT COALESCE(SUM(total_weight),0) w, COUNT(*) n FROM transactions"
            " WHERE created_at>=date('now','start of month')").fetchone()
        weekly = conn.execute(
            "SELECT date(created_at) d, SUM(total_weight) w FROM transactions"
            " GROUP BY d ORDER BY d DESC LIMIT 10").fetchall()
        incoming = conn.execute(
            "SELECT p.* FROM pickup_requests p WHERE p.status='collected'"
            " OR (p.status='completed' AND p.recycler_id IS NULL) LIMIT 12").fetchall()
        centers = [row_dict(r) for r in conn.execute(
            "SELECT * FROM recycling_centers").fetchall()]

    flow = {"collected": 0.0, "sorted": 0.0, "processed": 0.0, "recycled": 0.0}
    total = sum((r["w"] or 0) for r in by_cat)
    flow["collected"] = round(total, 0)
    flow["sorted"] = round(total * 0.94, 0)
    flow["processed"] = round(total * 0.86, 0)
    flow["recycled"] = round(total * 0.82, 0)

    return {
        "material_totals": {r["category"]: round(r["w"] or 0, 0) for r in by_cat},
        "month_weight_kg": round(month["w"], 0),
        "month_batches": month["n"],
        "weekly": [{"date": r["d"], "weight": round(r["w"] or 0, 0)} for r in reversed(weekly)],
        "flow": flow,
        "incoming": [row_dict(r) for r in incoming],
        "centers": centers,
        "demo_note": "Demo facility data for SIH26229.",
    }


@router.get("/presentation")
def presentation(user: dict = Depends(get_current_user)):
    """Large-format KPIs for the SIH presentation screen (public to logged-in users)."""
    with db() as conn:
        completed = conn.execute(
            "SELECT COUNT(*) n, COALESCE(SUM(actual_weight),0) w FROM pickup_requests"
            " WHERE status='completed'").fetchone()
        collectors = conn.execute("SELECT COUNT(*) n FROM collectors").fetchone()
        earnings = conn.execute("SELECT COALESCE(SUM(total_amount),0) v FROM transactions").fetchone()
        impact = conn.execute(
            "SELECT COALESCE(SUM(co2_avoided),0) c FROM impact_records").fetchone()
        by_cat = conn.execute(
            "SELECT category, SUM(weight) w FROM impact_records GROUP BY category").fetchall()

    return {
        "headline": "Digitizing India's Informal Recycling Ecosystem",
        "kpi": {
            "waste_diverted_kg": round(completed["w"], 0),
            "pickups": completed["n"],
            "collectors": collectors["n"],
            "earnings": round(earnings["v"], 0),
            "co2_avoided_kg": round(impact["c"], 0),
        },
        "material_mix": [{"category": r["category"], "weight": round(r["w"], 0)} for r in by_cat],
        "note": "Demo data for SIH26229.",
    }
