import { useState } from "react";
import {
  BadgeCheck,
  ChevronDown,
  Crown,
  Globe,
  Info,
  Minus,
  Plus,
  ShieldQuestion,
  Sparkle,
  TriangleAlert,
} from "lucide-react";
import { PgProduct, faPrice, toFa } from "../data/mockStore";
import {
  PgComparison,
  PgCompareRow,
  PgConfidence,
} from "../data/mockComparison";

interface Props {
  comparison: PgComparison;
  cartIds: string[];
  onAddToCart: (p: PgProduct) => void;
  onSend: (text: string) => void;
}

const CONF: Record<PgConfidence, { label: string; cls: string; dot: string }> = {
  high: {
    label: "اعتماد بالا",
    cls: "text-emerald-700 bg-emerald-50 border-emerald-200",
    dot: "bg-emerald-500",
  },
  medium: {
    label: "اعتماد متوسط",
    cls: "text-amber-700 bg-amber-50 border-amber-200",
    dot: "bg-amber-500",
  },
  low: {
    label: "اعتماد پایین",
    cls: "text-muted-foreground bg-muted/50 border-border",
    dot: "bg-muted-foreground",
  },
};

const cell = (row: PgCompareRow, v: string | null) => {
  if (v === null) return "—";
  if (row.key === "price") return faPrice(Number(v));
  if (row.key === "rating") return toFa(v);
  return toFa(v);
};

const Chip = ({
  children,
  onClick,
  tone = "ghost",
}: {
  children: React.ReactNode;
  onClick: () => void;
  tone?: "ghost" | "solid";
}) => (
  <button
    onClick={onClick}
    className={`px-3 py-2 rounded-xl text-xs transition-colors ${
      tone === "solid"
        ? "bg-primary text-primary-foreground hover:opacity-90"
        : "border border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
    }`}
  >
    {children}
  </button>
);

