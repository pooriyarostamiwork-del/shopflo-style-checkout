
-- ============================================================
-- Shift: Category-scoped agents, hierarchical prompts, per-category products
-- ============================================================

-- 1. Categories
CREATE TABLE public.shift_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name_fa text NOT NULL,
  products_table_name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.shift_categories TO anon, authenticated;
GRANT ALL ON public.shift_categories TO service_role;
ALTER TABLE public.shift_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active categories" ON public.shift_categories
  FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "Service role manage categories" ON public.shift_categories
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE TRIGGER shift_categories_updated_at
  BEFORE UPDATE ON public.shift_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Master prompts (per-category default, or custom for multi-cat vendors)
CREATE TABLE public.shift_master_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES public.shift_categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  is_default boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX shift_master_prompts_default_per_category
  ON public.shift_master_prompts (category_id)
  WHERE is_default = true AND category_id IS NOT NULL;
GRANT SELECT ON public.shift_master_prompts TO anon, authenticated;
GRANT ALL ON public.shift_master_prompts TO service_role;
ALTER TABLE public.shift_master_prompts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active master prompts" ON public.shift_master_prompts
  FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "Service role manage master prompts" ON public.shift_master_prompts
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE TRIGGER shift_master_prompts_updated_at
  BEFORE UPDATE ON public.shift_master_prompts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Volumes
CREATE TABLE public.shift_prompt_volumes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  master_prompt_id uuid NOT NULL REFERENCES public.shift_master_prompts(id) ON DELETE CASCADE,
  title text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX shift_prompt_volumes_master_idx ON public.shift_prompt_volumes(master_prompt_id, order_index);
GRANT SELECT ON public.shift_prompt_volumes TO anon, authenticated;
GRANT ALL ON public.shift_prompt_volumes TO service_role;
ALTER TABLE public.shift_prompt_volumes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active volumes" ON public.shift_prompt_volumes
  FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "Service role manage volumes" ON public.shift_prompt_volumes
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE TRIGGER shift_prompt_volumes_updated_at
  BEFORE UPDATE ON public.shift_prompt_volumes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Chapters
CREATE TABLE public.shift_prompt_chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  volume_id uuid NOT NULL REFERENCES public.shift_prompt_volumes(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX shift_prompt_chapters_volume_idx ON public.shift_prompt_chapters(volume_id, order_index);
GRANT SELECT ON public.shift_prompt_chapters TO anon, authenticated;
GRANT ALL ON public.shift_prompt_chapters TO service_role;
ALTER TABLE public.shift_prompt_chapters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active chapters" ON public.shift_prompt_chapters
  FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "Service role manage chapters" ON public.shift_prompt_chapters
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE TRIGGER shift_prompt_chapters_updated_at
  BEFORE UPDATE ON public.shift_prompt_chapters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Extend shift_stores
ALTER TABLE public.shift_stores
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.shift_categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS master_prompt_id uuid REFERENCES public.shift_master_prompts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS vendor_prompt text;

-- 6. Per-category products table: shift_products_pets (clone of shift_products shape)
CREATE TABLE public.shift_products_pets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.shift_stores(id) ON DELETE CASCADE,
  external_id text,
  name_fa text NOT NULL,
  description_fa text,
  price integer NOT NULL,
  original_price integer,
  image_url text,
  image_urls text[],
  category text,
  subcategory text,
  species text,
  brand text,
  tags text[],
  in_stock boolean NOT NULL DEFAULT true,
  stock_qty integer NOT NULL DEFAULT 0,
  rating numeric,
  review_count integer NOT NULL DEFAULT 0,
  specs jsonb NOT NULL DEFAULT '{}'::jsonb,
  search_vector tsvector,
  embedding public.vector(384),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX shift_products_pets_store_idx ON public.shift_products_pets(store_id);
CREATE INDEX shift_products_pets_search_idx ON public.shift_products_pets USING GIN(search_vector);
CREATE INDEX shift_products_pets_embedding_idx ON public.shift_products_pets USING hnsw (embedding public.vector_cosine_ops);
CREATE TRIGGER shift_products_pets_search_vector_update
  BEFORE INSERT OR UPDATE ON public.shift_products_pets
  FOR EACH ROW EXECUTE FUNCTION public.shift_products_search_vector_update();
CREATE TRIGGER shift_products_pets_updated_at
  BEFORE UPDATE ON public.shift_products_pets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

GRANT SELECT ON public.shift_products_pets TO anon, authenticated;
GRANT ALL ON public.shift_products_pets TO service_role;
ALTER TABLE public.shift_products_pets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read pets products in active stores" ON public.shift_products_pets
  FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.shift_stores s WHERE s.id = shift_products_pets.store_id AND s.is_active = true));
