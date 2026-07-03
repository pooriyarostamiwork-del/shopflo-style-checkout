-- Remove public read on prompt chapters (edge function uses service role)
DROP POLICY IF EXISTS "Public read active chapters" ON public.shift_prompt_chapters;

-- Also restrict volumes and master prompts to service role only (they reveal prompt structure/titles)
DROP POLICY IF EXISTS "Public read active volumes" ON public.shift_prompt_volumes;
DROP POLICY IF EXISTS "Public read active master prompts" ON public.shift_master_prompts;

-- Hide vendor_prompt column from public/authenticated readers via column-level privileges.
-- RLS row policy still allows selecting the row; PostgREST will only return granted columns.
REVOKE SELECT ON public.shift_stores FROM anon, authenticated;
GRANT SELECT (
  id, slug, name_fa, tagline_fa, logo_url, hero_image_url,
  theme_primary, theme_accent, currency, suggested_prompts,
  is_active, category_id, master_prompt_id, created_at, updated_at
) ON public.shift_stores TO anon, authenticated;
