ALTER TABLE public.products ADD COLUMN IF NOT EXISTS quick_replies jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.pet_products ADD COLUMN IF NOT EXISTS quick_replies jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.baskets ADD COLUMN IF NOT EXISTS product_id text;
COMMENT ON COLUMN public.products.quick_replies IS 'Fixed PDP quick replies, entered manually. Array of strings or {"text":string,"highlight":bool,"executional":bool}.';
COMMENT ON COLUMN public.pet_products.quick_replies IS 'Fixed PDP quick replies, entered manually. Array of strings or {"text":string,"highlight":bool,"executional":bool}.';