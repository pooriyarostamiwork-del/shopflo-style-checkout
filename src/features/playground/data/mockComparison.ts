// Conversational product comparison — playground mock engine.
// Front-end only: pure builders that emit the shape an AI agent would produce
// when the user asks "کدوم بهتره؟" inside chat. No network, no AI, no Supabase.
import { PgProduct, PG_PRODUCTS, toFa } from "./mockStore";

/* ---------------- Types ---------------- */

export type PgCompareChip = "similar" | "cheaper" | "premium" | "bestseller";

export type PgCompareMode = "full" | "usecase-only" | "single";
export type PgCompareCta = "internal" | "external";
export type PgConfidence = "high" | "medium" | "low";

export interface PgCompareColumn {
  id: string;
  name: string;
  shortName: string;
  image?: string;
  price?: number;
  rating?: number;
  category?: string;
  inStock: boolean;
  /** Product we do not sell — data is public/unverified. */
  external?: boolean;
  /** The user's current selection (cart / last viewed). */
  current?: boolean;
  product?: PgProduct;
}

export interface PgCompareRow {
  key: string;
  label: string;
  /** null = unknown for that column. */
  values: (string | null)[];
  /** index of the winning column, or null when not comparable. */
  winner: number | null;
  /** shown in the "top differences" block. */
  note?: string;
}

export interface PgCompareDim {
  key: string;
  label: string;
  /** 0..100, null = not enough data. */
  scores: (number | null)[];
}

export interface PgVerdict {
  winnerIndex: number | null;
  sentence: string;
  confidence: PgConfidence;
  confidenceNote: string;
}

export interface PgUseCase {
  columnIndex: number;
  bullets: string[];
}

export interface PgSwitchInsight {
  fromIndex: number;
  toIndex: number;
  gains: string[];
  costs: string[];
}

export type PgCompareIssueKind =
  | "mixed-category"
  | "single-product"
  | "dropped-columns"
  | "duplicate"
  | "external"
  | "missing-specs"
  | "out-of-stock"
  | "low-confidence";

export interface PgCompareIssue {
  kind: PgCompareIssueKind;
  message: string;
  hint?: string;
}

export interface PgComparison {
  id: string;
  mode: PgCompareMode;
  ctaMode: PgCompareCta;
  scope: string;
  columns: PgCompareColumn[];
  topDifferences: PgCompareRow[];
  rows: PgCompareRow[];
  dims: PgCompareDim[];
  verdict: PgVerdict;
  useCases: PgUseCase[];
  switchInsight?: PgSwitchInsight;
  issues: PgCompareIssue[];
  missingCells: number;
  /** Candidate second products when only one was resolved. */
  candidates?: PgProduct[];
  /** Shown instead of a winner when the agent is not sure. */
  clarify?: { question: string; quickReplies: string[] };
}

/* ---------------- External (not-sold) fixture ---------------- */

export interface PgExternalProduct {
  id: string;
  name: string;
  price?: number;
  rating?: number;
  image?: string;
  category?: string;
  specs?: { label: string; value: string }[];
}

export const PG_EXTERNAL_PRODUCT: PgExternalProduct = {
  id: "ext-1",
  name: "هدفون رقیب مدل Studio Pro (فروشگاه دیگر)",
  price: 5_900_000,
  rating: 4.5,
  image:
    "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=600&q=70",
  category: "صوتی",
  specs: [
    { label: "نوع اتصال", value: "بلوتوث ۵.۲" },
    { label: "شارژدهی", value: "۴۰ ساعت" },
  ],
};

/* ---------------- Deterministic pseudo-scores ---------------- */

const seed = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 100000;
  return h;
};

const scoreFor = (id: string, dim: string, base = 55) =>
  base + (seed(id + dim) % 40);

const shortName = (name: string) => name.split(" ").slice(0, 3).join(" ");

/* ---------------- Column mapping ---------------- */

const toColumn = (p: PgProduct, current?: boolean): PgCompareColumn => ({
  id: p.id,
  name: p.name,
  shortName: shortName(p.name),
  image: p.image,
  price: p.price,
  rating: p.rating,
  category: p.category,
  inStock: p.inStock,
  current,
  product: p,
});

