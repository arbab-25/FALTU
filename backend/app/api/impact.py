"""Impact endpoints (transparent, clearly-labelled estimates)."""
from fastapi import APIRouter, Depends

from ..database import db, row_dict
from ..deps import get_current_user
from ..services.impact import CO2_NOTE

router = APIRouter(prefix="/impact", tags=["impact"])


def _platform_impact() -> dict:
    with db() as conn:
        by_cat = conn.execute(
            "SELECT category, SUM(weight) w, SUM(co2_avoided) c, SUM(water_saved) wa,"
            " SUM(energy_saved) e FROM impact_records GROUP BY category").fetchall()
        totals = conn.execute(
            "SELECT COUNT(DISTINCT pickup_id) trips, SUM(weight) w, SUM(co2_avoided) c,"
            " SUM(water_saved) wa, SUM(energy_saved) e FROM impact_records").fetchone()
        pickups = conn.execute("SELECT COUNT(*) n FROM pickup_requests WHERE status='completed'").fetchone()
        collectors = conn.execute(
            "SELECT COUNT(*) n FROM collectors WHERE verified=1").fetchone()
        customers = conn.execute(
            "SELECT COUNT(*) n FROM users WHERE role='customer'").fetchone()
        earnings = conn.execute(
            "SELECT COALESCE(SUM(total_amount),0) v FROM transactions").fetchone()

    return {
        "totals": {
            "waste_diverted_kg": round(totals["w"] or 0, 0),
            "co2_kg": round(totals["c"] or 0, 0),
            "water_saved_l": round(totals["wa"] or 0, 0),
            "energy_saved_kwh": round(totals["e"] or 0, 1),
            "optimized_trips": totals["trips"] or 0,
        },
        "platform": {
            "completed_pickups": pickups["n"],
            "verified_collectors": collectors["n"],
            "households": customers["n"],
            "collector_earnings": round(earnings["v"] or 0, 2),
        },
        "by_material": [row_dict(r) for r in by_cat],
        "methodology": CO2_NOTE,
        "estimated": True,
    }


@router.get("/public")
def public_impact():
    """Public totals for the landing/impact pages (no auth; demo data)."""
    return _platform_impact()


@router.get("")
def impact(user: dict = Depends(get_current_user)):
    return _platform_impact()


@router.get("/mine")
def my_impact(user: dict = Depends(get_current_user)):
    with db() as conn:
        rows = conn.execute(
            "SELECT i.category, SUM(i.weight) w, SUM(i.co2_avoided) c, SUM(i.water_saved) wa,"
            " SUM(i.energy_saved) e FROM impact_records i"
            " JOIN pickup_requests p ON p.id=i.pickup_id WHERE p.customer_id=?"
            " GROUP BY i.category", (user["id"],)).fetchall()
        totals = conn.execute(
            "SELECT SUM(i.weight) w, SUM(i.co2_avoided) c, SUM(i.water_saved) wa,"
            " SUM(i.energy_saved) e FROM impact_records i"
            " JOIN pickup_requests p ON p.id=i.pickup_id WHERE p.customer_id=?",
            (user["id"],)).fetchone()
    return {
        "totals": {"weight_kg": round(totals["w"] or 0, 1), "co2_kg": round(totals["c"] or 0, 1),
                   "water_l": round(totals["wa"] or 0, 0), "energy_kwh": round(totals["e"] or 0, 1)},
        "by_material": [row_dict(r) for r in rows],
        "methodology": CO2_NOTE,
        "estimated": True,
    }
