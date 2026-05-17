export type Category =
  | "한식"
  | "중식"
  | "일식"
  | "양식"
  | "카페"
  | "술집"
  | "기타";

export interface Restaurant {
  id: string;
  user_id: string;
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  category: Category | null;
  rating: number | null;
  note: string | null;
  is_favorite: boolean;
  created_at: string;
  images?: RestaurantImage[];
  visits?: Visit[];
}

export interface RestaurantImage {
  id: string;
  restaurant_id: string;
  storage_path: string;
  is_primary: boolean;
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
