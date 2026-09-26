"""SQLite persistence layer (stdlib only)."""
import sqlite3
from contextlib import contextmanager
from pathlib import Path

from .config import DATABASE_PATH

SCHEMA = """
PRAGMA journal_mode=WAL;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
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
  code TEXT UNIQUE NOT NULL,
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
  pickup_id INTEGER UNIQUE NOT NULL REFERENCES pickup_requests(id),
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
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db() -> None:
    with db() as conn:
        conn.executescript(SCHEMA)


def row_dict(row) -> dict:
    return dict(row) if row is not None else {}
