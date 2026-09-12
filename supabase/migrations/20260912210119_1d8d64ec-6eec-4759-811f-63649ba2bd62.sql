DROP FUNCTION IF EXISTS public.pet_hybrid_search(uuid, text, vector, text, text, text, text, text, text, text, text, text, text[], text[], text, integer, integer, boolean, boolean, integer, integer);

CREATE OR REPLACE FUNCTION public.pet_hybrid_search(
  p_store_id uuid DEFAULT NULL::uuid,
  p_query text DEFAULT NULL::text,
  p_embedding vector DEFAULT NULL::vector,
  p_category text DEFAULT NULL::text,
  p_subcategory text DEFAULT NULL::text,
  p_subcategory_prefix text DEFAULT NULL::text,
  p_species text DEFAULT NULL::text,
  p_brand text DEFAULT NULL::text,
  p_origin_country text DEFAULT NULL::text,
  p_product_line text DEFAULT NULL::text,
  p_life_stage text DEFAULT NULL::text,
  p_breed_size text DEFAULT NULL::text,
  p_needs text[] DEFAULT NULL::text[],
  p_product_types text[] DEFAULT NULL::text[],
  p_type_group text DEFAULT NULL::text,
  p_max_price integer DEFAULT NULL::integer,
  p_min_price integer DEFAULT NULL::integer,
  p_in_stock boolean DEFAULT true,
  p_diversify boolean DEFAULT true,
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0,
  p_exclude_brands text[] DEFAULT NULL::text[],
  p_foreign_only boolean DEFAULT NULL::boolean,
  p_brand_cap integer DEFAULT NULL::integer
)
RETURNS TABLE(id uuid, name_fa text, description_fa text, price integer, original_price integer, image_url text, image_urls text[], category text, subcategory text, species text, brand text, origin_country text, weight text, life_stage text, breed_size text, product_line text, health_needs text[], product_type text, type_group text, specs jsonb, tags text[], in_stock boolean, stock_qty integer, rating numeric, review_count integer, final_score double precision, matched_total integer)
LANGUAGE sql
STABLE
SET search_path TO 'public', 'extensions'
AS $function$
  WITH keys AS (
    SELECT CASE WHEN p_brand IS NULL OR btrim(p_brand) = '' THEN NULL
                ELSE public.brand_match_keys(p_brand) END AS bk
  ),
  excl AS (
    SELECT COALESCE((
      SELECT array_agg(DISTINCT k)
      FROM unnest(COALESCE(p_exclude_brands, ARRAY[]::text[])) AS b,
           unnest(public.brand_match_keys(b)) AS k
    ), ARRAY[]::text[]) AS xk
  ),
  filtered AS (
    SELECT p.*,
      (
        COALESCE(ts_rank(p.search_vector, websearch_to_tsquery('simple', public.normalize_persian(coalesce(p_query,'')))), 0)
          * (CASE WHEN p_embedding IS NOT NULL THEN 0.26 ELSE 0.32 END)
        + COALESCE(similarity(p.name, public.normalize_persian(coalesce(p_query,''))), 0) * 0.18
        + COALESCE(similarity(array_to_string(COALESCE(p.tags, '{}'), ' '), public.normalize_persian(coalesce(p_query,''))), 0) * 0.08
        + (CASE WHEN p_embedding IS NOT NULL AND p.embedding IS NOT NULL
                THEN GREATEST(1.0 - (p.embedding <=> p_embedding), 0) * 0.28 ELSE 0.0 END)
        + (CASE WHEN p_subcategory IS NOT NULL AND p.subcategory = p_subcategory THEN 0.12 ELSE 0.0 END)
        + (CASE WHEN p_product_types IS NOT NULL AND p.product_type = ANY(p_product_types) THEN 0.14 ELSE 0.0 END)
        + (CASE WHEN p_life_stage IS NOT NULL AND p.life_stage = p_life_stage THEN 0.14
                WHEN p_life_stage IS NOT NULL AND p.life_stage IS NOT NULL AND p.life_stage <> p_life_stage THEN -0.20
                ELSE 0.0 END)
        + (CASE WHEN p_breed_size IS NOT NULL AND p.breed_size = p_breed_size THEN 0.12
                WHEN p_breed_size IS NOT NULL AND p.breed_size IS NOT NULL AND p.breed_size <> p_breed_size THEN -0.08
                ELSE 0.0 END)
        + (CASE WHEN p_needs IS NOT NULL AND array_length(p_needs,1) IS NOT NULL
                     AND p.health_needs && p_needs THEN 0.16 ELSE 0.0 END)
      )::double precision AS score
    FROM pet_products p, keys k, excl e
    WHERE (p_in_stock IS NULL OR p.in_stock = p_in_stock)
      AND (p_category IS NULL OR p.category = p_category)
      AND (p_subcategory IS NULL OR p.subcategory = p_subcategory)
      AND (p_subcategory_prefix IS NULL
           OR public.normalize_persian(coalesce(p.subcategory,'')) ILIKE public.normalize_persian(p_subcategory_prefix) || '%')
      AND (p_product_types IS NULL OR array_length(p_product_types,1) IS NULL OR p.product_type = ANY(p_product_types))
      AND (p_type_group IS NULL OR p.type_group = p_type_group)
      AND (p_species IS NULL OR p.species ILIKE '%' || p_species || '%')
      AND (p_origin_country IS NULL
           OR public.normalize_persian(coalesce(p.origin_country,'')) ILIKE '%' || public.normalize_persian(p_origin_country) || '%')
      AND (p_foreign_only IS NULL
           OR (p_foreign_only IS TRUE AND p.origin_country IS NOT NULL AND btrim(p.origin_country) <> ''
               AND public.normalize_persian(p.origin_country) NOT ILIKE '%ایران%')
           OR (p_foreign_only IS FALSE AND public.normalize_persian(coalesce(p.origin_country,'')) ILIKE '%ایران%'))
      AND (array_length(e.xk, 1) IS NULL OR NOT (public.brand_key(p.brand) = ANY(e.xk)))
      AND (p_product_line IS NULL
           OR public.normalize_persian(coalesce(p.name,'') || ' ' || coalesce(p.product_line,''))
              ILIKE '%' || public.normalize_persian(p_product_line) || '%')
      AND (p_max_price IS NULL OR p.price <= p_max_price)
      AND (p_min_price IS NULL OR p.price >= p_min_price)
      AND (k.bk IS NULL OR public.brand_key(p.brand) = ANY(k.bk))
  ),
  ranked AS (
    SELECT f.*,
      row_number() OVER (
        PARTITION BY coalesce(lower(f.product_line), coalesce(f.brand,'') || coalesce(f.subcategory,''))
        ORDER BY f.score DESC, f.rating DESC
      ) AS line_rank,
      row_number() OVER (
        PARTITION BY public.brand_key(f.brand)
        ORDER BY f.score DESC, f.rating DESC
      ) AS brand_rank
    FROM filtered f
  ),
  picked AS (
    SELECT * FROM ranked
    WHERE (p_diversify IS NOT TRUE OR p_product_line IS NOT NULL OR line_rank <= 2)
      AND (p_brand_cap IS NULL OR p_brand IS NOT NULL OR brand_rank <= p_brand_cap)
  )
  SELECT f.id, f.name AS name_fa, f.description AS description_fa, f.price, f.original_price,
         f.image_url, f.image_urls, f.category, f.subcategory, f.species, f.brand,
         f.origin_country, f.weight, f.life_stage, f.breed_size, f.product_line,
         f.health_needs, f.product_type, f.type_group, f.specs, f.tags, f.in_stock, 0 AS stock_qty, f.rating, f.review_count,
         f.score AS final_score,
         (SELECT count(*)::int FROM filtered) AS matched_total
  FROM picked f
  ORDER BY f.score DESC, f.rating DESC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 20), 1), 60)
  OFFSET GREATEST(COALESCE(p_offset, 0), 0);
