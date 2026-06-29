
-- ============================================================
-- /shift tables: multi-instance single-merchant storefront
-- ============================================================

-- 1. STORES
CREATE TABLE public.shift_stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name_fa TEXT NOT NULL,
  tagline_fa TEXT,
  logo_url TEXT,
  hero_image_url TEXT,
  theme_primary TEXT NOT NULL DEFAULT '262 47% 60%',
  theme_accent TEXT NOT NULL DEFAULT '262 47% 60%',
  currency TEXT NOT NULL DEFAULT 'IRT',
  suggested_prompts JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.shift_stores TO anon, authenticated;
GRANT ALL ON public.shift_stores TO service_role;
ALTER TABLE public.shift_stores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shift_stores_public_read" ON public.shift_stores FOR SELECT USING (true);

-- 2. PRODUCTS
CREATE TABLE public.shift_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.shift_stores(id) ON DELETE CASCADE,
  external_id TEXT,
  name_fa TEXT NOT NULL,
  description_fa TEXT,
  price INTEGER NOT NULL DEFAULT 0,
  original_price INTEGER,
  image_url TEXT,
  image_urls TEXT[] DEFAULT '{}',
  category TEXT,
  subcategory TEXT,
  species TEXT,
  brand TEXT,
  tags TEXT[] DEFAULT '{}',
  in_stock BOOLEAN NOT NULL DEFAULT true,
  stock_qty INTEGER NOT NULL DEFAULT 0,
  rating NUMERIC(3,2) DEFAULT 0,
  review_count INTEGER NOT NULL DEFAULT 0,
  specs JSONB NOT NULL DEFAULT '{}'::jsonb,
  search_vector tsvector,
  embedding vector(384),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (store_id, external_id)
);

GRANT SELECT ON public.shift_products TO anon, authenticated;
GRANT ALL ON public.shift_products TO service_role;
ALTER TABLE public.shift_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shift_products_public_read" ON public.shift_products FOR SELECT USING (true);

CREATE INDEX shift_products_store_idx ON public.shift_products(store_id);
CREATE INDEX shift_products_search_idx ON public.shift_products USING gin(search_vector);
CREATE INDEX shift_products_name_trgm_idx ON public.shift_products USING gin(name_fa gin_trgm_ops);
CREATE INDEX shift_products_embedding_idx ON public.shift_products USING hnsw (embedding vector_cosine_ops);

-- Search vector trigger
CREATE OR REPLACE FUNCTION public.shift_products_search_vector_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.search_vector :=
    to_tsvector('simple', normalize_persian(coalesce(NEW.name_fa, ''))) ||
    to_tsvector('simple', normalize_persian(coalesce(NEW.description_fa, ''))) ||
    to_tsvector('simple', normalize_persian(coalesce(NEW.brand, ''))) ||
    to_tsvector('simple', normalize_persian(coalesce(NEW.category, ''))) ||
    to_tsvector('simple', normalize_persian(coalesce(NEW.subcategory, ''))) ||
    to_tsvector('simple', normalize_persian(coalesce(NEW.species, ''))) ||
    to_tsvector('simple', normalize_persian(array_to_string(coalesce(NEW.tags, '{}'), ' ')));
  RETURN NEW;
END;
$$;

CREATE TRIGGER shift_products_search_vector_trigger
BEFORE INSERT OR UPDATE ON public.shift_products
FOR EACH ROW EXECUTE FUNCTION public.shift_products_search_vector_update();

CREATE TRIGGER shift_products_updated_at
BEFORE UPDATE ON public.shift_products
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER shift_stores_updated_at
BEFORE UPDATE ON public.shift_stores
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. CARTS
CREATE TABLE public.shift_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.shift_stores(id) ON DELETE CASCADE,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, store_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.shift_carts TO authenticated;
GRANT ALL ON public.shift_carts TO service_role;
ALTER TABLE public.shift_carts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shift_carts_own" ON public.shift_carts FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER shift_carts_updated_at
BEFORE UPDATE ON public.shift_carts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. ORDERS
CREATE TABLE public.shift_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.shift_stores(id) ON DELETE CASCADE,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal INTEGER NOT NULL DEFAULT 0,
  shipping_cost INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0,
  address JSONB NOT NULL DEFAULT '{}'::jsonb,
  shipping_method TEXT,
  payment_method TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.shift_orders TO authenticated;
