"""PostgreSQL compatibility helpers for Neon / Render deployments.

Keeps the backend stdlib-only in SQLite mode and adds psycopg2 support only
when DATABASE_URL points at Postgres:

- SQLite (local demo):  DATABASE_URL unset or sqlite:///  → local file
- PostgreSQL (Neon):    DATABASE_URL postgres[ql]://      → psycopg2 + $N params

Translation rules (applied by `q()`):
- `?` placeholders        → `%s` (psycopg2 client-side binding)
- `datetime('now')`       → `to_char(now(), 'YYYY-MM-DD HH24:MI:SS')`
- `date('now','start of month')` → `to_char(date_trunc('month', now()), 'YYYY-MM-DD')`
"""
import re  # noqa: F401  (kept for future pattern-based translations)
from contextlib import contextmanager

from .config import DATABASE_URL, IS_POSTGRES


def _neon_url() -> str:
    """Normalize a Neon/Render Postgres URL for psycopg2 (sslmode required)."""
    url = DATABASE_URL.strip()
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    if "sslmode=" not in url:
        url += ("&" if "?" in url else "?") + "sslmode=require"
    return url


def q(sql: str) -> str:
    """Translate SQLite-style SQL into PostgreSQL dialect."""
    if not IS_POSTGRES:
        return sql
    sql = sql.replace("datetime('now')", "to_char(now(), 'YYYY-MM-DD HH24:MI:SS')")
    sql = sql.replace("date('now','start of month')",
                      "to_char(date_trunc('month', now()), 'YYYY-MM-DD')")
    sql = sql.replace("date(created_at)=date('now')", "(created_at::date)=current_date")
    sql = sql.replace("date(created_at)", "(created_at::date)::text")
    # Escape literal % (LIKE patterns etc.) before injecting %s placeholders.
    sql = sql.replace("%", "%%")
    return sql.replace("?", "%s")


def connect():
    """Open a psycopg2 connection whose rows behave like dictionaries."""
    import psycopg2
    from psycopg2.extras import RealDictCursor

    conn = psycopg2.connect(_neon_url(), cursor_factory=RealDictCursor)
    conn.autocommit = False
    return conn


@contextmanager
def pg_db():
    """Postgres variant of the database.db() context manager."""
    conn = connect()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def insert_returning_id(conn, sql: str, params: tuple) -> int:
    """INSERT that returns the new row id in both dialects."""
    cur = conn.cursor()
    if IS_POSTGRES:
        cur.execute(q(sql) + " RETURNING id", params)
        return int(cur.fetchone()["id"])
    cur.execute(sql, params)
    return int(cur.lastrowid)


def init_pg(schema_sql: str) -> None:
    """Create tables/indexes on Postgres by translating the SQLite schema."""
    conn = connect()
    try:
        with conn.cursor() as cur:
            for i, stmt in enumerate(_pg_schema(schema_sql)):
                try:
                    cur.execute(stmt)
                except Exception:
                    raise RuntimeError(f"PG schema statement #{i} failed: {stmt[:160]}") from None
        conn.commit()
    finally:
        conn.close()


def _pg_schema(schema_sql: str) -> list[str]:
    out: list[str] = []
    for stmt in schema_sql.split(";"):
        s = stmt.strip()
        if not s or s.upper().startswith("PRAGMA"):
            continue
        s = q(s)  # translate SQLite datetime()/date() defaults for Postgres
        s = s.replace("INTEGER PRIMARY KEY AUTOINCREMENT", "BIGSERIAL PRIMARY KEY")
        s = s.replace(" REAL ", " DOUBLE PRECISION ")
        out.append(s + ";")
    return out
