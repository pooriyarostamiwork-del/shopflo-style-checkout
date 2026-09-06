CREATE OR REPLACE FUNCTION public.product_question_facets(
  p_query text DEFAULT NULL,
  p_subcategory text DEFAULT NULL,
  p_in_stock boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
WITH toks AS (
  SELECT array_agg(DISTINCT t) AS tokens
  FROM unnest(regexp_split_to_array(coalesce(public.normalize_persian(p_query), ''), '\s+')) AS t
  WHERE length(t) >= 3
),
base AS (
  SELECT p.id, p.price, p.brand, p.tags,
         public.normalize_persian(
           coalesce(p.name,'') || ' ' || coalesce(p.description,'') || ' ' ||
           coalesce(p.brand,'') || ' ' || coalesce(p.subcategory,'') || ' ' ||
           coalesce(array_to_string(p.tags, ' '),'')
         ) AS blob
  FROM products p
  WHERE (p_in_stock IS NOT TRUE OR p.in_stock)
    AND (p_subcategory IS NULL OR p.subcategory ILIKE '%' || p_subcategory || '%')
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

GRANT EXECUTE ON FUNCTION public.product_question_facets(text, text, boolean) TO anon, authenticated, service_role;