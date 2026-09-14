/**
 * Per-conversation memory of the shopper's pets and preferences (PetAbad only).
 * Filled deterministically from the shopper's own words and from answered
 * journey steps — no model call.
 *
 * Preferences are SCOPED: every preference remembers which purchase it was
 * stated in (species + product group) and whether the shopper meant it globally
 * («کلاً فقط برند X»), for that one decision («برای این غذا برند X»), or left it
 * ambiguous. A new purchase deactivates contextual/ambiguous preferences of the
 * previous purchase; coming back to an earlier purchase reactivates them.
 */
import type { JourneyStep } from "@/data/petabadData";

export interface PetProfile {
  species: string;              // canonical: گربه / سگ / پرنده / ...
  name?: string;
  lifeStage?: string | null;    // نابالغ / بالغ / سنیور
  ageYears?: number | null;
  breedSize?: string | null;
  healthNeeds: string[];
  preferences: string[];        // free text likes (e.g. «کنسرو»)
  productTypes: string[];       // types discussed for this pet
}

export type PrefDim =
  | "brand" | "budget" | "origin" | "type" | "flavor" | "color"
  | "size" | "need" | "quality" | "count";
export type PrefScope = "global" | "contextual" | "ambiguous";

export interface ScopedPreference {
  dim: PrefDim;
  value: string;
  scope: PrefScope;
  /** «species|productGroup» of the purchase this was stated in. */
  purchaseKey: string;
  species?: string | null;
  min?: number;
  max?: number;
  /** The shopper said it should NOT carry into this purchase. */
  declinedFor?: string[];
}

export interface PetMemory {
  pets: PetProfile[];
  activeSpecies?: string | null;
  brandsDiscussed: string[];
  brandsLiked: string[];
  brandsRejected: string[];
  foreignOnly?: boolean | null;
  /** budget by «species|type» key (legacy, kept for older baskets) */
  budgets: Record<string, { min?: number; max?: number }>;
  topics: string[];
  /** Scoped preference log. */
  preferences: ScopedPreference[];
  /** Current purchase: «species|productGroup». */
  purchaseKey?: string | null;
  /** «purchaseKey:dim» pairs already asked about — never ask twice. */
  askedCarryOver: string[];
}

export const createEmptyPetMemory = (): PetMemory => ({
  pets: [],
  activeSpecies: null,
  brandsDiscussed: [],
  brandsLiked: [],
  brandsRejected: [],
  foreignOnly: null,
  budgets: {},
  topics: [],
  preferences: [],
  purchaseKey: null,
  askedCarryOver: [],
});

export const ensurePetMemory = (m?: PetMemory | null): PetMemory => ({
  ...createEmptyPetMemory(),
  ...(m || {}),
  pets: Array.isArray(m?.pets) ? m!.pets : [],
  brandsDiscussed: m?.brandsDiscussed ?? [],
  brandsLiked: m?.brandsLiked ?? [],
  brandsRejected: m?.brandsRejected ?? [],
  budgets: m?.budgets ?? {},
  topics: m?.topics ?? [],
  preferences: Array.isArray(m?.preferences) ? m!.preferences : [],
  purchaseKey: m?.purchaseKey ?? null,
  askedCarryOver: Array.isArray(m?.askedCarryOver) ? m!.askedCarryOver : [],
});

const norm = (s: string) =>
  s
    .replace(/\u200c/g, " ")
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .toLowerCase();

const SPECIES: Array<[RegExp, string]> = [
  [/گربه|گربم|گربه‌ام|پیشی|کیتن|بچه گربه/, "گربه"],
  [/سگ|سگم|توله|پاپی|هاپو/, "سگ"],
  [/طوطی|پرنده|مرغ عشق|کاسکو|قناری/, "پرنده"],
  [/ماهی|آکواریوم/, "ماهی و آکواریوم"],
  [/خرگوش|همستر|جونده|خوکچه|لاک پشت|خزنده/, "سایر حیوانات خانگی"],
];

