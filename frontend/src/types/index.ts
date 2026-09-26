/** Shared domain types mirroring the backend API. */

export type Role = 'customer' | 'collector' | 'recycler' | 'admin';

export type PickupStatus =
  | 'pending' | 'accepted' | 'on_the_way' | 'collected' | 'completed' | 'cancelled';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  phone?: string | null;
  address?: string | null;
  zone?: string | null;
  lat?: number | null;
  lng?: number | null;
  language?: string;
  business_name?: string | null;
  rating?: number | null;
  completed_pickups?: number;
  vehicle?: string | null;
  available?: number;
  materials?: string | null;
  kg_collected?: number;
  earnings?: number;
}

export interface WasteMaterial {
  category: string;
  name: string;
  rate: number;
  co2: number;
  icon: string;
}

export interface EstimateLine {
  category: string;
  name: string;
  weight: number;
  rate: number;
  value: number;
}

export interface ValueEstimate {
  lines: EstimateLine[];
  total_weight: number;
  total_value: number;
  disclaimer: string;
}

export interface AiAnalysis {
  engine: string;
  notice: string;
  items: EstimateLine[];
  total_weight: number;
  value_min: number;
  value_max: number;
  confidence: number;
}

export interface PickupItem {
  id?: number;
  pickup_id?: number;
  category: string;
  estimated_weight: number;
  actual_weight?: number | null;
  rate_per_kg: number;
  amount?: number | null;
}

export interface Pickup {
  id: number;
  code: string;
  customer_id: number;
  collector_id?: number | null;
  status: PickupStatus;
  address: string;
  zone?: string | null;
  lat?: number | null;
  lng?: number | null;
  estimated_weight?: number | null;
  actual_weight?: number | null;
  estimated_value_min?: number | null;
  estimated_value_max?: number | null;
  final_value?: number | null;
  payment_method?: string | null;
  notes?: string | null;
  ai_confidence?: number | null;
  created_at: string;
  accepted_at?: string | null;
  completed_at?: string | null;
  customer_name?: string;
  customer_phone?: string | null;
  collector_name?: string | null;
  business_name?: string | null;
  items: PickupItem[];
  recycler_name?: string | null;
}

export interface CollectorCard {
  collector_id: number;
  name: string;
  owner: string;
  zone: string;
  distance_km: number;
  rating: number;
  completed_pickups: number;
  available: boolean;
  materials: string[];
  vehicle: string;
  eta_minutes?: number | null;
  score: number;
}

export interface Receipt {
  brand: string;
  pickup: { id: number; code: string; status: string; address: string; date: string };
  customer: { name: string; phone: string; address: string };
  collector: { name: string; phone: string };
  lines: { category: string; name: string; weight: number; rate: number; amount: number }[];
  totals: { weight: number; amount: number; payment_method: string };
  receipt_code: string;
  tagline: string;
  note: string;
}

export interface AuthSession {
  token: string;
  user: User;
}

export interface Notification {
  id: number;
  title: string;
  body?: string;
  kind: string;
  read: number;
  created_at: string;
}

export interface ImpactTotals {
  weight_kg: number;
  co2_kg: number;
  water_l: number;
  energy_kwh: number;
}

export interface ImpactResponse {
  totals: ImpactTotals & { waste_diverted_kg: number; optimized_trips: number };
  platform?: {
    completed_pickups: number;
    verified_collectors: number;
    households: number;
    collector_earnings: number;
  };
  by_material: { category: string; weight: number; co2_avoided?: number }[];
  methodology: string;
  estimated: boolean;
}

export interface Analytics {
  kpi: {
    total_users: number;
    customers: number;
    collectors: number;
    recyclers: number;
    active_collectors: number;
    total_pickups: number;
    waste_diverted_kg: number;
    co2_avoided_kg: number;
    collector_earnings: number;
    recycling_rate: number;
  };
  pickup_status: Record<string, number>;
  material_mix: { category: string; weight: number }[];
  daily_transactions: { date: string; count: number; value: number }[];
  zone_demand: { zone: string; pickups: number }[];
}

export interface RoutePlan {
  stops: {
    id: number; code: string; address: string; zone: string;
    lat: number; lng: number; estimated_weight: number;
  }[];
  distance_km: number;
  naive_distance_km: number;
  saved_km: number;
  saved_minutes: number;
  center: { name: string; zone: string; lat: number; lng: number } | null;
  engine: string;
}

export interface CollectorStats {
  completed_pickups: number;
  weight_collected_kg: number;
  lifetime_earnings: number;
  active_pickups: number;
  pending_in_zone: number;
  month_earnings: number;
  month_weight_kg: number;
  today_earnings: number;
  today_weight_kg: number;
  today_pickups: number;
  avg_daily_kg: number;
  avg_rating: number;
  materials_breakdown: { category: string; weight: number }[];
  daily: { date: string; value: number; weight: number }[];
}

export interface RecyclerOverview {
  material_totals: Record<string, number>;
  month_weight_kg: number;
  month_batches: number;
  weekly: { date: string; weight: number }[];
  flow: { collected: number; sorted: number; processed: number; recycled: number };
  incoming: Pickup[];
  centers: { id: number; name: string; zone: string; lat: number; lng: number }[];
}

export interface PresentationData {
  headline: string;
  kpi: {
    waste_diverted_kg: number;
    pickups: number;
    collectors: number;
    earnings: number;
    co2_avoided_kg: number;
  };
  material_mix: { category: string; weight: number }[];
}
