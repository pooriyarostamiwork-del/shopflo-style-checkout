import { useState, useRef } from "react";
import { useShiftStore } from "../context/ShiftStoreContext";
import { supabase } from "@/integrations/supabase/client";
import { Upload, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { toPersianDigits } from "../data/format";

const SAMPLE = `name,description,price,original_price,image_url,category,subcategory,species,brand,tags,in_stock,stock_qty,rating,review_count,external_id
غذای خشک گربه بالغ پروپلن,غذای کامل و متعادل برای گربه‌های بالغ,890000,990000,https://example.com/img1.jpg,غذای حیوانات,غذای گربه,گربه,Pro Plan,"گربه|بالغ|غذای خشک",true,50,4.6,124,SKU-001
اسباب‌بازی توپ سگ,توپ لاستیکی مقاوم,180000,,https://example.com/img2.jpg,اسباب بازی,اسباب‌بازی سگ,سگ,KONG,"سگ|اسباب‌بازی|توپ",true,30,4.8,89,SKU-002`;

const AdminCatalogView = () => {
  const { store } = useShiftStore();
  const [csvText, setCsvText] = useState("");
  const [replace, setReplace] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [stats, setStats] = useState<{ total: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const refreshStats = async () => {
    if (!store) return;
    const { count } = await supabase.from("shift_products").select("id", { count: "exact", head: true }).eq("store_id", store.id);
    setStats({ total: count || 0 });
  };

  // Load stats once
  useState(() => { refreshStats(); return undefined; });

  const onFile = (f: File | null) => {
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setCsvText(String(reader.result || ""));
    reader.readAsText(f, "utf-8");
  };

  const onUpload = async () => {
    if (!store || !csvText.trim()) return;
    setBusy(true); setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("shift-import-catalog", {
        body: { store_slug: store.slug, csv: csvText, replace },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      const inserted = (data as any)?.inserted ?? 0;
      setResult({ ok: true, message: `${toPersianDigits(inserted)} محصول وارد شد` });
      // Trigger embedding in background
      supabase.functions.invoke("shift-embed-products", { body: { store_slug: store.slug } }).catch(() => {});
      refreshStats();
    } catch (e: any) {
      setResult({ ok: false, message: e.message || "خطا در ارسال" });
    } finally {
      setBusy(false);
    }
  };

  const onEmbed = async () => {
    if (!store) return;
    setBusy(true);
    try {
      const { data } = await supabase.functions.invoke("shift-embed-products", { body: { store_slug: store.slug } });
      setResult({ ok: true, message: `embedding: ${toPersianDigits((data as any)?.processed ?? 0)} محصول` });
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <header>
        <h1 className="text-xl font-bold">مدیریت کاتالوگ</h1>
        <p className="text-xs text-[hsl(var(--shift-muted))] mt-1">
          فروشگاه فعال: <code className="font-mono">{store?.slug}</code>
          {stats && <span> — {toPersianDigits(stats.total)} محصول</span>}
        </p>
      </header>

      <section className="rounded-xl bg-[hsl(var(--shift-surface))] border border-[hsl(var(--shift-border))] p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Upload className="w-4 h-4" /> آپلود فایل CSV
        </div>

        <div className="flex items-center gap-3">
          <input ref={fileRef} type="file" accept=".csv,text/csv" hidden
            onChange={(e) => onFile(e.target.files?.[0] || null)} />
          <button onClick={() => fileRef.current?.click()}
            className="px-4 py-2 rounded-lg bg-[hsl(var(--shift-bg))] border border-[hsl(var(--shift-border))] text-sm">
            انتخاب فایل
          </button>
          <button onClick={() => setCsvText(SAMPLE)}
            className="text-xs text-[hsl(var(--shift-primary))]">
            <FileText className="w-3 h-3 inline ml-1" /> درج نمونه
          </button>
        </div>

        <textarea
          value={csvText} onChange={(e) => setCsvText(e.target.value)}
          rows={10} dir="ltr" placeholder="یا محتوای CSV را اینجا بچسبانید..."
          className="w-full px-3 py-2 rounded-lg bg-[hsl(var(--shift-bg))] border border-[hsl(var(--shift-border))] text-xs font-mono"
        />

        <label className="flex items-center gap-2 text-xs text-[hsl(var(--shift-muted))]">
          <input type="checkbox" checked={replace} onChange={(e) => setReplace(e.target.checked)} />
          قبل از وارد کردن، تمام محصولات این فروشگاه پاک شوند
        </label>

        <div className="flex flex-wrap gap-2">
          <button onClick={onUpload} disabled={busy || !csvText.trim()}
            className="px-5 py-2.5 rounded-lg bg-[hsl(var(--shift-primary))] text-white text-sm disabled:opacity-50">
            {busy ? "در حال ارسال..." : "آپلود کاتالوگ"}
          </button>
          <button onClick={onEmbed} disabled={busy}
            className="px-5 py-2.5 rounded-lg bg-[hsl(var(--shift-bg))] border border-[hsl(var(--shift-border))] text-sm">
            ساخت embedding برای محصولات جدید
          </button>
        </div>

        {result && (
          <div className={`flex items-center gap-2 text-sm ${result.ok ? "text-emerald-600" : "text-red-500"}`}>
            {result.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {result.message}
          </div>
        )}
      </section>

      <section className="rounded-xl bg-[hsl(var(--shift-surface))] border border-[hsl(var(--shift-border))] p-5 text-xs text-[hsl(var(--shift-muted))] space-y-1.5">
        <div className="text-sm font-medium text-[hsl(var(--shift-fg))] mb-2">فرمت ستون‌های پشتیبانی‌شده</div>
        <div>اجباری: <code className="font-mono">name</code>, <code className="font-mono">price</code></div>
        <div>اختیاری: <code className="font-mono">description, original_price, image_url, image_urls, category, subcategory, species, brand, tags, in_stock, stock_qty, rating, review_count, external_id</code></div>
        <div>چندتایی‌ها (tags / image_urls) با <code className="font-mono">|</code> یا <code className="font-mono">,</code> داخل کوتیشن جدا شوند.</div>
      </section>
    </div>
  );
};

export default AdminCatalogView;