export const PgComparisonBlock = ({ comparison, cartIds, onAddToCart, onSend }: Props) => {
  const [showAll, setShowAll] = useState(false);
  const c = comparison;
  const conf = CONF[c.verdict.confidence];
  const cols = c.columns;
  const gridCols =
    cols.length === 3
      ? "grid-cols-[minmax(88px,1fr)_repeat(3,minmax(0,1fr))]"
      : "grid-cols-[minmax(88px,1fr)_repeat(2,minmax(0,1fr))]";

  return (
    <div className="pg-card pg-anim-in overflow-hidden" dir="rtl">
      {/* ---------- Header ---------- */}
      <div className="p-3.5 border-b border-border">
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-3">
          <Sparkle className="w-3.5 h-3.5 text-primary" />
          {c.scope}
        </div>
        <div className={`grid gap-2 ${cols.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
          {cols.map((col, i) => (
            <div
              key={col.id}
              className={`p-2 rounded-xl border ${
                c.verdict.winnerIndex === i
                  ? "border-primary/50 bg-primary/5"
                  : "border-border"
              }`}
            >
              <div className="flex items-start gap-2">
                {col.image && (
                  <img
                    src={col.image}
                    alt={col.name}
                    loading="lazy"
                    className="w-10 h-10 rounded-lg object-cover bg-muted/40 shrink-0"
                  />
                )}
                <div className="min-w-0">
                  <p className="text-[11px] font-medium leading-snug line-clamp-2">
                    {col.shortName}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {col.price ? faPrice(col.price) : "قیمت نامشخص"}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1 mt-2">
                {col.external ? (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] border border-border text-muted-foreground">
                    <Globe className="w-3 h-3" />
                    خارجی
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] border border-emerald-200 bg-emerald-50 text-emerald-700">
                    <BadgeCheck className="w-3 h-3" />
                    موجود در فروشگاه ما
                  </span>
                )}
                {col.current && (
                  <span className="px-1.5 py-0.5 rounded-md text-[10px] border border-primary/40 text-primary">
                    انتخاب فعلی تو
                  </span>
                )}
                {!col.inStock && (
                  <span className="px-1.5 py-0.5 rounded-md text-[10px] border border-border text-muted-foreground">
                    ناموجود
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ---------- Issue banners ---------- */}
      {c.issues.length > 0 && (
        <div className="px-3.5 pt-3 space-y-2">
          {c.issues.map((iss, i) => (
            <div
              key={`${iss.kind}-${i}`}
              className="flex items-start gap-2 p-2.5 rounded-xl bg-muted/50 border border-border"
            >
              {iss.kind === "mixed-category" || iss.kind === "low-confidence" ? (
                <TriangleAlert className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
              ) : (
                <Info className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
              )}
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                {iss.message}
                {iss.hint && <span className="block mt-0.5">{iss.hint}</span>}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ---------- Single-product state ---------- */}
      {c.mode === "single" ? (
        <div className="p-3.5 space-y-3">
          <p className="text-xs leading-relaxed">{c.verdict.sentence}</p>
          <div className="flex flex-wrap gap-2">
            {c.candidates?.map((p) => (
              <Chip
                key={p.id}
                onClick={() => onSend(`${p.name} را با گزینه قبلی مقایسه کن`)}
              >
                {p.name.split(" ").slice(0, 3).join(" ")}
              </Chip>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* ---------- AI Verdict ---------- */}
          <div className="p-3.5 border-b border-border">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                {c.verdict.winnerIndex !== null ? (
                  <Crown className="w-4 h-4 text-primary" />
                ) : (
                  <ShieldQuestion className="w-4 h-4 text-muted-foreground" />
                )}
                نظر نهایی هوش مصنوعی
              </span>
              <span
                className={`ms-auto inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] border ${conf.cls}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${conf.dot}`} />
                {conf.label}
              </span>
            </div>
            <p className="text-sm leading-relaxed">{c.verdict.sentence}</p>
            <p className="text-[11px] text-muted-foreground mt-1.5">
              {c.verdict.confidenceNote}
            </p>

            {c.clarify && (
              <div className="mt-3">
                <p className="text-[11px] text-muted-foreground mb-2">
                  {c.clarify.question}
                </p>
                <div className="flex flex-wrap gap-2">
                  {c.clarify.quickReplies.map((q) => (
                    <Chip key={q} onClick={() => onSend(q)}>
                      {q}
                    </Chip>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ---------- Top differences ---------- */}
          {c.topDifferences.length > 0 && (
            <div className="p-3.5 border-b border-border">
              <h4 className="text-xs font-medium mb-2.5">
                {toFa(c.topDifferences.length)} تفاوت مهم
              </h4>
              <div className="space-y-2">
                {c.topDifferences.map((row) => (
                  <div
                    key={row.key}
                    className="p-2.5 rounded-xl border border-border"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-1 h-3.5 rounded-full bg-primary" />
                      <span className="text-[11px] font-medium">{row.label}</span>
                      {row.winner !== null && (
                        <span className="ms-auto text-[10px] text-primary">
                          برنده: {cols[row.winner].shortName}
                        </span>
                      )}
                    </div>
                    <div
                      className={`grid gap-2 mt-2 ${
                        cols.length === 3 ? "grid-cols-3" : "grid-cols-2"
                      }`}
                    >
                      {row.values.map((v, i) => (
                        <div
                          key={i}
                          className={`px-2 py-1.5 rounded-lg text-[11px] ${
                            row.winner === i
                              ? "bg-primary/10 text-foreground font-medium"
                              : "bg-muted/50 text-muted-foreground"
                          }`}
                        >
                          {cell(row, v)}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ---------- Comparison radar (parallel bars) ---------- */}
          {c.dims.length > 0 && (
            <div className="p-3.5 border-b border-border">
              <h4 className="text-xs font-medium mb-3">نمای کلی امتیازها</h4>
              <div className="space-y-3">
                {c.dims.map((d) => (
                  <div key={d.key}>
                    <p className="text-[11px] text-muted-foreground mb-1.5">
                      {d.label}
                    </p>
                    <div className="space-y-1">
                      {d.scores.map((s, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="w-[70px] shrink-0 text-[10px] text-muted-foreground truncate">
                            {cols[i].shortName}
                          </span>
                          <span className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                            <span
                              className={`block h-full rounded-full ${
                                s === null
                                  ? "bg-transparent"
                                  : s === Math.max(
                                        ...d.scores.map((x) => x ?? -1),
                                      )
                                    ? "bg-primary"
                                    : "bg-foreground/25"
                              }`}
                              style={{ width: `${s ?? 0}%` }}
                            />
                          </span>
                          <span className="w-8 shrink-0 text-[10px] text-muted-foreground text-left">
                            {s === null ? "—" : toFa(s)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ---------- Full spec table (progressive disclosure) ---------- */}
          <div className="border-b border-border">
            <button
              onClick={() => setShowAll((s) => !s)}
              className="w-full px-3.5 py-3 flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronDown
                className={`w-4 h-4 transition-transform ${showAll ? "rotate-180" : ""}`}
              />
              {showAll
                ? "بستن جدول مشخصات"
                : `نمایش همه ${toFa(c.rows.length)} مشخصه`}
              {c.missingCells > 0 && (
                <span className="ms-auto text-[10px]">
                  {toFa(c.missingCells)} خانه بدون داده
                </span>
              )}
            </button>

            {showAll && (
              <div className="px-3.5 pb-3.5 overflow-x-auto pg-scroll-hidden">
                <div className="min-w-[420px]">
                  <div
                    className={`grid ${gridCols} gap-2 pb-2 mb-1 border-b border-border`}
                  >
                    <span className="text-[10px] text-muted-foreground">مشخصه</span>
                    {cols.map((col) => (
                      <span key={col.id} className="text-[10px] font-medium truncate">
                        {col.shortName}
                      </span>
                    ))}
                  </div>
                  {c.rows.map((row) => (
                    <div
                      key={row.key}
                      className={`grid ${gridCols} gap-2 py-1.5 border-b border-border/60 last:border-0`}
                    >
                      <span className="text-[11px] text-muted-foreground">
                        {row.label}
                      </span>
                      {row.values.map((v, i) => (
                        <span
                          key={i}
                          className={`text-[11px] ${
                            row.winner === i
                              ? "text-foreground font-medium"
                              : v === null
                                ? "text-muted-foreground/60"
                                : "text-muted-foreground"
                          }`}
                        >
                          {cell(row, v)}
                        </span>
                      ))}
                    </div>
                  ))}
                </div>
                {c.missingCells > 0 && (
                  <p className="text-[10px] text-muted-foreground mt-2">
                    خانه‌های «—» داده کافی نداشتند و در انتخاب برنده حساب نشدند.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* ---------- Reasons to switch ---------- */}
          {c.switchInsight && (
            <div className="p-3.5 border-b border-border">
              <h4 className="text-xs font-medium mb-2">
                ارزش عوض‌کردن دارد؟ نسبت به {cols[c.switchInsight.fromIndex].shortName}
              </h4>
              <div className="space-y-1.5">
                {c.switchInsight.gains.map((g) => (
                  <p key={g} className="flex items-start gap-1.5 text-[11px]">
                    <Plus className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-px" />
                    <span className="text-muted-foreground">{g}</span>
                  </p>
                ))}
                {c.switchInsight.costs.map((g) => (
                  <p key={g} className="flex items-start gap-1.5 text-[11px]">
                    <Minus className="w-3.5 h-3.5 text-destructive shrink-0 mt-px" />
                    <span className="text-muted-foreground">{g}</span>
                  </p>
                ))}
                {c.switchInsight.gains.length === 0 &&
                  c.switchInsight.costs.length === 0 && (
                    <p className="text-[11px] text-muted-foreground">
                      تفاوت معناداری نیست؛ همان انتخاب فعلی‌ات کافی است.
                    </p>
                  )}
              </div>
            </div>
          )}

          {/* ---------- Use-case recommendations (always last content block) ---------- */}
          {c.useCases.length > 0 && (
            <div className="p-3.5 border-b border-border">
              <h4 className="text-xs font-medium mb-2.5">پیشنهاد بر اساس کاربرد</h4>
              <div
                className={`grid gap-2 ${
                  cols.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2"
                }`}
              >
                {c.useCases.map((u) => (
                  <div
                    key={u.columnIndex}
                    className={`p-2.5 rounded-xl border ${
                      c.verdict.winnerIndex === u.columnIndex
                        ? "border-primary/50 bg-primary/5"
                        : "border-border"
                    }`}
                  >
                    <p className="text-[11px] font-medium leading-snug">
                      {cols[u.columnIndex].shortName} را بخر اگر:
                    </p>
                    <ul className="mt-1.5 space-y-1">
                      {u.bullets.map((b) => (
                        <li
                          key={b}
                          className="text-[11px] text-muted-foreground flex items-center gap-1.5"
                        >
                          <span className="text-emerald-600">✓</span>
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ---------- Context-aware CTA ---------- */}
          <div className="p-3.5 flex flex-wrap gap-2">
            {c.ctaMode === "internal" ? (
              <>
                {c.verdict.winnerIndex !== null &&
                  cols[c.verdict.winnerIndex].product &&
                  cols[c.verdict.winnerIndex].inStock && (
                    <Chip
                      tone="solid"
                      onClick={() => onAddToCart(cols[c.verdict.winnerIndex!].product!)}
                    >
                      {cartIds.includes(cols[c.verdict.winnerIndex].id)
                        ? "برنده در سبد است"
                        : "افزودن برنده به سبد"}
                    </Chip>
                  )}
                <Chip onClick={() => onSend("جزئیات هر دو گزینه را نشان بده")}>
                  دیدن هر دو
                </Chip>
                <Chip onClick={() => onSend("با یک گزینه دیگر مقایسه کن")}>
                  مقایسه با مورد دیگر
                </Chip>
              </>
            ) : (
              <>
                <Chip tone="solid" onClick={() => onSend("بهترین جایگزین خودتان را بگو")}>
                  بهترین جایگزین ما
                </Chip>
                <Chip onClick={() => onSend("محصولات مشابه خودتان را نشان بده")}>
                  مشابه‌های ما
                </Chip>
                {cols.find((x) => !x.external)?.product && (
                  <Chip
                    onClick={() => onAddToCart(cols.find((x) => !x.external)!.product!)}
                  >
                    افزودن پیشنهاد ما
                  </Chip>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};
