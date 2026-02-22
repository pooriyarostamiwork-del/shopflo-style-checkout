
-- 1. Enable extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Add embedding column to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS embedding vector(768);

-- 3. Fix subcategory trailing slash
UPDATE public.products
SET subcategory = RTRIM(subcategory, '/')
WHERE subcategory LIKE '%/';

-- 4. Create Persian normalization function (SQL for IMMUTABLE)
CREATE OR REPLACE FUNCTION public.normalize_persian(input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public'
AS $$
  SELECT TRIM(
    regexp_replace(
      replace(
        replace(
          replace(
            replace(input, E'\u200C', ' '),
            'ي', 'ی'
          ),
          'ك', 'ک'
        ),
        E'\u0640', ''
      ),
      '\s+', ' ', 'g'
    )
  );
$$;

-- 5. Update search_vector trigger with Persian normalization
CREATE OR REPLACE FUNCTION public.products_search_vector_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.search_vector :=
    to_tsvector('simple', normalize_persian(coalesce(NEW.name, ''))) ||
    to_tsvector('simple', normalize_persian(coalesce(NEW.description, ''))) ||
    to_tsvector('simple', normalize_persian(coalesce(NEW.brand, ''))) ||
    to_tsvector('simple', normalize_persian(coalesce(NEW.category, ''))) ||
    to_tsvector('simple', normalize_persian(coalesce(NEW.subcategory, ''))) ||
    to_tsvector('simple', normalize_persian(array_to_string(coalesce(NEW.tags, '{}'), ' ')));
  RETURN NEW;
END;
$$;

-- 6. Create trigger
DROP TRIGGER IF EXISTS products_search_vector_trigger ON public.products;
CREATE TRIGGER products_search_vector_trigger
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.products_search_vector_update();

-- 7. Re-generate search_vector for all products
UPDATE public.products SET name = name;

-- 8. Create trigram index on name
CREATE INDEX IF NOT EXISTS idx_products_name_trgm
ON public.products USING GIN(name gin_trgm_ops);

-- 9. Create hybrid_product_search SQL function
CREATE OR REPLACE FUNCTION public.hybrid_product_search(
  p_query text,
  p_embedding vector(768) DEFAULT NULL,
  p_subcategory text DEFAULT NULL,
  p_max_price numeric DEFAULT NULL,
  p_min_price numeric DEFAULT NULL,
  p_min_rating numeric DEFAULT NULL,
  p_brand text DEFAULT NULL,
  p_in_stock boolean DEFAULT true
)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  price integer,
  original_price integer,
  rating numeric,
  image_url text,
  image_urls text[],
  brand text,
  category text,
  subcategory text,
  tags text[],
  in_stock boolean,
  fast_delivery boolean,
  return_guarantee boolean,
  review_count integer,
  reviews_summary text,
  merchant_id text,
  specs jsonb,
  source_url text,
  final_score double precision
)
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
  SELECT
    p.id,
    p.name,
    p.description,
    p.price,
    p.original_price,
    p.rating,
    p.image_url,
    p.image_urls,
    p.brand,
    p.category,
    p.subcategory,
    p.tags,
    p.in_stock,
    p.fast_delivery,
    p.return_guarantee,
    p.review_count,
    p.reviews_summary,
    p.merchant_id,
    p.specs,
    p.source_url,
    (
      COALESCE(ts_rank(
        p.search_vector,
        websearch_to_tsquery('simple', normalize_persian(p_query))
      ), 0) * 0.35
      +
      COALESCE(similarity(p.name, normalize_persian(p_query)), 0) * 0.25
      +
      COALESCE(similarity(array_to_string(COALESCE(p.tags, '{}'), ' '), normalize_persian(p_query)), 0) * 0.25
      +
      (CASE
        WHEN p_subcategory IS NOT NULL AND p.subcategory = p_subcategory THEN 1.0
        ELSE 0.0
      END) * 0.15
    ) AS final_score
  FROM products p
  WHERE
    (p_in_stock IS NULL OR p.in_stock = p_in_stock)
    AND (p_subcategory IS NULL OR p.subcategory = p_subcategory)
    AND (p_max_price IS NULL OR p.price <= p_max_price)
    AND (p_min_price IS NULL OR p.price >= p_min_price)
    AND (p_min_rating IS NULL OR p.rating >= p_min_rating)
    AND (p_brand IS NULL OR p.brand ILIKE '%' || p_brand || '%')
  ORDER BY final_score DESC
  LIMIT 20;
$$;
