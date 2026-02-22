
-- Change embedding column from 768 to 384 dimensions (for gte-small model)
ALTER TABLE public.products DROP COLUMN IF EXISTS embedding;
ALTER TABLE public.products ADD COLUMN embedding vector(384);

-- Recreate hybrid_product_search with embedding support (384 dims)
CREATE OR REPLACE FUNCTION public.hybrid_product_search(
  p_query text,
  p_embedding vector(384) DEFAULT NULL,
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
      -- Full-text rank (weight depends on whether embeddings available)
      COALESCE(ts_rank(
        p.search_vector,
        websearch_to_tsquery('simple', normalize_persian(p_query))
      ), 0) * (CASE WHEN p_embedding IS NOT NULL THEN 0.30 ELSE 0.35 END)
      +
      -- Trigram similarity on name
      COALESCE(similarity(p.name, normalize_persian(p_query)), 0) * 0.20
      +
      -- Trigram similarity on tags
      COALESCE(similarity(array_to_string(COALESCE(p.tags, '{}'), ' '), normalize_persian(p_query)), 0) * 0.10
      +
      -- Vector similarity (when available)
      (CASE
        WHEN p_embedding IS NOT NULL AND p.embedding IS NOT NULL
        THEN GREATEST(1.0 - (p.embedding <=> p_embedding), 0) * 0.30
        ELSE 0.0
      END)
      +
      -- Structured match boost: subcategory
      (CASE
        WHEN p_subcategory IS NOT NULL AND p.subcategory = p_subcategory THEN 1.0
        ELSE 0.0
      END) * (CASE WHEN p_embedding IS NOT NULL THEN 0.10 ELSE 0.15 END)
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