const externalColumn = (e: PgExternalProduct): PgCompareColumn => ({
  id: e.id,
  name: e.name,
  shortName: shortName(e.name),
  image: e.image,
  price: e.price,
  rating: e.rating,
  category: e.category,
  inStock: true,
  external: true,
});

/* ---------------- Rows ---------------- */

const EXTRA_ATTRS = [
  "گارانتی",
  "وزن",
  "جنس بدنه",
  "رنگ‌بندی",
  "زمان شارژ کامل",
  "پشتیبانی اپلیکیشن",
  "میکروفون",
  "قابلیت تاشو",
  "کیف حمل",
  "بازگشت کالا",
  "کشور سازنده",
  "کد فنی",
];

const attrValue = (col: PgCompareColumn, attr: string): string | null => {
  if (col.external && seed(col.id + attr) % 3 === 0) return null;
  const s = seed(col.id + attr);
  switch (attr) {
    case "گارانتی":
      return `${12 + (s % 3) * 6} ماه`;
    case "وزن":
      return `${180 + (s % 12) * 10} گرم`;
    case "جنس بدنه":
      return ["آلومینیوم", "پلاستیک تقویت‌شده", "آلیاژ + چرم"][s % 3];
    case "رنگ‌بندی":
      return `${1 + (s % 4)} رنگ`;
    case "زمان شارژ کامل":
      return `${1 + (s % 3)} ساعت`;
    case "پشتیبانی اپلیکیشن":
      return s % 2 ? "دارد" : "ندارد";
    case "میکروفون":
      return ["تک‌میکروفون", "دو میکروفون", "چهار میکروفون با حذف نویز"][s % 3];
    case "قابلیت تاشو":
      return s % 2 ? "دارد" : "ندارد";
    case "کیف حمل":
      return s % 2 ? "همراه دارد" : "جداگانه";
    case "بازگشت کالا":
      return col.external ? null : "۷ روز بدون قید";
    case "کشور سازنده":
      return ["چین", "ویتنام", "کره جنوبی"][s % 3];
    default:
      return `${100 + (s % 800)}`;
  }
};

const numOf = (v: string | null) => {
  if (!v) return null;
  const m = v.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));
  const n = parseFloat(m.replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : null;
};

const winnerOf = (
  values: (string | null)[],
  dir: "high" | "low" = "high",
): number | null => {
  const nums = values.map(numOf);
  const known = nums.filter((n): n is number => n !== null);
  if (known.length < 2) return null;
  const best = dir === "high" ? Math.max(...known) : Math.min(...known);
  if (known.every((n) => n === best)) return null;
  return nums.findIndex((n) => n === best);
};

const buildRows = (
  cols: PgCompareColumn[],
  opts: { shared?: boolean; dropSpecs?: boolean } = {},
): PgCompareRow[] => {
  const rows: PgCompareRow[] = [];

  const priceValues = cols.map((c) => (c.price ? String(c.price) : null));
  rows.push({
    key: "price",
    label: "قیمت",
    values: priceValues,
    winner: winnerOf(priceValues, "low"),
    note: "اختلاف قیمت مستقیم‌ترین فاکتور تصمیم است",
  });

  const ratingValues = cols.map((c) => (c.rating ? String(c.rating) : null));
  rows.push({
    key: "rating",
    label: "امتیاز کاربران",
    values: ratingValues,
    winner: winnerOf(ratingValues, "high"),
    note: "رضایت خریداران قبلی",
  });

  rows.push({
    key: "stock",
    label: "موجودی",
    values: cols.map((c) => (c.inStock ? "موجود" : "ناموجود")),
    winner: cols.some((c) => !c.inStock)
      ? cols.findIndex((c) => c.inStock)
      : null,
    note: "یکی از گزینه‌ها الان قابل ارسال نیست",
  });

  if (opts.shared) return rows.map((r) => ({ ...r, winner: null }));

  rows.push({
    key: "category",
    label: "دسته",
    values: cols.map((c) => c.category ?? null),
    winner: null,
  });

  // union of real spec labels
  const labels = new Set<string>();
  cols.forEach((c) =>
    (c.product?.specs ?? []).forEach((s) => labels.add(s.label)),
  );
  cols.forEach((c) => {
    if (c.external)
      (PG_EXTERNAL_PRODUCT.specs ?? []).forEach((s) => labels.add(s.label));
  });

  labels.forEach((label) => {
    const values = cols.map((c) => {
      if (opts.dropSpecs && c.external) return null;
      const own = c.product?.specs.find((s) => s.label === label)?.value;
      if (own) return own;
      if (c.external)
        return PG_EXTERNAL_PRODUCT.specs?.find((s) => s.label === label)?.value ?? null;
      return null;
    });
    rows.push({ key: `spec-${label}`, label, values, winner: winnerOf(values) });
  });

  EXTRA_ATTRS.filter((attr) => !labels.has(attr)).forEach((attr) => {
    const values = cols.map((c) =>
      opts.dropSpecs && c.external ? null : attrValue(c, attr),
    );
    rows.push({ key: `attr-${attr}`, label: attr, values, winner: winnerOf(values) });
  });

  return rows;
};

