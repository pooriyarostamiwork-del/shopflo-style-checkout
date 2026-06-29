export interface ShiftStore {
  id: string;
  slug: string;
  name_fa: string;
  tagline_fa: string | null;
  logo_url: string | null;
  hero_image_url: string | null;
  theme_primary: string;
  theme_accent: string;
  currency: string;
  suggested_prompts: string[];
  is_active: boolean;
}

export interface ShiftProduct {
  id: string;
  store_id: string;
  name_fa: string;
  description_fa: string | null;
  price: number;
  original_price: number | null;
  image_url: string | null;
  image_urls: string[];
  category: string | null;
  subcategory: string | null;
  species: string | null;
  brand: string | null;
  tags: string[];
  in_stock: boolean;
  stock_qty: number;
  rating: number;
  review_count: number;
  specs: Record<string, unknown>;
}

export interface ShiftCartItem {
  product_id: string;
  name_fa: string;
  price: number;
  image_url: string | null;
  qty: number;
}

export interface ShiftAddress {
  full_name: string;
  phone: string;
  province: string;
  city: string;
  address_line: string;
  postal_code: string;
}

export interface ShiftOrder {
  id: string;
  store_id: string;
  items: ShiftCartItem[];
  subtotal: number;
  shipping_cost: number;
  total: number;
  address: ShiftAddress;
  shipping_method: string | null;
  payment_method: string | null;
  status: string;
  created_at: string;
}