const STAGE_FROM_TEXT = (t: string): string | null => {
  if (/بچه گربه|توله|پاپی|کیتن|نابالغ|چند ماهه|ماهشه/.test(t)) return "نابالغ";
  if (/پیر|مسن|سالمند|سنیور/.test(t)) return "سنیور";
  return null;
};
const STAGE_FROM_LABEL = (label: string): string | null => {
  if (/نابالغ|بچه|توله/.test(label)) return "نابالغ";
  if (/سنیور|سالمند/.test(label)) return "سنیور";
  if (/بالغ/.test(label)) return "بالغ";
  return null;
};
const stageFromAge = (y: number) => (y < 1 ? "نابالغ" : y >= 7 ? "سنیور" : "بالغ");

const PERSIAN_NUM: Record<string, number> = {
  یک: 1, دو: 2, سه: 3, چهار: 4, پنج: 5, شش: 6, هفت: 7, هشت: 8, نه: 9, ده: 10, یازده: 11, دوازده: 12,
};
const ageFromText = (t: string): number | null => {
  const m = t.match(/(\d{1,2}|یک|دو|سه|چهار|پنج|شش|هفت|هشت|نه|ده|یازده|دوازده)\s*(سال(ش|شه|ه|ست|شونه)?|ساله)/);
  if (!m) return null;
  const n = /\d/.test(m[1]) ? parseInt(m[1]) : PERSIAN_NUM[m[1]];
  return Number.isFinite(n) ? n : null;
};

const NEED_WORDS: Array<[RegExp, string]> = [
  [/پوست|مو\b|موش|ریزش مو/, "پوست و مو"],
  [/مفصل|مفاصل|استخوان/, "مفاصل و استخوان"],
  [/گوارش|معده|اسهال|یبوست/, "گوارش"],
  [/کلیه|ادرار|مجاری/, "کلیه و مجاری ادرار"],
  [/چاق|وزن|لاغر|رژیم/, "کنترل وزن"],
  [/عقیم/, "عقیم‌شده"],
  [/گلوله مو|هربال|hairball/i, "گلوله مو"],
  [/دندان|دهان/, "دندان و دهان"],
  [/حساس|آلرژی/, "حساسیت"],
];

const TYPE_WORDS: Array<[RegExp, string]> = [
  [/غذای خشک|خشک/, "غذای خشک"],
  [/غذای تر|کنسرو/, "کنسرو"],
  [/پوچ/, "پوچ"],
  [/تشویقی|اسنک/, "تشویقی"],
  [/سوپ/, "سوپ"],
  [/شامپو/, "شامپو و نرم‌کننده"],
  [/خاک|ظرف بهداشتی/, "خاک و ظرف بهداشتی"],
  [/اسباب بازی|اسباب‌بازی|توپ بازی/, "اسباب‌بازی"],
  [/قلاده|هارنس/, "قلاده و هارنس"],
  [/جای خواب|تخت/, "جای خواب"],
];

/** Product group = the purchase's shelf family. Different group ⇒ different purchase. */
const TYPE_GROUP: Array<[RegExp, string]> = [
  [/غذای خشک|کنسرو|پوچ|سوپ|شیر خشک/, "غذا"],
  [/تشویقی|اسنک/, "تشویقی"],
  [/شامپو|بهداشت/, "بهداشتی"],
  [/خاک|ظرف بهداشتی/, "خاک"],
  [/اسباب‌بازی/, "اسباب‌بازی"],
  [/قلاده|هارنس/, "قلاده"],
  [/جای خواب|تخت/, "جای خواب"],
];
const groupOfType = (type: string): string | null => {
  for (const [re, g] of TYPE_GROUP) if (re.test(type)) return g;
  return null;
};
/** Bare «غذا» with no concrete type still opens the food purchase. */
const groupFromText = (t: string): string | null => {
  const types = TYPE_WORDS.filter(([re]) => re.test(t)).map(([, v]) => v);
  for (const ty of types) {
    const g = groupOfType(ty);
    if (g) return g;
  }
  if (/غذا/.test(t)) return "غذا";
  return null;
};

