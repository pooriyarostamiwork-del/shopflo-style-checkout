// ── Adaptive, catalog-grounded question flow (PetAbad only) ─────────────
// One question per turn. Every option is checked against in-stock rows before
// it is shown, questions are asked only when they materially split the
// candidate set, and price always comes last — computed from the configuration
// the shopper has described so far.

export type FlowGoal = "single" | "bundle";

export interface QuestionFlow {
  goal: FlowGoal;
  /** The shopper's original request that started the flow. */
  seed: string;
  species?: string | null;
  /** Product types named in the request (set silently, never asked). */
  productTypes?: string[] | null;
  /** Question ids already asked (answered or skipped). */
  asked: string[];
  /** Answers keyed by question id (raw option labels, multi joined by « و »). */
  answers: Record<string, string>;
  /** Question id waiting for an answer (the card currently on screen). */
  pending?: string | null;
  /** Question ids answered from memory/request without being shown. */
  seeded?: string[];
  done?: boolean;
}

/** Facts already known about the shopper's pet — questions with a known answer are skipped. */
export interface FlowSeed {
  lifeStage?: string | null;
  foreignOnly?: boolean | null;
  healthNeeds?: string[] | null;
  productTypes?: string[] | null;
}

export type FacetPrice = { min: number; q1: number; median: number; q3: number; max: number } | null;

export interface FlowDeps {
  supabase: any;
  normalize: (s: string) => string;
  formatToman: (v: number) => string;
  detectSpecies: (s: string) => string | null;
  concreteSpecies: (species: string, text: string) => string;
  detectProductTypes: (text: string) => string[];
  buildBudgetOptions: (price: FacetPrice) => any[] | null;
  needSpecs: Array<{ key: string; label: string; query: (sp: string) => string }>;
}

type Bucket = { value: string; count: number };
type Facets = {
  total: number;
  price: FacetPrice;
  life_stages: Bucket[];
  needs: Bucket[];
  countries: Bucket[];
  species: Bucket[];
  product_types: Bucket[];
};

export interface FlowSummary {
  goal: FlowGoal;
  seed: string;
  species: string | null;
  lifeStage: string | null;
  healthNeeds: string[];
  productTypes: string[];
  needKeys: string[];
  foreignOnly: boolean | null;
  complete: boolean;
  tier: "economy" | "complete" | "premium" | null;
  priceMax: number | null;
  priceMin: number | null;
  promptBlock: string;
}

export type FlowCard = {
  kind: "single";
  id: string;
  title: string;
  question: string;
  helper?: string;
  multi?: boolean;
  progress?: string;
  options: Array<{ label: string; hint?: string }>;
};

const SKIP_RE = /(فرقی نمی|مهم نیست|نمی\s*دونم|هر چی|خودت انتخاب)/;
const MIN_OPTION_ROWS = 3;
const DOMINANCE = 0.85;
const MAX_QUESTIONS = 5;
const UMBRELLA = ["سایر حیوانات خانگی", "ماهی و آکواریوم"];

export const BUNDLE_RE =
  /(پک|پکیج|بسته|ست)\s*(کامل|شروع|اولیه|استارت)|استارتر|همه\s*(چیز|چیزهایی|وسایل|لوازم)|هر\s*چی\s*(که\s*)?لازم|تازه\s*(\S+\s*){0,2}(آوردم|آوردیم|اوردم|اوردیم|گرفتم|گرفتیم|خریدم|خریدیم|اومده)|(وسایل|لوازم)\s*(اولیه|لازم|ضروری)|از\s*صفر|نمی\s*دونم\s*چیا?\s*(باید\s*)?(براش\s*)?بگیرم|چیا\s*(باید\s*)?(براش\s*)?(لازم|بگیرم)/;

export function detectGoal(normText: string): FlowGoal {
  return BUNDLE_RE.test(normText) ? "bundle" : "single";
}

