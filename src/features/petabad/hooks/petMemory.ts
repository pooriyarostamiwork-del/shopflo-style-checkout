/**
 * Per-conversation memory of the shopper's pets and preferences (PetAbad only).
 * Filled deterministically from the shopper's own words and from answered
 * journey steps — no model call. Serialized as a few Persian lines for the prompt
 * and sent as a compact object so the server can skip questions it already knows.
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

export interface PetMemory {
  pets: PetProfile[];
  activeSpecies?: string | null;
  brandsDiscussed: string[];
  brandsLiked: string[];
  brandsRejected: string[];
  foreignOnly?: boolean | null;
  /** budget by «species|type» key */
  budgets: Record<string, { min?: number; max?: number }>;
  topics: string[];
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
  [/کنسرو/, "کنسرو"],
  [/پوچ/, "پوچ"],
  [/تشویقی|اسنک/, "تشویقی"],
  [/سوپ/, "سوپ"],
  [/شامپو/, "شامپو و نرم‌کننده"],
  [/خاک|ظرف بهداشتی/, "خاک و ظرف بهداشتی"],
  [/اسباب بازی|اسباب‌بازی/, "اسباب‌بازی"],
  [/قلاده|هارنس/, "قلاده و هارنس"],
  [/جای خواب|تخت/, "جای خواب"],
];

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

  if (/(خارجی|وارداتی|غیر ایرانی|اورجینال)/.test(t)) mem.foreignOnly = true;
  else if (/(ایرانی|داخلی|تولید ایران)/.test(t)) mem.foreignOnly = false;

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
  for (const s of steps) {
    const a = s.answer.trim();
    if (!a || /فرقی نمی|مهم نیست|نیاز خاصی/.test(a)) continue;
    switch (s.card.id) {
      case "age":
        if (pet) pet.lifeStage = STAGE_FROM_LABEL(a) || pet.lifeStage;
        break;
      case "need":
        if (pet) pet.healthNeeds = uniq([...pet.healthNeeds, ...a.split(" و ").map((x) => x.trim())]).slice(-6);
        break;
      case "type":
        if (pet) pet.productTypes = uniq([...pet.productTypes, ...a.split(" و ").map((x) => x.trim())]).slice(-6);
        break;
      case "origin":
        if (/خارجی/.test(a)) mem.foreignOnly = true;
        else if (/ایرانی/.test(a)) mem.foreignOnly = false;
        break;
      case "budget": {
        const nums = (a.match(/[۰-۹0-9٫.]+\s*(میلیون|هزار)/g) || []).map((x) => {
          const n = parseFloat(norm(x).replace("٫", ".").replace(/[^\d.]/g, ""));
          return /میلیون/.test(x) ? n * 1_000_000 : n * 1_000;
        });
        const key = `${species || "*"}|${pet?.productTypes.slice(-1)[0] || "*"}`;
        if (nums.length === 1) mem.budgets[key] = /^تا/.test(a) ? { max: nums[0] } : { min: nums[0] };
        else if (nums.length >= 2) mem.budgets[key] = { min: nums[0], max: nums[1] };
        break;
      }
    }
  }
  if (pet) setPet(mem, pet);
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
  return {
    species: pet.species,
    name: pet.name || null,
    life_stage: pet.lifeStage || null,
    age_years: pet.ageYears ?? null,
    breed_size: pet.breedSize || null,
    health_needs: pet.healthNeeds,
    product_types: pet.productTypes,
    foreign_only: m.foreignOnly ?? null,
  };
}

const STAGE_FA: Record<string, string> = { نابالغ: "بچه/نابالغ", بالغ: "بالغ", سنیور: "سالمند" };
const faNum = (n: number) => n.toLocaleString("fa-IR");

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
    if (p.productTypes.length) bits.push(`دنبال: ${p.productTypes.join("، ")}`);
    lines.push(`${p.species}${p.species === m.activeSpecies ? " (فعلی)" : ""}: ${bits.join("، ") || "بدون جزئیات"}`);
  }
  if (m.foreignOnly === true) lines.push("فقط برند خارجی می‌خواد");
  if (m.foreignOnly === false) lines.push("فقط برند ایرانی می‌خواد");
  if (m.brandsLiked.length) lines.push(`برندهای پسندیده: ${m.brandsLiked.join("، ")}`);
  if (m.brandsRejected.length) lines.push(`برندهای ردشده: ${m.brandsRejected.join("، ")}`);
  if (m.brandsDiscussed.length) lines.push(`برندهای دیده‌شده: ${m.brandsDiscussed.slice(-8).join("، ")}`);
  for (const [k, v] of Object.entries(m.budgets)) {
    const [sp, type] = k.split("|");
    const parts: string[] = [];
    if (v.min) parts.push(`از ${faNum(v.min)}`);
    if (v.max) parts.push(`تا ${faNum(v.max)}`);
    if (parts.length) lines.push(`بودجه ${type !== "*" ? type + " " : ""}${sp !== "*" ? sp : ""}: ${parts.join(" ")} تومان`);
  }
  return lines.length ? `حافظه حیوان‌ها و ترجیحات (هرگز اطلاعات دو حیوان را قاطی نکن):\n${lines.join("\n")}` : "";
}
