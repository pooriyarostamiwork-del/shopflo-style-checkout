CREATE TABLE IF NOT EXISTS public.pet_taxonomy_dimensions (
  key text PRIMARY KEY,
  name_fa text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pet_taxonomy_terms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dimension_key text NOT NULL REFERENCES public.pet_taxonomy_dimensions(key) ON DELETE CASCADE,
  canonical_fa text NOT NULL,
  english_key text,
  definition text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (dimension_key, canonical_fa)
);

CREATE TABLE IF NOT EXISTS public.pet_taxonomy_aliases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dimension_key text NOT NULL REFERENCES public.pet_taxonomy_dimensions(key) ON DELETE CASCADE,
  alias text NOT NULL,
  canonical_fa text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (dimension_key, alias)
);

GRANT SELECT ON public.pet_taxonomy_dimensions TO anon, authenticated;
GRANT SELECT ON public.pet_taxonomy_terms TO anon, authenticated;
GRANT SELECT ON public.pet_taxonomy_aliases TO anon, authenticated;
GRANT ALL ON public.pet_taxonomy_dimensions TO service_role;
GRANT ALL ON public.pet_taxonomy_terms TO service_role;
GRANT ALL ON public.pet_taxonomy_aliases TO service_role;

ALTER TABLE public.pet_taxonomy_dimensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pet_taxonomy_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pet_taxonomy_aliases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pet taxonomy dimensions readable" ON public.pet_taxonomy_dimensions FOR SELECT USING (true);
CREATE POLICY "pet taxonomy terms readable" ON public.pet_taxonomy_terms FOR SELECT USING (true);
CREATE POLICY "pet taxonomy aliases readable" ON public.pet_taxonomy_aliases FOR SELECT USING (true);

INSERT INTO public.pet_taxonomy_dimensions (key, name_fa) VALUES
  ('species','نوع حیوان'),
  ('life_stage','مرحله سنی'),
  ('breed_size','اندازه نژاد'),
  ('type_group','گروه محصول'),
  ('health_need','نیاز سلامتی')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.pet_taxonomy_terms (dimension_key, canonical_fa, english_key, sort_order) VALUES
  ('species','گربه','cat',1),
  ('species','سگ','dog',2),
  ('species','پرندگان','bird',3),
  ('species','جوندگان','rodent',4),
  ('species','خرگوش','rabbit',5),
  ('species','آبزیان','fish',6),
  ('species','خزندگان','reptile',7),
  ('life_stage','نابالغ','junior',1),
  ('life_stage','بالغ','adult',2),
  ('life_stage','سنیور','senior',3),
  ('breed_size','کوچک','small',1),
  ('breed_size','متوسط','medium',2),
  ('breed_size','بزرگ','large',3),
  ('type_group','غذا','food',1),
  ('type_group','سلامت','health',2),
  ('type_group','بهداشت','hygiene',3),
  ('type_group','اسباب‌بازی','toy',4),
  ('type_group','لوازم','accessory',5),
  ('health_need','پوست و مو','skin_coat',1),
  ('health_need','گوارش حساس','sensitive_digestion',2),
  ('health_need','سلامت دندان','dental',3),
  ('health_need','کلیه و مجاری ادرار','renal_urinary',4),
  ('health_need','عقیم شده','sterilised',5),
  ('health_need','کنترل وزن','weight_control',6),
  ('health_need','مفاصل','joints',7),
  ('health_need','گلوله مویی','hairball',8),
  ('health_need','ضد حساسیت','anti_allergy',9),
  ('health_need','درمانی','therapeutic',10),
  ('health_need','داخل خانه','indoor',11)
ON CONFLICT (dimension_key, canonical_fa) DO NOTHING;

