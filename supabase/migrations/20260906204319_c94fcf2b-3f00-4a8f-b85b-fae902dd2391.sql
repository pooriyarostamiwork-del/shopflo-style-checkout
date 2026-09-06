CREATE OR REPLACE FUNCTION public.product_question_facets(
  p_query text DEFAULT NULL,
  p_subcategory text DEFAULT NULL,
  p_in_stock boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_tokens text[];
  v_total int := 0;
  v_result jsonb;
  v_mode text := 'and';
BEGIN
  SELECT array_agg(t) INTO v_tokens
  FROM (
    SELECT DISTINCT t
    FROM unnest(regexp_split_to_array(coalesce(public.normalize_persian(p_query), ''), '\s+')) AS t
    WHERE length(t) >= 3
  ) s;
  IF v_tokens IS NULL THEN v_tokens := '{}'; END IF;

  CREATE TEMP TABLE IF NOT EXISTS _pqf_cand (
    id uuid, price int, brand text, tags text[]
  ) ON COMMIT DROP;
  DELETE FROM _pqf_cand;

  INSERT INTO _pqf_cand
  SELECT p.id, p.price, p.brand, p.tags
  FROM products p
  WHERE (p_in_stock IS NOT TRUE OR p.in_stock)
    AND (p_subcategory IS NULL OR p.subcategory ILIKE '%' || p_subcategory || '%')
    AND (
      cardinality(v_tokens) = 0
      OR NOT EXISTS (
        SELECT 1 FROM unnest(v_tokens) tk
        WHERE public.normalize_persian(
                coalesce(p.name,'') || ' ' || coalesce(p.description,'') || ' ' ||
                coalesce(p.brand,'') || ' ' || coalesce(p.subcategory,'') || ' ' ||
                coalesce(array_to_string(p.tags, ' '),'')
              ) NOT ILIKE '%' || tk || '%'
      )
    );

  SELECT count(*) INTO v_total FROM _pqf_cand;

  IF v_total < 3 AND cardinality(v_tokens) > 1 THEN
    v_mode := 'or';
    DELETE FROM _pqf_cand;
    INSERT INTO _pqf_cand
    SELECT p.id, p.price, p.brand, p.tags
    FROM products p
    WHERE (p_in_stock IS NOT TRUE OR p.in_stock)
      AND (p_subcategory IS NULL OR p.subcategory ILIKE '%' || p_subcategory || '%')
      AND EXISTS (
        SELECT 1 FROM unnest(v_tokens) tk
        WHERE public.normalize_persian(
                coalesce(p.name,'') || ' ' || coalesce(p.description,'') || ' ' ||
                coalesce(p.brand,'') || ' ' || coalesce(p.subcategory,'') || ' ' ||
                coalesce(array_to_string(p.tags, ' '),'')
              ) ILIKE '%' || tk || '%'
      );
    SELECT count(*) INTO v_total FROM _pqf_cand;
  END IF;

  SELECT jsonb_build_object(
    'total', v_total,
    'match_mode', v_mode,
    'price', CASE WHEN v_total = 0 THEN NULL ELSE (
      SELECT jsonb_build_object(
        'min', min(price),
        'q1', percentile_disc(0.25) WITHIN GROUP (ORDER BY price),
        'median', percentile_disc(0.5) WITHIN GROUP (ORDER BY price),
        'q3', percentile_disc(0.75) WITHIN GROUP (ORDER BY price),
        'max', max(price)
      ) FROM _pqf_cand
    ) END,
    'brands', coalesce((
      SELECT jsonb_agg(jsonb_build_object('brand', brand, 'count', c) ORDER BY c DESC)
      FROM (
        SELECT brand, count(*) c FROM _pqf_cand
        WHERE brand IS NOT NULL AND btrim(brand) <> ''
        GROUP BY brand ORDER BY c DESC LIMIT 12
      ) b
    ), '[]'::jsonb),
    'tags', coalesce((
      SELECT jsonb_agg(jsonb_build_object('value', tag, 'count', c) ORDER BY c DESC)
      FROM (
        SELECT tag, count(*) c
        FROM _pqf_cand, unnest(coalesce(tags, '{}')) tag
        WHERE btrim(tag) <> ''
        GROUP BY tag ORDER BY c DESC LIMIT 20
      ) t
    ), '[]'::jsonb)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.product_question_facets(text, text, boolean) TO anon, authenticated, service_role;