const uniq = (xs: string[]) => Array.from(new Set(xs.filter(Boolean)));

const getPet = (mem: PetMemory, species: string): PetProfile => {
  let p = mem.pets.find((x) => x.species === species);
  if (!p) {
    p = { species, healthNeeds: [], preferences: [], productTypes: [] };
    mem.pets = [...mem.pets, p];
  }
  return p;
};
const setPet = (mem: PetMemory, pet: PetProfile) => {
  mem.pets = mem.pets.map((p) => (p.species === pet.species ? pet : p));
};

/** «گربم» / «سگم» / «برای همون» → the pet the shopper means. */
export function resolveSpecies(mem: PetMemory, text: string): string | null {
  const t = norm(text);
  for (const [re, sp] of SPECIES) if (re.test(t)) return sp;
  if (/همون|همین|براش|واسش/.test(t)) return mem.activeSpecies || null;
  return null;
}

// ── Scoped preference extraction ─────────────────────────────────────────

const GLOBAL_RE = /(کلا|کلاً|همیشه|همواره|برای همه|برای همهٔ|همهٔ? (حیوون|حیوان)|هر (غذا|محصول|چیزی|چی)|از این به بعد|همه خریدها)/;
const LOCAL_RE = /(برای این|این یکی|برای همین|این خرید|این بار|فعلا|فعلاً|همین یکی)/;

const COUNTRY_ADJ = /(آلمانی|فرانسوی|هلندی|ایتالیایی|ترکیه‌ای|ترکی|آمریکایی|بلژیکی|اسپانیایی|چکی|کره‌ای|تایلندی)/;
const COLORS = /(مشکی|سیاه|سفید|قرمز|آبی|صورتی|سبز|طوسی|قهوه‌ای)/;
const PROTEINS = /(مرغ|ماهی|گوشت|بره|بوقلمون|سالمون|بیف|تن)/;

const parseAmount = (raw: string): number | undefined => {
  const s = norm(raw).replace(/,/g, "").replace(/٫/g, ".");
  const m = s.match(/(\d+(?:\.\d+)?)\s*(میلیون|ملیون|هزار|تومان|تومن)?/);
  if (!m) return undefined;
  const n = parseFloat(m[1]);
  if (!isFinite(n)) return undefined;
  if (m[2] === "میلیون" || m[2] === "ملیون") return Math.round(n * 1_000_000);
  if (m[2] === "هزار") return Math.round(n * 1_000);
  return Math.round(n);
};

const faNum = (n: number) => n.toLocaleString("fa-IR");

const scopeOf = (t: string): PrefScope =>
  GLOBAL_RE.test(t) ? "global" : LOCAL_RE.test(t) ? "contextual" : "ambiguous";

