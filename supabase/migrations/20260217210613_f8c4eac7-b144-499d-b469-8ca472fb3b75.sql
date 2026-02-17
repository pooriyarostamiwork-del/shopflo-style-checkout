
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_urls text[] DEFAULT '{}'::text[];
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS specs jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS reviews_summary text DEFAULT '';
