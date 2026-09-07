-- ── Derived attribute columns ──────────────────────────────────────────
ALTER TABLE public.pet_products
  ADD COLUMN IF NOT EXISTS life_stage text,
  ADD COLUMN IF NOT EXISTS breed_size text,
  ADD COLUMN IF NOT EXISTS product_line text,
  ADD COLUMN IF NOT EXISTS health_needs text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS enriched_at timestamptz;

-- ── Extraction helpers ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.pet_extract_country(p_tags text[], p_specs jsonb, p_current text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN p_current IS NOT NULL AND btrim(p_current) <> '' THEN btrim(p_current)
    ELSE (
      SELECT c FROM unnest(ARRAY[
        'آلمان','ایران','چین','آمریکا','امریکا','فرانسه','روسیه','اوکراین','ایتالیا','ترکیه',
        'لهستان','سوئیس','سنگاپور','نیوزیلند','اسپانیا','انگلیس','برزیل','هلند','تایلند','هند',
        'کره جنوبی','کره','بلژیک','کانادا','اتریش','مجارستان','چک','صربستان','یونان','ژاپن','استرالیا'
      ]) c
      WHERE public.normalize_persian(
              coalesce(array_to_string(p_tags, ' '), '') || ' ' || coalesce(p_specs::text, '')
            ) ILIKE '%' || c || '%'
      ORDER BY length(c) DESC
      LIMIT 1
    )
  END;
$$;

CREATE OR REPLACE FUNCTION public.pet_extract_life_stage(p_text text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN public.normalize_persian(coalesce(p_text,'')) ~* '(توله|بچه گربه|بچه سگ|کیتن|پاپی|نابالغ|kitten|puppy|junior)' THEN 'نابالغ'
    WHEN public.normalize_persian(coalesce(p_text,'')) ~* '(سنیور|مسن|senior|ایجینگ|aging)' THEN 'سنیور'
    WHEN public.normalize_persian(coalesce(p_text,'')) ~* '(بالغ|adult)' THEN 'بالغ'
    ELSE NULL
  END;
$$;

CREATE OR REPLACE FUNCTION public.pet_extract_breed_size(p_text text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN public.normalize_persian(coalesce(p_text,'')) ~* '(نژاد بزرگ|جثه بزرگ|نژاد های بزرگ|maxi|large|giant)' THEN 'بزرگ'
    WHEN public.normalize_persian(coalesce(p_text,'')) ~* '(نژاد متوسط|جثه متوسط|medium)' THEN 'متوسط'
    WHEN public.normalize_persian(coalesce(p_text,'')) ~* '(نژاد کوچک|جثه کوچک|مینی|mini|small|toy)' THEN 'کوچک'
    ELSE NULL
  END;
$$;

CREATE OR REPLACE FUNCTION public.pet_extract_needs(p_text text)
RETURNS text[]
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  WITH t AS (SELECT public.normalize_persian(coalesce(p_text,'')) AS s)
  SELECT coalesce(array_agg(n), '{}'::text[]) FROM (
    SELECT 'پوست و مو' AS n FROM t WHERE s ~* '(پوست و مو|پوست|مو|skin|coat|derma|hair)'
    UNION ALL SELECT 'گوارش حساس' FROM t WHERE s ~* '(گوارش حساس|حساس|sensi|sensitive|digest)'
    UNION ALL SELECT 'کلیه و مجاری ادرار' FROM t WHERE s ~* '(کلیه|مجاری ادرار|urinary|renal)'
    UNION ALL SELECT 'عقیم شده' FROM t WHERE s ~* '(عقیم|اسپی|sterilised|sterilized|neutered)'
    UNION ALL SELECT 'کنترل وزن' FROM t WHERE s ~* '(کنترل وزن|رژیمی|لایت|light|weight|slim|لجر|leger)'
    UNION ALL SELECT 'ضد حساسیت' FROM t WHERE s ~* '(ضد حساسیت|هایپوآلرژنیک|hypoaller|allerg)'
    UNION ALL SELECT 'گلوله مویی' FROM t WHERE s ~* '(گلوله مویی|هیربال|hairball)'
    UNION ALL SELECT 'داخل خانه' FROM t WHERE s ~* '(ایندور|داخل خانه|indoor)'
    UNION ALL SELECT 'درمانی' FROM t WHERE s ~* '(درمانی|رژیم درمانی|veterinary|help )'
    UNION ALL SELECT 'سلامت دندان' FROM t WHERE s ~* '(دندان|جرم گیر|dental|oral)'
    UNION ALL SELECT 'مفاصل' FROM t WHERE s ~* '(مفاصل|joint|articul)'
  ) x(n);
$$;

CREATE OR REPLACE FUNCTION public.pet_extract_line(p_name text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT nullif(btrim(regexp_replace(
    coalesce(substring(p_name from '([A-Za-z][A-Za-z0-9''\-\+&\. ]{2,})'), ''),
    '\s+', ' ', 'g')), '');
$$;

-- ── Trigger keeps derived fields + search vector in sync ────────────────
CREATE OR REPLACE FUNCTION public.pet_products_search_vector_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  blob text;
BEGIN
  blob := coalesce(NEW.name,'') || ' ' || coalesce(NEW.short_description,'') || ' ' ||
          coalesce(NEW.description,'') || ' ' || coalesce(NEW.subcategory,'') || ' ' ||
          coalesce(array_to_string(NEW.tags, ' '),'');

  NEW.origin_country := public.pet_extract_country(NEW.tags, NEW.specs, NEW.origin_country);
  IF NEW.life_stage IS NULL OR btrim(NEW.life_stage) = '' THEN
    NEW.life_stage := public.pet_extract_life_stage(blob);
  END IF;
  IF NEW.breed_size IS NULL OR btrim(NEW.breed_size) = '' THEN
    NEW.breed_size := public.pet_extract_breed_size(blob);
  END IF;
  IF NEW.product_line IS NULL OR btrim(NEW.product_line) = '' THEN
    NEW.product_line := public.pet_extract_line(NEW.name);
  END IF;
  IF NEW.health_needs IS NULL OR array_length(NEW.health_needs, 1) IS NULL THEN
    NEW.health_needs := public.pet_extract_needs(blob);
  END IF;

  NEW.search_vector :=
    to_tsvector('simple', public.normalize_persian(coalesce(NEW.name, ''))) ||
    to_tsvector('simple', public.normalize_persian(coalesce(NEW.short_description, ''))) ||
    to_tsvector('simple', public.normalize_persian(coalesce(NEW.description, ''))) ||
    to_tsvector('simple', public.normalize_persian(coalesce(NEW.brand, ''))) ||
    to_tsvector('simple', public.normalize_persian(coalesce(NEW.category, ''))) ||
    to_tsvector('simple', public.normalize_persian(coalesce(NEW.subcategory, ''))) ||
    to_tsvector('simple', public.normalize_persian(coalesce(NEW.species, ''))) ||
    to_tsvector('simple', public.normalize_persian(coalesce(NEW.origin_country, ''))) ||
    to_tsvector('simple', public.normalize_persian(coalesce(NEW.weight, ''))) ||
    to_tsvector('simple', public.normalize_persian(coalesce(NEW.life_stage, ''))) ||
    to_tsvector('simple', public.normalize_persian(coalesce(NEW.breed_size, ''))) ||
    to_tsvector('simple', public.normalize_persian(coalesce(NEW.product_line, ''))) ||
    to_tsvector('simple', public.normalize_persian(array_to_string(coalesce(NEW.health_needs, '{}'), ' '))) ||
    to_tsvector('simple', public.normalize_persian(array_to_string(coalesce(NEW.tags, '{}'), ' ')));
  RETURN NEW;
END;
$$;

-- Backfill every row through the trigger
UPDATE public.pet_products SET updated_at = now();

CREATE INDEX IF NOT EXISTS pet_products_origin_idx ON public.pet_products (origin_country);
CREATE INDEX IF NOT EXISTS pet_products_life_stage_idx ON public.pet_products (life_stage);
CREATE INDEX IF NOT EXISTS pet_products_breed_size_idx ON public.pet_products (breed_size);
CREATE INDEX IF NOT EXISTS pet_products_line_trgm_idx ON public.pet_products USING GIN (product_line gin_trgm_ops);
CREATE INDEX IF NOT EXISTS pet_products_needs_idx ON public.pet_products USING GIN (health_needs);

-- ── Search: family match, real brand/country/line filters, diversity ────
DROP FUNCTION IF EXISTS public.pet_hybrid_search(text, vector, text, text, text, text, integer, integer, boolean, integer, integer);
DROP FUNCTION IF EXISTS public.pet_hybrid_search(uuid, text, vector, text, text, text, text, integer, integer, boolean, integer, integer);

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
  p_max_price integer DEFAULT NULL::integer,
  p_min_price integer DEFAULT NULL::integer,
  p_in_stock boolean DEFAULT true,
  p_diversify boolean DEFAULT true,
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid, name_fa text, description_fa text, price integer, original_price integer,
  image_url text, image_urls text[], category text, subcategory text, species text, brand text,
  origin_country text, weight text, life_stage text, breed_size text, product_line text,
  health_needs text[], specs jsonb, tags text[], in_stock boolean, stock_qty integer,
  rating numeric, review_count integer, final_score double precision, matched_total integer
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
        COALESCE(ts_rank(p.search_vector, websearch_to_tsquery('simple', public.normalize_persian(coalesce(p_query,'')))), 0)
          * (CASE WHEN p_embedding IS NOT NULL THEN 0.26 ELSE 0.32 END)
        + COALESCE(similarity(p.name, public.normalize_persian(coalesce(p_query,''))), 0) * 0.18
        + COALESCE(similarity(array_to_string(COALESCE(p.tags, '{}'), ' '), public.normalize_persian(coalesce(p_query,''))), 0) * 0.08
        + (CASE WHEN p_embedding IS NOT NULL AND p.embedding IS NOT NULL
                THEN GREATEST(1.0 - (p.embedding <=> p_embedding), 0) * 0.28 ELSE 0.0 END)
        + (CASE WHEN p_subcategory IS NOT NULL AND p.subcategory = p_subcategory THEN 0.12 ELSE 0.0 END)
        + (CASE WHEN p_life_stage IS NOT NULL AND p.life_stage = p_life_stage THEN 0.14
                WHEN p_life_stage IS NOT NULL AND p.life_stage IS NOT NULL AND p.life_stage <> p_life_stage THEN -0.20
                ELSE 0.0 END)
        + (CASE WHEN p_breed_size IS NOT NULL AND p.breed_size = p_breed_size THEN 0.12
                WHEN p_breed_size IS NOT NULL AND p.breed_size IS NOT NULL AND p.breed_size <> p_breed_size THEN -0.08
                ELSE 0.0 END)
        + (CASE WHEN p_needs IS NOT NULL AND array_length(p_needs,1) IS NOT NULL
                     AND p.health_needs && p_needs THEN 0.16 ELSE 0.0 END)
      )::double precision AS score
    FROM pet_products p, keys k
    WHERE (p_in_stock IS NULL OR p.in_stock = p_in_stock)
      AND (p_category IS NULL OR p.category = p_category)
      AND (p_subcategory IS NULL OR p.subcategory = p_subcategory)
      AND (p_subcategory_prefix IS NULL
           OR public.normalize_persian(coalesce(p.subcategory,'')) ILIKE public.normalize_persian(p_subcategory_prefix) || '%')
      AND (p_species IS NULL OR p.species ILIKE '%' || p_species || '%')
      AND (p_origin_country IS NULL
           OR public.normalize_persian(coalesce(p.origin_country,'')) ILIKE '%' || public.normalize_persian(p_origin_country) || '%')
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
      ) AS line_rank
    FROM filtered f
  ),
  picked AS (
    SELECT * FROM ranked
    WHERE p_diversify IS NOT TRUE OR p_product_line IS NOT NULL OR line_rank <= 2
  )
  SELECT f.id, f.name AS name_fa, f.description AS description_fa, f.price, f.original_price,
         f.image_url, f.image_urls, f.category, f.subcategory, f.species, f.brand,
         f.origin_country, f.weight, f.life_stage, f.breed_size, f.product_line,
         f.health_needs, f.specs, f.tags, f.in_stock, 0 AS stock_qty, f.rating, f.review_count,
         f.score AS final_score,
         (SELECT count(*)::int FROM filtered) AS matched_total
  FROM picked f
  ORDER BY f.score DESC, f.rating DESC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 20), 1), 60)
  OFFSET GREATEST(COALESCE(p_offset, 0), 0);