/** Everything the shopper stated in one message, as scoped preferences. */
function extractPreferences(t: string, purchaseKey: string, species: string | null): ScopedPreference[] {
  const scope = scopeOf(t);
  const out: ScopedPreference[] = [];
  const push = (dim: PrefDim, value: string, extra?: Partial<ScopedPreference>) =>
    out.push({ dim, value, scope, purchaseKey, ...extra });

  // origin scope / country
  if (/(خارجی|وارداتی|غیر ایرانی|اورجینال)/.test(t)) push("origin", "خارجی");
  else if (/(ایرانی|داخلی|تولید ایران)/.test(t)) push("origin", "ایرانی");
  const country = t.match(COUNTRY_ADJ);
  if (country) push("origin", country[1]);

  // brand
  const brand = t.match(/(?:برند|مارک)\s+(?:ی\s+)?([^\s،.؛]{2,20})/);
  if (brand && !/(خوب|دیگه|دیگری|خارجی|ایرانی|مناسب)/.test(brand[1])) push("brand", brand[1]);

  // budget
  const maxM = t.match(/(?:زیر|تا|حداکثر|کمتر از|سقف|ماکسیمم)\s+([\d.,٫]+\s*(?:میلیون|ملیون|هزار)?)/);
  const minM = t.match(/(?:بالای|بیشتر از|حداقل)\s+([\d.,٫]+\s*(?:میلیون|ملیون|هزار)?)/);
  if (maxM || minM) {
    const max = maxM ? parseAmount(maxM[1]) : undefined;
    const min = minM ? parseAmount(minM[1]) : undefined;
    const label = [min ? `از ${faNum(min)}` : "", max ? `تا ${faNum(max)}` : ""].filter(Boolean).join(" ");
    push("budget", `${label} تومان`, { min, max });
  }

  // product type
  const types = TYPE_WORDS.filter(([re]) => re.test(t)).map(([, v]) => v);
  if (types.length) push("type", types[0]);

  // flavour / protein
  const noProtein = t.match(new RegExp(`(?:بدون|نمی\\s*خوام|نمیخوام|نه)\\s*${PROTEINS.source}`));
  if (noProtein) push("flavor", `بدون ${noProtein[1]}`);
  else {
    const withProtein = t.match(new RegExp(`(?:با|طعم)\\s*${PROTEINS.source}`));
    if (withProtein) push("flavor", `با ${withProtein[1]}`);
  }

  // colour
  const color = t.match(COLORS);
  if (color) push("color", color[1]);

  // size
  if (/(سگ|گربه)?\s*بزرگ|نژاد بزرگ|بزرگ جثه/.test(t)) push("size", "جثه بزرگ");
  else if (/کوچیک|کوچک جثه|نژاد کوچک/.test(t)) push("size", "جثه کوچک");

  // needs
  const needs = NEED_WORDS.filter(([re]) => re.test(t)).map(([, v]) => v);
  if (needs.length) push("need", needs.join("، "));

  // quality
  if (/(بهترین|پرمیوم|premium|گرون بودنش مهم نیست|هر چقدر|بالاترین کیفیت)/i.test(t)) push("quality", "پرمیوم");
  else if (/(ارزون|ارزان|اقتصادی|کم هزینه)/.test(t)) push("quality", "اقتصادی");

  // number of options
  const count = t.match(/(?:فقط\s*)?(\d{1,2}|دو|سه|چهار|پنج)\s*تا\s*(?:گزینه|مورد|محصول)/);
  if (count) push("count", /\d/.test(count[1]) ? count[1] : String(PERSIAN_NUM[count[1]] || 3));

  return out.map((p) => ({ ...p, species }));
}

/** Newer statement in the same dimension + same purchase overrides the older one. */
function mergePreferences(existing: ScopedPreference[], incoming: ScopedPreference[]): ScopedPreference[] {
  let list = [...existing];
  for (const p of incoming) {
    list = list.filter((old) => {
      if (old.dim !== p.dim) return true;
      if (p.scope === "global") return old.scope !== "global";
      return old.purchaseKey !== p.purchaseKey || old.scope === "global";
    });
    list.push(p);
  }
  return list.slice(-24);
}

/** Preferences that are valid for the purchase in progress. */
export function activePreferences(mem?: PetMemory | null): ScopedPreference[] {
  const m = ensurePetMemory(mem);
  const key = m.purchaseKey || "*|*";
  return m.preferences.filter(
    (p) => p.scope === "global" || (p.purchaseKey === key && !(p.declinedFor || []).includes(key)),
  );
}

/** Remembered but NOT active — they belong to another purchase. */
export function rememberedPreferences(mem?: PetMemory | null): ScopedPreference[] {
  const m = ensurePetMemory(mem);
  const key = m.purchaseKey || "*|*";
  const active = new Set(activePreferences(m).map((p) => `${p.dim}:${p.value}`));
  return m.preferences.filter(
    (p) =>
      !active.has(`${p.dim}:${p.value}`) &&
      p.scope !== "global" &&
      !(p.declinedFor || []).includes(key),
  );
}

