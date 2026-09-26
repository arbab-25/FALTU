"""Auth endpoints (simulated sessions for the SIH demo)."""
from fastapi import APIRouter, Depends, HTTPException

from ..deps import get_current_user
from ..database import db, row_dict
from ..schemas import LoginRequest
from ..security import create_token, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


def _user_payload(row) -> dict:
    user = row_dict(row)
    user.pop("password_hash", None)
    return user


@router.post("/login")
def login(body: LoginRequest):
    with db() as conn:
        row = conn.execute(
            "SELECT u.*, c.business_name, c.rating, c.completed_pickups, c.vehicle,"
            " c.available, c.materials, c.kg_collected, c.earnings"
            " FROM users u LEFT JOIN collectors c ON c.user_id=u.id WHERE lower(u.email)=?",
            (body.email.strip().lower(),),
        ).fetchone()

    if not row or not verify_password(body.password, row["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_token({"type": "session", "uid": row["id"], "role": user_role(row)})
    return {"token": token, "user": _user_payload(row)}


def user_role(row) -> str:
    return row["role"]


@router.post("/refresh")
def refresh(user: dict = Depends(get_current_user)):
    return {"token": create_token({"type": "session", "uid": user["id"], "role": user["role"]}),
            "user": user}


@router.post("/logout")
def logout():
    return {"ok": True}
