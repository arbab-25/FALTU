"""Auth & security utilities: PBKDF2 password hashing and signed demo tokens."""
import base64
import hashlib
import hmac
import json
import secrets
import time

from .config import SECRET_KEY

_SESSION_TTL_SECONDS = 12 * 3600


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 120_000)
    return f"pbkdf2${base64.b64encode(salt).decode()}${base64.b64encode(dk).decode()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        algo, salt_b64, dk_b64 = stored.split("$")
        if algo != "pbkdf2":
            return False
        salt = base64.b64decode(salt_b64)
        expected = base64.b64decode(dk_b64)
        actual = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 120_000)
        return hmac.compare_digest(expected, actual)
    except Exception:
        return False


def _b64(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode().rstrip("=")


def _unb64(data: str) -> bytes:
    return base64.urlsafe_b64decode(data + "=" * (-len(data) % 4))


def create_token(payload: dict) -> str:
    body = dict(payload)
    body["exp"] = int(time.time()) + _SESSION_TTL_SECONDS
    raw = json.dumps(body, separators=(",", ":")).encode()
    sig = hmac.new(SECRET_KEY.encode(), raw, hashlib.sha256).digest()
    return f"{_b64(raw)}.{_b64(sig)}"


def verify_token(token: str) -> dict | None:
    try:
        raw_b64, sig_b64 = token.split(".", 1)
        raw = _unb64(raw_b64)
        expected = hmac.new(SECRET_KEY.encode(), raw, hashlib.sha256).digest()
        if not hmac.compare_digest(expected, _unb64(sig_b64)):
            return None
        payload = json.loads(raw)
        if payload.get("exp", 0) < time.time():
            return None
        return payload
    except Exception:
        return None


def sanitize_filename(name: str) -> str:
    """Strip path components and unsafe characters from an uploaded filename."""
    keep = "".join(c if c.isalnum() or c in {".", "_", "-"} else "_" for c in name)
    return keep.replace("..", "_")[:120] or "upload"
