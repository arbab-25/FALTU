"""Pickup lifecycle endpoints — the connected core of the platform."""
from fastapi import APIRouter, Depends, HTTPException, Query

from ..database import db, insert_id, row_dict
from ..deps import get_current_user, require_roles
from ..schemas import (PickupComplete, PickupCreate, PickupStatusUpdate,
                       RecommendationRequest, RateRequest)
from ..services.catalog import MATERIALS
from ..services.collector_matcher import score_collectors
from ..services.impact import impact_for_weight

router = APIRouter(prefix="/pickups", tags=["pickups"])

STATUS_FLOW = {
    "pending": ["accepted", "cancelled"],
    "accepted": ["on_the_way", "cancelled"],
    "on_the_way": ["collected", "cancelled"],
    "collected": ["completed", "cancelled"],
    "completed": [],
    "cancelled": [],
}


def _new_code(conn) -> str:
    row = conn.execute("SELECT MAX(id) AS m FROM pickup_requests").fetchone()
    n = (row["m"] if not isinstance(row, dict) else row.get("m")) or 0
    return f"KC-2026-{int(n) + 1001:05d}"


def _with_items(conn, p: dict) -> dict:
    p["items"] = [row_dict(r) for r in conn.execute(
        "SELECT * FROM pickup_items WHERE pickup_id=?", (p["id"],)).fetchall()]
    return p


def _get(conn, pid: int) -> dict:
    row = conn.execute(
        "SELECT p.*, cu.name AS customer_name, cu.phone AS customer_phone,"
        " co.name AS collector_name, co.phone AS collector_phone, cb.business_name"
        " FROM pickup_requests p"
        " JOIN users cu ON cu.id=p.customer_id"
        " LEFT JOIN users co ON co.id=p.collector_id"
        " LEFT JOIN collectors cb ON cb.user_id=p.collector_id"
        " WHERE p.id=?", (pid,)).fetchone()
    if not row:
        raise HTTPException(404, "Pickup not found")
    p = row_dict(row)
    p["items"] = [row_dict(r) for r in conn.execute(
        "SELECT * FROM pickup_items WHERE pickup_id=?", (pid,)).fetchall()]
    if p.get("recycler_id"):
        rc = conn.execute("SELECT facility_name FROM recyclers WHERE user_id=?",
                          (p["recycler_id"],)).fetchone()
        p["recycler_name"] = rc["facility_name"] if rc else None
    return p


@router.post("")
def create_pickup(body: PickupCreate, user: dict = Depends(require_roles("customer"))):
    with db() as conn:
        code = _new_code(conn)
        pid = insert_id(conn,
            "INSERT INTO pickup_requests (code, customer_id, status, address, zone, lat, lng,"
            " estimated_weight, estimated_value_min, estimated_value_max, notes, image_path,"
            " ai_confidence) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (code, user["id"], "pending", body.address, body.zone or user.get("zone"),
             user.get("lat"), user.get("lng"), body.total_weight or 0,
             body.estimated_value_min, body.estimated_value_max, body.notes,
             body.image_path, body.ai_confidence))

        weights = body.weights or []
        est = 0.0
        for i, cat in enumerate(body.categories):
            meta = MATERIALS.get(cat, MATERIALS["other"])
            w = weights[i] if i < len(weights) else round((body.total_weight or 0) / len(body.categories), 1)
            w = max(0.1, w)
            conn.execute(
                "INSERT INTO pickup_items (pickup_id, category, estimated_weight, rate_per_kg)"
                " VALUES (?,?,?,?)", (pid, cat, w, meta["rate"]))
            est += w * meta["rate"]
        if not body.estimated_value_min:
            conn.execute(
                "UPDATE pickup_requests SET estimated_value_min=?, estimated_value_max=?"
                " WHERE id=?", (round(est * 0.9, 0), round(est * 1.1, 0), pid))

        conn.execute(
            "INSERT INTO notifications (user_id, title, body, kind) VALUES (?,?,?,?)",
            (user["id"], "Pickup request created", f"{code} is now visible to nearby collectors", "info"))

        p = _get(conn, pid)
    return p


@router.get("")
def list_pickups(
    status: str | None = Query(default=None),
    scope: str = Query(default="mine"),
    limit: int = Query(default=100, le=500),
    user: dict = Depends(get_current_user),
):
    q = ("SELECT p.*, cu.name AS customer_name, co.name AS collector_name, cb.business_name"
         " FROM pickup_requests p JOIN users cu ON cu.id=p.customer_id"
         " LEFT JOIN users co ON co.id=p.collector_id"
         " LEFT JOIN collectors cb ON cb.user_id=p.collector_id")
    params: list = []
    where = []
    if scope == "mine":
        if user["role"] == "customer":
            where.append("p.customer_id=?")
            params.append(user["id"])
        elif user["role"] == "collector":
            if status == "pending":
                # Open requests: show all pending so collectors can browse the whole city.
                where.append("p.status='pending'")
            else:
                where.append("p.collector_id=?")
                params.append(user["id"])
    elif scope == "all" and user["role"] in ("admin", "recycler"):
        pass
    else:
        raise HTTPException(403, "Invalid scope")

    if status:
        where.append("p.status=?")
        params.append(status)
    if where:
        q += " WHERE " + " AND ".join(where)
    q += " ORDER BY p.created_at DESC LIMIT ?"
    params.append(limit)

    with db() as conn:
        rows = [row_dict(r) for r in conn.execute(q, params).fetchall()]
        for p in rows:
            p["items"] = [row_dict(r) for r in conn.execute(
                "SELECT * FROM pickup_items WHERE pickup_id=?", (p["id"],)).fetchall()]
    return {"pickups": rows}