INSERT INTO public.pet_taxonomy_aliases (dimension_key, alias, canonical_fa) VALUES
  ('species','cat','گربه'),('species','گربه ها','گربه'),('species','بچه گربه','گربه'),('species','بچه‌گربه','گربه'),('species','گربه عقیم','گربه'),('species','پیشی','گربه'),('species','kitten','گربه'),
  ('species','dog','سگ'),('species','توله سگ','سگ'),('species','توله‌سگ','سگ'),('species','سگ عروسکی','سگ'),('species','سگ خیلی بزرگ','سگ'),('species','puppy','سگ'),
  ('species','پرنده','پرندگان'),('species','طوطی','پرندگان'),('species','قناری','پرندگان'),('species','مرغ عشق','پرندگان'),('species','عروس هلندی','پرندگان'),('species','کاسکو','پرندگان'),('species','فنچ','پرندگان'),('species','مرغ مینا','پرندگان'),('species','bird','پرندگان'),
  ('species','همستر','جوندگان'),('species','خوکچه هندی','جوندگان'),('species','جونده','جوندگان'),('species','hamster','جوندگان'),
  ('species','خرگوش ها','خرگوش'),('species','rabbit','خرگوش'),
  ('species','ماهی','آبزیان'),('species','fish','آبزیان'),
  ('species','خزنده','خزندگان'),('species','لاکپشت','خزندگان'),('species','reptile','خزندگان'),
  ('life_stage','مسن','سنیور'),('life_stage','پیر','سنیور'),('life_stage','سالمند','سنیور'),('life_stage','senior','سنیور'),('life_stage','elderly','سنیور'),
  ('life_stage','بچه','نابالغ'),('life_stage','توله','نابالغ'),('life_stage','junior','نابالغ'),('life_stage','kitten','نابالغ'),('life_stage','puppy','نابالغ'),('life_stage','جوان','نابالغ'),
  ('life_stage','adult','بالغ'),('life_stage','بزرگسال','بالغ'),
  ('breed_size','small','کوچک'),('breed_size','مینیاتوری','کوچک'),('breed_size','کوتوله','کوچک'),
  ('breed_size','medium','متوسط'),('breed_size','میان اندازه','متوسط'),
  ('breed_size','large','بزرگ'),('breed_size','غول','بزرگ'),('breed_size','نژاد بزرگ','بزرگ'),
  ('health_need','ریزش مو','پوست و مو'),('health_need','hair & skin','پوست و مو'),('health_need','پوست','پوست و مو'),('health_need','مو','پوست و مو'),('health_need','skin','پوست و مو'),
  ('health_need','هربال','گلوله مویی'),('health_need','hairball','گلوله مویی'),
  ('health_need','معده حساس','گوارش حساس'),('health_need','گوارش','گوارش حساس'),('health_need','sensitive','گوارش حساس'),
  ('health_need','دندان','سلامت دندان'),('health_need','dental','سلامت دندان'),
  ('health_need','کلیه','کلیه و مجاری ادرار'),('health_need','ادراری','کلیه و مجاری ادرار'),('health_need','urinary','کلیه و مجاری ادرار'),('health_need','renal','کلیه و مجاری ادرار'),
  ('health_need','اسپی شده','عقیم شده'),('health_need','sterilised','عقیم شده'),('health_need','sterilized','عقیم شده'),('health_need','neutered','عقیم شده'),
  ('health_need','چاقی','کنترل وزن'),('health_need','لاغری','کنترل وزن'),('health_need','light','کنترل وزن'),
  ('health_need','مفصل','مفاصل'),('health_need','joint','مفاصل'),
  ('health_need','آلرژی','ضد حساسیت'),('health_need','حساسیت غذایی','ضد حساسیت'),('health_need','allergy','ضد حساسیت'),
  ('health_need','رژیمی','درمانی'),('health_need','veterinary','درمانی'),('health_need','دارویی','درمانی'),
  ('health_need','آپارتمانی','داخل خانه'),('health_need','indoor','داخل خانه')
ON CONFLICT (dimension_key, alias) DO NOTHING;

CREATE OR REPLACE FUNCTION public.pet_taxonomy_normalize(p_dimension text, p_value text)
RETURNS text
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  WITH v AS (SELECT public.normalize_persian(btrim(coalesce(p_value,''))) AS n)
  SELECT COALESCE(
    (SELECT t.canonical_fa FROM public.pet_taxonomy_terms t, v
      WHERE t.dimension_key = p_dimension AND t.is_active
        AND public.normalize_persian(t.canonical_fa) = v.n LIMIT 1),
    (SELECT a.canonical_fa FROM public.pet_taxonomy_aliases a, v
      WHERE a.dimension_key = p_dimension
        AND public.normalize_persian(a.alias) = v.n LIMIT 1)
  );
$$;