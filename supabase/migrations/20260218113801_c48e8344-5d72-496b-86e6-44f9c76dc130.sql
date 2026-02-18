
-- 1. Profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone text UNIQUE NOT NULL,
  full_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. User addresses table
CREATE TABLE public.user_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  full_address text NOT NULL DEFAULT '',
  recipient_name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own addresses" ON public.user_addresses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own addresses" ON public.user_addresses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own addresses" ON public.user_addresses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own addresses" ON public.user_addresses FOR DELETE USING (auth.uid() = user_id);

-- 3. Baskets table
CREATE TABLE public.baskets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'سبد خرید',
  status text NOT NULL DEFAULT 'active',
  cart_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  agentic_state jsonb DEFAULT '{}'::jsonb,
  selected_address_id uuid,
  shipping_selections jsonb DEFAULT '{}'::jsonb,
  last_activity timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.baskets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own baskets" ON public.baskets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own baskets" ON public.baskets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own baskets" ON public.baskets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own baskets" ON public.baskets FOR DELETE USING (auth.uid() = user_id);

-- 4. Orders table
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_number text NOT NULL,
  status text NOT NULL DEFAULT 'processing',
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  merchant_groups jsonb DEFAULT '[]'::jsonb,
  delivery_address jsonb DEFAULT '{}'::jsonb,
  payment_method text DEFAULT '',
  subtotal integer NOT NULL DEFAULT 0,
  total_shipping integer NOT NULL DEFAULT 0,
  total_discount integer NOT NULL DEFAULT 0,
  total integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. OTP codes table (internal, no RLS - accessed via service role only)
CREATE TABLE public.otp_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  code text NOT NULL,
  expires_at timestamptz NOT NULL,
  used boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- No RLS on otp_codes - only accessed by edge functions via service role

-- 6. Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Indexes
CREATE INDEX idx_baskets_user_status ON public.baskets(user_id, status);
CREATE INDEX idx_baskets_last_activity ON public.baskets(last_activity);
CREATE INDEX idx_orders_user ON public.orders(user_id);
CREATE INDEX idx_otp_codes_phone ON public.otp_codes(phone, used);
CREATE INDEX idx_user_addresses_user ON public.user_addresses(user_id);
