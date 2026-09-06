CREATE OR REPLACE FUNCTION public.pet_hybrid_search(
  p_store_id uuid DEFAULT NULL::uuid,
  p_query text DEFAULT NULL::text,
  p_embedding vector DEFAULT NULL::vector,
  p_category text DEFAULT NULL::text,
  p_subcategory text DEFAULT NULL::text,
  p_species text DEFAULT NULL::text,
  p_brand text DEFAULT NULL::text,
  p_max_price integer DEFAULT NULL::integer,
  p_min_price integer DEFAULT NULL::integer,
  p_in_stock boolean DEFAULT true,
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  name_fa text,
  description_fa text,
  price integer,
  original_price integer,
  image_url text,
  image_urls text[],
  category text,
  subcategory text,
  species text,
  brand text,
  origin_country text,
  weight text,
  specs jsonb,
  tags text[],
  in_stock boolean,
  stock_qty integer,
  rating numeric,
  review_count integer,
  final_score double precision,
  matched_total integer
)
LANGUAGE sql
STABLE
SET search_path = public, extensions
AS $$
  WITH keys AS (
    SELECT CASE WHEN p_brand IS NULL OR btrim(p_brand) = '' THEN NULL
                ELSE public.brand_match_keys(p_brand) END AS bk
  ),
  filtered AS (
    SELECT p.*,
      (
        COALESCE(ts_rank(p.search_vector, websearch_to_tsquery('simple', normalize_persian(coalesce(p_query,'')))), 0)
          * (CASE WHEN p_embedding IS NOT NULL THEN 0.30 ELSE 0.35 END)
        + COALESCE(similarity(p.name, normalize_persian(coalesce(p_query,''))), 0) * 0.20
        + COALESCE(similarity(array_to_string(COALESCE(p.tags, '{}'), ' '), normalize_persian(coalesce(p_query,''))), 0) * 0.10
        + (CASE WHEN p_embedding IS NOT NULL AND p.embedding IS NOT NULL
                THEN GREATEST(1.0 - (p.embedding <=> p_embedding), 0) * 0.30 ELSE 0.0 END)
        + (CASE WHEN p_subcategory IS NOT NULL AND p.subcategory = p_subcategory THEN 1.0 ELSE 0.0 END)
          * (CASE WHEN p_embedding IS NOT NULL THEN 0.10 ELSE 0.15 END)
      )::double precision AS score
    FROM pet_products p, keys k
    WHERE (p_in_stock IS NULL OR p.in_stock = p_in_stock)
      AND (p_category IS NULL OR p.category = p_category)
      AND (p_subcategory IS NULL OR p.subcategory = p_subcategory)
      AND (p_species IS NULL OR p.species ILIKE '%' || p_species || '%')
      AND (p_max_price IS NULL OR p.price <= p_max_price)
      AND (p_min_price IS NULL OR p.price >= p_min_price)
      AND (k.bk IS NULL OR public.brand_key(p.brand) = ANY(k.bk))
  )
  SELECT f.id, f.name AS name_fa, f.description AS description_fa, f.price, f.original_price,
         f.image_url, f.image_urls, f.category, f.subcategory, f.species, f.brand,
         f.origin_country, f.weight, f.specs, f.tags, f.in_stock, 0 AS stock_qty, f.rating, f.review_count,
         f.score AS final_score,
         (SELECT count(*)::int FROM filtered) AS matched_total
  FROM filtered f
  ORDER BY f.score DESC, f.rating DESC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 20), 1), 60)
  OFFSET GREATEST(COALESCE(p_offset, 0), 0);
$$;