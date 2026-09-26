"""Service: environmental impact calculations.

Transparent, clearly-labelled ESTIMATES using per-material emission factors
stored in configuration so they can be tuned or replaced later.
"""
from .catalog import ENERGY_FACTORS, MATERIALS, WATER_FACTORS

CO2_NOTE = (
    "CO₂e avoided = recycled weight × material-specific emission factor "
    "(demo factors stored in backend/app/services/catalog.py). Figures are estimates."
)


def impact_for_weight(category: str, weight: float) -> dict:
    meta = MATERIALS.get(category, MATERIALS["other"])
    co2 = round(weight * float(meta.get("co2", 0.5)), 2)
    water = round(weight * WATER_FACTORS.get(category, 5.0), 1)
    energy = round(weight * ENERGY_FACTORS.get(category, 2.0), 1)
    return {"category": category, "weight": round(weight, 1), "co2": co2,
            "water": water, "energy": energy}


def impact_summary(records: list[dict]) -> dict:
    """records: [{"category", "weight"}] → aggregated impact estimates."""
    agg = {"co2": 0.0, "water": 0.0, "energy": 0.0, "weight": 0.0}
    for r in records:
        item = impact_for_weight(r.get("category", "other"), float(r.get("weight", 0)))
        agg["co2"] += item["co2"]
        agg["water"] += item["water"]
        agg["energy"] += item["energy"]
        agg["weight"] += item["weight"]
    return {
        "weight_kg": round(agg["weight"], 1),
        "co2_kg": round(agg["co2"], 1),
        "water_l": round(agg["water"], 0),
        "energy_kwh": round(agg["energy"], 1),
        "note": CO2_NOTE,
        "estimated": True,
    }
