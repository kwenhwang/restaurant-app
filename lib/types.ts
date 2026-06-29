export type Category =
  | "한식"
  | "중식"
  | "일식"
  | "양식"
  | "카페"
  | "술집"
  | "기타";

/** Business hours per weekday (24h, "HH:MM-HH:MM" or "휴무"). */
export type BusinessHours = Partial<Record<
  "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun",
  string
>>;

export interface MenuItem {
  name: string;
  price: string | null;
}

export interface MenuData {
  items: MenuItem[];
  price_range: string | null;
  summary: string | null;
  source: "ai-vision" | "manual" | "ai-search";
}

export interface Restaurant {
  id: string;
  user_id: string;
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  category: Category | null;
  note: string | null;
  is_favorite: boolean;
  created_at: string;

  // v2: Kakao Place cache
  phone: string | null;
  place_url: string | null;
  kakao_place_id: string | null;
  business_hours: BusinessHours | null;
  place_synced_at: string | null;

  // AI-extracted menu
  menu?: MenuData | null;

  // v2: relations
  tags?: string[];
  images?: RestaurantImage[];
  visits?: Visit[];
}

export interface RestaurantImage {
  id: string;
  restaurant_id: string;
  storage_path: string;
  is_primary: boolean;
  /** Tiny base64 JPEG (~150 bytes) for <Image placeholder="blur">. Null on legacy rows. */
  blur_data_url?: string | null;
}

export interface Visit {
  id: string;
  user_id: string;
  restaurant_id: string;
  visited_at: string;
  memo: string | null;
  created_at: string;
  restaurant?: Pick<Restaurant, "id" | "name" | "category">;
}

/** Aggregated visit info per restaurant (derived). */
export interface VisitRollup {
  visit_count: number;
  last_visit: string | null;
}
