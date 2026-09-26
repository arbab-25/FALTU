"""Waste material catalog, reference rates and emission factors.

All rates and factors are DEMO/indicative values for the SIH prototype.
They live in this single config so they can be tuned or replaced by a
market-rate feed later.
"""

# category -> (display name, reference rate ₹/kg, co2 factor kg CO2e/kg, icon key)
MATERIALS: dict[str, dict] = {
    "paper": {"name": "Paper", "rate": 14.0, "co2": 1.1, "icon": "newspaper"},
    "cardboard": {"name": "Cardboard", "rate": 10.0, "co2": 0.9, "icon": "package"},
    "plastic": {"name": "Plastic", "rate": 25.0, "co2": 1.5, "icon": "cup-soda"},
    "metal": {"name": "Metal", "rate": 60.0, "co2": 9.0, "icon": "wrench"},
    "glass": {"name": "Glass", "rate": 5.0, "co2": 0.3, "icon": "wine"},
    "e-waste": {"name": "E-waste", "rate": 80.0, "co2": 12.0, "icon": "cpu"},
    "mixed": {"name": "Mixed Recyclables", "rate": 12.0, "co2": 1.0, "icon": "layers"},
    "other": {"name": "Other", "rate": 8.0, "co2": 0.5, "icon": "tag"},
}

CATEGORY_ORDER = [
    "paper", "cardboard", "plastic", "metal", "e-waste", "glass", "mixed", "other",
]

# Rough material mix when a customer picks a category but gives one total weight.
DEFAULT_MIX: dict[str, float] = {
    "paper": 1.0, "cardboard": 1.0, "plastic": 1.0, "metal": 1.0,
    "glass": 1.0, "e-waste": 1.0, "mixed": 1.0, "other": 1.0,
}

# Materials each collector accepts (superset used for matching compatibility).
COLLECTOR_MATERIALS = ["paper", "cardboard", "plastic", "metal", "e-waste", "glass", "mixed"]

# Additional environmental factors (estimates, per kg recycled).
WATER_FACTORS = {"paper": 18.0, "cardboard": 14.0, "plastic": 8.0, "metal": 25.0,
                 "glass": 4.0, "e-waste": 6.0, "mixed": 10.0, "other": 3.0}  # litres/kg
ENERGY_FACTORS = {"paper": 3.2, "cardboard": 2.8, "plastic": 4.1, "metal": 14.0,
                  "glass": 1.2, "e-waste": 6.0, "mixed": 3.0, "other": 1.5}  # kWh/kg
