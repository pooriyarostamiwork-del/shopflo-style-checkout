CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE public.pet_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  short_description text DEFAULT '',
  description text DEFAULT '',
  price integer NOT NULL DEFAULT 0,
  original_price integer,
  image_url text NOT NULL DEFAULT '',
  image_urls text[] DEFAULT '{}'::text[],
  category text NOT NULL DEFAULT '',
  subcategory text,
  species text,
  brand text,
  origin_country text,
  weight text,
  taxonomy_level1 text,
  taxonomy_level2 text,
  taxonomy_level3 text,
  specs jsonb DEFAULT '{}'::jsonb,
  tags text[] DEFAULT '{}'::text[],
  rating numeric NOT NULL DEFAULT 4.0,
  review_count integer NOT NULL DEFAULT 0,
  in_stock boolean NOT NULL DEFAULT true,
  search_vector tsvector,
  embedding vector(3072),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.pet_products TO anon;
GRANT SELECT ON public.pet_products TO authenticated;
GRANT ALL ON public.pet_products TO service_role;

ALTER TABLE public.pet_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pet products are publicly readable" ON public.pet_products
  FOR SELECT TO public USING (true);

CREATE POLICY "Service role can manage pet products" ON public.pet_products
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX pet_products_search_vector_idx ON public.pet_products USING GIN (search_vector);
CREATE INDEX pet_products_name_trgm_idx ON public.pet_products USING GIN (name gin_trgm_ops);
CREATE INDEX pet_products_brand_trgm_idx ON public.pet_products USING GIN (brand gin_trgm_ops);
CREATE INDEX pet_products_category_idx ON public.pet_products (category);
CREATE INDEX pet_products_subcategory_idx ON public.pet_products (subcategory);
CREATE INDEX pet_products_species_idx ON public.pet_products (species);
CREATE INDEX pet_products_price_idx ON public.pet_products (price);
CREATE INDEX pet_products_embedding_idx ON public.pet_products USING hnsw ((embedding::halfvec(3072)) halfvec_cosine_ops);

CREATE OR REPLACE FUNCTION public.pet_products_search_vector_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.search_vector :=
    to_tsvector('simple', normalize_persian(coalesce(NEW.name, ''))) ||
    to_tsvector('simple', normalize_persian(coalesce(NEW.short_description, ''))) ||
    to_tsvector('simple', normalize_persian(coalesce(NEW.description, ''))) ||
    to_tsvector('simple', normalize_persian(coalesce(NEW.brand, ''))) ||
    to_tsvector('simple', normalize_persian(coalesce(NEW.category, ''))) ||
    to_tsvector('simple', normalize_persian(coalesce(NEW.subcategory, ''))) ||
    to_tsvector('simple', normalize_persian(coalesce(NEW.species, ''))) ||
    to_tsvector('simple', normalize_persian(array_to_string(coalesce(NEW.tags, '{}'), ' ')));
  RETURN NEW;
END;
$$;

CREATE TRIGGER pet_products_search_vector_trigger
  BEFORE INSERT OR UPDATE ON public.pet_products
  FOR EACH ROW EXECUTE FUNCTION public.pet_products_search_vector_update();

CREATE TRIGGER pet_products_updated_at
  BEFORE UPDATE ON public.pet_products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.pet_hybrid_search(
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
  name text,
  short_description text,
  description text,
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
  SELECT f.id, f.name, f.short_description, f.description, f.price, f.original_price,
         f.image_url, f.image_urls, f.category, f.subcategory, f.species, f.brand,
         f.origin_country, f.weight, f.specs, f.tags, f.in_stock, f.rating, f.review_count,
         f.score AS final_score,
         (SELECT count(*)::int FROM filtered) AS matched_total
  FROM filtered f
  ORDER BY f.score DESC, f.rating DESC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 20), 1), 60)
  OFFSET GREATEST(COALESCE(p_offset, 0), 0);
$$;

CREATE OR REPLACE FUNCTION public.pet_question_facets(
  p_query text DEFAULT NULL::text,
  p_category text DEFAULT NULL::text,
  p_subcategory text DEFAULT NULL::text,
  p_species text DEFAULT NULL::text,
  p_in_stock boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = public
AS $$
WITH toks AS (
  SELECT array_agg(DISTINCT t) AS tokens
  FROM unnest(regexp_split_to_array(coalesce(public.normalize_persian(p_query), ''), '\s+')) AS t
  WHERE length(t) >= 3
),
base AS (
  SELECT p.id, p.price, p.brand, p.species, p.tags,
         public.normalize_persian(
           coalesce(p.name,'') || ' ' || coalesce(p.short_description,'') || ' ' || coalesce(p.description,'') || ' ' ||
           coalesce(p.brand,'') || ' ' || coalesce(p.category,'') || ' ' || coalesce(p.subcategory,'') || ' ' ||
           coalesce(p.species,'') || ' ' || coalesce(array_to_string(p.tags, ' '),'')
         ) AS blob
  FROM pet_products p
  WHERE (p_in_stock IS NOT TRUE OR p.in_stock)
    AND (p_category IS NULL OR p.category = p_category)
    AND (p_subcategory IS NULL OR p.subcategory = p_subcategory)
    AND (p_species IS NULL OR p.species ILIKE '%' || p_species || '%')
),
and_set AS (
  SELECT b.* FROM base b, toks
  WHERE coalesce(cardinality(toks.tokens), 0) = 0
     OR NOT EXISTS (
       SELECT 1 FROM unnest(toks.tokens) tk WHERE b.blob NOT ILIKE '%' || tk || '%'
     )
),
or_set AS (
  SELECT b.* FROM base b, toks
  WHERE coalesce(cardinality(toks.tokens), 0) = 0
     OR EXISTS (
       SELECT 1 FROM unnest(toks.tokens) tk WHERE b.blob ILIKE '%' || tk || '%'
     )
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
    FROM (
      SELECT brand, count(*) c FROM cand
      WHERE brand IS NOT NULL AND btrim(brand) <> ''
      GROUP BY brand ORDER BY c DESC LIMIT 12
    ) b
  ), '[]'::jsonb),
  'species', coalesce((
    SELECT jsonb_agg(jsonb_build_object('value', species, 'count', c) ORDER BY c DESC)
    FROM (
      SELECT species, count(*) c FROM cand
      WHERE species IS NOT NULL AND btrim(species) <> ''
      GROUP BY species ORDER BY c DESC LIMIT 15
    ) s
  ), '[]'::jsonb),
  'tags', coalesce((
    SELECT jsonb_agg(jsonb_build_object('value', tag, 'count', c) ORDER BY c DESC)
    FROM (
      SELECT tag, count(*) c
      FROM cand, unnest(coalesce(tags, '{}')) tag
      WHERE btrim(tag) <> ''
      GROUP BY tag ORDER BY c DESC LIMIT 20
    ) t
  ), '[]'::jsonb)
);
$$;