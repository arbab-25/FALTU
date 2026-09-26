"""Waste intelligence endpoints: catalog, estimation and demo AI analysis."""
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from ..config import ALLOWED_IMAGE_TYPES, DEMO_NOTE, MAX_UPLOAD_BYTES, UPLOAD_DIR
from ..database import db, row_dict
from ..deps import get_current_user
from ..schemas import EstimateRequest
from ..security import sanitize_filename
from ..services.ai_provider import get_classifier
from ..services.catalog import MATERIALS

router = APIRouter(prefix="/waste", tags=["waste"])

GUIDELINES = {
    "plastic": {
        "recyclable": "Bottles, containers, rigid packaging (PET, HDPE).",
        "prepare": "Rinse and dry; crush bottles to save space; keep caps separate if possible.",
        "avoid": "Do not mix with food waste; soft plastic bags degrade the batch.",
        "safety": "Never burn plastic waste — releases toxic fumes.",
    },
    "paper": {
        "recyclable": "Newspapers, notebooks, office paper, magazines.",
        "prepare": "Keep dry; remove plastic covers and staples where possible.",
        "avoid": "Do not mix with wet kitchen waste; greasy paper is hard to recycle.",
        "safety": "Stack and tie bundles to prevent scattering.",
    },
    "metal": {
        "recyclable": "Aluminium cans, steel utensils, wires, sheets.",
        "prepare": "Flatten cans; separate aluminium from iron/steel for better rates.",
        "avoid": "Do not mix with e-waste or batteries.",
        "safety": "Watch for sharp edges; avoid rusted sharp metal in loose bags.",
    },
    "glass": {
        "recyclable": "Bottles, jars, pane glass (intact pieces preferred).",
        "prepare": "Rinse; pack in a separate sturdy bag or box.",
        "avoid": "Do not mix broken glass with paper or plastic waste.",
        "safety": "Wrap broken pieces in newspaper and mark 'GLASS'.",
    },
    "e-waste": {
        "recyclable": "Old phones, chargers, cables, small appliances, batteries.",
        "prepare": "Tape battery terminals; keep devices whole where possible.",
        "avoid": "Do not mix with dry waste; batteries need separate handling.",
        "safety": "Never dismantle lithium batteries; fire risk.",
    },
    "hazardous": {
        "recyclable": "Not collected via normal pickup — needs special handling.",
        "prepare": "Store in original containers; keep away from children.",
        "avoid": "Never mix paints, solvents, medical waste with recyclables.",
        "safety": "Contact your municipal helpline for hazardous disposal.",
    },
}


@router.get("/catalog")
def catalog(user: dict = Depends(get_current_user)):
    return {"materials": [
        {"category": c, **{k: v for k, v in MATERIALS[c].items()}} for c in MATERIALS
    ], "note": DEMO_NOTE}


@router.post("/estimate")
def estimate(body: EstimateRequest, user: dict = Depends(get_current_user)):
    from ..services.value_estimator import estimate_value

    return estimate_value([{"category": i.category, "weight": i.weight} for i in body.items])


@router.post("/analyze")
async def analyze(
    image: UploadFile | None = File(default=None),
    categories: str = Form(default=""),
    hint_weight: float | None = Form(default=None),
    user: dict = Depends(get_current_user),
):
    """AI waste estimation (demo engine). Accepts an optional image upload."""
    image_bytes = None
    filename = ""
    if image and image.filename:
        if image.content_type not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(400, "Unsupported image type. Use PNG, JPEG or WEBP.")
        image_bytes = await image.read(MAX_UPLOAD_BYTES + 1)
        if len(image_bytes) > MAX_UPLOAD_BYTES:
            raise HTTPException(413, "Image too large (max 8 MB).")
        filename = sanitize_filename(image.filename)
        (UPLOAD_DIR / filename).write_bytes(image_bytes)

    selected = [c.strip() for c in categories.split(",") if c.strip()] or None
    if not selected and not image_bytes:
        raise HTTPException(400, "Provide an image or select at least one material.")

    result = get_classifier()(image_bytes, selected, hint_weight, filename)

    if image_bytes:
        path = UPLOAD_DIR / filename
        if path.exists():
            path.unlink()  # demo: do not retain uploads
    return result


@router.get("/guidelines")
def guidelines():
    return {"categories": GUIDELINES}


@router.get("/prices")
def prices():
    with db() as conn:
        rows = conn.execute("SELECT * FROM waste_items ORDER BY rate_per_kg DESC").fetchall()
    return {"prices": [row_dict(r) for r in rows], "note": DEMO_NOTE}
