/**
 * PetAbad discovery regression suite (Part 7 of the approved plan).
 *
 * Replays real Persian shopping missions against the DEPLOYED petabad-agent and
 * asserts shopping-decision correctness, not just "did anything come back".
 *
 * Run:  bun run scripts/petabad-eval.ts
 */

const SUPABASE_URL = "https://duzgvkljbwtocgydbbln.supabase.co";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1emd2a2xqYnd0b2NneWRiYmxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzNTczNjQsImV4cCI6MjA4NjkzMzM2NH0.H4txBBcMtzYWnY4nRjxXQPxZxxvhIhaOuhlPsZmNhXM";

type Case = {
  id: string;
  prompt: string;
  /** canonical species the products must belong to (substring match on the species field) */
  species?: string;
  /** every product name must match at least one of these */
  nameAnyOf?: RegExp[];
  /** no product name may match any of these */
  nameNoneOf?: RegExp[];
  expectProducts: boolean;
  /** a grounded clarification card is an acceptable answer for this vague prompt */
  allowClarification?: boolean;
  maxSeconds?: number;
  /** prior turns replayed before the prompt (real-world conversations) */
  history?: { role: "user" | "assistant"; content: string }[];
  /** answer text must contain at least one of these */
  contentAnyOf?: RegExp[];
  /** answer text must contain none of these */
  contentNoneOf?: RegExp[];
  /** trace.tools must not include any of these */
  toolsNoneOf?: string[];
  /** accepted trace.answer_source values */
  answerSource?: string | string[];
  minProducts?: number;
};

const CASES: Case[] = [
  {
    id: "cat-skin-coat",
    prompt: "برای گربم غذا می خوام برای پوست و مو",
    species: "گربه",
    expectProducts: true,
    allowClarification: true,
  },
  {
    id: "senior-cat-skin-coat",
    prompt: "برای گربه هفت سالم غذا میخوام برای پوست و موش",
    species: "گربه",
    expectProducts: true,
  },
  {
    id: "senior-cat-german-brand",
    prompt: "برای گربم که هفت سالشه برای پوست و موش غذا می‌خوام فقط از برند آلمانی باشه",
    species: "گربه",
    expectProducts: true,
  },
  {
    id: "colloquial-senior",
    prompt: "برای گربه مسنم غذا میخوام",
    species: "گربه",
    expectProducts: true,
    allowClarification: true,
  },
  {
    id: "wet-cat-food",
    prompt: "چندتا غذای تر برای گربم پیشنهاد بده",
    species: "گربه",
    nameAnyOf: [/کنسرو/, /پوچ/, /سوپ/, /موس/, /پته/, /کاسه/],
    nameNoneOf: [/خشک/],
    expectProducts: true,
  },
  {
    id: "large-breed-dog-dry",
    prompt: "غذای خشک سگ نژاد بزرگ میخوام",
    species: "سگ",
    nameNoneOf: [/گربه/],
    expectProducts: true,
  },
  {
    id: "rabbit-food",
    prompt: "برای خرگوشم غذا میخوام",
    nameNoneOf: [/گربه/, /سگ/],
    expectProducts: true,
  },
  {
    id: "faq-shipping",
    prompt: "هزینه ارسال چقدره؟",
    expectProducts: false,
  },
  // ── Real-world regressions: the tool-loop answer must be what renders ──
  {
    id: "faq-litter-quantity",
    prompt: "چندتا خاک گربه می تونم بخرم؟",
    expectProducts: false,
    contentAnyOf: [/دو\s*عدد/, /۲\s*عدد/],
    toolsNoneOf: ["search_products (discovery-guard)"],
    answerSource: ["model_final", "faq_regrounding"],
  },
  {
    id: "faq-damaged-product",
    prompt: "می شه بهم بگی اگر محصول خراب بود چی می شه؟",
    expectProducts: false,
    contentAnyOf: [/۷\s*روز/, /هفت\s*روز/, /خودداری/, /بازپس/, /مرجوع/],
    toolsNoneOf: ["search_products (discovery-guard)"],
    answerSource: "model_final",
  },
  {
    id: "faq-snapppay-change",
    prompt: "چطور می تونم سفارشی که با اسنپ پی ثبت کردمو تغییر بدم؟",
    expectProducts: false,
    contentAnyOf: [/۰۲۱۷۸۷۶۱۰۰۰/, /لغو/],
    answerSource: "model_final",
  },
  {
    id: "info-foreign-pouch-brands",
    prompt: "برندهای خارجی پوچ گربه چانک چیا دارین",
    expectProducts: false,
    contentNoneOf: [/چانک چیا در لیست/, /موجود نیست/],
    contentAnyOf: [/ویسکاس|فلیکس|گورمت|رویال|جوسرا|پروپلن|مونژه|مونجه|کیت.?کت/],
    toolsNoneOf: ["search_products (discovery-guard)"],
  },
  {
    id: "details-followup-no-new-list",
    history: [
      { role: "user", content: "برای بچه گربم شامپو میخوام" },
      {
        role: "assistant",
        content: "چند گزینه خوب برات پیدا کردم:\n\n۱. شامپو بچه گربه یو اس پت USPet Kitten Shampoo حجم ۲۵۰ میلی لیتر — ۳۰۰,۰۰۰ تومان\nبرای پوست حساس بچه گربه فرموله شده.",
      },
    ],
    prompt: "در مورد این شامپو بیشتر بهم توضیح میدی",
    expectProducts: false,
    contentAnyOf: [/یو اس پت|USPet|US Pet|شامپو/i],
    toolsNoneOf: ["search_products (discovery-guard)"],
    answerSource: "model_final",
  },
  {
    id: "new-cat-bundle",
    history: [{ role: "user", content: "سلام تازه گربه اوردیم اصلا نمی دونم چیا باید براش بگیرم" }],
    prompt: "نیازهای اولیه: بهداشت و نظافت و غذا و خوراک و ظروف تغذیه، بودجه حدودی: مهم نیست، بهترین رو نشونم بده",
    species: "گربه",
    expectProducts: true,
    minProducts: 4,
    maxSeconds: 30,
  },
];

