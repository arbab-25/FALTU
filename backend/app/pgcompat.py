"""PostgreSQL compatibility helpers for Neon / Render deployments.

Keeps the backend stdlib-only in SQLite mode and adds psycopg2 support only
when DATABASE_URL points at Postgres:

- SQLite (local demo):  DATABASE_URL unset or sqlite:///  → local file
- PostgreSQL (Neon):    DATABASE_URL postgres[ql]://      → psycopg2 + $N params

Translation rules (applied by `q()`):
- `?` placeholders        → `$1, $2, ...`
- `datetime('now')`       → `to_char(now(), 'YYYY-MM-DD HH24:MI:SS')`
- `date('now','start of month')` → `to_char(date_trunc('month', now()), 'YYYY-MM-DD')`
"""
import re
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
    counter = {"n": 0}

    def repl(_m):
        counter["n"] += 1
        return f"${counter['n']}"

    return re.sub(r"\?", repl, sql)


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
            for stmt in _pg_schema(schema_sql):
                cur.execute(stmt)
        conn.commit()
    finally:
        conn.close()


def _pg_schema(schema_sql: str) -> list[str]:
    out: list[str] = []
    for stmt in schema_sql.split(";"):
        s = stmt.strip()
        if not s or s.upper().startswith("PRAGMA"):
            continue
        s = s.replace("INTEGER PRIMARY KEY AUTOINCREMENT", "BIGSERIAL PRIMARY KEY")
        s = s.replace(" REAL ", " DOUBLE PRECISION ")
        out.append(s + ";")
    return out
