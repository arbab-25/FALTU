"""Service: waste value estimation.

Transparent reference-rate estimator:
    value = weight × reference_rate(₹/kg)

All rates are demo/indicative values maintained in `catalog.py`.
"""
from .catalog import MATERIALS


def material_meta(category: str) -> dict:
    return MATERIALS.get(category, MATERIALS["other"])


def estimate_line(category: str, weight: float) -> dict:
    meta = material_meta(category)
    rate = float(meta["rate"])
    return {
        "category": category,
        "name": meta["name"],
        "weight": round(float(weight), 1),
        "rate": rate,
        "value": round(float(weight) * rate, 2),
    }


def estimate_value(items: list[dict]) -> dict:
    """items: [{"category", "weight"}] → transparent breakdown."""
    lines = [estimate_line(i["category"], i["weight"]) for i in items]
    total_value = round(sum(l["value"] for l in lines), 2)
    total_weight = round(sum(l["weight"] for l in lines), 1)
    return {
        "lines": lines,
        "total_weight": total_weight,
        "total_value": total_value,
        "disclaimer": (
            "Estimated values are indicative demo rates and may vary by location, "
            "material quality, market conditions and collector."
        ),
    }
