UPDATE public.pet_products
SET breed_size = NULL
WHERE breed_size IS NOT NULL AND species IS NOT NULL AND species NOT ILIKE '%سگ%';