const STAGE_ANSWER: Record<string, string> = { نابالغ: "بچه / نابالغ", بالغ: "بالغ", سنیور: "سالمند / سنیور" };

/**
 * Start a flow. Facts the conversation already established (pet memory, words in
 * the request) are written in as answers so the matching questions are skipped.
 */
export function startFlow(
  goal: FlowGoal,
  seed: string,
  species: string | null,
  deps?: FlowDeps,
  known?: FlowSeed | null,
): QuestionFlow {
  const answers: Record<string, string> = {};
  const asked: string[] = [];
  const types = known?.productTypes?.length ? known.productTypes : deps ? deps.detectProductTypes(seed) : [];
  if (known?.lifeStage && STAGE_ANSWER[known.lifeStage]) {
    answers["age"] = STAGE_ANSWER[known.lifeStage];
    asked.push("age");
  }
  if (known?.foreignOnly === true || known?.foreignOnly === false) {
    answers["origin"] = known.foreignOnly ? "خارجی" : "ایرانی";
    asked.push("origin");
  }
  if (goal === "single" && known?.healthNeeds?.length) {
    answers["need"] = known.healthNeeds.join(" و ");
    asked.push("need");
  }
  return {
    goal,
    seed,
    species,
    productTypes: types.length ? types : null,
    asked,
    answers,
    seeded: [...asked],
    pending: null,
    done: false,
  };
}

/** Record the shopper's reply to the pending question. Free text counts as an answer too. */
export function recordAnswer(flow: QuestionFlow, text: string): QuestionFlow {
  if (!flow.pending) return flow;
  const answers = { ...flow.answers, [flow.pending]: SKIP_RE.test(text) ? "" : text.trim() };
  return { ...flow, answers, pending: null };
}

export function isFlow(v: any): v is QuestionFlow {
  return (
    v &&
    typeof v === "object" &&
    (v.goal === "single" || v.goal === "bundle") &&
    typeof v.seed === "string" &&
    Array.isArray(v.asked) &&
    v.answers &&
    typeof v.answers === "object"
  );
}

async function facets(deps: FlowDeps, params: Record<string, any>): Promise<Facets | null> {
  try {
    const { data, error } = await deps.supabase.rpc("pet_question_facets", { p_in_stock: true, ...params });
    if (error || !data) {
      if (error) console.error("Flow facets error:", error);
      return null;
    }
    return {
      total: Number(data.total) || 0,
      price: data.price
        ? {
            min: Number(data.price.min),
            q1: Number(data.price.q1),
            median: Number(data.price.median),
            q3: Number(data.price.q3),
            max: Number(data.price.max),
          }
        : null,
      life_stages: data.life_stages || [],
      needs: data.needs || [],
      countries: data.countries || [],
      species: data.species || [],
      product_types: data.product_types || [],
    };
  } catch (e) {
    console.error("Flow facets exception:", e);
    return null;
  }
}

const STAGE_LABEL: Record<string, { label: string; hint?: string }> = {
  نابالغ: { label: "بچه / نابالغ", hint: "زیر یک سال" },
  بالغ: { label: "بالغ", hint: "۱ تا ۷ سال" },
  سنیور: { label: "سالمند / سنیور", hint: "بالای ۷ سال" },
};
function stageFromLabel(label: string): string | null {
  if (/نابالغ|بچه|توله|کیتن|پاپی/.test(label)) return "نابالغ";
  if (/سنیور|سالمند|پیر|مسن/.test(label)) return "سنیور";
  if (/بالغ/.test(label)) return "بالغ";
  return null;
}

/** Keep buckets with enough rows; drop a bucket that dominates the slice (it does not split anything). */
function splitting(buckets: Bucket[], total: number, max = 5): Bucket[] {
  const live = (buckets || []).filter((b) => b?.value && Number(b.count) >= MIN_OPTION_ROWS);
  if (live.length < 2) return [];
  const usable = live.filter((b) => total === 0 || Number(b.count) / total <= DOMINANCE);
  return (usable.length >= 2 ? usable : live).slice(0, max);
}