/* ---------------- Dimensions (radar / parallel bars) ---------------- */

const DIMS: { key: string; label: string }[] = [
  { key: "perf", label: "عملکرد" },
  { key: "battery", label: "باتری" },
  { key: "comfort", label: "راحتی" },
  { key: "value", label: "ارزش قیمت" },
  { key: "support", label: "پشتیبانی" },
];

const buildDims = (cols: PgCompareColumn[]): PgCompareDim[] =>
  DIMS.map((d) => ({
    key: d.key,
    label: d.label,
    scores: cols.map((c) => {
      if (d.key === "value") {
        if (!c.price || !c.rating) return null;
        const ratio = (c.rating / 5) / (c.price / 5_000_000);
        return Math.max(25, Math.min(98, Math.round(ratio * 55)));
      }
      if (d.key === "support" && c.external) return null;
      const base = c.rating ? 45 + Math.round((c.rating - 4) * 20) : 50;
      return Math.max(20, Math.min(98, scoreFor(c.id, d.key, base)));
    }),
  }));

/* ---------------- Use-case bullets ---------------- */

const USE_CASE_POOL: Record<string, string[]> = {
  صوتی: ["سفر و پرواز", "تماس کاری", "موسیقی روزمره", "ورزش و باشگاه"],
  پوشیدنی: ["پایش خواب", "ورزش روزانه", "نوتیفیکیشن روی مچ"],
  جانبی: ["کار طولانی با لپ‌تاپ", "سفر چندروزه", "میز کار کم‌صدا"],
  تصویر: ["فیلم‌برداری سفر", "ورزش‌های آبی", "محتوای شبکه اجتماعی"],
};