@router.get("/next-code")
def next_code(user: dict = Depends(get_current_user)):
    with db() as conn:
        return {"code": _new_code(conn)}


@router.get("/{pid}")
def get_pickup(pid: int, user: dict = Depends(get_current_user)):
    with db() as conn:
        p = _get(conn, pid)
    if user["role"] not in ("admin", "recycler") and user["id"] not in (
            p["customer_id"], p["collector_id"]):
        raise HTTPException(403, "Not your pickup")
    return p


@router.post("/recommend")
def recommend(body: RecommendationRequest, user: dict = Depends(get_current_user)):
    if body.pickup_id:
        with db() as conn:
            p = conn.execute("SELECT * FROM pickup_requests WHERE id=?", (body.pickup_id,)).fetchone()
        if not p:
            raise HTTPException(404, "Pickup not found")
        if p["customer_id"] != user["id"] and user["role"] not in ("admin",):
            raise HTTPException(403, "Not your pickup")
        lat, lng, cats = p["lat"], p["lng"], None
        with db() as conn:
            cats = [r["category"] for r in conn.execute(
                "SELECT DISTINCT category FROM pickup_items WHERE pickup_id=?",
                (body.pickup_id,)).fetchall()]
        cats = cats or ["paper"]
    else:
        lat, lng = user.get("lat"), user.get("lng")
        cats = body.categories or ["paper"]
        if not lat:
            raise HTTPException(400, "No location available for matching")

    recs = score_collectors(lat, lng, cats, limit=8)
    return {
        "recommended": recs[0] if recs else None,
        "alternatives": recs[1:5],
        "all": recs,
        "algorithm": "distance .40 · availability .25 · material .20 · rating .15",
        "note": "Scores shown in admin/debug contexts; customers see a simple ranking.",
    }


@router.patch("/{pid}/status")
def update_status(pid: int, body: PickupStatusUpdate, user: dict = Depends(get_current_user)):
    with db() as conn:
        p = _get(conn, pid)
        if body.status not in STATUS_FLOW.get(p["status"], []):
            raise HTTPException(400, f"Cannot move from {p['status']} to {body.status}")
        if user["role"] == "collector" and body.status != "accepted" and p["collector_id"] != user["id"]:
            raise HTTPException(403, "Not your pickup")
        if user["role"] == "customer" and body.status != "cancelled":
            raise HTTPException(403, "Only collectors can advance pickup status")

        if body.status == "accepted":
            if p["status"] == "pending":
                conn.execute(
                    "UPDATE pickup_requests SET collector_id=?, accepted_at=datetime('now') "
                    "WHERE id=?", (user["id"], pid))
        conn.execute("UPDATE pickup_requests SET status=? WHERE id=?", (body.status, pid))

        title_map = {
            "accepted": "Collector accepted your pickup",
            "on_the_way": "Collector is on the way",
            "collected": "Waste collected",
            "cancelled": "Pickup cancelled",
        }
        conn.execute(
            "INSERT INTO notifications (user_id, title, body, kind) VALUES (?,?,?,?)",
            (p["customer_id"], title_map[body.status], f"Pickup {p['code']} · status updated", "info"))
        p = _get(conn, pid)
    return p


@router.post("/{pid}/accept")
def accept_pickup(pid: int, user: dict = Depends(require_roles("collector"))):
    return update_status(pid, PickupStatusUpdate(status="accepted"), user)


