
-- 1. otp_codes: deny-all policy (RLS enabled, no policy currently)
CREATE POLICY "otp_codes_deny_all"
ON public.otp_codes
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

-- 2. products: restrict overly-permissive ALL policy to service_role
DROP POLICY IF EXISTS "Service role can manage products" ON public.products;
CREATE POLICY "Service role can manage products"
ON public.products
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 3. Move pg_trgm out of public schema
CREATE SCHEMA IF NOT EXISTS extensions;
GRANT USAGE ON SCHEMA extensions TO anon, authenticated, service_role;
ALTER EXTENSION pg_trgm SET SCHEMA extensions;

-- Update functions that reference pg_trgm operators/functions to include extensions in search_path
ALTER FUNCTION public.hybrid_product_search(text, vector, text, numeric, numeric, numeric, text, boolean) SET search_path = public, extensions;
ALTER FUNCTION public.shift_hybrid_search(uuid, text, vector, text, text, text, integer, integer, boolean, integer) SET search_path = public, extensions;
