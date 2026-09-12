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
  /** product cards are acceptable even though this is not a product-listing case */
  allowProducts?: boolean;
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
    // brand answers may name real products; cards next to them are fine, a denial is not
    expectProducts: false,
    allowProducts: true,
    contentNoneOf: [/چانک چیا در لیست/, /موجود نیست/],
    contentAnyOf: [/ویسکاس|فلیکس|گورمت|رویال|جوسرا|پروپلن|مونژه|مونجه|کیت.?کت|Whiskas|Royal Canin|KitCat|Monge|Felix|Hills/i],
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
  // ── Full-catalog scope: foreign-only, brand diversity, "other brands" ──
  {
    id: "foreign-skin-coat-all",
    prompt: "همه محصولات خارجی که برای پوست و موی گربم مناسبن رو بده غذا",
    species: "گربه",
    expectProducts: true,
    minProducts: 5,
    maxSeconds: 30,
  },
  {
    id: "other-brands-no-repeat",
    history: [
      { role: "user", content: "همه محصولات خارجی که برای پوست و موی گربم مناسبن رو بده غذا" },
      {
        role: "assistant",
        content:
          "۱. غذای خشک گربه مراقبت از پوست و مو رویال کنین Royal Canin Hair & Skin Care وزن ۲ کیلوگرم\n۲. غذای خشک گربه جوسرا کتلوکس مناسب سلامت پوست و مو Josera Catelux وزن ۱ کیلوگرم\n۳. غذای خشک درمانی گربه بالغ پروپلن Proplan Derma Care وزن ۱.۵ کیلوگرم",
      },
    ],
    prompt: "بجز این برندها از برندهای دیگه هم بده",
    species: "گربه",
    expectProducts: true,
    nameNoneOf: [/جوسرا|Josera/i, /رویال کنین|Royal Canin/i, /پروپلن|Proplan/i],
    contentNoneOf: [/محدود می‌شود|محدود میشه/],
    maxSeconds: 30,
  },
  // ── Text/card binding: the cards must be the products the answer names ──
  {
    id: "shihtzu-dog-food",
    prompt: "برای سگ شیتزوم غذا می‌خوام",
    species: "سگ",
    nameNoneOf: [/گربه/],
    expectProducts: true,
    allowClarification: true,
    maxSeconds: 30,
  },
  {
    id: "breed-only-species-lock",
    history: [
      { role: "user", content: "شیتزو دارم" },
      { role: "assistant", content: "چه کمکی می‌تونم بکنم؟" },
    ],
    prompt: "غذای خشک مناسبش رو بده",
    species: "سگ",
    nameNoneOf: [/گربه/],
    expectProducts: true,
    allowClarification: true,
    maxSeconds: 30,

  },
  {
    id: "recalled-products-have-cards",
    history: [
      { role: "user", content: "برای سگ نژاد کوچکم غذای خشک میخوام" },
      {
        role: "assistant",
        content:
          "۱. غذای خشک سگ بالغ مدل نژاد کوچک فیدار وزن ۸ کیلوگرم — ۳,۳۴۰,۰۰۰ تومان\nبرای نژاد کوچک فرموله شده.\n\n۲. غذای خشک سگ جوسرا مخصوص نژاد کوچک Josera Adult Mini Delux وزن ۱ کیلوگرم — ۱,۸۵۰,۰۰۰ تومان\nاز برند جوسرا ساخت آلمان.",
      },
    ],
    prompt: "همون دوتای قبلی رو دوباره نشونم بده",
    species: "سگ",
    nameNoneOf: [/گربه/],
    // the model may recap in prose; what must never happen is unrelated cards
    expectProducts: false,
    allowProducts: true,
    contentAnyOf: [/فیدار/, /جوسرا|Josera/i],
    contentNoneOf: [/قلاده/, /کریر/, /پرزگیر/, /گربه/],
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
      // every card must be the product the text names, with the catalog's own price
      if (name && !content.includes(name.slice(0, 20))) fails.push(`card not named in the text: ${name}`);
      if (typeof p.price === "number") {
        const faPrice = p.price.toLocaleString("en-US").replace(/\d/g, (d: string) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);
        if (!content.includes(faPrice)) fails.push(`price in text differs from catalog: ${name} (${faPrice})`);
      }
    }

  } else if (products.length > 0 && !c.allowProducts) {
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

// ── Question-journey replays: drive the adaptive flow the way the card does ──
type JourneyCase = {
  id: string;
  prompt: string;
  history?: { role: "user" | "assistant"; content: string }[];
  /** what the conversation already knows about the pet (client pet memory) */
  petMemory?: Record<string, unknown>;
  /** answer per question id; unknown ids are skipped with «فرقی نمی‌کنه» */
  answers: Record<string, string>;
  neverAsk?: string[];
  /** question ids that must appear, in this relative order */
  order?: string[];
  budgetNoneOf?: RegExp[];
  budgetAnyOf?: RegExp[];
  species?: string;
};

const JOURNEYS: JourneyCase[] = [
  {
    id: "journey-senior-cat-memory",
    prompt: "راهنماییم می‌کنی چه غذایی باید برای گربم بگیرم",
    petMemory: { species: "گربه", life_stage: "سنیور", health_needs: [], product_types: [], foreign_only: null },
    answers: { type: "غذای خشک", need: "نیاز خاصی نداره", origin: "خارجی" },
    neverAsk: ["species", "age"],
    order: ["type", "budget"],
    budgetNoneOf: [/تا ۳۰۰ هزار/],
    species: "گربه",
  },
  {
    id: "journey-foreign-cat-dry-buckets",
    prompt: "غذای خارجی گربه راهنماییم کن",
    answers: { age: "بالغ", type: "غذای خشک", need: "نیاز خاصی نداره" },
    neverAsk: ["species", "origin"],
    order: ["type", "budget"],
    budgetNoneOf: [/تا ۳۰۰ هزار/, /تا ۴۰۰ هزار/],
    budgetAnyOf: [/میلیون/],
    species: "گربه",
  },
  {
    id: "journey-canned-cat-buckets",
    prompt: "کنسرو گربه چی بگیرم راهنماییم کن",
    answers: { age: "بالغ", need: "نیاز خاصی نداره", origin: "فرقی نمی‌کنه" },
    neverAsk: ["species", "type"],
    budgetNoneOf: [/بالای ۱۰ میلیون/],
    species: "گربه",
  },
];

JOURNEYS.push({
  id: "journey-new-cat-bundle",
  prompt: "سلام تازه گربه اوردیم اصلا نمی دونم چیا باید براش بگیرم",
  answers: { age: "بالغ", origin: "فرقی نمی‌کنه" },
  neverAsk: ["species", "budget"],
  species: "گربه",
});

const FLOW_QUESTION_IDS = ["species", "age", "type", "need", "essentials", "completeness", "origin", "budget", "tier"];
const idOf = (card: any): string => {
  const raw = String(card?.id || card?.title || "");
  const found = FLOW_QUESTION_IDS.find((k) => raw === k || raw.startsWith(`flow-${k}`));
  if (found) return found;
  const q = String(card?.question || "");
  if (/حیوان/.test(q)) return "species";
  if (/سنی/.test(q)) return "age";
  if (/نوع/.test(q)) return "type";
  if (/نیاز/.test(q)) return "need";
  if (/برند/.test(q)) return "origin";
  if (/بودجه|سطح/.test(q)) return "budget";
  return raw || "unknown";
};

async function runJourney(c: JourneyCase) {
  const fails: string[] = [];
  const started = Date.now();
  const messages: { role: string; content: string }[] = [...(c.history || []), { role: "user", content: c.prompt }];
  let flow: any = undefined;
  const asked: string[] = [];
  let final: any = null;
  for (let turn = 0; turn < 8; turn++) {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/petabad-agent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${ANON_KEY}` },
      body: JSON.stringify({ messages, mode: "agentic", question_flow: flow, pet_memory: c.petMemory }),
    });
    const body = await res.json();
    if (res.status !== 200) return { fails: [`http ${res.status}`], seconds: 0 };
    if (body.response_type !== "clarification" || !body.question_flow) {
      final = body;
      break;
    }
    const card = body.clarification;
    const id = idOf(card);
    asked.push(id);
    const labels: string[] = (card?.options || []).map((o: any) => String(o?.label || ""));
    if (labels.some((l) => !l.trim())) fails.push(`${id}: empty option label`);
    if (labels.length < 2) fails.push(`${id}: fewer than two options`);
    if (/\d/.test(labels.join(" ")) && !FA.test(labels.join(" "))) fails.push(`${id}: latin digits in options`);
    if (id === "budget") {
      const joined = labels.join(" | ");
      for (const re of c.budgetNoneOf || []) if (re.test(joined)) fails.push(`budget bucket should not exist: ${re} in «${joined}»`);
      for (const re of c.budgetAnyOf || []) if (!re.test(joined)) fails.push(`budget missing ${re}: «${joined}»`);
    }
    const answer = c.answers[id] ?? (labels.find((l) => /فرقی نمی|مهم نیست/.test(l)) || labels[0]);
    flow = body.question_flow;
    messages.push({ role: "assistant", content: `سؤال: ${card?.question}` }, { role: "user", content: answer });
  }
  for (const id of c.neverAsk || []) if (asked.includes(id)) fails.push(`asked «${id}» although it was already known`);
  if (asked.includes("budget") && asked[asked.length - 1] !== "budget") fails.push(`budget was not the last question: ${asked.join(" → ")}`);
  for (const o of c.order || []) if (!asked.includes(o) && o !== "budget") fails.push(`expected question «${o}» was never asked: ${asked.join(" → ")}`);
  if (c.order && c.order.every((o) => asked.includes(o))) {
    const idx = c.order.map((o) => asked.indexOf(o));
    if (idx.some((v, i) => i > 0 && v < idx[i - 1])) fails.push(`question order ${asked.join(" → ")} violates ${c.order.join(" → ")}`);
  }
  if (!final) fails.push("journey never produced a final answer");
  else {
    const products: any[] = final.products || [];
    if (products.length === 0) fails.push("no products after the journey");
    for (const p of products) {
      if (c.species && p.species && !String(p.species).includes(c.species)) fails.push(`species mismatch: ${p.name_fa}`);
    }
  }
  console.log(`   asked: ${asked.join(" → ") || "(none)"}`);
  return { fails, seconds: (Date.now() - started) / 1000 };
}

for (const c of JOURNEYS) {
  try {
    console.log(`… ${c.id}`);
    const { fails, seconds } = await runJourney(c);
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