const useCaseFor = (col: PgCompareColumn, dims: PgCompareDim[], i: number): string[] => {
  const pool = USE_CASE_POOL[col.category ?? ""] ?? [
    "استفاده روزمره",
    "هدیه دادن",
    "شروع کم‌هزینه",
  ];
  const strong = dims
    .map((d) => ({ label: d.label, score: d.scores[i] ?? 0 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map((d) => d.label);
  const bullets = [...strong, ...pool].slice(0, 4);
  return Array.from(new Set(bullets));
};

/* ---------------- Verdict ---------------- */

const totalScore = (dims: PgCompareDim[], i: number) => {
  const vals = dims.map((d) => d.scores[i]).filter((v): v is number => v !== null);
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
};

/* ---------------- Builder ---------------- */

export interface PgBuildOpts {
  /** Add an external (not-sold) column. */
  external?: boolean;
  /** id of the user's current selection. */
  currentId?: string;
  /** Simulate an incomplete data source. */
  dropSpecs?: boolean;
  /** Force the "not sure" verdict state. */
  lowConfidence?: boolean;
  scope?: string;
}

let cmpSeq = 0;

export const buildComparison = (
  input: PgProduct[],
  opts: PgBuildOpts = {},
): PgComparison => {
  const id = `cmp-${++cmpSeq}`;
  const issues: PgCompareIssue[] = [];

  // dedupe
  const seen = new Set<string>();
  const unique = input.filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true)));
  if (unique.length < input.length)
    issues.push({
      kind: "duplicate",
      message: "یک محصول دو بار در درخواستت تکرار شده بود؛ حذفش کردم.",
    });

  // more than 3
  const maxCols = opts.external ? 2 : 3;
  const kept = unique.slice(0, maxCols);
  const dropped = unique.length - kept.length;
  if (dropped > 0)
    issues.push({
      kind: "dropped-columns",
      message: `فقط ${dropped === 1 ? "یک" : toFa(dropped)} مورد جا نشد؛ ${toFa(kept.length)} گزینه اصلی را مقایسه کردم.`,
      hint: "می‌تونی بگی کدوم ستون جایگزین شود.",
    });

  let columns: PgCompareColumn[] = kept.map((p) =>
    toColumn(p, opts.currentId === p.id),
  );
  if (opts.external) columns = [...columns, externalColumn(PG_EXTERNAL_PRODUCT)];

  const scope = opts.scope ?? "مقایسه بر اساس گفتگوی تو";

  /* --- single product --- */
  if (columns.length < 2) {
    const only = columns[0];
    issues.push({
      kind: "single-product",
      message: "فقط یک محصول را تشخیص دادم، پس چیزی برای مقایسه نیست.",
      hint: "یکی از این‌ها را برای ستون دوم انتخاب کن.",
    });
    const candidates = PG_PRODUCTS.filter(
      (p) => p.id !== only?.id && p.category === only?.category,
    ).slice(0, 3);
    return {
      id,
      mode: "single",
      ctaMode: "internal",
      scope,
      columns,
      topDifferences: [],
      rows: [],
      dims: [],
      verdict: {
        winnerIndex: null,
        sentence: "برای نتیجه‌گیری به یک گزینه دوم نیاز دارم.",
        confidence: "low",
        confidenceNote: "تنها یک محصول در گفتگو مشخص شد.",
      },
      useCases: [],
      issues,
      missingCells: 0,
      candidates: candidates.length
        ? candidates
        : PG_PRODUCTS.filter((p) => p.id !== only?.id).slice(0, 3),
    };
  }

  const cats = new Set(columns.map((c) => c.category).filter(Boolean));
  const mixed = cats.size > 1;
  const hasExternal = columns.some((c) => c.external);
  const outOfStock = columns.some((c) => !c.inStock);

  const dims = mixed ? [] : buildDims(columns);
  const rows = buildRows(columns, { shared: mixed, dropSpecs: opts.dropSpecs });
  const missingCells = rows.reduce(
    (s, r) => s + r.values.filter((v) => v === null).length,
    0,
  );
  if (missingCells > 0)
    issues.push({
      kind: "missing-specs",
      message: `${toFa(missingCells)} خانه داده کافی نداشت و از محاسبه برنده کنار گذاشته شد.`,
    });

  if (hasExternal)
    issues.push({
      kind: "external",
      message: "یکی از گزینه‌ها را ما نمی‌فروشیم؛ داده‌اش عمومی و تأییدنشده است.",
    });

  if (outOfStock)
    issues.push({
      kind: "out-of-stock",
      message: "یکی از گزینه‌ها الان ناموجود است.",
    });

  /* --- mixed categories: use-case framing only --- */
  if (mixed) {
    issues.unshift({
      kind: "mixed-category",
      message: "این گزینه‌ها در یک دسته نیستند، پس «برنده» معنی ندارد.",
      hint: "بگو برای چه کاری می‌خواهی تا بر اساس کاربرد راهنمایی کنم.",
    });
    return {
      id,
      mode: "usecase-only",
      ctaMode: hasExternal ? "external" : "internal",
      scope,
      columns,
      topDifferences: rows.slice(0, 2),
      rows,
      dims: [],
      verdict: {
        winnerIndex: null,
        sentence: "این‌ها جایگزین هم نیستند؛ انتخاب به کاربردت بستگی دارد.",
        confidence: "low",
        confidenceNote: `دسته‌های متفاوت: ${Array.from(cats).join(" و ")}`,
      },
      useCases: columns.map((c, i) => ({
        columnIndex: i,
        bullets: useCaseFor(c, buildDims(columns), i),
      })),
      issues,
      missingCells,
      clarify: {
        question: "برای چه کاری می‌خواهی؟",
        quickReplies: ["برای سفر", "برای کار روزمره", "برای ورزش", "کم‌هزینه‌ترین"],
      },
    };
  }

  /* --- full comparison --- */
  const scores = columns.map((_, i) => totalScore(dims, i));
  let winnerIndex = scores.indexOf(Math.max(...scores));
  let stockNote = "";
  if (!columns[winnerIndex].inStock) {
    const alt = columns.findIndex((c) => c.inStock);
    if (alt >= 0) {
      winnerIndex = alt;
      stockNote = " (گزینه امتیاز‌بالاتر ناموجود بود، پس موجودترین را پیشنهاد دادم)";
    }
  }

  const gap = Math.abs(
    Math.max(...scores) - scores.slice().sort((a, b) => b - a)[1],
  );
  let confidence: PgConfidence =
    gap > 12 ? "high" : gap > 5 ? "medium" : "low";
  if (hasExternal && confidence === "high") confidence = "medium";
  if (missingCells > 6 && confidence === "high") confidence = "medium";
  if (opts.lowConfidence) confidence = "low";

  const confidenceNote =
    confidence === "high"
      ? "اختلاف امتیاز در بیشتر معیارها واضح است."
      : hasExternal
        ? "داده گزینه خارجی تأییدنشده است."
        : missingCells > 6
          ? "بخشی از مشخصات ناقص بود."
          : "امتیاز گزینه‌ها نزدیک است.";

  const winner = columns[winnerIndex];
  const bestDim = dims
    .map((d) => ({ label: d.label, score: d.scores[winnerIndex] ?? 0 }))
    .sort((a, b) => b.score - a.score)[0];

  const verdict: PgVerdict = {
    winnerIndex: confidence === "low" ? null : winnerIndex,
    sentence:
      confidence === "low"
        ? "مطمئن نیستم کدام برای تو بهتر است؛ یک نکته را روشن کن تا قطعی بگویم."
        : `${winner.shortName} را پیشنهاد می‌کنم؛ بهترین ${bestDim?.label ?? "تعادل"} را با قیمتش دارد${stockNote}.`,
    confidence,
    confidenceNote,
  };

  if (confidence === "low")
    issues.push({
      kind: "low-confidence",
      message: "اعتماد این نتیجه پایین است.",
    });

  const NON_DECISION = ["کد فنی", "کشور سازنده", "رنگ‌بندی", "بازگشت کالا"];
  const topDifferences = rows
    .filter(
      (r) =>
        r.winner !== null &&
        r.values.every((v) => v !== null) &&
        !NON_DECISION.includes(r.label),
    )
    .sort((a, b) => {
      const spread = (r: PgCompareRow) => {
        const n = r.values.map(numOf).filter((x): x is number => x !== null);
        return n.length > 1 ? (Math.max(...n) - Math.min(...n)) / (Math.max(...n) || 1) : 0;
      };
      return spread(b) - spread(a);
    })
    .slice(0, 3);

  const currentIndex = columns.findIndex((c) => c.current);
  const switchInsight: PgSwitchInsight | undefined =
    currentIndex >= 0 && currentIndex !== winnerIndex
      ? {
          fromIndex: currentIndex,
          toIndex: winnerIndex,
          gains: dims
            .filter(
              (d) =>
                (d.scores[winnerIndex] ?? 0) - (d.scores[currentIndex] ?? 0) > 6,
            )
            .slice(0, 3)
            .map(
              (d) =>
                `${toFa(
                  Math.round(
                    (((d.scores[winnerIndex] ?? 0) - (d.scores[currentIndex] ?? 0)) /
                      Math.max(1, d.scores[currentIndex] ?? 1)) *
                      100,
                  ),
                )}٪ ${d.label} بهتر`,
            ),
          costs: [
            ...(winner.price && columns[currentIndex].price
              ? winner.price > columns[currentIndex].price!
                ? [
                    `${toFa(
                      Math.round(
                        (winner.price - columns[currentIndex].price!) / 1000,
                      ),
                    )} هزار تومان گران‌تر`,
                  ]
                : []
              : []),
            ...dims
              .filter(
                (d) =>
                  (d.scores[currentIndex] ?? 0) - (d.scores[winnerIndex] ?? 0) > 6,
              )
              .slice(0, 2)
              .map((d) => `${d.label} کمی ضعیف‌تر`),
          ],
        }
      : undefined;

  return {
    id,
    mode: "full",
    ctaMode: hasExternal ? "external" : "internal",
    scope,
    columns,
    topDifferences,
    rows,
    dims,
    verdict,
    useCases: columns.map((c, i) => ({ columnIndex: i, bullets: useCaseFor(c, dims, i) })),
    switchInsight,
    issues,
    missingCells,
    clarify:
      confidence === "low"
        ? {
            question: "کدام برایت مهم‌تر است؟",
            quickReplies: ["قیمت کمتر", "کیفیت بیشتر", "باتری بیشتر", "سبک‌تر باشد"],
          }
        : undefined,
  };
};