GRANT ALL ON public.shift_orders TO service_role;
ALTER TABLE public.shift_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shift_orders_own_read" ON public.shift_orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "shift_orders_own_insert" ON public.shift_orders FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX shift_orders_user_idx ON public.shift_orders(user_id, created_at DESC);

-- 5. HYBRID SEARCH FUNCTION
CREATE OR REPLACE FUNCTION public.shift_hybrid_search(
  p_store_id UUID,
  p_query TEXT,
  p_embedding vector DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_subcategory TEXT DEFAULT NULL,
  p_species TEXT DEFAULT NULL,
  p_max_price INTEGER DEFAULT NULL,
  p_min_price INTEGER DEFAULT NULL,
  p_in_stock BOOLEAN DEFAULT TRUE,
  p_limit INTEGER DEFAULT 12
)
RETURNS TABLE (
  id UUID, name_fa TEXT, description_fa TEXT, price INTEGER, original_price INTEGER,
  image_url TEXT, image_urls TEXT[], category TEXT, subcategory TEXT, species TEXT,
  brand TEXT, tags TEXT[], in_stock BOOLEAN, stock_qty INTEGER, rating NUMERIC,
  review_count INTEGER, specs JSONB, final_score DOUBLE PRECISION
)
LANGUAGE sql STABLE
SET search_path TO 'public'
AS $$
  SELECT
    p.id, p.name_fa, p.description_fa, p.price, p.original_price,
    p.image_url, p.image_urls, p.category, p.subcategory, p.species,
    p.brand, p.tags, p.in_stock, p.stock_qty, p.rating, p.review_count, p.specs,
    (
      COALESCE(ts_rank(p.search_vector, websearch_to_tsquery('simple', normalize_persian(coalesce(p_query,'')))), 0) * 0.35
      + COALESCE(similarity(p.name_fa, normalize_persian(coalesce(p_query,''))), 0) * 0.25
      + COALESCE(similarity(array_to_string(COALESCE(p.tags, '{}'), ' '), normalize_persian(coalesce(p_query,''))), 0) * 0.10
      + (CASE WHEN p_embedding IS NOT NULL AND p.embedding IS NOT NULL
             THEN GREATEST(1.0 - (p.embedding <=> p_embedding), 0) * 0.30 ELSE 0 END)
    )::DOUBLE PRECISION AS final_score
  FROM public.shift_products p
  WHERE p.store_id = p_store_id
    AND (p_in_stock IS NULL OR p.in_stock = p_in_stock)
    AND (p_category IS NULL OR p.category = p_category)
    AND (p_subcategory IS NULL OR p.subcategory = p_subcategory)
    AND (p_species IS NULL OR p.species = p_species)
    AND (p_max_price IS NULL OR p.price <= p_max_price)
    AND (p_min_price IS NULL OR p.price >= p_min_price)
  ORDER BY final_score DESC
  LIMIT p_limit;
$$;

-- 6. SEED two store instances
INSERT INTO public.shift_stores (slug, name_fa, tagline_fa, theme_primary, theme_accent, suggested_prompts) VALUES
  ('raw', 'فروشگاه شیفت',
   'فروشگاه هوشمند شما',
   '220 70% 50%', '220 70% 50%',
   '["محصولات پرفروش رو نشونم بده", "تخفیف‌های امروز چیه؟", "یه پیشنهاد خوب بهم بده"]'::jsonb),
  ('petplayground', 'پت‌پلی‌گراند',
   'همه‌چیز برای حیوون خونگی شما',
   '24 90% 55%', '170 60% 45%',
   '["غذای خشک گربه پیشنهاد بده", "اسباب‌بازی برای توله سگ", "لوازم آکواریوم نشونم بده", "غذای پرنده چی خوبه؟"]'::jsonb);
