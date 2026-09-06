CREATE OR REPLACE FUNCTION public.brand_key(input text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path TO 'public' AS $$
  SELECT lower(regexp_replace(normalize_persian(coalesce(input, '')), '[\s\-_.]', '', 'g'));
$$;

CREATE TABLE IF NOT EXISTS public.brand_aliases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alias_key text NOT NULL UNIQUE,
  canonical text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.brand_aliases TO anon;
GRANT SELECT ON public.brand_aliases TO authenticated;
GRANT ALL ON public.brand_aliases TO service_role;

ALTER TABLE public.brand_aliases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Brand aliases are publicly readable" ON public.brand_aliases;
CREATE POLICY "Brand aliases are publicly readable" ON public.brand_aliases FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role can manage brand aliases" ON public.brand_aliases;
CREATE POLICY "Service role can manage brand aliases" ON public.brand_aliases FOR ALL TO service_role USING (true) WITH CHECK (true);

INSERT INTO public.brand_aliases (alias_key, canonical)
SELECT k, canonical FROM (
  SELECT public.brand_key(brand) AS k,
         (array_agg(brand ORDER BY c DESC))[1] AS canonical
  FROM (
    SELECT brand, count(*) c FROM public.products
    WHERE brand IS NOT NULL AND btrim(brand) <> ''
    GROUP BY brand
  ) v
  GROUP BY 1
) s
ON CONFLICT (alias_key) DO NOTHING;

INSERT INTO public.brand_aliases (alias_key, canonical)
SELECT public.brand_key(a.en), a.fa
FROM (VALUES
  ('apple','اپل'), ('macbook','اپل'), ('mac','اپل'), ('iphone','اپل'),
  ('samsung','سامسونگ'), ('galaxy','سامسونگ'),
  ('asus','ایسوس'), ('lenovo','لنوو'), ('xiaomi','شیائومی'), ('redmi','شیائومی'), ('poco','شیائومی'),
  ('hp','اچ پی'), ('hewlettpackard','اچ پی'), ('dell','دل'), ('acer','ایسر'),
  ('msi','ام اس آی'), ('gigabyte','گیگابایت'), ('microsoft','مایکروسافت'), ('surface','مایکروسافت'),
  ('huawei','هوآوی'), ('honor','آنر'), ('nokia','نوکیا'), ('realme','ریلمی'), ('motorola','موتورولا'),
  ('oneplus','وان پلاس'), ('lg','ال جی'), ('sony','سونی'), ('philips','فیلیپس'), ('jbl','جی بی ال'),
  ('anker','انکر'), ('baseus','بیسوس'), ('logitech','لاجیتک'), ('razer','ریزر'), ('redragon','ردراگون'),
  ('seagate','سیگیت'), ('sandisk','سن دیسک'), ('westerndigital','وسترن دیجیتال'), ('wd','وسترن دیجیتال'),
  ('toshiba','توشیبا'), ('kioxia','کیوکسیا'), ('adata','ای دیتا'), ('siliconpower','سیلیکون پاور'),
  ('garmin','گارمین'), ('suunto','سونتو'), ('casio','کاسیو'), ('amazfit','امیزفیت'), ('haylou','هایلو'),
  ('qcy','کیو سی وای'), ('kz','کی زد'), ('tcl','تی سی ال'), ('htc','اچ تی سی'), ('alcatel','آلکاتل'),
  ('nothing','ناتینگ'), ('tecno','تکنو'), ('olympus','الیمپوس'), ('fujifilm','فوجی فیلم'),
  ('verity','وریتی'), ('remax','ریمکس'), ('mcdodo','مک دودو')
) AS a(en, fa)
ON CONFLICT (alias_key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.brand_match_keys(p_brand text)
RETURNS text[] LANGUAGE sql STABLE SET search_path TO 'public' AS $$
  WITH input AS (SELECT public.brand_key(p_brand) AS k),
  canon AS (
    SELECT ba.canonical FROM public.brand_aliases ba, input WHERE ba.alias_key = input.k
    UNION
    SELECT p_brand WHERE NOT EXISTS (
      SELECT 1 FROM public.brand_aliases ba, input WHERE ba.alias_key = input.k
    )
  )
  SELECT COALESCE(array_agg(DISTINCT k2), ARRAY[]::text[]) FROM (
    SELECT public.brand_key(c.canonical) AS k2 FROM canon c
    UNION
    SELECT ba.alias_key FROM public.brand_aliases ba JOIN canon c ON ba.canonical = c.canonical
    UNION
    SELECT public.brand_key(p_brand)
  ) t;
$$;

CREATE OR REPLACE FUNCTION public.product_facets(
  p_subcategory text DEFAULT NULL,
  p_criterion text DEFAULT NULL,
  p_query text DEFAULT NULL,
  p_in_stock boolean DEFAULT true
)
RETURNS jsonb LANGUAGE sql STABLE SET search_path TO 'public', 'extensions' AS $$
  WITH base AS (
    SELECT p.* FROM products p
    WHERE (p_in_stock IS NULL OR p.in_stock = p_in_stock)
      AND (p_subcategory IS NULL OR p.subcategory = p_subcategory)
      AND (
        p_query IS NULL OR p_query = '' OR
        normalize_persian(coalesce(p.name,'') || ' ' || coalesce(p.description,'') || ' ' ||
          coalesce(p.category,'') || ' ' || coalesce(p.subcategory,'') || ' ' ||
          array_to_string(coalesce(p.tags,'{}'), ' '))
          ILIKE '%' || normalize_persian(p_query) || '%'
      )
      AND (
        p_criterion IS NULL OR p_criterion = '' OR
        normalize_persian(coalesce(p.name,'') || ' ' || coalesce(p.description,'') || ' ' ||
          array_to_string(coalesce(p.tags,'{}'), ' '))
          ILIKE '%' || normalize_persian(p_criterion) || '%'
      )
  ), brands AS (
    SELECT COALESCE(ba.canonical, b.brand) AS brand, count(*)::int AS product_count
    FROM base b
    LEFT JOIN brand_aliases ba ON ba.alias_key = public.brand_key(b.brand)
    WHERE b.brand IS NOT NULL AND btrim(b.brand) <> ''
    GROUP BY 1 ORDER BY 2 DESC
  ), subs AS (
    SELECT coalesce(subcategory, 'بدون دسته') AS subcategory, count(*)::int AS product_count
    FROM base GROUP BY 1 ORDER BY 2 DESC
  )
  SELECT jsonb_build_object(
    'total', (SELECT count(*) FROM base),
    'brands', COALESCE((SELECT jsonb_agg(jsonb_build_object('brand', brand, 'count', product_count)) FROM brands), '[]'::jsonb),
    'subcategories', COALESCE((SELECT jsonb_agg(jsonb_build_object('subcategory', subcategory, 'count', product_count)) FROM subs), '[]'::jsonb),
    'price_min', (SELECT min(price) FROM base),
    'price_max', (SELECT max(price) FROM base)
  );
$$;

GRANT EXECUTE ON FUNCTION public.product_facets(text, text, text, boolean) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.brand_match_keys(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.brand_key(text) TO anon, authenticated, service_role;

DROP FUNCTION IF EXISTS public.hybrid_product_search(text, vector, text, numeric, numeric, numeric, text, boolean);

CREATE OR REPLACE FUNCTION public.hybrid_product_search(
  p_query text,
  p_embedding vector DEFAULT NULL,
  p_subcategory text DEFAULT NULL,
  p_max_price numeric DEFAULT NULL,
  p_min_price numeric DEFAULT NULL,
  p_min_rating numeric DEFAULT NULL,
  p_brand text DEFAULT NULL,
  p_in_stock boolean DEFAULT true,
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0,
  p_evidence text[] DEFAULT NULL
)
RETURNS TABLE(
  id uuid, name text, description text, price integer, original_price integer, rating numeric,
  image_url text, image_urls text[], brand text, category text, subcategory text, tags text[],
  in_stock boolean, fast_delivery boolean, return_guarantee boolean, review_count integer,
  reviews_summary text, merchant_id text, specs jsonb, source_url text,
  final_score double precision, matched_total integer
)
LANGUAGE sql STABLE SET search_path TO 'public', 'extensions' AS $function$
  WITH keys AS (
    SELECT CASE WHEN p_brand IS NULL OR btrim(p_brand) = '' THEN NULL
                ELSE public.brand_match_keys(p_brand) END AS bk
  ), filtered AS (
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
    FROM products p, keys k
    WHERE (p_in_stock IS NULL OR p.in_stock = p_in_stock)
      AND (p_subcategory IS NULL OR p.subcategory = p_subcategory)
      AND (p_max_price IS NULL OR p.price <= p_max_price)
      AND (p_min_price IS NULL OR p.price >= p_min_price)
      AND (p_min_rating IS NULL OR p.rating >= p_min_rating)
      AND (k.bk IS NULL OR public.brand_key(p.brand) = ANY(k.bk))
      AND (
        p_evidence IS NULL OR array_length(p_evidence, 1) IS NULL OR EXISTS (
          SELECT 1 FROM unnest(p_evidence) AS term
          WHERE normalize_persian(coalesce(p.name,'') || ' ' || coalesce(p.description,'') || ' ' ||
                array_to_string(coalesce(p.tags,'{}'), ' '))
                ILIKE '%' || normalize_persian(term) || '%'
        )
      )
  )
  SELECT f.id, f.name, f.description, f.price, f.original_price, f.rating, f.image_url, f.image_urls,
         f.brand, f.category, f.subcategory, f.tags, f.in_stock, f.fast_delivery, f.return_guarantee,
         f.review_count, f.reviews_summary, f.merchant_id, f.specs, f.source_url,
         f.score AS final_score,
         (SELECT count(*)::int FROM filtered) AS matched_total
  FROM filtered f
  ORDER BY f.score DESC, f.rating DESC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 20), 1), 60)
  OFFSET GREATEST(COALESCE(p_offset, 0), 0);
$function$;

GRANT EXECUTE ON FUNCTION public.hybrid_product_search(text, vector, text, numeric, numeric, numeric, text, boolean, integer, integer, text[]) TO anon, authenticated, service_role;