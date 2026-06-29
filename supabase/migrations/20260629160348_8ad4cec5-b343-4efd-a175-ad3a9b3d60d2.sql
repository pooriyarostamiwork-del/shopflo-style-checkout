
CREATE TABLE public.shift_store_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.shift_stores(id) ON DELETE CASCADE,
  content_key text NOT NULL,
  content_type text NOT NULL DEFAULT 'text',
  value text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (store_id, content_key)
);

GRANT SELECT ON public.shift_store_content TO anon, authenticated;
GRANT ALL ON public.shift_store_content TO service_role;

ALTER TABLE public.shift_store_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active shift store content is publicly readable"
  ON public.shift_store_content
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE TRIGGER shift_store_content_set_updated_at
  BEFORE UPDATE ON public.shift_store_content
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default content for both stores
WITH s AS (
  SELECT id, slug FROM public.shift_stores WHERE slug IN ('raw','petplayground')
)
INSERT INTO public.shift_store_content (store_id, content_key, content_type, value, sort_order, notes)
SELECT s.id, kv.k, kv.t, kv.v, kv.o, kv.n
FROM s
JOIN LATERAL (
  VALUES
    -- Defaults for the original "shift" store (slug='raw')
    ('home.tagline','text', CASE WHEN s.slug='petplayground' THEN 'همراه مهربون رفیق چهارپات' ELSE 'دستیار خرید هوشمند شما' END, 10, 'Subtitle under store name on landing'),
    ('home.promo_banner','text', CASE WHEN s.slug='petplayground' THEN 'غذا، اسباب‌بازی، لوازم — همه‌چی برای رفیق چهارپات' ELSE 'تا صد میلیون خیال جمع — فلوکارت هست، پول کم؟ کم‌کم!' END, 20, 'Top promo strip text'),
    ('home.promo_link_label','text', CASE WHEN s.slug='petplayground' THEN 'دیدن همه دسته‌ها' ELSE 'دریافت وام فلوپی' END, 21, 'CTA shown after promo banner'),
    ('chat.input_placeholder','text', CASE WHEN s.slug='petplayground' THEN '«برام یه چیز خوب برای رفیقم پیدا کن»' ELSE '«خودت برام خرید کن»' END, 30, 'Placeholder text inside the chat input'),
    ('home.suggested_prompt_1','text', CASE WHEN s.slug='petplayground' THEN 'یه اسباب‌بازی برای گربه‌م می‌خوام' ELSE 'محصولات پرفروش رو نشونم بده' END, 40, NULL),
    ('home.suggested_prompt_2','text', CASE WHEN s.slug='petplayground' THEN 'غذای خشک سگ پیشنهاد بده' ELSE 'تخفیف‌های امروز چیه؟' END, 41, NULL),
    ('home.suggested_prompt_3','text', CASE WHEN s.slug='petplayground' THEN 'تشویقی سالم برای توله‌سگ' ELSE 'یه پیشنهاد خوب بهم بده' END, 42, NULL),
    ('footer.copyright','text', CASE WHEN s.slug='petplayground' THEN '© ۱۴۰۵ پت‌پلی‌گراند' ELSE '© ۱۴۰۵ فروشگاه شیفت' END, 50, NULL),
    ('home.logo_url','image_url', NULL, 60, 'Override logo image. Empty falls back to default svg.')
) AS kv(k,t,v,o,n) ON true
ON CONFLICT (store_id, content_key) DO NOTHING;