/** Answer to a carry-over question: activate the preference here, or drop it here. */
export function applyCarryOverAnswer(
  base: PetMemory,
  dim: PrefDim,
  value: string,
  accepted: boolean,
): PetMemory {
  const mem = ensurePetMemory(base);
  const key = mem.purchaseKey || "*|*";
  const preferences = mem.preferences.map((p) => {
    if (p.dim !== dim || p.value !== value) return p;
    if (accepted) return { ...p, purchaseKey: key, declinedFor: (p.declinedFor || []).filter((k) => k !== key) };
    return { ...p, declinedFor: uniq([...(p.declinedFor || []), key]) };
  });
  return { ...mem, preferences, askedCarryOver: uniq([...mem.askedCarryOver, `${key}:${dim}`]) };
}

/** Remember that a carry-over question was already asked for this purchase. */
export function markCarryOverAsked(base: PetMemory, dim: string): PetMemory {
  const mem = ensurePetMemory(base);
  const key = mem.purchaseKey || "*|*";
  return { ...mem, askedCarryOver: uniq([...mem.askedCarryOver, `${key}:${dim}`]) };
}

/** Update memory from one shopper message. */
export function rememberFromMessage(base: PetMemory, message: string): PetMemory {
  const mem: PetMemory = { ...ensurePetMemory(base), pets: [...ensurePetMemory(base).pets] };
  const t = norm(message);
  const species = resolveSpecies(mem, message);
  if (species) mem.activeSpecies = species;
  const target = species ? { ...getPet(mem, species) } : null;

  if (target) {
    const age = ageFromText(t);
    if (age !== null) {
      target.ageYears = age;
      target.lifeStage = stageFromAge(age);
    } else {
      const st = STAGE_FROM_TEXT(t);
      if (st) target.lifeStage = st;
    }
    const nm = t.match(/(?:اسمش|به اسم|نامش)\s+([^\s،.]{2,15})/);
    if (nm) target.name = nm[1];
    for (const [re, need] of NEED_WORDS) if (re.test(t)) target.healthNeeds = uniq([...target.healthNeeds, need]).slice(-6);
    for (const [re, type] of TYPE_WORDS) if (re.test(t)) target.productTypes = uniq([...target.productTypes, type]).slice(-6);
    if (/بزرگ جثه|نژاد بزرگ|ژرمن|هاسکی|گلدن|لابرادور/.test(t)) target.breedSize = "بزرگ";
    else if (/کوچک جثه|نژاد کوچک|پامرانین|شیتزو|چی واوا/.test(t)) target.breedSize = "کوچک";
    setPet(mem, target);
  }

  // ── Purchase context: species + product group. A change opens a new purchase;
  // coming back to an earlier combination resumes it with its own preferences.
  const group = groupFromText(t);
  const prevGroup = (mem.purchaseKey || "").split("|")[1] || null;
  const sp = mem.activeSpecies || species || null;
  const nextGroup = group || prevGroup;
  if (sp || nextGroup) mem.purchaseKey = `${sp || "*"}|${nextGroup || "*"}`;

  const incoming = extractPreferences(t, mem.purchaseKey || "*|*", sp);
  if (incoming.length) mem.preferences = mergePreferences(mem.preferences, incoming);

  // Legacy mirrors (still read by older baskets / the flow seed).
  const originPref = activePreferences(mem).find((p) => p.dim === "origin");
  mem.foreignOnly = originPref ? (originPref.value !== "ایرانی" ? true : false) : null;

  const topics = uniq([...mem.topics, ...NEED_WORDS.filter(([re]) => re.test(t)).map(([, n]) => n)]);
  mem.topics = topics.slice(-10);
  return mem;
}

