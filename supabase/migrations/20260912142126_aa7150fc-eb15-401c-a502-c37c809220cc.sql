CREATE OR REPLACE FUNCTION public.pet_products_search_vector_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  blob text;
  specs_text text;
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

  SELECT string_agg(coalesce(kv.key,'') || ' ' || coalesce(kv.value::text,''), ' ')
    INTO specs_text
    FROM jsonb_each(coalesce(NEW.specs, '{}'::jsonb)) AS kv;

  NEW.search_vector :=
    setweight(to_tsvector('simple', public.normalize_persian(coalesce(NEW.name, ''))), 'A') ||
    setweight(to_tsvector('simple', public.normalize_persian(
      concat_ws(' ',
        NEW.species, NEW.category, NEW.subcategory, NEW.brand,
        NEW.life_stage, NEW.breed_size, NEW.product_type, NEW.type_group,
        array_to_string(coalesce(NEW.health_needs, '{}'), ' ')
      ))), 'B') ||
    setweight(to_tsvector('simple', public.normalize_persian(
      concat_ws(' ', NEW.short_description, NEW.description))), 'C') ||
    setweight(to_tsvector('simple', public.normalize_persian(
      concat_ws(' ', specs_text, array_to_string(coalesce(NEW.tags, '{}'), ' '),
        NEW.origin_country, NEW.weight, NEW.product_line))), 'D');
  RETURN NEW;
END;
$$;

UPDATE public.pet_products SET updated_at = now();