/* ---------------- Chip resolution ---------------- */

export const CHIP_LABELS: Record<PgCompareChip, string> = {
  similar: "در برابر مشابه",
  cheaper: "در برابر ارزان‌تر",
  premium: "در برابر پرمیوم",
  bestseller: "در برابر پرفروش",
};

/** Best counterpart for a chip, or null when no candidate exists. */
export const resolveChipTarget = (
  product: PgProduct,
  chip: PgCompareChip,
): PgProduct | null => {
  const others = PG_PRODUCTS.filter((p) => p.id !== product.id);
  const sameCat = others.filter((p) => p.category === product.category);
  /** Same-category candidates first; only fall back when the category has none. */
  const pick = (
    filter: (p: PgProduct) => boolean,
    sort: (a: PgProduct, b: PgProduct) => number,
  ) => sameCat.filter(filter).sort(sort)[0] ?? others.filter(filter).sort(sort)[0] ?? null;

  switch (chip) {
    case "similar":
      return pick(
        () => true,
        (a, b) =>
          Math.abs(a.price - product.price) - Math.abs(b.price - product.price),
      );
    case "cheaper":
      return pick(
        (p) => p.price < product.price,
        (a, b) => b.price - a.price,
      );
    case "premium":
      return pick(
        (p) => p.price > product.price,
        (a, b) => a.price - b.price,
      );
    case "bestseller":
      return pick(
        () => true,
        (a, b) => b.rating - a.rating,
      );
  }
};


