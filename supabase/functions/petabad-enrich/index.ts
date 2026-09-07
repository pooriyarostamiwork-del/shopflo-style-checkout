import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// PetAbad-only catalog enrichment. The database trigger already derives everything
// that can be parsed deterministically; this function only fills what is STILL empty,
// using the model as a reader of the product's own text — never as a fact inventor.

const COUNTRIES = [
  "آلمان", "ایران", "چین", "آمریکا", "فرانسه", "روسیه", "اوکراین", "ایتالیا", "ترکیه",
  "لهستان", "سوئیس", "سنگاپور", "نیوزیلند", "اسپانیا", "انگلیس", "برزیل", "هلند",
  "تایلند", "هند", "کره جنوبی", "بلژیک", "کانادا", "اتریش", "مجارستان", "چک", "ژاپن", "استرالیا",
];
const LIFE_STAGES = ["نابالغ", "بالغ", "سنیور"];
const BREED_SIZES = ["کوچک", "متوسط", "بزرگ"];
const NEEDS = [
  "پوست و مو", "گوارش حساس", "کلیه و مجاری ادرار", "عقیم شده", "کنترل وزن",
  "ضد حساسیت", "گلوله مویی", "داخل خانه", "درمانی", "سلامت دندان", "مفاصل",
];

const SYSTEM = `تو یک متخصص داده‌های کاتالوگ پت‌شاپ هستی.
برای هر محصول، فقط از متن خودش (نام، توضیحات، ویژگی‌ها، برند) اطلاعات ساختاریافته استخراج کن.
اگر یک مقدار در متن نبود و از برند/نام هم قابل استنباط مطمئن نبود، همان فیلد را null یا خالی بگذار. هیچ‌وقت حدس نزن و اطلاعات نساز.
مقادیر باید دقیقاً از فهرست مجاز انتخاب شوند.
کشورهای مجاز: ${COUNTRIES.join(" | ")}
مرحله زندگی: ${LIFE_STAGES.join(" | ")}
اندازه نژاد: ${BREED_SIZES.join(" | ")}
نیازهای سلامتی: ${NEEDS.join(" | ")}
خروجی فقط JSON.`;

type Row = Record<string, any>;

function buildUserPayload(rows: Row[]): string {
  return JSON.stringify(
    rows.map((r) => ({
      id: r.id,
      name: r.name,
      brand: r.brand,
      species: r.species,
      subcategory: r.subcategory,
      description: (r.short_description || r.description || "").slice(0, 700),
      tags: (r.tags || []).slice(0, 20),
      specs: r.specs || {},
    })),
    null,
    0,
  );
}

