"""Kabadiwala Connect — API regression self-test.

Runs the complete connected flow against a live backend:
    python backend/selftest.py [--base http://127.0.0.1:8000/api]

Checks (SIH26229 requirement 53 — the connected platform):
    auth → pickup create → collector feed → accept → status flow →
    complete → transaction/receipt → impact → analytics → presentation
"""
import io
import json
import sys
import urllib.error
import urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

BASE = "http://127.0.0.1:8000/api"
if "--base" in sys.argv:
    BASE = sys.argv[sys.argv.index("--base") + 1]

PASS: list[str] = []
FAIL: list[str] = []


def check(name: str, ok: bool, detail: str = "") -> None:
    (PASS if ok else FAIL).append(f"{name}{f' — {detail}' if detail else ''}")
    print(("  PASS " if ok else "  FAIL ") + name + (f" ({detail})" if detail else ""))


def call(method: str, path: str, body=None, token: str | None = None) -> tuple[int, dict]:
    req = urllib.request.Request(BASE + path, method=method)
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    data = json.dumps(body).encode() if body is not None else None
    try:
        with urllib.request.urlopen(req, data, timeout=30) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read())
        except Exception:
            return e.code, {}


def main() -> int:
    print(f"\nKabadiwala Connect self-test → {BASE}\n" + "=" * 56)

    # 0. Health & identity
    st, health = call("GET", "/health")
    check("health endpoint", st == 200 and health.get("ok") is True)
    check("code identity", health.get("code_version") == "1.0.0-sih26229",
          str(health.get("code_version")))
    check("database reachable", health.get("database_ok") is True, str(health.get("database")))
    check("database seeded", (health.get("counts", {}).get("users") or 0) > 100,
          str(health.get("counts", {}).get("users")))

    # 1. Auth: all four demo roles
    tokens: dict[str, str] = {}
    for role, email in [("customer", "customer@demo.com"), ("collector", "collector@demo.com"),
                        ("recycler", "recycler@demo.com"), ("admin", "admin@demo.com")]:
        st, d = call("POST", "/auth/login", {"email": email, "password": "demo123"})
        check(f"login {role}", st == 200 and d.get("token"))
        tokens[role] = d.get("token", "")

    st, _ = call("POST", "/auth/login", {"email": "customer@demo.com", "password": "wrong"})
    check("bad password rejected", st == 401)

    # 2. Customer dashboard reads
    st, imp = call("GET", "/impact/mine", token=tokens["customer"])
    check("customer impact", st == 200 and "totals" in imp)
    st, picks = call("GET", "/pickups?scope=mine", token=tokens["customer"])
    check("customer pickups list", st == 200 and isinstance(picks.get("pickups"), list))

    # 3. AI estimate (no image — demo engine)
    st, est = call("POST", "/waste/estimate",
                   {"items": [{"category": "cardboard", "weight": 4.2},
                              {"category": "plastic", "weight": 1.8}]},
                   token=tokens["customer"])
    check("value estimator", st == 200 and abs(est.get("total_value", 0) - 87.0) < 0.01,
          f"total={est.get('total_value')}")

    # 4. Collector matching
    st, rec = call("POST", "/pickups/recommend", {"categories": ["paper"]},
                   token=tokens["customer"])
    check("matcher returns ranked collectors", st == 200 and rec.get("recommended"),
          rec.get("recommended", {}).get("name", ""))

    # 5. THE CONNECTED FLOW (requirement 53)
    st, p = call("POST", "/pickups",
                 {"categories": ["cardboard", "plastic"], "weights": [4.0, 2.0],
                  "total_weight": 6.0,
                  "address": "B-402 Sunshine Residency, Satellite, Ahmedabad",
                  "zone": "Satellite"},
                 token=tokens["customer"])
    check("customer creates pickup", st == 200 and p.get("status") == "pending",
          p.get("code", ""))

    st, feed = call("GET", "/pickups?scope=mine&status=pending", token=tokens["collector"])
    check("pickup visible to collector", st == 200 and
          any(x["id"] == p["id"] for x in feed.get("pickups", [])))

    st, acc = call("POST", f"/pickups/{p['id']}/accept", {}, token=tokens["collector"])
    check("collector accepts", st == 200 and acc.get("status") == "accepted")

    st, view = call("GET", f"/pickups/{p['id']}", token=tokens["customer"])
    check("customer sees status change", st == 200 and view.get("status") == "accepted")

    for status in ("on_the_way", "collected"):
        st, _ = call("PATCH", f"/pickups/{p['id']}/status", {"status": status},
                     token=tokens["collector"])
        check(f"status → {status}", st == 200)

    st, done = call("POST", f"/pickups/{p['id']}/complete",
                    {"items": [{"category": "cardboard", "actual_weight": 4.2, "rate_per_kg": 10},
                               {"category": "plastic", "actual_weight": 1.8, "rate_per_kg": 25}],
                     "payment_method": "UPI"},
                    token=tokens["collector"])
    check("complete → transaction", st == 200 and done.get("status") == "completed"
          and abs((done.get("final_value") or 0) - 87.0) < 0.01,
          f"value={done.get('final_value')}")

    st, rc = call("GET", f"/pickups/{p['id']}/receipt", token=tokens["customer"])
    check("digital receipt", st == 200 and rc.get("receipt_code", "").startswith("RCPT-")
          and abs(rc.get("totals", {}).get("amount", 0) - 87.0) < 0.01,
          rc.get("receipt_code", ""))

    st, mine = call("GET", "/impact/mine", token=tokens["customer"])
    check("impact updated by completion", st == 200 and (mine["totals"]["weight_kg"] or 0) > 0)

    st, cd = call("GET", "/collectors/dashboard", token=tokens["collector"])
    check("collector earnings updated", st == 200 and (cd.get("today_earnings") or 0) >= 87.0,
          f"today={cd.get('today_earnings')}")

    # 6. RBAC: cross-role access blocked
    st, _ = call("GET", "/admin/analytics", token=tokens["customer"])
    check("RBAC: customer blocked from admin", st == 403)
    st, _ = call("POST", "/pickups", {"categories": ["paper"], "total_weight": 1,
                                      "address": "x"}, token=tokens["collector"])
    check("RBAC: collector cannot create pickup", st == 403)
    st, _ = call("GET", "/pickups?scope=all", token=tokens["customer"])
    check("RBAC: customer blocked from scope=all", st == 403)

    # 7. Validation
    st, _ = call("POST", "/pickups", {"categories": [], "total_weight": -5, "address": ""},
                 token=tokens["customer"])
    check("invalid input rejected (422)", st == 422)

    # 8. Admin / recycler / presentation
    st, an = call("GET", "/admin/analytics", token=tokens["admin"])
    check("admin analytics", st == 200 and an.get("kpi", {}).get("total_pickups", 0) > 0)
    st, pr = call("GET", "/presentation", token=tokens["admin"])
    check("presentation mode", st == 200 and pr.get("kpi"))
    st, rov = call("GET", "/recycler/overview", token=tokens["recycler"])
    check("recycler overview + flow", st == 200 and rov.get("flow", {}).get("collected", 0) > 0)
    st, pub = call("GET", "/impact/public")
    check("public impact (no auth)", st == 200 and pub.get("totals"))

    # 9. Notifications
    st, n = call("GET", "/notifications", token=tokens["customer"])
    check("notifications", st == 200 and isinstance(n.get("notifications"), list))

    print("=" * 56)
    print(f"RESULT: {len(PASS)} passed, {len(FAIL)} failed")
    for f in FAIL:
        print("  ✗", f)
    return 0 if not FAIL else 1


if __name__ == "__main__":
    sys.exit(main())