$$;

GRANT EXECUTE ON FUNCTION public.pet_hybrid_search(uuid, text, vector, text, text, text, text, text, text, text, text, text, text[], integer, integer, boolean, boolean, integer, integer) TO anon, authenticated, service_role;

-- ── Facets: family match + country / life stage / needs ────────────────
DROP FUNCTION IF EXISTS public.pet_question_facets(text, text, text, text, boolean);

CREATE OR REPLACE FUNCTION public.pet_question_facets(
  p_query text DEFAULT NULL::text,
  p_category text DEFAULT NULL::text,
  p_subcategory text DEFAULT NULL::text,
  p_subcategory_prefix text DEFAULT NULL::text,
  p_species text DEFAULT NULL::text,
  p_brand text DEFAULT NULL::text,
  p_origin_country text DEFAULT NULL::text,
  p_in_stock boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = public
AS $$
WITH keys AS (
  SELECT CASE WHEN p_brand IS NULL OR btrim(p_brand) = '' THEN NULL
              ELSE public.brand_match_keys(p_brand) END AS bk
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
  FROM pet_products p, keys k
  WHERE (p_in_stock IS NOT TRUE OR p.in_stock)
    AND (p_category IS NULL OR p.category = p_category)
    AND (p_subcategory IS NULL OR p.subcategory = p_subcategory)
    AND (p_subcategory_prefix IS NULL
         OR public.normalize_persian(coalesce(p.subcategory,'')) ILIKE public.normalize_persian(p_subcategory_prefix) || '%')
    AND (p_species IS NULL OR p.species ILIKE '%' || p_species || '%')
    AND (p_origin_country IS NULL
         OR public.normalize_persian(coalesce(p.origin_country,'')) ILIKE '%' || public.normalize_persian(p_origin_country) || '%')
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
$$;

GRANT EXECUTE ON FUNCTION public.pet_question_facets(text, text, text, text, text, text, text, boolean) TO anon, authenticated, service_role;