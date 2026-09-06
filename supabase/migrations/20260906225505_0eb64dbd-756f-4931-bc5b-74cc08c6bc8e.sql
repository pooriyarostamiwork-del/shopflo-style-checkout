CREATE OR REPLACE FUNCTION public.set_pet_product_embedding(p_id uuid, p_embedding vector)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.pet_products SET embedding = p_embedding WHERE id = p_id;
$$;

GRANT EXECUTE ON FUNCTION public.set_pet_product_embedding(uuid, vector) TO anon;
GRANT EXECUTE ON FUNCTION public.set_pet_product_embedding(uuid, vector) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_pet_product_embedding(uuid, vector) TO service_role;