/** Update memory from the answered steps of a journey card. */
export function rememberFromJourney(base: PetMemory, steps: JourneyStep[]): PetMemory {
  const mem: PetMemory = { ...ensurePetMemory(base), pets: [...ensurePetMemory(base).pets] };
  const speciesStep = steps.find((s) => s.card.id === "species");
  if (speciesStep) {
    const sp = resolveSpecies(mem, speciesStep.answer);
    if (sp) mem.activeSpecies = sp;
  }
  const species = mem.activeSpecies;
  const pet = species ? { ...getPet(mem, species) } : null;
  const key = mem.purchaseKey || `${species || "*"}|*`;
  const journeyPrefs: ScopedPreference[] = [];
  for (const s of steps) {
    const a = s.answer.trim();
    if (!a || /فرقی نمی|مهم نیست|نیاز خاصی/.test(a)) continue;
    switch (s.card.id) {
      case "age":
        if (pet) pet.lifeStage = STAGE_FROM_LABEL(a) || pet.lifeStage;
        break;
      case "need":
        if (pet) pet.healthNeeds = uniq([...pet.healthNeeds, ...a.split(" و ").map((x) => x.trim())]).slice(-6);
        journeyPrefs.push({ dim: "need", value: a, scope: "contextual", purchaseKey: key, species });
        break;
      case "type":
        if (pet) pet.productTypes = uniq([...pet.productTypes, ...a.split(" و ").map((x) => x.trim())]).slice(-6);
        journeyPrefs.push({ dim: "type", value: a, scope: "contextual", purchaseKey: key, species });
        break;
      case "origin":
        if (/خارجی/.test(a)) mem.foreignOnly = true;
        else if (/ایرانی/.test(a)) mem.foreignOnly = false;
        journeyPrefs.push({
          dim: "origin",
          value: /خارجی/.test(a) ? "خارجی" : "ایرانی",
          scope: "contextual",
          purchaseKey: key,
          species,
        });
        break;
      case "budget": {
        const nums = (a.match(/[۰-۹0-9٫.]+\s*(میلیون|هزار)/g) || []).map((x) => {
          const n = parseFloat(norm(x).replace("٫", ".").replace(/[^\d.]/g, ""));
          return /میلیون/.test(x) ? n * 1_000_000 : n * 1_000;
        });
        const bkey = `${species || "*"}|${pet?.productTypes.slice(-1)[0] || "*"}`;
        if (nums.length === 1) mem.budgets[bkey] = /^تا/.test(a) ? { max: nums[0] } : { min: nums[0] };
        else if (nums.length >= 2) mem.budgets[bkey] = { min: nums[0], max: nums[1] };
        const b = mem.budgets[bkey];
        if (b) journeyPrefs.push({ dim: "budget", value: a, scope: "contextual", purchaseKey: key, species, ...b });
        break;
      }
    }
  }
  if (pet) setPet(mem, pet);
  if (journeyPrefs.length) mem.preferences = mergePreferences(mem.preferences, journeyPrefs);
  return mem;
}

/** Remember brands the assistant surfaced (from returned product cards). */
export function rememberBrands(base: PetMemory, brands: string[]): PetMemory {
  const mem = ensurePetMemory(base);
  return { ...mem, brandsDiscussed: uniq([...mem.brandsDiscussed, ...brands]).slice(-20) };
}

/** Active pet facts the server uses to skip questions it already knows. */
export function activePetPayload(mem?: PetMemory | null) {
  const m = ensurePetMemory(mem);
  const pet = m.pets.find((p) => p.species === m.activeSpecies) || m.pets[m.pets.length - 1];
  if (!pet) return undefined;
  const active = activePreferences(m);
  const origin = active.find((p) => p.dim === "origin");
  const needPref = active.filter((p) => p.dim === "need").flatMap((p) => p.value.split("، "));
  const typePref = active.filter((p) => p.dim === "type").map((p) => p.value);
  return {
    species: pet.species,
    name: pet.name || null,
    life_stage: pet.lifeStage || null,
    age_years: pet.ageYears ?? null,
    breed_size: pet.breedSize || null,
    // Needs/types are per-purchase: only the ones valid for this purchase travel.
    health_needs: needPref,
    product_types: typePref,
    foreign_only: origin ? origin.value !== "ایرانی" : null,
  };
}