@router.post("/{pid}/complete")
def complete_pickup(pid: int, body: PickupComplete,
                    user: dict = Depends(require_roles("collector"))):
    with db() as conn:
        p = _get(conn, pid)
        if p["collector_id"] != user["id"]:
            raise HTTPException(403, "Not your pickup")
        if p["status"] not in ("collected", "on_the_way", "accepted"):
            raise HTTPException(400, f"Pickup is {p['status']} — cannot complete")

        total_weight = 0.0
        total_value = 0.0
        for item in body.items:
            meta = MATERIALS.get(item.category, MATERIALS["other"])
            conn.execute(
                "INSERT INTO pickup_items (pickup_id, category, estimated_weight, actual_weight,"
                " rate_per_kg, amount) VALUES (?,?,?,?,?,?)",
                (pid, item.category, item.actual_weight, item.actual_weight,
                 item.rate_per_kg, round(item.actual_weight * item.rate_per_kg, 2)))
            total_weight += item.actual_weight
            total_value += item.actual_weight * item.rate_per_kg
        total_value = round(total_value, 2)

        recycler_id = body.recycler_id
        if not recycler_id:
            row = conn.execute("SELECT user_id FROM recyclers LIMIT 1").fetchone()
            recycler_id = row["user_id"] if row else None

        code = p["code"]
        conn.execute(
            "UPDATE pickup_requests SET status='completed', actual_weight=?, final_value=?,"
            " payment_method=?, completed_at=datetime('now'), recycler_id=? WHERE id=?",
            (round(total_weight, 1), total_value, body.payment_method, recycler_id, pid))
        conn.execute(
            "INSERT INTO transactions (pickup_id, customer_id, collector_id, total_weight,"
            " total_amount, payment_method, receipt_code) VALUES (?,?,?,?,?,?,?)",
            (pid, p["customer_id"], user["id"], round(total_weight, 1), total_value,
             body.payment_method, f"RCPT-{code.split('-')[-1]}"))

        for item in body.items:
            imp = impact_for_weight(item.category, item.actual_weight)
            conn.execute(
                "INSERT INTO impact_records (pickup_id, category, weight, co2_avoided,"
                " water_saved, energy_saved) VALUES (?,?,?,?,?,?)",
                (pid, item.category, imp["weight"], imp["co2"], imp["water"], imp["energy"]))

        conn.execute(
            "UPDATE collectors SET completed_pickups=completed_pickups+1,"
            " kg_collected=kg_collected+?, earnings=earnings+? WHERE user_id=?",
            (round(total_weight, 1), total_value, user["id"]))
        conn.execute(
            "INSERT INTO notifications (user_id, title, body, kind) VALUES (?,?,?,?)",
            (p["customer_id"], "Pickup completed",
             f"{code} · {total_weight:.1f} kg · ₹{total_value:,.2f} · receipt ready", "success"))

        p = _get(conn, pid)
    return p


@router.get("/{pid}/receipt")
def receipt(pid: int, user: dict = Depends(get_current_user)):
    with db() as conn:
        p = _get(conn, pid)
        if user["role"] not in ("admin",) and user["id"] not in (p["customer_id"], p["collector_id"]):
            raise HTTPException(403, "Not your receipt")
        tx = conn.execute("SELECT * FROM transactions WHERE pickup_id=?", (pid,)).fetchone()
        if not tx:
            raise HTTPException(404, "Receipt not available until pickup completes")
        tx = row_dict(tx)
        cu = conn.execute("SELECT name, phone, address FROM users WHERE id=?",
                          (p["customer_id"],)).fetchone()
        co = conn.execute("SELECT name, phone FROM users WHERE id=?",
                          (p["collector_id"],)).fetchone()

    lines = []
    for it in p["items"]:
        if it.get("actual_weight"):
            lines.append({
                "category": it["category"],
                "name": MATERIALS.get(it["category"], {}).get("name", it["category"].title()),
                "weight": it["actual_weight"],
                "rate": it["rate_per_kg"],
                "amount": it["amount"] or round(it["actual_weight"] * it["rate_per_kg"], 2),
            })
    return {
        "brand": "KABADIWALA CONNECT",
        "pickup": {"id": p["id"], "code": p["code"], "status": p["status"],
                   "address": p["address"], "date": p["completed_at"] or p["created_at"]},
        "customer": row_dict(cu),
        "collector": row_dict(co),
        "lines": lines,
        "totals": {
            "weight": round(sum(l["weight"] for l in lines), 1),
            "amount": round(sum(l["amount"] for l in lines), 2),
            "payment_method": tx["payment_method"],
        },
        "receipt_code": tx["receipt_code"],
        "tagline": "Every kilogram recycled contributes to a cleaner future.",
        "note": "Demo receipt generated for the SIH prototype.",
    }


@router.post("/{pid}/rate")
def rate(pid: int, body: RateRequest, user: dict = Depends(require_roles("customer"))):
    with db() as conn:
        p = _get(conn, pid)
        if p["customer_id"] != user["id"]:
            raise HTTPException(403, "Not your pickup")
        if p["status"] != "completed":
            raise HTTPException(400, "Rate after completion")
        conn.execute(
            "INSERT INTO ratings (pickup_id, customer_id, collector_id, stars, comment)"
            " VALUES (?,?,?,?,?)", (pid, user["id"], p["collector_id"], body.stars, body.comment))
    return {"ok": True}


@router.post("/{pid}/cancel")
def cancel(pid: int, user: dict = Depends(get_current_user)):
    with db() as conn:
        p = _get(conn, pid)
        if p["customer_id"] != user["id"] and user["role"] != "admin":
            raise HTTPException(403, "Not your pickup")
        if p["status"] in ("completed", "cancelled"):
            raise HTTPException(400, f"Cannot cancel a {p['status']} pickup")
        conn.execute("UPDATE pickup_requests SET status='cancelled' WHERE id=?", (pid,))
        if p["collector_id"]:
            conn.execute("INSERT INTO notifications (user_id, title, body, kind) VALUES (?,?,?,?)",
                         (p["collector_id"], "Pickup cancelled",
                          f"{p['code']} was cancelled by the customer", "warn"))
    return {"ok": True}