function speciesParam(deps: FlowDeps, flow: QuestionFlow): string | null {
  const sp = flow.species || null;
  if (!sp) return null;
  if (UMBRELLA.includes(sp)) {
    const concrete = deps.concreteSpecies(sp, flow.seed);
    return concrete && !UMBRELLA.includes(concrete) ? concrete : null;
  }
  return sp;
}
const speciesWord = (deps: FlowDeps, flow: QuestionFlow) =>
  speciesParam(deps, flow) || (flow.species ? deps.concreteSpecies(flow.species, flow.seed) : "") || "";

const currentStage = (flow: QuestionFlow) => (flow.answers["age"] ? stageFromLabel(flow.answers["age"]) : null);
function currentForeign(flow: QuestionFlow): boolean | null {
  const a = flow.answers["origin"] || "";
  if (/خارجی/.test(a)) return true;
  if (/ایرانی/.test(a)) return false;
  return null;
}
const selectedNeedKeys = (deps: FlowDeps, flow: QuestionFlow) => {
  const a = flow.answers["essentials"] || "";
  return deps.needSpecs.filter((n) => a.includes(n.label)).map((n) => n.key);
};
function selectedHealthNeeds(flow: QuestionFlow): string[] {
  const a = flow.answers["need"] || "";
  if (!a || /نیاز خاصی/.test(a)) return [];
  return a.split(" و ").map((s) => s.trim()).filter(Boolean);
}
/** Product types in play: the answered type question first, then types named in the request. */
function currentTypes(flow: QuestionFlow): string[] {
  const a = flow.answers["type"] || "";
  if (a && !/فرقی نمی|مهم نیست/.test(a)) return a.split(" و ").map((s) => s.trim()).filter(Boolean);
  return flow.productTypes || [];
}
const FOOD_SEED_RE = /(غذا|خوراک|کنسرو|پوچ|تشویقی|خشک)/;

const FILLER_RE =
  /(راهنمایی(م)?|کمک(م)?|کن|کنی|چی|چه|کدوم|بخرم|بگیرم|میخوام|می‌خوام|خوام|برام|برای|پیشنهاد|معرفی|لطفا|لطفاً|بهترین|یه|یک|بده|نمیدونم|نمی‌دونم|مشاوره|توصیه|بدید|میدی|می‌دی|هست|رو|را|از|به|که|و)/g;
const cleanSeed = (deps: FlowDeps, seed: string) =>
  deps.normalize(seed).replace(FILLER_RE, " ").replace(/\s+/g, " ").trim();

/** Facets of the slice the shopper has described so far (single-product flow). */
async function singleSlice(deps: FlowDeps, flow: QuestionFlow): Promise<Facets | null> {
  const params: Record<string, any> = {};
  const sp = speciesParam(deps, flow);
  if (sp) params.p_species = sp;
  const types = currentTypes(flow);
  if (types.length) params.p_product_types = types;
  else if (FOOD_SEED_RE.test(deps.normalize(flow.seed))) params.p_type_group = "غذا";
  // Free text only narrows an unstructured slice; once a type is known it would
  // just re-match generic words and skew the price quantiles.
  const q = types.length ? "" : cleanSeed(deps, flow.seed);
  if (q) params.p_query = q;
  const needs = selectedHealthNeeds(flow);
  if (needs.length) params.p_needs = needs;
  const foreign = currentForeign(flow);
  if (foreign !== null) params.p_foreign_only = foreign;
  let f = await facets(deps, params);
  if ((!f || f.total === 0) && params.p_query) {
    delete params.p_query;
    f = await facets(deps, params);
  }
  // Life stage is a soft signal: narrow only while the slice stays meaningful.
  const stage = currentStage(flow);
  if (stage && f && f.total >= 8) {
    const g = await facets(deps, { ...params, p_life_stage: stage });
    if (g && g.total >= 4) f = g;
  }
  return f;
}

