CREATE OR REPLACE FUNCTION public.pet_faq_search(
  p_query text DEFAULT NULL,
  p_embedding vector(384) DEFAULT NULL,
  p_categories text[] DEFAULT NULL,
  p_limit integer DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  question text,
  answer text,
  category text,
  subtopic text,
  tags text[],
  phone_numbers text[],
  version integer,
  score double precision,
  match_kind text
)
LANGUAGE plpgsql
STABLE
SET search_path = public, extensions
AS $$
DECLARE
  q text := public.normalize_persian(coalesce(p_query, ''));
BEGIN
  RETURN QUERY
  WITH base AS (
    SELECT f.*
    FROM public.pet_faqs f
    WHERE f.is_active = true
      AND (p_categories IS NULL OR f.category = ANY(p_categories))
  ),
  scored AS (
    SELECT
      b.id, b.question, b.answer, b.category, b.subtopic, b.tags, b.phone_numbers, b.version,
      CASE WHEN q = '' THEN 0
           ELSE ts_rank(b.search_vector, plainto_tsquery('simple', q)) END::double precision AS fts,
      CASE WHEN q = '' THEN 0
           ELSE GREATEST(
             similarity(public.normalize_persian(b.question), q),
             similarity(public.normalize_persian(array_to_string(b.keywords, ' ')), q)
           ) END::double precision AS trgm,
      CASE WHEN p_embedding IS NULL OR b.embedding IS NULL THEN 0
           ELSE 1 - (b.embedding <=> p_embedding) END::double precision AS vec
    FROM base b
  )
  SELECT
    s.id, s.question, s.answer, s.category, s.subtopic, s.tags, s.phone_numbers, s.version,
    (s.fts * 4.0 + s.trgm * 2.0 + s.vec * 3.0)::double precision AS score,
    CASE
      WHEN s.fts > 0 AND s.vec >= 0.8 THEN 'strong'
      WHEN s.fts > 0 OR s.trgm >= 0.45 OR s.vec >= 0.78 THEN 'likely'
      ELSE 'weak'
    END AS match_kind
  FROM scored s
  WHERE s.fts > 0 OR s.trgm >= 0.2 OR s.vec >= 0.6
  ORDER BY score DESC
  LIMIT GREATEST(coalesce(p_limit, 5), 1);
END;
$$;

GRANT EXECUTE ON FUNCTION public.pet_faq_search(text, vector, text[], integer) TO anon, authenticated, service_role;