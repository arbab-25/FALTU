"""Deterministic demo data generators (seeded random) for Ahmedabad."""
import random

random.seed(26229)

FIRST_NAMES = [
    "Aarav", "Vihaan", "Anaya", "Diya", "Ishaan", "Kavya", "Arjun", "Meera",
    "Rohan", "Priya", "Kabir", "Ananya", "Dev", "Nisha", "Yash", "Riya",
    "Aditya", "Pooja", "Manav", "Sneha", "Rahul", "Sima", "Nirav", "Hetal",
    "Jignesh", "Bhavna", "Parth", "Kinjal", "Mihir", "Falguni",
]
LAST_NAMES = [
    "Patel", "Shah", "Desai", "Mehta", "Joshi", "Trivedi", "Bhatt", "Chauhan",
    "Vyas", "Modi", "Pandya", "Kapoor", "Verma", "Nair",
]

COLLECTOR_BUSINESSES = [
    "Ramesh Recycling Services", "GreenCycle Kabadi", "Ahmedabad Scrap Network",
    "EcoCollect Ahmedabad", "Shree Recycling", "Sarthi Scrap Solutions",
    "Navkar Waste Traders", "Prakriti Collectors", "GreenLeaf Kabadiwala",
    "Sattva Scrap Mart", "CleanLoop Collectors", "Annapurna Recycling",
    "Hariyali Scrap Point", "Vatva Scrap Hub", "Chandkheda Kabadi Corner",
]

VEHICLES = ["Cycle trolley", "Auto-rickshaw", "Pickup van", "E-cart", "Tempo"]
PAYMENTS = ["Cash", "UPI", "Digital"]

# Central Ahmedabad neighborhoods with representative (approximate) coordinates.
ZONES = [
    ("Navrangpura", 23.0365, 72.5611),
    ("Satellite", 23.0276, 72.5073),
    ("Maninagar", 22.9958, 72.6072),
    ("Bopal", 23.0345, 72.4600),
    ("Vadaj", 23.0748, 72.5600),
    ("Vastrapur", 23.0346, 72.5340),
    ("Bapunagar", 23.0260, 72.6100),
    ("Paldi", 23.0090, 72.5500),
    ("Gota", 23.1100, 72.5400),
    ("Ellisbridge", 23.0170, 72.5550),
    ("Naranpura", 23.0430, 72.5510),
    ("Vejalpur", 23.0100, 72.5000),
]

STREET_NAMES = [
    "MG Road", "Law Garden Road", "CG Road", "Sindhu Bhavan Marg", "Ashram Road",
    "Prahladnagar Road", "Sarkhej–Gandhinagar Highway", "Jodhpur Cross Road",
    "Motera Stadium Road", "Rajpath Club Road", "Arya Samaj Road", "Shivranjani Road",
]


def rand_name() -> str:
    return f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"


def rand_zone() -> tuple[str, float, float]:
    return random.choice(ZONES)


def rand_address(zone: str) -> str:
    return f"{random.randint(1, 250)} {random.choice(STREET_NAMES)}, {zone}, Ahmedabad"


def jitter(lat: float, lng: float, spread: float = 0.02) -> tuple[float, float]:
    return round(lat + random.uniform(-spread, spread), 5), \
        round(lng + random.uniform(-spread, spread), 5)


def rand_phone() -> str:
    return f"+91 9{random.randint(100000000, 999999999)}"


def float_between(lo: float, hi: float, nd: int = 1) -> float:
    return round(random.uniform(lo, hi), nd)
