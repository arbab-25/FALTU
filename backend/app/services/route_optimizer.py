"""Service: nearest-neighbour route optimization for collectors.

Simple deterministic heuristic: greedily visit the nearest unvisited pickup,
then end at the closest recycling center. Architected so a real routing API
(OSRM / Google Distance Matrix) can replace the distance function later.
"""
import math

from ..database import db, row_dict


def _haversine_km(lat1, lng1, lat2, lng2) -> float:
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lng2 - lng1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def _speed_kmh() -> float:
    return 18.0  # mixed urban speed for a trolley/auto route (demo assumption)


def optimize_route(pickup_ids: list[int]) -> dict:
    with db() as conn:
        stops = []
        for pid in pickup_ids:
            row = conn.execute(
                "SELECT id, code, address, zone, lat, lng, estimated_weight,"
                " estimated_value_min, estimated_value_max FROM pickup_requests WHERE id=?",
                (pid,),
            ).fetchone()
            if row:
                stops.append(row_dict(row))
        centers = [row_dict(r) for r in conn.execute(
            "SELECT * FROM recycling_centers ORDER BY id"
        ).fetchall()]

    if len(stops) < 2:
        return {"stops": stops, "order": [], "distance_km": 0, "naive_distance_km": 0,
                "saved_km": 0, "saved_minutes": 0, "center": None, "engine": "nearest-neighbour"}

    # Start at the stop closest to the first listed pickup (deterministic).
    remaining = list(range(len(stops)))
    order = [remaining.pop(0)]
    while remaining:
        cur = stops[order[-1]]
        nxt = min(remaining, key=lambda i: _haversine_km(
            cur["lat"], cur["lng"], stops[i]["lat"], stops[i]["lng"]))
        order.append(nxt)
        remaining.remove(nxt)

    last = stops[order[-1]]
    center = None
    if centers:
        center = min(centers, key=lambda c: _haversine_km(
            last["lat"], last["lng"], c["lat"], c["lng"]))

    def leg_km(a, b):
        return _haversine_km(a["lat"], a["lng"], b["lat"], b["lng"])

    optimized = sum(leg_km(stops[order[i]], stops[order[i + 1]]) for i in range(len(order) - 1))
    if center:
        optimized += leg_km(last, center)
    naive = 0.0
    for i in range(len(stops) - 1):
        naive += leg_km(stops[i], stops[i + 1])
    naive += leg_km(stops[-1], center) if center else 0.0

    saved_km = max(0.0, round(naive - optimized, 1))
    saved_min = round(saved_km / _speed_kmh() * 60, 0)

    ordered_stops = [stops[i] for i in order]
    return {
        "stops": ordered_stops,
        "order": order,
        "distance_km": round(optimized, 1),
        "naive_distance_km": round(naive, 1),
        "saved_km": saved_km,
        "saved_minutes": saved_min,
        "center": center,
        "engine": "nearest-neighbour",
    }
