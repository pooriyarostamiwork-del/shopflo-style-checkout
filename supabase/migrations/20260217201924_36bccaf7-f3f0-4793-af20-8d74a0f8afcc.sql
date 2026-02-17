
-- Create products table for Digikala scraped products
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text DEFAULT '',
  price integer NOT NULL,
  original_price integer,
  image_url text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT '',
  subcategory text,
  brand text,
  merchant_id text NOT NULL DEFAULT 'm1',
  rating numeric NOT NULL DEFAULT 4.0,
  review_count integer NOT NULL DEFAULT 0,
  in_stock boolean NOT NULL DEFAULT true,
  fast_delivery boolean NOT NULL DEFAULT false,
  return_guarantee boolean NOT NULL DEFAULT true,
  tags text[] DEFAULT '{}',
  source_url text,
  search_vector tsvector,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS (public read, no auth needed for this demo)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Public read policy (products are publicly viewable)
CREATE POLICY "Products are publicly readable"
  ON public.products FOR SELECT
  USING (true);

-- Service role can insert/update/delete (for scraping edge function)
CREATE POLICY "Service role can manage products"
  ON public.products FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create function to update search_vector
CREATE OR REPLACE FUNCTION public.products_search_vector_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    to_tsvector('simple', coalesce(NEW.name, '')) ||
    to_tsvector('simple', coalesce(NEW.description, '')) ||
    to_tsvector('simple', coalesce(NEW.brand, '')) ||
    to_tsvector('simple', coalesce(NEW.category, '')) ||
    to_tsvector('simple', coalesce(NEW.subcategory, '')) ||
    to_tsvector('simple', array_to_string(coalesce(NEW.tags, '{}'), ' '));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger to auto-update search_vector
CREATE TRIGGER products_search_vector_trigger
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.products_search_vector_update();

-- GIN index for full-text search
CREATE INDEX idx_products_search_vector ON public.products USING GIN (search_vector);

-- Index on category for filtering
CREATE INDEX idx_products_category ON public.products (category);

-- Index on price for range queries
CREATE INDEX idx_products_price ON public.products (price);