export const availableChips = (product: PgProduct): PgCompareChip[] =>
  (Object.keys(CHIP_LABELS) as PgCompareChip[]).filter(
    (c) => resolveChipTarget(product, c) !== null,
  );

/* ---------------- Lab presets ---------------- */

export type PgComparePreset =
  | "two"
  | "three"
  | "external"
  | "mixed"
  | "incomplete"
  | "duplicate"
  | "low-confidence"
  | "single"
  | "overflow";

export const buildPreset = (preset: PgComparePreset): PgComparison => {
  const p = (i: number) => PG_PRODUCTS[i];
  switch (preset) {
    case "two":
      return buildComparison([p(0), p(2)], { currentId: p(2).id });
    case "three":
      return buildComparison([p(0), p(2), p(6)], { currentId: p(2).id });
    case "duplicate":
      return buildComparison([p(0), p(0), p(2)], {});

    case "external":
      return buildComparison([p(0)], { external: true });
    case "mixed":
      return buildComparison([p(0), p(3)], {});
    case "incomplete":
      return buildComparison([p(0)], { external: true, dropSpecs: true });
    case "low-confidence":
      return buildComparison([p(0), p(2)], { lowConfidence: true });
    case "single":
      return buildComparison([p(0)], {});
    case "overflow":
      return buildComparison([p(0), p(2), p(6), p(1), p(4)], {});
  }
};
