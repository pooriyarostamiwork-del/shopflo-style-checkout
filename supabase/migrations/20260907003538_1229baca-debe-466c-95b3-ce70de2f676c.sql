INSERT INTO public.brand_aliases (alias_key, canonical)
SELECT DISTINCT ON (public.brand_key(a.alias)) public.brand_key(a.alias), a.canonical
FROM (VALUES
  ('جوسرا','Josera'),('جوزرا','Josera'),
  ('رویال کنین','Royal Canin'),('رویال کانین','Royal Canin'),('رویالکنین','Royal Canin'),
  ('رفلکس','Reflex'),('فیدار','Fidar'),('سلبن','Celebone'),('سلین','Celine'),
  ('هپی کت','Happy Cat'),('لئوناردو','Leonardo'),('ویسکاس','Whiskas'),('فلیکس','Felix'),
  ('مونژ','Monge'),('هیلز','Hills'),('پروپلن','ProPlan'),('پرو پلن','ProPlan'),
  ('نوبی','Nobby'),('تریکسی','Trixie'),('کربل','Kerbl'),('جیم کت','GimCat'),
  ('بیفار','Beaphar'),('بیولاین','Bioline'),('دکتر کلادرز','Dr.Clauder’s'),('کلادرز','Dr.Clauder’s'),
  ('گورمت','Gourmet'),('وی پت','Vipet'),('ویپت','Vipet'),('سنسو','Senso'),
  ('رویال فید','Royal Feed'),('تاپ فید','TopFeed'),('نوتری پت','Nutri Pet'),('نوتری','Nutri'),
  ('کیت کت','Kit Cat'),('کیتکت','KitCat'),('میوکت','MeoCat'),('وانپی','Wanpy'),
  ('جرهای','Jerhigh'),('دریمیز','Dreamies'),('زیل','Zeal'),('تست او د وایلد','Taste Of The Wild'),
  ('مونلو','Monello'),('آراکال','Aracal'),('کاراکال','Caracal'),('پتیران','Petiran'),
  ('نیناپت','Ninapet'),('نینا پت','Ninapet'),('ماهیران','Mahiran'),('زاریکس','Zarix'),
  ('رانووا','Ranova'),('رداسپرینگ','Redspring'),('رد اسپرینگ','Redspring'),('پولر','Puller'),
  ('استفان پلاست','Stefanplast'),('توکان','Toucan'),('اسنکی کرانچ','Snacky Crunch'),
  ('آدریانا پت','Adriana Pet'),('بونست','Bonnest'),('گرین','Green'),('هیمالیان','Himalayan'),
  ('یامیکس','Yummix'),('زوریخ','Zurich'),('وینستون','Winston'),('کاشه','Cachet'),
  ('هاگن','Hagen'),('پت گارد','Petguard'),('پرسا','Perssa'),('اسکارلت','Scarlet'),
  ('راینو','Rhino'),('رولی','Rolly'),('نئوپت','Neopet'),('پتوپیا','Petopia'),
  ('ارتز پت','Earthz Pet'),('گیگوی','GiGwi'),('ام پتس','M Pets'),('یوروپت','Europet'),
  ('فرافود','Fara food'),('مو فید','MoFeed'),('مکیان دام پارس','Makian Dam Pars'),
  ('براوکتو','Bravecto'),('اندوپت','Endopet'),('آکواپت','Aquapet'),('آسوپد','Asoopad'),
  ('پت آباد','Petabad'),('پتابد','Petabad'),('بیورن','Bioran'),('چکاوک','Chakavak')
) AS a(alias, canonical)
WHERE NOT EXISTS (
  SELECT 1 FROM public.brand_aliases b WHERE b.alias_key = public.brand_key(a.alias)
)
ORDER BY public.brand_key(a.alias);

-- Latin spellings resolve to themselves so brand_match_keys returns all variants
INSERT INTO public.brand_aliases (alias_key, canonical)
SELECT DISTINCT ON (public.brand_key(p.brand)) public.brand_key(p.brand), p.brand
FROM public.pet_products p
WHERE p.brand IS NOT NULL AND btrim(p.brand) <> ''
  AND NOT EXISTS (
    SELECT 1 FROM public.brand_aliases b WHERE b.alias_key = public.brand_key(p.brand)
  )
ORDER BY public.brand_key(p.brand);