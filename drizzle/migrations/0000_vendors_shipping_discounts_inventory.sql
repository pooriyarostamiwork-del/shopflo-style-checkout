CREATE TABLE public.vendors (
  vendor_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  category text NOT NULL CHECK (category IN ('pet','digital')),
  owner_phone text,
  is_flowcart boolean NOT NULL DEFAULT false,
  is_shift boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  store_url text,
  api_key text,
  last_synced_at timestamptz,
  shipping_method_ids text[] NOT NULL DEFAULT '{}',
  discount_ids text[] NOT NULL DEFAULT '{}',
  shipping_agent_context jsonb NOT NULL DEFAULT '[]'::jsonb,
  discount_agent_context jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.vendors TO service_role;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
-- no client policies: owner_phone/api_key stay server-only

CREATE TABLE public.shipping_methods (
  id text PRIMARY KEY,
  vendor_id uuid NOT NULL REFERENCES public.vendors(vendor_id) ON DELETE CASCADE,
  title text NOT NULL,
  cost integer NOT NULL DEFAULT 0,
  estimated_days text,
  external_rate_id text,
  is_cod boolean NOT NULL DEFAULT false,
  is_default boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.shipping_methods TO anon, authenticated;
GRANT ALL ON public.shipping_methods TO service_role;
ALTER TABLE public.shipping_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active shipping methods are public" ON public.shipping_methods FOR SELECT TO anon, authenticated USING (is_active);

CREATE TABLE public.discounts (
  id text PRIMARY KEY,
  vendor_id uuid NOT NULL REFERENCES public.vendors(vendor_id) ON DELETE CASCADE,
  code text,
  title text NOT NULL,
  type text,
  value numeric,
  min_order_amount integer,
  max_discount_amount integer,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','expired','disabled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.discounts IS 'Placeholder: final shape decided with the discount engine';
GRANT ALL ON public.discounts TO service_role;
ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.vendor_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES public.vendors(vendor_id) ON DELETE CASCADE,
  master_product_id uuid NOT NULL,
  master_table text NOT NULL CHECK (master_table IN ('pet_master','digital_master')),
  external_product_id text,
  price integer NOT NULL,
  original_price integer,
  in_stock boolean NOT NULL DEFAULT true,
  stock_qty integer,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (vendor_id, master_table, master_product_id)
);
COMMENT ON TABLE public.vendor_inventory IS 'Interim copy of master pricing/stock; variant-aware design pending';
CREATE INDEX vendor_inventory_master_idx ON public.vendor_inventory (master_table, master_product_id);
GRANT SELECT ON public.vendor_inventory TO anon, authenticated;
GRANT ALL ON public.vendor_inventory TO service_role;
ALTER TABLE public.vendor_inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active offers are public" ON public.vendor_inventory FOR SELECT TO anon, authenticated USING (is_active);

CREATE TRIGGER vendors_updated_at BEFORE UPDATE ON public.vendors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER shipping_methods_updated_at BEFORE UPDATE ON public.shipping_methods FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER discounts_updated_at BEFORE UPDATE ON public.discounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER vendor_inventory_updated_at BEFORE UPDATE ON public.vendor_inventory FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Initial PetAbad backfill
INSERT INTO public.vendors (name, slug, category, owner_phone, is_flowcart, is_shift, store_url, shipping_method_ids, shipping_agent_context)
VALUES ('پت‌آباد', 'petabad', 'pet', '09122752540', false, true, 'https://petabad.com',
  ARRAY['petabad_standard','petabad_express','petabad_courier'],
  '[{"id":"petabad_standard","title":"ارسال عادی","cost":55000,"hint":"۲ تا ۷ روز کاری، ۵۵ هزار تومان"},{"id":"petabad_express","title":"ارسال اکسپرس","cost":85000,"hint":"۲ تا ۴ روز کاری، ۸۵ هزار تومان"},{"id":"petabad_courier","title":"ارسال با پیک","cost":0,"hint":"تحویل امروز، پس‌کرایه"}]'::jsonb);

INSERT INTO public.shipping_methods (id, vendor_id, title, cost, estimated_days, is_cod, is_default, sort_order)
SELECT m.id, v.vendor_id, m.title, m.cost, m.days, m.cod, m.def, m.ord
FROM public.vendors v,
(VALUES ('petabad_standard','ارسال عادی',55000,'۲ تا ۷ روز کاری',false,true,1),
        ('petabad_express','ارسال اکسپرس',85000,'۲ تا ۴ روز کاری',false,false,2),
        ('petabad_courier','ارسال با پیک',0,'امروز',true,false,3)) AS m(id,title,cost,days,cod,def,ord)
WHERE v.slug = 'petabad';

INSERT INTO public.vendor_inventory (vendor_id, master_product_id, master_table, price, original_price, in_stock)
SELECT v.vendor_id, p.id, 'pet_master', p.price, p.original_price, p.in_stock
FROM public.pet_master p CROSS JOIN public.vendors v
WHERE v.slug = 'petabad';