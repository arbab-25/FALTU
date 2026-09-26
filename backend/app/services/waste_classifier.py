"""Service: waste classification.

PROTOTYPE NOTICE
----------------
This is a deterministic mock inference engine, NOT a real trained model.
It combines uploaded-image metadata (size, aspect, name) with user-selected
categories and an optional weight hint to produce plausible, stable results.

The public API of this module is intentionally identical to what a real
vision service would expose, so it can be swapped without touching the rest
of the codebase.
"""
import hashlib
from typing import Optional

from .catalog import MATERIALS

CONFIDENCE_RANGE = (0.82, 0.94)


def _hash01(seed: str) -> float:
    return int(hashlib.sha256(seed.encode()).hexdigest()[:8], 16) / 0xFFFFFFFF


def analyze_image(
    image_bytes: Optional[bytes],
    selected_categories: Optional[list[str]] = None,
    hint_weight: Optional[float] = None,
    filename: str = "",
) -> dict:
    """Return a deterministic, plausible waste estimate for the demo.

    Returns:
        {
          "engine": "demo-mock",
          "items": [{"category", "name", "weight", "rate", "value"}],
          "total_weight", "value_min", "value_max", "confidence",
        }
    """
    selected = [c for c in (selected_categories or []) if c in MATERIALS]
    if not selected:
        selected = ["cardboard", "plastic", "metal"]

    seed_parts = [filename or "upload", f"{len(image_bytes or b'')}"]
    seed = "|".join(seed_parts)

    # Distribute the total weight across detected materials, biased by list order.
    total = float(hint_weight) if hint_weight else round(6.0 + _hash01(seed) * 6.5, 1)
    weights: list[float] = []
    for i, _ in enumerate(selected):
        share = 0.55 + _hash01(f"{seed}#{i}") * 0.5
        weights.append(share)
    norm = sum(weights) or 1.0

    items = []
    for i, cat in enumerate(selected):
        w = round(total * weights[i] / norm, 1)
        if w <= 0:
            w = 0.1
        rate = MATERIALS[cat]["rate"]
        items.append({
            "category": cat,
            "name": MATERIALS[cat]["name"],
            "weight": w,
            "rate": rate,
            "value": round(w * rate, 2),
        })

    total_weight = round(sum(i["weight"] for i in items), 1)
    value_min = round(sum(i["value"] for i in items) * 0.9, 0)
    value_max = round(sum(i["value"] for i in items) * 1.1, 0)
    confidence = round(CONFIDENCE_RANGE[0] + _hash01(seed + "conf") * 0.12, 2)

    return {
        "engine": "demo-mock",
        "notice": "Demo estimation engine — not a trained model. Replaceable by a real vision service.",
        "items": items,
        "total_weight": total_weight,
        "value_min": value_min,
        "value_max": value_max,
        "confidence": confidence,
    }