$function$;

DROP FUNCTION IF EXISTS public.pet_question_facets(text, text, text, text, text, text, text, boolean);

CREATE OR REPLACE FUNCTION public.pet_question_facets(
  p_query text DEFAULT NULL::text,
  p_category text DEFAULT NULL::text,
  p_subcategory text DEFAULT NULL::text,
  p_subcategory_prefix text DEFAULT NULL::text,
  p_species text DEFAULT NULL::text,
  p_brand text DEFAULT NULL::text,
  p_origin_country text DEFAULT NULL::text,
  p_in_stock boolean DEFAULT true,
  p_needs text[] DEFAULT NULL::text[],
  p_type_group text DEFAULT NULL::text,
  p_product_types text[] DEFAULT NULL::text[],
  p_exclude_brands text[] DEFAULT NULL::text[],
  p_foreign_only boolean DEFAULT NULL::boolean
)
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $function$
WITH keys AS (
  SELECT CASE WHEN p_brand IS NULL OR btrim(p_brand) = '' THEN NULL
              ELSE public.brand_match_keys(p_brand) END AS bk
),
excl AS (
  SELECT COALESCE((
    SELECT array_agg(DISTINCT k)
    FROM unnest(COALESCE(p_exclude_brands, ARRAY[]::text[])) AS b,
         unnest(public.brand_match_keys(b)) AS k
  ), ARRAY[]::text[]) AS xk
),
toks AS (
  SELECT array_agg(DISTINCT t) AS tokens
  FROM unnest(regexp_split_to_array(coalesce(public.normalize_persian(p_query), ''), '\s+')) AS t
  WHERE length(t) >= 3
),
base AS (
  SELECT p.id, p.price, p.brand, p.species, p.tags, p.origin_country, p.life_stage,
         p.breed_size, p.health_needs, p.subcategory,
         public.normalize_persian(
           coalesce(p.name,'') || ' ' || coalesce(p.short_description,'') || ' ' || coalesce(p.description,'') || ' ' ||
           coalesce(p.brand,'') || ' ' || coalesce(p.category,'') || ' ' || coalesce(p.subcategory,'') || ' ' ||
           coalesce(p.species,'') || ' ' || coalesce(p.origin_country,'') || ' ' ||
           coalesce(array_to_string(p.health_needs, ' '),'') || ' ' ||
           coalesce(array_to_string(p.tags, ' '),'')
         ) AS blob
  FROM pet_products p, keys k, excl e
  WHERE (p_in_stock IS NOT TRUE OR p.in_stock)
    AND (p_category IS NULL OR p.category = p_category)
    AND (p_subcategory IS NULL OR p.subcategory = p_subcategory)
    AND (p_subcategory_prefix IS NULL
         OR public.normalize_persian(coalesce(p.subcategory,'')) ILIKE public.normalize_persian(p_subcategory_prefix) || '%')
    AND (p_species IS NULL OR p.species ILIKE '%' || p_species || '%')
    AND (p_type_group IS NULL OR p.type_group = p_type_group)
    AND (p_product_types IS NULL OR array_length(p_product_types,1) IS NULL OR p.product_type = ANY(p_product_types))
    AND (p_needs IS NULL OR array_length(p_needs,1) IS NULL OR p.health_needs && p_needs)
    AND (p_origin_country IS NULL
         OR public.normalize_persian(coalesce(p.origin_country,'')) ILIKE '%' || public.normalize_persian(p_origin_country) || '%')
    AND (p_foreign_only IS NULL
         OR (p_foreign_only IS TRUE AND p.origin_country IS NOT NULL AND btrim(p.origin_country) <> ''
             AND public.normalize_persian(p.origin_country) NOT ILIKE '%ایران%')
         OR (p_foreign_only IS FALSE AND public.normalize_persian(coalesce(p.origin_country,'')) ILIKE '%ایران%'))
    AND (array_length(e.xk, 1) IS NULL OR NOT (public.brand_key(p.brand) = ANY(e.xk)))
    AND (k.bk IS NULL OR public.brand_key(p.brand) = ANY(k.bk))
),
and_set AS (
  SELECT b.* FROM base b, toks
  WHERE coalesce(cardinality(toks.tokens), 0) = 0
     OR NOT EXISTS (SELECT 1 FROM unnest(toks.tokens) tk WHERE b.blob NOT ILIKE '%' || tk || '%')
),
or_set AS (
  SELECT b.* FROM base b, toks
  WHERE coalesce(cardinality(toks.tokens), 0) = 0
     OR EXISTS (SELECT 1 FROM unnest(toks.tokens) tk WHERE b.blob ILIKE '%' || tk || '%')
),
pick AS (
  SELECT CASE
    WHEN (SELECT count(*) FROM and_set) >= 3 THEN 'and'
    WHEN coalesce((SELECT cardinality(tokens) FROM toks), 0) > 1 THEN 'or'
    ELSE 'and'
  END AS mode
),
cand AS (
  SELECT * FROM and_set WHERE (SELECT mode FROM pick) = 'and'
  UNION ALL
  SELECT * FROM or_set WHERE (SELECT mode FROM pick) = 'or'
)
SELECT jsonb_build_object(
  'total', (SELECT count(*) FROM cand),
  'match_mode', (SELECT mode FROM pick),
  'price', (
    SELECT CASE WHEN count(*) = 0 THEN NULL ELSE jsonb_build_object(
      'min', min(price),
      'q1', percentile_disc(0.25) WITHIN GROUP (ORDER BY price),
      'median', percentile_disc(0.5) WITHIN GROUP (ORDER BY price),
      'q3', percentile_disc(0.75) WITHIN GROUP (ORDER BY price),
      'max', max(price)
    ) END FROM cand
  ),
  'brands', coalesce((
    SELECT jsonb_agg(jsonb_build_object('brand', brand, 'count', c) ORDER BY c DESC)
    FROM (SELECT brand, count(*) c FROM cand WHERE brand IS NOT NULL AND btrim(brand) <> ''
          GROUP BY brand ORDER BY c DESC LIMIT 20) b
  ), '[]'::jsonb),
  'countries', coalesce((
    SELECT jsonb_agg(jsonb_build_object('value', origin_country, 'count', c) ORDER BY c DESC)
    FROM (SELECT origin_country, count(*) c FROM cand WHERE origin_country IS NOT NULL AND btrim(origin_country) <> ''
          GROUP BY origin_country ORDER BY c DESC LIMIT 20) o
  ), '[]'::jsonb),
  'brands_by_country', coalesce((
    SELECT jsonb_agg(jsonb_build_object('country', origin_country, 'brand', brand, 'count', c) ORDER BY c DESC)
    FROM (SELECT origin_country, brand, count(*) c FROM cand
          WHERE origin_country IS NOT NULL AND btrim(origin_country) <> ''
            AND brand IS NOT NULL AND btrim(brand) <> ''
          GROUP BY origin_country, brand ORDER BY c DESC LIMIT 60) bc
  ), '[]'::jsonb),
  'life_stages', coalesce((
    SELECT jsonb_agg(jsonb_build_object('value', life_stage, 'count', c) ORDER BY c DESC)
    FROM (SELECT life_stage, count(*) c FROM cand WHERE life_stage IS NOT NULL
          GROUP BY life_stage ORDER BY c DESC) l
  ), '[]'::jsonb),
  'breed_sizes', coalesce((
    SELECT jsonb_agg(jsonb_build_object('value', breed_size, 'count', c) ORDER BY c DESC)
    FROM (SELECT breed_size, count(*) c FROM cand WHERE breed_size IS NOT NULL
          GROUP BY breed_size ORDER BY c DESC) s
  ), '[]'::jsonb),
  'needs', coalesce((
    SELECT jsonb_agg(jsonb_build_object('value', need, 'count', c) ORDER BY c DESC)
    FROM (SELECT need, count(*) c FROM cand, unnest(coalesce(health_needs, '{}')) need
          GROUP BY need ORDER BY c DESC LIMIT 15) n
  ), '[]'::jsonb),
  'subcategories', coalesce((
    SELECT jsonb_agg(jsonb_build_object('value', subcategory, 'count', c) ORDER BY c DESC)
    FROM (SELECT subcategory, count(*) c FROM cand WHERE subcategory IS NOT NULL
          GROUP BY subcategory ORDER BY c DESC LIMIT 20) sc
  ), '[]'::jsonb),
  'species', coalesce((
    SELECT jsonb_agg(jsonb_build_object('value', species, 'count', c) ORDER BY c DESC)
    FROM (SELECT species, count(*) c FROM cand WHERE species IS NOT NULL AND btrim(species) <> ''
          GROUP BY species ORDER BY c DESC LIMIT 15) s
  ), '[]'::jsonb),
  'tags', coalesce((
    SELECT jsonb_agg(jsonb_build_object('value', tag, 'count', c) ORDER BY c DESC)
    FROM (SELECT tag, count(*) c FROM cand, unnest(coalesce(tags, '{}')) tag
          WHERE btrim(tag) <> '' GROUP BY tag ORDER BY c DESC LIMIT 20) t
  ), '[]'::jsonb)
);
$function$;