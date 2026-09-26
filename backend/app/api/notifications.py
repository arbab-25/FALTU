"""User notifications."""
from fastapi import APIRouter, Depends

from ..database import db, row_dict
from ..deps import get_current_user

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("")
def list_notifications(user: dict = Depends(get_current_user), limit: int = 30):
    with db() as conn:
        rows = conn.execute(
            "SELECT * FROM notifications WHERE user_id=? ORDER BY id DESC LIMIT ?",
            (user["id"], limit)).fetchall()
        unread = conn.execute(
            "SELECT COUNT(*) n FROM notifications WHERE user_id=? AND read=0",
            (user["id"],)).fetchone()
    return {"notifications": [row_dict(r) for r in rows], "unread": unread["n"]}


@router.post("/read")
def mark_read(user: dict = Depends(get_current_user)):
    with db() as conn:
        conn.execute("UPDATE notifications SET read=1 WHERE user_id=?", (user["id"],))
    return {"ok": True}


@router.post("/{nid}/read")
def mark_one(nid: int, user: dict = Depends(get_current_user)):
    with db() as conn:
        conn.execute("UPDATE notifications SET read=1 WHERE id=? AND user_id=?",
                     (nid, user["id"]))
    return {"ok": True}