/** Per-essential facets for a bundle (species + origin applied). */
async function bundleSlices(deps: FlowDeps, flow: QuestionFlow, keys: string[]) {
  const sp = speciesParam(deps, flow);
  const word = speciesWord(deps, flow);
  const foreign = currentForeign(flow);
  return Promise.all(
    deps.needSpecs
      .filter((n) => keys.includes(n.key))
      .map(async (n) => {
        const params: Record<string, any> = { p_query: n.query(word) };
        if (sp) params.p_species = sp;
        if (foreign !== null) params.p_foreign_only = foreign;
        let f = await facets(deps, params);
        if ((!f || f.total === 0) && foreign !== null) {
          delete params.p_foreign_only;
          f = await facets(deps, params);
        }
        return { need: n, facets: f };
      }),
  );
}

const roundHuman = (v: number) => {
  if (v >= 10_000_000) return Math.round(v / 1_000_000) * 1_000_000;
  if (v >= 1_000_000) return Math.round(v / 500_000) * 500_000;
  return Math.max(100_000, Math.round(v / 100_000) * 100_000);
};

const originSplit = (c: Bucket[]) => {
  const ir = c.filter((x) => /ایران/.test(String(x.value))).reduce((a, x) => a + Number(x.count), 0);
  const fo = c.filter((x) => !/ایران/.test(String(x.value))).reduce((a, x) => a + Number(x.count), 0);
  return { ir, fo };
};

type Builder = (deps: FlowDeps, flow: QuestionFlow) => Promise<FlowCard | null>;

const speciesQuestion: Builder = async (deps, flow) => {
  if (flow.species) return null;
  const f = await facets(deps, {});
  const present = (f?.species || []).map((s) => deps.normalize(String(s.value || "")));
  const has = (re: RegExp) => present.some((v) => re.test(v));
  const options: FlowCard["options"] = [];
  if (has(/سگ/)) options.push({ label: "سگ" });
  if (has(/گربه/)) options.push({ label: "گربه" });
  if (has(/پرنده|طوطی/)) options.push({ label: "پرنده" });
  if (has(/ماهی|آبزی|آکواریوم/)) options.push({ label: "ماهی و آکواریوم" });
  if (has(/جونده|خرگوش|همستر|خزنده|لاک/)) options.push({ label: "سایر حیوانات خانگی", hint: "خرگوش، همستر، خزنده…" });
  if (options.length < 2) return null;
  return { kind: "single", id: "species", title: "نوع حیوان", question: "برای چه حیوانی می‌خوای؟", options };
};

const ageQuestion: Builder = async (deps, flow) => {
  const sp = speciesParam(deps, flow);
  const f = flow.goal === "bundle" ? await facets(deps, sp ? { p_species: sp } : {}) : await singleSlice(deps, flow);
  if (!f) return null;
  const buckets = splitting(f.life_stages, f.total, 3);
  if (buckets.length < 2) return null;
  const options: FlowCard["options"] = ["نابالغ", "بالغ", "سنیور"]
    .filter((k) => buckets.some((b) => b.value === k))
    .map((k) => ({ label: STAGE_LABEL[k].label, hint: STAGE_LABEL[k].hint }));
  options.push({ label: "مهم نیست" });
  const name = flow.species && !UMBRELLA.includes(flow.species) ? `${flow.species}‌ت` : "حیوانت";
  return { kind: "single", id: "age", title: "سن", question: `${name} تو چه سنیه؟`, options };
};