CREATE POLICY "Service role manage pets products" ON public.shift_products_pets
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 7. Hybrid search RPC for pets table (mirror of shift_hybrid_search)
CREATE OR REPLACE FUNCTION public.shift_hybrid_search_pets(
  p_store_id uuid,
  p_query text,
  p_embedding public.vector DEFAULT NULL,
  p_category text DEFAULT NULL,
  p_subcategory text DEFAULT NULL,
  p_species text DEFAULT NULL,
  p_max_price integer DEFAULT NULL,
  p_min_price integer DEFAULT NULL,
  p_in_stock boolean DEFAULT true,
  p_limit integer DEFAULT 12
)
RETURNS TABLE(
  id uuid, name_fa text, description_fa text, price integer, original_price integer,
  image_url text, image_urls text[], category text, subcategory text, species text,
  brand text, tags text[], in_stock boolean, stock_qty integer, rating numeric,
  review_count integer, specs jsonb, final_score double precision
)
LANGUAGE sql STABLE
SET search_path = public, extensions
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
  FROM public.shift_products_pets p
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

-- 8. Seed categories
INSERT INTO public.shift_categories (slug, name_fa, products_table_name)
VALUES
  ('general', 'عمومی', 'shift_products'),
  ('pets', 'حیوانات خانگی', 'shift_products_pets');

-- 9. Seed default master prompts + starter volume/chapter for each category
WITH gen_cat AS (SELECT id FROM public.shift_categories WHERE slug='general'),
     pet_cat AS (SELECT id FROM public.shift_categories WHERE slug='pets'),
     gen_mp AS (
       INSERT INTO public.shift_master_prompts (category_id, name, description, is_default)
       SELECT id, 'پرامپت پیش‌فرض دسته عمومی', 'Master prompt for general Shift stores', true FROM gen_cat
       RETURNING id
     ),
     pet_mp AS (
       INSERT INTO public.shift_master_prompts (category_id, name, description, is_default)
       SELECT id, 'پرامپت پیش‌فرض پت‌شاپ', 'Master prompt for pet stores', true FROM pet_cat
       RETURNING id
     ),
     gen_v AS (
       INSERT INTO public.shift_prompt_volumes (master_prompt_id, title, order_index)
       SELECT id, 'هویت و رفتار پایه', 0 FROM gen_mp RETURNING id
     ),
     pet_v AS (
       INSERT INTO public.shift_prompt_volumes (master_prompt_id, title, order_index)
       SELECT id, 'هویت و رفتار پایه', 0 FROM pet_mp RETURNING id
     )
INSERT INTO public.shift_prompt_chapters (volume_id, title, body, order_index)
SELECT id, 'نقش فروشنده',
'تو فروشنده و دستیار خرید این فروشگاه هستی. این یک فروشگاه تک‌فروشنده است — فقط محصولات همین فروشگاه رو پیشنهاد بده.
همیشه فارسی، لحن صمیمی، بدون مارک‌داون. قیمت‌ها به تومان.
هرگز از فروشگاه‌های دیگه یا مقایسه بین فروشگاه‌ها صحبت نکن.', 0 FROM gen_v
UNION ALL
SELECT id, 'نقش مشاور پت‌شاپ',
'تو مشاور خرید یک پت‌شاپ هستی. با گرمی و توجه به سلامت و رفاه حیوان خانگی کاربر صحبت کن.
همیشه فارسی، لحن مهربان و آگاه، بدون مارک‌داون. قیمت‌ها به تومان.
قبل از پیشنهاد، اگر لازمه گونه/سن/نژاد حیوان رو بپرس. فقط محصولات همین فروشگاه رو پیشنهاد بده.', 0 FROM pet_v;

-- 10. Assign existing stores to categories + default master prompt
UPDATE public.shift_stores s
SET category_id = c.id
FROM public.shift_categories c
WHERE s.slug = 'shift' AND c.slug = 'general';

UPDATE public.shift_stores s
SET category_id = c.id
FROM public.shift_categories c
WHERE s.slug = 'petplayground' AND c.slug = 'pets';
