CREATE TABLE public.pet_faqs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question text NOT NULL,
  answer text NOT NULL,
  category text NOT NULL,
  subtopic text,
  tags text[] NOT NULL DEFAULT '{}',
  keywords text[] NOT NULL DEFAULT '{}',
  phone_numbers text[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  version integer NOT NULL DEFAULT 1,
  search_vector tsvector,
  embedding vector(384),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.pet_faqs TO anon;
GRANT SELECT ON public.pet_faqs TO authenticated;
GRANT ALL ON public.pet_faqs TO service_role;

ALTER TABLE public.pet_faqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active FAQs are publicly readable"
  ON public.pet_faqs FOR SELECT
  USING (is_active = true);

CREATE OR REPLACE FUNCTION public.pet_faqs_search_vector_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', public.normalize_persian(coalesce(NEW.question, ''))), 'A') ||
    setweight(to_tsvector('simple', public.normalize_persian(array_to_string(NEW.keywords, ' '))), 'A') ||
    setweight(to_tsvector('simple', public.normalize_persian(array_to_string(NEW.tags, ' '))), 'B') ||
    setweight(to_tsvector('simple', public.normalize_persian(coalesce(NEW.answer, ''))), 'C');
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER pet_faqs_search_vector_trigger
  BEFORE INSERT OR UPDATE ON public.pet_faqs
  FOR EACH ROW EXECUTE FUNCTION public.pet_faqs_search_vector_update();

CREATE INDEX pet_faqs_search_vector_idx ON public.pet_faqs USING gin (search_vector);
CREATE INDEX pet_faqs_question_trgm_idx ON public.pet_faqs USING gin (public.normalize_persian(question) gin_trgm_ops);
CREATE INDEX pet_faqs_keywords_idx ON public.pet_faqs USING gin (keywords);
CREATE INDEX pet_faqs_category_idx ON public.pet_faqs (category);
CREATE INDEX pet_faqs_embedding_idx ON public.pet_faqs USING hnsw (embedding vector_cosine_ops);

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
SET search_path = public
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