const essentialsQuestion: Builder = async (deps, flow) => {
  const slices = await bundleSlices(deps, flow, deps.needSpecs.map((n) => n.key));
  const options = slices.filter((s) => s.facets && s.facets.total >= MIN_OPTION_ROWS).map((s) => ({ label: s.need.label }));
  if (options.length < 2) return null;
  const name = flow.species && !UMBRELLA.includes(flow.species) ? `${flow.species}‌ت` : "حیوانت";
  return {
    kind: "single",
    id: "essentials",
    title: "اقلام",
    question: `برای ${name} چه چیزهایی لازم داری؟`,
    helper: "می‌تونی چند مورد انتخاب کنی",
    multi: true,
    options,
  };
};

const completenessQuestion: Builder = async (deps, flow) => {
  if (selectedNeedKeys(deps, flow).length < 2) return null;
  return {
    kind: "single",
    id: "completeness",
    title: "کامل بودن",
    question: "پک چقدر کامل باشه؟",
    options: [
      { label: "فقط ضروری‌ها", hint: "یک انتخاب مطمئن برای هر قلم" },
      { label: "کامل و بی‌دغدغه", hint: "برای هر قلم دو گزینه تا انتخاب کنی" },
    ],
  };
};

const needQuestion: Builder = async (deps, flow) => {
  const f = await singleSlice(deps, flow);
  if (!f || f.total < 8) return null;
  const buckets = splitting(f.needs, f.total, 5);
  if (buckets.length < 2) return null;
  return {
    kind: "single",
    id: "need",
    title: "نیاز",
    question: "نیاز خاصی داره که باید در نظر بگیرم؟",
    helper: "می‌تونی چند مورد انتخاب کنی",
    multi: true,
    options: [...buckets.map((b) => ({ label: b.value })), { label: "نیاز خاصی نداره" }],
  };
};

const originQuestion: Builder = async (deps, flow) => {
  if (flow.goal === "bundle") {
    const keys = selectedNeedKeys(deps, flow);
    if (keys.length === 0) return null;
    const slices = await bundleSlices(deps, flow, keys);
    // Ask only when every chosen essential has both origins in stock.
    const ok = slices.every((s) => {
      const { ir, fo } = originSplit(s.facets?.countries || []);
      return ir >= MIN_OPTION_ROWS && fo >= MIN_OPTION_ROWS;
    });
    if (!ok) return null;
  } else {
    const f = await singleSlice(deps, flow);
    if (!f || f.total === 0) return null;
    const { ir, fo } = originSplit(f.countries || []);
    if (ir < MIN_OPTION_ROWS || fo < MIN_OPTION_ROWS) return null;
    if (ir / f.total > DOMINANCE || fo / f.total > DOMINANCE) return null;
  }
  return {
    kind: "single",
    id: "origin",
    title: "برند",
    question: "برند خارجی ترجیح می‌دی یا ایرانی؟",
    options: [{ label: "خارجی" }, { label: "ایرانی" }, { label: "فرقی نمی‌کنه" }],
  };
};

/** «خشک یا کنسرو؟» — asked only when the request names no type and the slice really splits. */
const typeQuestion: Builder = async (deps, flow) => {
  if (currentTypes(flow).length) return null;
  const f = await singleSlice(deps, flow);
  if (!f || f.total < 8) return null;
  const buckets = splitting(f.product_types, f.total, 5);
  if (buckets.length < 2) return null;
  const food = buckets.every((b) => /غذا|کنسرو|پوچ|تشویقی|سوپ|شیر/.test(String(b.value)));
  return {
    kind: "single",
    id: "type",
    title: "نوع محصول",
    question: food ? "چه نوع غذایی مد نظرته؟" : "دقیقاً دنبال چه نوع محصولی هستی؟",
    options: [...buckets.map((b) => ({ label: String(b.value) })), { label: "فرقی نمی‌کنه" }],
  };
};

const budgetQuestion: Builder = async (deps, flow) => {
  const f = await singleSlice(deps, flow);
  if (!f || f.total < 4) return null;
  const options = deps.buildBudgetOptions(f.price);
  if (!options) return null;
  return {
    kind: "single",
    id: "budget",
    title: "بودجه",
    question: "بودجه‌ات حدوداً چقدره؟",
    options: options.map((o: any) => ({ label: o.label })),
  };
};

