DO $$ BEGIN
  CREATE TYPE public.catalog_status AS ENUM ('active','draft','merged');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.catalog_origin AS ENUM ('manual','merchant');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.products RENAME TO digital_master;
ALTER TABLE public.pet_products RENAME TO pet_master;

ALTER TABLE public.digital_master
  ADD COLUMN catalog_status public.catalog_status NOT NULL DEFAULT 'active',
  ADD COLUMN flowcart_eligible boolean NOT NULL DEFAULT true,
  ADD COLUMN origin public.catalog_origin NOT NULL DEFAULT 'manual',
  ADD COLUMN merged_into_id uuid REFERENCES public.digital_master(id) ON DELETE SET NULL;
ALTER TABLE public.pet_master
  ADD COLUMN catalog_status public.catalog_status NOT NULL DEFAULT 'active',
  ADD COLUMN flowcart_eligible boolean NOT NULL DEFAULT true,
  ADD COLUMN origin public.catalog_origin NOT NULL DEFAULT 'manual',
  ADD COLUMN merged_into_id uuid REFERENCES public.pet_master(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS digital_master_status_idx ON public.digital_master(catalog_status);
CREATE INDEX IF NOT EXISTS pet_master_status_idx ON public.pet_master(catalog_status);

COMMENT ON TABLE public.digital_master IS 'Digital master catalog: product identity and content only; price/stock belong to merchant offers.';
COMMENT ON TABLE public.pet_master IS 'Pet master catalog: product identity and content only; price/stock belong to merchant offers.';

-- Compatibility views: every existing reader (search functions, agents, app) sees only active masters.
CREATE VIEW public.products WITH (security_invoker = on) AS
  SELECT * FROM public.digital_master WHERE catalog_status = 'active';
CREATE VIEW public.pet_products WITH (security_invoker = on) AS
  SELECT * FROM public.pet_master WHERE catalog_status = 'active';

GRANT SELECT ON public.products, public.pet_products TO anon, authenticated;
GRANT ALL ON public.products, public.pet_products TO service_role;
GRANT ALL ON public.digital_master, public.pet_master TO service_role;

-- Merge a duplicate master into a canonical one (service role / back office only).
CREATE OR REPLACE FUNCTION public.merge_master_product(p_catalog text, p_duplicate uuid, p_canonical uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_duplicate = p_canonical THEN RAISE EXCEPTION 'cannot merge a product into itself'; END IF;
  IF p_catalog = 'pet' THEN
    UPDATE public.pet_master SET catalog_status = 'merged', merged_into_id = p_canonical WHERE id = p_duplicate;
  ELSIF p_catalog = 'digital' THEN
    UPDATE public.digital_master SET catalog_status = 'merged', merged_into_id = p_canonical WHERE id = p_duplicate;
  ELSE
    RAISE EXCEPTION 'unknown catalog %', p_catalog;
  END IF;
END $$;
REVOKE ALL ON FUNCTION public.merge_master_product(text, uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.merge_master_product(text, uuid, uuid) TO service_role;