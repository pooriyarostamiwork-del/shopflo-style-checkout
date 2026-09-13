ALTER TABLE public.pet_products ALTER COLUMN type_group DROP EXPRESSION;
ALTER TABLE public.pet_products ALTER COLUMN product_type DROP EXPRESSION;

CREATE OR REPLACE FUNCTION public.pet_products_fill_product_type()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.product_type IS NULL THEN
    NEW.product_type := public.pet_derive_product_type(NEW.name, NEW.subcategory, NEW.category);
  END IF;
  IF NEW.type_group IS NULL THEN
    NEW.type_group := public.pet_type_group(NEW.product_type);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER pet_products_fill_product_type_trg
BEFORE INSERT ON public.pet_products
FOR EACH ROW EXECUTE FUNCTION public.pet_products_fill_product_type();