-- Derive a functional product type from shelf + product name (no LLM guessing).
CREATE OR REPLACE FUNCTION public.pet_derive_product_type(p_name text, p_subcategory text, p_category text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public'
AS $$
  WITH t AS (
    SELECT public.normalize_persian(coalesce(p_name,'') || ' ' || coalesce(p_subcategory,'') || ' ' || coalesce(p_category,'')) AS h,
           public.normalize_persian(coalesce(p_subcategory,'') || ' ' || coalesce(p_category,'')) AS shelf
  )
  SELECT CASE
    WHEN h ~ 'خمیر مالت' THEN 'خمیر مالت'
    WHEN h ~ 'کنسرو' THEN 'کنسرو'
    WHEN h ~ 'پوچ' THEN 'پوچ'
    WHEN h ~ 'سوپ' THEN 'سوپ'
    WHEN h ~ '(موس|کاسه ای|کاسه‌ای|کاسه)' AND shelf ~ '(غذای تر|کنسرو|پوچ)' THEN 'پوچ'
    WHEN shelf ~ '(غذای تر|کنسرو|پوچ)' THEN 'غذای تر'
    WHEN h ~ '(تشویقی|بیسکویت|بستنی|اسنک)' THEN 'تشویقی'
    WHEN h ~ 'غذای خشک' OR shelf ~ 'غذای خشک' THEN 'غذای خشک'
    WHEN h ~ 'شیر خشک' THEN 'شیر خشک'
    WHEN h ~ 'غذای درمانی' THEN 'غذای درمانی'
    WHEN h ~ 'خاک' THEN 'خاک و ظرف بهداشتی'
    WHEN h ~ '(شامپو|نرم کننده|صابون)' THEN 'شامپو و نرم‌کننده'
    WHEN h ~ '(اسپری|فوم|ادکلن|عطر|دئودورانت)' THEN 'اسپری و فوم'
    WHEN h ~ '(مسواک|خمیر دندان|خمیردندان|دهان)' THEN 'بهداشت دهان'
    WHEN h ~ '(برس|پرزگیر|ماساژور|شانه|ناخن گیر|ناخن‌گیر|قیچی|ماشین اصلاح)' THEN 'ابزار آرایش و نظافت'
    WHEN h ~ '(قطره|شربت|قرص|ضد انگل|ضدانگل|پیپت|پماد|آمپول|درمان)' THEN 'دارو و درمان'
    WHEN h ~ '(مکمل|ویتامین|پروبیوتیک|کلسیم|امگا)' THEN 'مکمل و ویتامین'
    WHEN h ~ '(اسکرچر|درخت گربه)' THEN 'اسکرچر و درخت'
    WHEN h ~ '(اسباب بازی|توپ|تونل|عروسک|موش پارچه|لیزر|میله بازی)' THEN 'اسباب‌بازی'
    WHEN h ~ '(ظرف|آبخوری|فواره|غذاخوری|آب سرد کن)' THEN 'ظرف آب و غذا'
    WHEN h ~ '(تخت|تشک|جای خواب|لانه|خانه|پتو)' THEN 'جای خواب'
    WHEN h ~ '(باکس|حمل|کریر|کوله|ترولی)' THEN 'حمل و نقل'
    WHEN h ~ '(قلاده|هارنس|افسار|پلاک)' THEN 'قلاده و هارنس'
    WHEN h ~ '(لباس|کاپشن|بارانی|جوراب|کفش)' THEN 'لباس'
    WHEN h ~ '(قفس|لانه پرنده|آکواریوم|اکواریوم|فیلتر|هیتر)' THEN 'قفس و آکواریوم'
    ELSE NULL
  END
  FROM t;
$$;

CREATE OR REPLACE FUNCTION public.pet_type_group(p_type text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public'
AS $$
  SELECT CASE
    WHEN p_type IN ('کنسرو','پوچ','سوپ','غذای تر','غذای خشک','تشویقی','شیر خشک','غذای درمانی') THEN 'غذا'
    WHEN p_type IN ('خاک و ظرف بهداشتی','شامپو و نرم‌کننده','اسپری و فوم','بهداشت دهان','ابزار آرایش و نظافت') THEN 'بهداشت'
    WHEN p_type IN ('دارو و درمان','مکمل و ویتامین','خمیر مالت') THEN 'سلامت'
    WHEN p_type IN ('اسباب‌بازی','اسکرچر و درخت') THEN 'اسباب‌بازی'
    WHEN p_type IN ('ظرف آب و غذا','جای خواب','حمل و نقل','قلاده و هارنس','لباس','قفس و آکواریوم') THEN 'لوازم'
    ELSE NULL
  END;
$$;

ALTER TABLE public.pet_products
  ADD COLUMN IF NOT EXISTS product_type text
    GENERATED ALWAYS AS (public.pet_derive_product_type(name, subcategory, category)) STORED,
  ADD COLUMN IF NOT EXISTS type_group text
    GENERATED ALWAYS AS (public.pet_type_group(public.pet_derive_product_type(name, subcategory, category))) STORED;

CREATE INDEX IF NOT EXISTS pet_products_product_type_idx ON public.pet_products (product_type);
CREATE INDEX IF NOT EXISTS pet_products_type_group_idx ON public.pet_products (type_group);