const SCHEMA = {
  type: "object",
  properties: {
    products: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          origin_country: { type: ["string", "null"], enum: [...COUNTRIES, null] },
          life_stage: { type: ["string", "null"], enum: [...LIFE_STAGES, null] },
          breed_size: { type: ["string", "null"], enum: [...BREED_SIZES, null] },
          health_needs: { type: "array", items: { type: "string", enum: NEEDS } },
          product_line: { type: ["string", "null"] },
          short_description: { type: ["string", "null"] },
        },
        required: ["id"],
        additionalProperties: false,
      },
    },
  },
  required: ["products"],
  additionalProperties: false,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "LOVABLE_API_KEY not configured" }, 500);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const batchSize = Math.min(Math.max(Number(body.batch_size) || 12, 1), 25);
    const maxBatches = Math.min(Math.max(Number(body.max_batches) || 1, 1), 6);
    const dryRun = body.dry_run === true;

    if (body.report === true) {
      const countOf = async (build: (q: any) => any) => {
        const { count } = await build(
          supabase.from("pet_products").select("id", { count: "exact", head: true }),
        );
        return count ?? 0;
      };
      return json({
        coverage: {
          total: await countOf((q: any) => q),
          missing_country: await countOf((q: any) => q.is("origin_country", null)),
          missing_life_stage: await countOf((q: any) => q.is("life_stage", null)),
          missing_breed_size: await countOf((q: any) => q.is("breed_size", null)),
          missing_product_line: await countOf((q: any) => q.is("product_line", null)),
          missing_needs: await countOf((q: any) => q.eq("health_needs", "{}")),
          not_enriched: await countOf((q: any) => q.is("enriched_at", null)),
        },
      });
    }

    let processed = 0;
    let updated = 0;
    const notes: string[] = [];

    for (let batch = 0; batch < maxBatches; batch++) {
      // Rows still missing something the parser could not derive.
      const { data: rows, error } = await supabase
        .from("pet_products")
        .select("id,name,brand,species,subcategory,short_description,description,tags,specs,origin_country,life_stage,breed_size,product_line,health_needs")
        .is("enriched_at", null)
        .or("origin_country.is.null,life_stage.is.null,breed_size.is.null,product_line.is.null")
        .limit(batchSize);

      if (error) return json({ error: error.message }, 500);
      if (!rows || rows.length === 0) {
        notes.push("no_rows_left");
        break;
      }

      const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
        },
        body: JSON.stringify({
          model: "google/gemini-3.1-flash-lite",
          messages: [
            { role: "system", content: SYSTEM },
            { role: "user", content: buildUserPayload(rows) },
          ],
          response_format: {
            type: "json_schema",
            json_schema: { name: "pet_enrichment", strict: false, schema: SCHEMA },
          },
        }),
      });

      if (aiRes.status === 429 || aiRes.status >= 500) {
        return json({ error: "AI gateway busy, retry later", status: aiRes.status, processed, updated }, 429);
      }
      if (aiRes.status === 402 || aiRes.status === 403) {
        const detail = await aiRes.text();
        return json({ error: "AI access blocked", status: aiRes.status, detail, processed, updated }, aiRes.status);
      }
      if (!aiRes.ok) {
        const detail = await aiRes.text();
        return json({ error: "AI request failed", status: aiRes.status, detail }, 500);
      }

      const payload = await aiRes.json();
      let parsed: any = {};
      try {
        parsed = JSON.parse(payload?.choices?.[0]?.message?.content || "{}");
      } catch {
        parsed = {};
      }
      const suggestions: Row[] = Array.isArray(parsed.products) ? parsed.products : [];

      for (const row of rows) {
        processed++;
        const s = suggestions.find((x) => x.id === row.id);
        const patch: Row = { enriched_at: new Date().toISOString() };

        if (s) {
          if (!row.origin_country && s.origin_country && COUNTRIES.includes(s.origin_country)) {
            patch.origin_country = s.origin_country;
          }
          if (!row.life_stage && s.life_stage && LIFE_STAGES.includes(s.life_stage)) {
            patch.life_stage = s.life_stage;
          }
          if (!row.breed_size && s.breed_size && BREED_SIZES.includes(s.breed_size)) {
            patch.breed_size = s.breed_size;
          }
          if (!row.product_line && typeof s.product_line === "string" && s.product_line.trim()) {
            patch.product_line = s.product_line.trim().slice(0, 80);
          }
          const needs = Array.isArray(s.health_needs) ? s.health_needs.filter((n: string) => NEEDS.includes(n)) : [];
          if ((row.health_needs || []).length === 0 && needs.length > 0) patch.health_needs = needs;
          if (!row.short_description && typeof s.short_description === "string" && s.short_description.trim()) {
            patch.short_description = s.short_description.trim().slice(0, 300);
          }
        }

        if (dryRun) continue;
        const { error: upErr } = await supabase.from("pet_products").update(patch).eq("id", row.id);
        if (upErr) console.error("update failed", row.id, upErr.message);
        else if (Object.keys(patch).length > 1) updated++;
      }

      if (rows.length < batchSize) {
        notes.push("last_batch");
        break;
      }
    }

    const { data: remaining } = await supabase
      .from("pet_products")
      .select("id", { count: "exact", head: true })
      .is("enriched_at", null);

    return json({ processed, updated, dry_run: dryRun, notes, remaining_hint: remaining ?? null });
  } catch (e) {
    console.error("petabad-enrich error", e);
    return json({ error: String(e) }, 500);
  }
});
