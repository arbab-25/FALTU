"""Pydantic request/response models."""
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator

Role = str  # 'customer' | 'collector' | 'recycler' | 'admin' (validated at use sites)


class LoginRequest(BaseModel):
    email: str = Field(min_length=3, max_length=200)
    password: str = Field(min_length=1, max_length=200)


class TokenResponse(BaseModel):
    token: str
    user: dict


class WasteItemIn(BaseModel):
    category: str = Field(min_length=1, max_length=40)
    weight: float = Field(gt=0, le=500)
    note: Optional[str] = Field(default=None, max_length=200)


class AnalyzeRequest(BaseModel):
    """Payload sent together with (or instead of) an uploaded image."""

    categories: List[str] = Field(default_factory=list)
    hint_weight: Optional[float] = Field(default=None, gt=0, le=500)
    location: Optional[str] = Field(default=None, max_length=120)

    @field_validator("categories")
    @classmethod
    def cap_items(cls, v):
        return v[:12]


class EstimateRequest(BaseModel):
    items: List[WasteItemIn] = Field(min_length=1, max_length=20)


class PickupItemIn(BaseModel):
    category: str = Field(min_length=1, max_length=40)
    weight: float = Field(gt=0, le=500)


class PickupCreate(BaseModel):
    categories: List[str] = Field(min_length=1, max_length=8)
    weights: Optional[List[float]] = None
    total_weight: Optional[float] = Field(default=None, gt=0, le=2000)
    address: str = Field(min_length=4, max_length=300)
    zone: Optional[str] = Field(default=None, max_length=80)
    notes: Optional[str] = Field(default=None, max_length=500)
    estimated_value_min: Optional[float] = Field(default=None, ge=0)
    estimated_value_max: Optional[float] = Field(default=None, ge=0)
    image_path: Optional[str] = Field(default=None, max_length=200)
    ai_confidence: Optional[float] = Field(default=None, ge=0, le=1)

    @field_validator("categories")
    @classmethod
    def cap_items(cls, v):
        return v[:8]


class PickupCompleteItem(BaseModel):
    category: str
    actual_weight: float = Field(gt=0, le=500)
    rate_per_kg: float = Field(ge=0, le=10000)


class PickupComplete(BaseModel):
    items: List[PickupCompleteItem] = Field(min_length=1, max_length=20)
    payment_method: str = Field(pattern="^(Cash|UPI|Digital)$")
    recycler_id: Optional[int] = None


class PickupStatusUpdate(BaseModel):
    status: str = Field(pattern="^(accepted|on_the_way|collected|cancelled)$")


class RecommendationRequest(BaseModel):
    pickup_id: Optional[int] = None
    categories: List[str] = Field(default_factory=list)
    zone: Optional[str] = None


class RouteOptimizeRequest(BaseModel):
    pickup_ids: List[int] = Field(min_length=2, max_length=12)


class RateRequest(BaseModel):
    pickup_id: int
    stars: int = Field(ge=1, le=5)
    comment: Optional[str] = Field(default=None, max_length=400)
