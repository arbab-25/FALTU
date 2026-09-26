"""Shared FastAPI dependencies: auth guard and role enforcement."""
from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from .database import db, row_dict
from .security import verify_token

_bearer = HTTPBearer(auto_error=False)


def _extract_token(
    creds: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> str | None:
    return creds.credentials if creds else None


def get_current_user(request: Request, token: str | None = Depends(_extract_token)) -> dict:
    """Resolve the signed demo session; falls back to ?demo_user= for quick demos."""
    payload = None
    if token:
        payload = verify_token(token)
    if not payload:
        q = request.query_params.get("demo_user")
        if q:
            payload = verify_token(q)
    if not payload or payload.get("type") != "session":
        raise HTTPException(status_code=401, detail="Not authenticated")

    with db() as conn:
        row = conn.execute(
            "SELECT u.*, c.business_name, c.rating, c.completed_pickups, c.vehicle,"
            " c.available, c.materials, c.kg_collected, c.earnings"
            " FROM users u LEFT JOIN collectors c ON c.user_id=u.id WHERE u.id=?",
            (payload["uid"],),
        ).fetchone()
    if not row:
        raise HTTPException(status_code=401, detail="User no longer exists")
    user = row_dict(row)
    user.pop("password_hash", None)
    return user


def require_roles(*roles: str):
    def guard(user: dict = Depends(get_current_user)) -> dict:
        if user["role"] not in roles:
            raise HTTPException(status_code=403, detail="Insufficient role")
        return user
    return guard
