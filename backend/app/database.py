"""Persistence layer: SQLite locally, PostgreSQL (Neon/Render) in the cloud."""
import re
import sqlite3
from contextlib import contextmanager

from .config import DATABASE_PATH, IS_POSTGRES
from . import pgcompat

SCHEMA = """
PRAGMA journal_mode=WAL;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('customer','collector','recycler','admin')),
  phone TEXT,
  address TEXT,
  zone TEXT,
  lat REAL,
  lng REAL,
  language TEXT DEFAULT 'en',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS collectors (
  user_id INTEGER PRIMARY KEY REFERENCES users(id),
  business_name TEXT,
  rating REAL DEFAULT 4.5,
  completed_pickups INTEGER DEFAULT 0,
  kg_collected REAL DEFAULT 0,
  earnings REAL DEFAULT 0,
  verified INTEGER DEFAULT 1,
  vehicle TEXT DEFAULT 'Cycle trolley',
  available INTEGER DEFAULT 1,
  materials TEXT DEFAULT 'Paper,Plastic,Metal,Cardboard',
  eta_minutes INTEGER DEFAULT 20
);

CREATE TABLE IF NOT EXISTS recyclers (
  user_id INTEGER PRIMARY KEY REFERENCES users(id),
  facility_name TEXT,
  capacity_tons REAL DEFAULT 50,
  accepted_materials TEXT DEFAULT 'Paper,Plastic,Metal,E-waste,Cardboard,Glass'
);

CREATE TABLE IF NOT EXISTS waste_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  rate_per_kg REAL NOT NULL,
  co2_factor REAL NOT NULL,
  icon TEXT
);

CREATE TABLE IF NOT EXISTS pickup_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL,
  customer_id INTEGER NOT NULL REFERENCES users(id),
  collector_id INTEGER REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','accepted','on_the_way','collected','completed','cancelled')),
  address TEXT,
  zone TEXT,
  lat REAL,
  lng REAL,
  estimated_weight REAL,
  actual_weight REAL,
  estimated_value_min REAL,
  estimated_value_max REAL,
  final_value REAL,
  payment_method TEXT,
  notes TEXT,
  image_path TEXT,
  ai_confidence REAL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  accepted_at TEXT,
  completed_at TEXT,
  recycler_id INTEGER REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS pickup_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pickup_id INTEGER NOT NULL REFERENCES pickup_requests(id),
  category TEXT NOT NULL,
  estimated_weight REAL NOT NULL,
  actual_weight REAL,
  rate_per_kg REAL NOT NULL,
  amount REAL
);

CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pickup_id INTEGER NOT NULL REFERENCES pickup_requests(id),
  customer_id INTEGER NOT NULL,
  collector_id INTEGER NOT NULL,
  total_weight REAL NOT NULL,
  total_amount REAL NOT NULL,
  payment_method TEXT DEFAULT 'Cash',
  receipt_code TEXT UNIQUE NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS collector_locations (
  collector_id INTEGER PRIMARY KEY REFERENCES users(id),
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  zone TEXT,
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS recycling_centers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  zone TEXT,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  accepted TEXT
);

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  body TEXT,
  kind TEXT DEFAULT 'info',
  read INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ratings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pickup_id INTEGER REFERENCES pickup_requests(id),
  customer_id INTEGER NOT NULL,
  collector_id INTEGER NOT NULL,
  stars INTEGER NOT NULL,
  comment TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS impact_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pickup_id INTEGER REFERENCES pickup_requests(id),
  category TEXT NOT NULL,
  weight REAL NOT NULL,
  co2_avoided REAL NOT NULL,
  water_saved REAL DEFAULT 0,
  energy_saved REAL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS route_assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  collector_id INTEGER NOT NULL,
  pickup_id INTEGER NOT NULL,
  stop_order INTEGER NOT NULL,
  saved_km REAL DEFAULT 0,
  saved_min REAL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_pickups_code ON pickup_requests(code);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_pickups_status ON pickup_requests(status);
CREATE INDEX IF NOT EXISTS idx_pickups_customer ON pickup_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_pickups_collector ON pickup_requests(collector_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_tx_customer ON transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_tx_collector ON transactions(collector_id);
"""


def get_connection() -> sqlite3.Connection:
    DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DATABASE_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


@contextmanager
def db():
    """Yield a connection that behaves identically in both dialects."""
    if IS_POSTGRES:
        with pgcompat.pg_db() as pg:
            yield _PgCompat(pg)
        return
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


class _PgCompat:
    """Cursor-like facade so API code can call conn.execute(...) unchanged."""

    def __init__(self, conn):
        self._conn = conn

    def execute(self, sql, params=()):
        cur = self._conn.cursor()
        cur.execute(pgcompat.q(sql), tuple(params))
        return cur

    def execute_raw(self, sql, params=()):
        """Execute SQL that is already in Postgres form (no translation)."""
        cur = self._conn.cursor()
        cur.execute(sql, tuple(params))
        return cur

    def executemany(self, sql, seq):
        cur = self._conn.cursor()
        cur.executemany(pgcompat.q(sql), [tuple(p) for p in seq])
        return cur

    def executescript(self, script):
        pgcompat.init_pg(script)


_DIALECT_INITIALIZED = {"v": None}


def init_db() -> None:
    """Create tables once per dialect (safe to call repeatedly)."""
    key = "pg" if IS_POSTGRES else "sqlite"
    if _DIALECT_INITIALIZED["v"] == key:
        return
    if IS_POSTGRES:
        pgcompat.init_pg(SCHEMA)
    else:
        conn = get_connection()
        try:
            conn.executescript(SCHEMA)
            conn.commit()
        finally:
            conn.close()
    _DIALECT_INITIALIZED["v"] = key


def insert_id(conn, sql: str, params: tuple = ()) -> int:
    """INSERT and return the new row id in both dialects."""
    if IS_POSTGRES:
        cur = conn.execute(sql + " RETURNING id", params)
        return int(cur.fetchone()["id"])
    cur = conn.execute(sql, params)
    return int(cur.lastrowid)


_IDENT_RE = re.compile(r"^[a-z_][a-z0-9_]*$")


def _check_ident(name: str) -> str:
    """Guard SQL identifiers used in dynamically-built statements."""
    if not _IDENT_RE.match(name):
        raise ValueError(f"Invalid SQL identifier: {name!r}")
    return name


def insert_rows(conn, table: str, columns: list[str], rows: list[tuple],
                chunk: int = 300) -> None:
    """Batch insert using multi-row VALUES — one round-trip per `chunk` rows.

    Critical for cloud databases (Neon pooler ≈ 0.2 s per round-trip).
    Table/column names are validated identifiers; values are always bound.
    """
    if not rows:
        return
    _check_ident(table)
    for c in columns:
        _check_ident(c)
    mark = "%s" if IS_POSTGRES else "?"
    row_ph = "(" + ",".join([mark] * len(columns)) + ")"
    head = f"INSERT INTO {table} ({','.join(columns)}) VALUES "  # nosec B608 - validated identifiers, values bound
    raw = getattr(conn, "execute_raw", conn.execute)
    for i in range(0, len(rows), chunk):
        part = rows[i:i + chunk]
        flat = [v for row in part for v in row]
        raw(head + ",".join([row_ph] * len(part)), flat)


def row_dict(row) -> dict:
    return dict(row) if row is not None else {}