/** What the server needs to scope preferences: the purchase and both preference sets. */
export function purchaseContextPayload(mem?: PetMemory | null) {
  const m = ensurePetMemory(mem);
  const key = m.purchaseKey || "*|*";
  const [species, group] = key.split("|");
  const shape = (p: ScopedPreference) => ({
    dim: p.dim,
    value: p.value,
    scope: p.scope,
    ...(p.min ? { min: p.min } : {}),
    ...(p.max ? { max: p.max } : {}),
    purchase: p.purchaseKey,
  });
  return {
    key,
    species: species === "*" ? null : species,
    product_group: group === "*" ? null : group,
    active: activePreferences(m).map(shape),
    remembered: rememberedPreferences(m).map(shape),
    asked_carry_over: m.askedCarryOver.filter((x) => x.startsWith(`${key}:`)).map((x) => x.split(":")[1]),
  };
}

const STAGE_FA: Record<string, string> = { نابالغ: "بچه/نابالغ", بالغ: "بالغ", سنیور: "سالمند" };

const prefLine = (p: ScopedPreference) => {
  const dimFa: Record<PrefDim, string> = {
    brand: "برند", budget: "بودجه", origin: "کشور/مبدأ", type: "نوع محصول", flavor: "طعم",
    color: "رنگ", size: "سایز", need: "نیاز", quality: "کیفیت", count: "تعداد گزینه",
  };
  return `${dimFa[p.dim]}: ${p.value}${p.scope === "global" ? " (ترجیح همیشگی)" : ""}`;
};

/** Few-line Persian summary for the prompt. */
export function serializePetMemory(mem?: PetMemory | null): string {
  const m = ensurePetMemory(mem);
  const lines: string[] = [];
  for (const p of m.pets) {
    const bits: string[] = [];
    if (p.name) bits.push(`اسم ${p.name}`);
    if (p.ageYears != null) bits.push(`${faNum(p.ageYears)} ساله`);
    else if (p.lifeStage) bits.push(STAGE_FA[p.lifeStage] || p.lifeStage);
    if (p.breedSize) bits.push(`جثه ${p.breedSize}`);
    if (p.healthNeeds.length) bits.push(`نیاز: ${p.healthNeeds.join("، ")}`);
    lines.push(`${p.species}${p.species === m.activeSpecies ? " (فعلی)" : ""}: ${bits.join("، ") || "بدون جزئیات"}`);
  }
  if (m.brandsLiked.length) lines.push(`برندهای پسندیده: ${m.brandsLiked.join("، ")}`);
  if (m.brandsRejected.length) lines.push(`برندهای ردشده: ${m.brandsRejected.join("، ")}`);
  if (m.brandsDiscussed.length) lines.push(`برندهای دیده‌شده: ${m.brandsDiscussed.slice(-8).join("، ")}`);

  const head = lines.length
    ? `حافظه حیوان‌ها (هرگز اطلاعات دو حیوان را قاطی نکن):\n${lines.join("\n")}`
    : "";

  const key = m.purchaseKey || "*|*";
  const [sp, group] = key.split("|");
  const active = activePreferences(m);
  const remembered = rememberedPreferences(m);
  const blocks: string[] = [head];
  if (sp !== "*" || group !== "*") {
    blocks.push(`خرید جاری: ${sp !== "*" ? sp : "—"}${group !== "*" ? ` / ${group}` : ""}`);
  }
  if (active.length) {
    blocks.push(`ترجیحات فعال همین خرید (اعمال کن):\n${active.map((p) => `- ${prefLine(p)}`).join("\n")}`);
  }
  if (remembered.length) {
    blocks.push(
      `ترجیح‌های خریدهای قبلی (غیرفعال — بدون تأیید کاربر اعمال نکن و از آن‌ها «نداریم» نتیجه نگیر):\n${remembered
        .map((p) => `- ${prefLine(p)} (خرید: ${p.purchaseKey})`)
        .join("\n")}`,
    );
  }
  return blocks.filter(Boolean).join("\n\n");
}