/** Real configurations priced from the catalog: economical / complete / professional. */
const tierQuestion: Builder = async (deps, flow) => {
  const keys = selectedNeedKeys(deps, flow);
  if (keys.length === 0) return null;
  const priced = (await bundleSlices(deps, flow, keys)).filter((s) => s.facets?.price);
  if (priced.length === 0) return null;
  const perItem = /کامل/.test(flow.answers["completeness"] || "") ? 2 : 1;
  const sum = (pick: (p: NonNullable<FacetPrice>) => number) =>
    priced.reduce((a, s) => a + pick(s.facets!.price!), 0) * perItem;
  const eco = roundHuman(sum((p) => p.q1));
  const mid = roundHuman(sum((p) => p.median));
  const pro = roundHuman(sum((p) => p.q3));
  const options: FlowCard["options"] = [];
  if (eco > 0) options.push({ label: `پک اقتصادی — حدود ${deps.formatToman(eco)} تومان` });
  if (mid > eco) options.push({ label: `پک کامل — حدود ${deps.formatToman(mid)} تومان` });
  if (pro > mid) options.push({ label: `پک حرفه‌ای — حدود ${deps.formatToman(pro)} تومان` });
  if (options.length < 2) return null;
  options.push({ label: "مهم نیست، بهترین ترکیب رو بچین" });
  return {
    kind: "single",
    id: "tier",
    title: "بودجه",
    question: "با کدوم سطح راحت‌تری؟",
    helper: "قیمت‌ها از محصولات واقعی همین اقلام حساب شده",
    options,
  };
};

const PLANS: Record<FlowGoal, Array<[string, Builder]>> = {
  bundle: [
    ["species", speciesQuestion],
    ["age", ageQuestion],
    ["essentials", essentialsQuestion],
    ["completeness", completenessQuestion],
    ["origin", originQuestion],
    ["tier", tierQuestion],
  ],
  single: [
    ["species", speciesQuestion],
    ["age", ageQuestion],
    ["type", typeQuestion],
    ["need", needQuestion],
    ["origin", originQuestion],
    ["budget", budgetQuestion],
  ],
};

const faNum = (n: number) => String(n).replace(/[0-9]/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);

/** Apply side effects of an answer (species) so later questions see it. */
function applyAnswerEffects(deps: FlowDeps, flow: QuestionFlow): QuestionFlow {
  const next = { ...flow };
  const sp = flow.answers["species"];
  if (sp && !next.species) next.species = deps.detectSpecies(sp) || sp;
  return next;
}

export async function nextQuestion(
  deps: FlowDeps,
  flowIn: QuestionFlow,
): Promise<{ card: FlowCard | null; flow: QuestionFlow }> {
  const flow = applyAnswerEffects(deps, flowIn);
  const seeded = flow.seeded || [];
  const askedCount = Object.keys(flow.answers).filter((k) => !seeded.includes(k)).length;
  if (askedCount >= MAX_QUESTIONS) return { card: null, flow: { ...flow, done: true, pending: null } };
  const remaining = PLANS[flow.goal].filter(([id]) => !flow.asked.includes(id));
  const asked = [...flow.asked];
  for (let i = 0; i < remaining.length; i++) {
    const [id, build] = remaining[i];
    const card = await build(deps, { ...flow, asked });
    asked.push(id);
    if (!card) continue;
    const left = Math.min(remaining.length - i, MAX_QUESTIONS - askedCount);
    card.progress = `سؤال ${faNum(askedCount + 1)} از حدود ${faNum(askedCount + left)}`;
    return { card, flow: { ...flow, asked, pending: id } };
  }
  return { card: null, flow: { ...flow, asked, done: true, pending: null } };
}

