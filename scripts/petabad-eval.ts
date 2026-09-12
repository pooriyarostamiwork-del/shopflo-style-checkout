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
  maxSeconds?: number;
};

const CASES: Case[] = [
  {
    id: "cat-skin-coat",
    prompt: "برای گربم غذا می خوام برای پوست و مو",
    species: "گربه",
    expectProducts: true,
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
];

const FA = /[۰-۹]/;
const numberedLines = (t: string) => (t.match(/^\s*[0-9۰-۹]{1,2}[.)\-–]\s*\S/gmu) || []).length;

async function ask(prompt: string) {
  const started = Date.now();
  const res = await fetch(`${SUPABASE_URL}/functions/v1/petabad-agent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${ANON_KEY}` },
    body: JSON.stringify({ messages: [{ role: "user", content: prompt }] }),
  });
  const body = await res.json();
  return { body, seconds: (Date.now() - started) / 1000, status: res.status };
}

function assertCase(c: Case, body: any, seconds: number): string[] {
  const fails: string[] = [];
  const content: string = body?.content || "";
  const products: any[] = body?.products || [];

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

  const limit = c.maxSeconds ?? 20;
  if (seconds > limit) fails.push(`slow: ${seconds.toFixed(1)}s > ${limit}s`);
  return fails;
}

const results: { id: string; pass: boolean; seconds: number; fails: string[] }[] = [];
for (const c of CASES) {
  try {
    const { body, seconds, status } = await ask(c.prompt);
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