const FA = /[۰-۹]/;
const numberedLines = (t: string) => (t.match(/^\s*[0-9۰-۹]{1,2}[.)\-–]\s*\S/gmu) || []).length;

async function ask(prompt: string, history: Case["history"] = []) {
  const started = Date.now();
  const res = await fetch(`${SUPABASE_URL}/functions/v1/petabad-agent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${ANON_KEY}` },
    body: JSON.stringify({ messages: [...history, { role: "user", content: prompt }], mode: "agentic" }),
  });
  const body = await res.json();
  return { body, seconds: (Date.now() - started) / 1000, status: res.status };
}

function assertCase(c: Case, body: any, seconds: number): string[] {
  const fails: string[] = [];
  const content: string = body?.content || "";
  const products: any[] = body?.products || [];

  if (c.allowClarification && body?.response_type === "clarification" && (body?.clarification?.options?.length || body?.clarification?.steps?.length)) return [];
  if (!content.trim()) fails.push("empty answer text");
  if (/این گزینه‌ها به درخواستت می‌خوره/.test(content)) fails.push("placeholder answer");
  if (/محصول شماره X/.test(content)) fails.push("add-to-cart hint leaked into text");
  if (/\d/.test(content) && !FA.test(content)) fails.push("latin digits in answer");

  if (c.expectProducts) {
    if (products.length === 0) fails.push("no products returned");
    const numbered = numberedLines(content);
    if (numbered !== products.length) fails.push(`parity: ${numbered} numbered vs ${products.length} cards`);
    // intro must be short: everything before the first numbered line
    const firstNumberedIdx = content.split("\n").findIndex((l) => /^\s*[0-9۰-۹]{1,2}[.)\-–]\s*\S/u.test(l));
    const intro = content.split("\n").slice(0, Math.max(firstNumberedIdx, 0)).filter((l) => l.trim()).length;
    if (intro > 3) fails.push(`intro is ${intro} lines (max 3)`);
    // every product needs its own why line
    if (numbered > 0 && content.split("\n").filter((l) => l.trim()).length < numbered * 2)
      fails.push("missing per-product reason lines");
    for (const p of products) {
      const name = String(p.name_fa || p.name || "");
      if (c.species && p.species && !String(p.species).includes(c.species))
        fails.push(`species mismatch: ${name} (${p.species})`);
      if (c.nameAnyOf && !c.nameAnyOf.some((re) => re.test(name))) fails.push(`type mismatch: ${name}`);
      if (c.nameNoneOf && c.nameNoneOf.some((re) => re.test(name))) fails.push(`forbidden product: ${name}`);
    }
  } else if (products.length > 0) {
    fails.push("products returned for a non-product question");
  }

  const tools: string[] = body?.trace?.tools || [];
  if (c.toolsNoneOf) for (const t of c.toolsNoneOf) if (tools.includes(t)) fails.push(`forced tool ran: ${t}`);
  if (c.answerSource) {
    const ok = ([] as string[]).concat(c.answerSource);
    if (!ok.includes(body?.trace?.answer_source)) fails.push(`answer_source ${body?.trace?.answer_source} not in ${ok.join("|")}`);
  }
  if (c.contentAnyOf && !c.contentAnyOf.some((re) => re.test(content))) fails.push(`content missing expected text: ${content.slice(0, 120)}`);
  if (c.contentNoneOf) for (const re of c.contentNoneOf) if (re.test(content)) fails.push(`forbidden text: ${re}`);
  if (c.minProducts && products.length < c.minProducts) fails.push(`only ${products.length} cards (min ${c.minProducts})`);

  const limit = c.maxSeconds ?? 20;
  if (seconds > limit) fails.push(`slow: ${seconds.toFixed(1)}s > ${limit}s`);
  return fails;
}

const results: { id: string; pass: boolean; seconds: number; fails: string[] }[] = [];
for (const c of CASES) {
  try {
    const { body, seconds, status } = await ask(c.prompt, c.history);
    const fails = status === 200 ? assertCase(c, body, seconds) : [`http ${status}`];
    results.push({ id: c.id, pass: fails.length === 0, seconds, fails });
    console.log(`${fails.length === 0 ? "PASS" : "FAIL"} ${c.id} (${seconds.toFixed(1)}s)`);
    for (const f of fails) console.log(`   - ${f}`);
  } catch (e) {
    results.push({ id: c.id, pass: false, seconds: 0, fails: [String(e)] });
    console.log(`FAIL ${c.id} — ${String(e)}`);
  }
}

const passed = results.filter((r) => r.pass).length;
console.log(`\n${passed}/${results.length} cases passed`);
if (passed !== results.length) process.exit(1);