export function summarize(deps: FlowDeps, flow: QuestionFlow): FlowSummary {
  const lifeStage = currentStage(flow);
  const foreignOnly = currentForeign(flow);
  const healthNeeds = selectedHealthNeeds(flow);
  const productTypes = currentTypes(flow);
  const needKeys = selectedNeedKeys(deps, flow);
  const complete = /کامل/.test(flow.answers["completeness"] || "");
  const tierAnswer = flow.answers["tier"] || "";
  const tier = /اقتصادی/.test(tierAnswer)
    ? "economy"
    : /حرفه/.test(tierAnswer)
      ? "premium"
      : /کامل/.test(tierAnswer)
        ? "complete"
        : null;

  let priceMax: number | null = null;
  let priceMin: number | null = null;
  const b = flow.answers["budget"] || "";
  const nums = (b.match(/[۰-۹0-9٫.]+\s*(میلیون|میلیارد|هزار)/g) || []).map((s) => {
    const n = parseFloat(
      s.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace("٫", ".").replace(/[^\d.]/g, ""),
    );
    return /میلیارد/.test(s) ? n * 1_000_000_000 : /میلیون/.test(s) ? n * 1_000_000 : n * 1_000;
  });
  if (nums.length === 1) {
    if (/^تا/.test(b)) priceMax = nums[0];
    else if (/بالای/.test(b)) priceMin = nums[0];
  } else if (nums.length >= 2) {
    priceMin = nums[0];
    priceMax = nums[1];
  }

  const lines: string[] = [
    "FLOW_COMPLETE: سؤال‌ها تموم شد؛ در این نوبت هرگز ask_clarification صدا نزن و حتماً search_products رو صدا بزن.",
    `درخواست اولیه: «${flow.seed}»`,
  ];
  if (flow.species) lines.push(`حیوان: ${flow.species}`);
  if (lifeStage) lines.push(`مرحله سنی: ${lifeStage} (filters.life_stage)`);
  if (needKeys.length) {
    const labels = deps.needSpecs.filter((n) => needKeys.includes(n.key)).map((n) => n.label);
    lines.push(`اقلام پک: ${labels.join("، ")} — ${complete ? "برای هر قلم دو گزینه" : "برای هر قلم یک گزینه مطمئن"}`);
  }
  if (healthNeeds.length) lines.push(`نیاز سلامتی: ${healthNeeds.join("، ")} (filters.needs)`);
  if (productTypes.length) lines.push(`نوع محصول: ${productTypes.join("، ")} — query_text باید همین نوع را داشته باشد`);
  if (foreignOnly !== null)
    lines.push(`محدوده برند: ${foreignOnly ? "فقط خارجی (filters.origin_scope=خارجی)" : "فقط ایرانی (filters.origin_scope=ایرانی)"}`);
  if (tier)
    lines.push(
      `سطح پک: ${tier === "economy" ? "اقتصادی (ارزون‌ترین گزینه‌های مناسب، sort_by=price_asc)" : tier === "premium" ? "حرفه‌ای (گزینه‌های پریمیوم)" : "کامل (میانه بازار)"}`,
    );
  if (priceMax) lines.push(`سقف قیمت هر محصول: ${priceMax} تومان (filters.price_max)`);
  if (priceMin) lines.push(`کف قیمت: ${priceMin} تومان (filters.price_min)`);
  lines.push("در متن پاسخ اول در یک خط بگو بر اساس چه چیزهایی انتخاب کردی، بعد محصول‌ها. هیچ سؤال دیگه‌ای نپرس.");

  return {
    goal: flow.goal,
    seed: flow.seed,
    species: flow.species || null,
    lifeStage,
    healthNeeds,
    productTypes,
    needKeys,
    foreignOnly,
    complete,
    tier,
    priceMax,
    priceMin,
    promptBlock: lines.join("\n"),
  };
}
