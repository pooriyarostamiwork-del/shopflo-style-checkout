// Executional requests (cart mutations, checkout selections, native-UI redirections).
// Runtime-neutral: imported by petabad-agent (Deno) and type-shared with the app, so the
// app and the Telegram bot receive one validated contract instead of raw model output.
import { PETABAD_SHIPPING } from "./petabadExperience.ts";

export type Surface = "web" | "mobile" | "telegram";

export interface CartLine { id: string; name: string; brand?: string | null; quantity: number; price?: number }
export interface Offer { id: string; name: string; brand?: string | null; price?: number }
export interface AddressRef { id: string; title: string; summary?: string; is_default?: boolean }

export type CartAction =
  | { type: "add"; product_id: string; quantity: number }
  | { type: "remove"; product_id: string }
  | { type: "update_quantity"; product_id: string; quantity: number }
  | { type: "replace"; remove_product_id: string; add_product_id: string; quantity: number }
  | { type: "clear" };

export interface CheckoutDirective { kind: "select_address" | "select_shipping" | "select_payment"; id: string }
export type GuideTarget =
  | "add_address" | "edit_address" | "delete_address" | "edit_profile" | "change_phone"
  | "wallet" | "coupon" | "orders" | "login";

/** One tappable answer. `actions`/`checkout` execute directly on tap; `say` is sent back as the user's message. */
export interface Choice { label: string; actions?: CartAction[]; checkout?: CheckoutDirective; say?: string; done?: string }

export interface CheckoutContext {
  logged_in?: boolean;
  addresses?: AddressRef[];
  selected_address_id?: string | null;
  shipping_id?: string | null;
  payment_id?: string | null;
  step?: string | null;
}

// ── Persian text helpers ──
export const normFa = (s: unknown) =>
  String(s ?? "")
    .replace(/[يى]/g, "ی").replace(/ك/g, "ک").replace(/[ۀة]/g, "ه").replace(/[أإآ]/g, "ا")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/\u200c/g, " ")
    .toLowerCase();

const STOP = new Set(
  ("رو را از به با و این اون اینو اونو همین همون اینا اونا سبد سبدم سبدمو خرید خریدم اضافه کن کنید بکن بکنش کنش بذار بزار بگذار " +
    "حذف بردار برداری کم زیاد بیشتر کمتر تا عدد دونه یه یک دو سه چهار پنج برام برای لطفا لطفاً من توی تو میخوام می خوام " +
    "عوض جایگزین جاش بجای جای بجاش محصول محصولات که هم بنداز بریز بخر میخواستم بشه باشه کنم کن، اونی اینی رو، " +
    "دیگه پاک پاکش دربیار در بیار نمیخوام نمی نخواستم بفرست ارسال آدرس ادرس انتخاب پرداخت").split(/\s+/),
);

export const tokens = (s: unknown) =>
  normFa(s).split(/[^\p{L}\p{N}]+/u).filter((t) => t.length >= 2 && !STOP.has(t));

const tokenHit = (a: string, b: string) =>
  a === b || (a.length >= 3 && b.length >= 3 && (a.startsWith(b) || b.startsWith(a)));

const nameTokens = (p: { name: string; brand?: string | null }) => [...new Set([...tokens(p.name), ...tokens(p.brand)])];

/** Name tokens of `p` that the text mentions. */
const mentioned = (p: { name: string; brand?: string | null }, textTokens: string[]) =>
  nameTokens(p).filter((t) => textTokens.some((x) => tokenHit(x, t)));

const ORDINALS: Array<[RegExp, number | "last"]> = [
  [/(^|\s)(اول|اولی|اولین|اولیه|یکمی|یکم)(ی|و|رو|ش)?(\s|$)/, 1],
  [/(^|\s)(دوم|دومی|دومین)(ی|و|رو|ش)?(\s|$)/, 2],
  [/(^|\s)(سوم|سومی|سومین)(ی|و|رو|ش)?(\s|$)/, 3],
  [/(^|\s)(چهارم|چهارمی|چهارمین)(ی|و|رو|ش)?(\s|$)/, 4],
  [/(^|\s)(پنجم|پنجمی|پنجمین)(ی|و|رو|ش)?(\s|$)/, 5],
  [/(^|\s)(ششم|ششمی|ششمین)(ی|و|رو|ش)?(\s|$)/, 6],
  [/(^|\s)(آخری|اخری|آخرین|اخرین|آخر)(ی|و|رو|ش)?(\s|$)/, "last"],
];

/** Explicit positional reference: «دومی»، «شماره ۳»، «#۲»، «آخری». */
export function parseOrdinal(text: string): number | "last" | null {
  const t = normFa(text);
  const m = t.match(/(?:شماره|#|گزینه|مورد)\s*(\d{1,2})/);
  if (m) return +m[1];
  for (const [re, n] of ORDINALS) if (re.test(t)) return n;
  return null;
}

const ALL_RE = /(همه|همشون|همش|هر\s*دو|هردو|هر\s*سه|هر\s*دوتا|هر\s*سه\s*تا|همه\s*رو|کل)/;
const PRONOUN_RE = /(^|\s)(این|اینو|اینم|همین|همینو|اون|اونو|همون|همونو|اینا|اونا)(\s|$)|ش\s*(رو\s*)?(کن|بکن|بذار|بزار|حذف)/;

const faNum = (n: number) => n.toLocaleString("fa-IR");
const shortName = (s: string, n = 34) => (s.length > n ? s.slice(0, n - 1) + "…" : s);
const priceTag = (p?: number) => (p ? ` · ${faNum(p)} ت` : "");
const clampQty = (n: unknown, d = 1) => {
  const v = Math.round(Number(n));
  return Number.isFinite(v) ? Math.max(0, Math.min(50, v)) : d;
};

// ── Cart turn resolution ──
export interface CartTurnInput {
  modelActions: any[];
  modelMessage?: string;
  modelNeedsClarification?: boolean;
  modelOptions?: unknown[];
  userText: string;
  recentUserTexts?: string[];
  cart: CartLine[];
  offers: Offer[];
  /** Everything shown earlier in this conversation (product memory); offers are the latest group. */
  shown?: Offer[];
  focusIds?: string[];
}

export interface CartTurnResult {
  actions: CartAction[];
  content: string;
  needs_clarification: boolean;
  choices: Choice[];
  undo?: Choice;
  changed: boolean;
  trace: string[];
}

const NEG_CLAUSE_RE = /(نمی\s*خوا[مهی]|نمیخوا[مهی]|نخواستم|لازم\s*نیست|نیاز\s*ندارم|نمی\s*خواد|نمیخواد|(^|\s)نه(\s|$))/;

/** Split a compound turn into wanted vs. negated clauses («غذا و هپی پت رو اضافه کن، شامپو رو نمی‌خوام»). */
export function splitPolarity(text: string): { pos: string[]; neg: string[] } {
  const clauses = normFa(text).split(/[،,.;!؟?\n]|\s(?:ولی|اما|ولیکن|به\s*جز|بجز|غیر\s*از)\s/);
  const pos: string[] = [];
  const neg: string[] = [];
  for (const c of clauses) (NEG_CLAUSE_RE.test(c) ? neg : pos).push(...tokens(c));
  return { pos, neg };
}

export function resolveCartTurn(input: CartTurnInput): CartTurnResult {
  const { cart, offers } = input;
  const text = input.userText || "";
  const tt = tokens(text);
  const polarity = splitPolarity(text);
  // Offers are matched only against wanted clauses, so a negated name never wins an add.
  const posTt = polarity.neg.length ? polarity.pos : tt;
  const isNegated = (p: { name: string; brand?: string | null }) =>
    polarity.neg.length > 0 && mentioned(p, polarity.neg).length > 0 && mentioned(p, polarity.pos).length === 0;
  const recent = (input.recentUserTexts || []).flatMap(tokens);
  const ordinal = parseOrdinal(text);
  const wantsAll = ALL_RE.test(normFa(text));
  const pronoun = PRONOUN_RE.test(normFa(text));
  const shown = [...offers, ...(input.shown || []).filter((s) => !offers.some((o) => o.id === s.id))];
  const trace: string[] = [];
  const nameOf = (id: string) =>
    cart.find((c) => c.id === id)?.name || shown.find((o) => o.id === id)?.name || "محصول";
  const offerAt = (i: unknown) => {
    const n = Number(i);
    return Number.isInteger(n) && n >= 1 ? offers[n - 1] : undefined;
  };
  const ordOffer = ordinal === "last" ? offers[offers.length - 1] : ordinal ? offers[ordinal - 1] : undefined;
  const ordCart = ordinal === "last" ? cart[cart.length - 1] : ordinal ? cart[ordinal - 1] : undefined;

  const findCart = (ref: unknown): CartLine | undefined => {
    const r = String(ref ?? "").trim();
    if (!r) return undefined;
    return cart.find((c) => c.id === r);
  };
  const findShown = (ref: unknown): Offer | undefined => {
    const r = String(ref ?? "").trim();
    return r ? shown.find((o) => o.id === r) || cart.find((c) => c.id === r) : undefined;
  };
  /** Pool items whose name the text points at (by mentioned tokens). */
  const textMatches = <T extends { name: string; brand?: string | null }>(pool: T[]) => {
    if (!tt.length) return [] as T[];
    const scored = pool.map((p) => ({ p, n: mentioned(p, tt).length })).filter((x) => x.n > 0);
    const best = Math.max(0, ...scored.map((x) => x.n));
    return scored.filter((x) => x.n === best).map((x) => x.p);
  };
  /**
   * Same-brand / same-name collision: the text names something several pool items share
   * («رویال رو اضافه کن» with two Royal Canin offers). The strongest text match wins; a tie is
   * broken only by a word from earlier turns that exactly one tied item carries (memory);
   * otherwise the turn must ask.
   */
  const narrow = <T extends { id: string; name: string; brand?: string | null }>(target: T | undefined, pool: T[], pickedIds: string[]):
    { item?: T; tie?: T[] } => {
    if (ordinal || wantsAll) return { item: target };
    const best = textMatches(pool).filter((p) => !pickedIds.includes(p.id) || p.id === target?.id);
    if (!best.length) return { item: target };
    if (best.length === 1) {
      if (target && target.id !== best[0].id) trace.push(`text-overrode-model:${target.id}->${best[0].id}`);
      return { item: best[0] };
    }
    const keys = new Set(best.flatMap((p) => mentioned(p, tt)));
    const own = (p: T) => nameTokens(p).filter((t) => !keys.has(t) && !best.some((o) => o.id !== p.id && nameTokens(o).includes(t)));
    const byMemory = best.filter((p) => own(p).some((d) => recent.some((x) => tokenHit(x, d))));
    if (byMemory.length === 1) { trace.push(`tie-resolved-by-memory:${byMemory[0].id}`); return { item: byMemory[0] }; }
    return { tie: best };
  };

  const resolved: CartAction[] = [];
  let pending: { question: string; choices: Choice[] } | null = null;
  let undo: Choice | undefined;
  const notes: string[] = [];
  const silent = new Set<string>();
  const raw = Array.isArray(input.modelActions) ? input.modelActions : [];
  const pickedAddIds = raw.map((a) => offerAt(a?.product_index)?.id || a?.product_id).filter(Boolean) as string[];
  const pickedCartIds = raw.map((a) => a?.product_id || a?.remove_product_id).filter(Boolean) as string[];
  const projected = () => {
    // Cart as it will be after the actions resolved so far (so «هر دو» / chained ops stay consistent).
    let c = cart.map((l) => ({ ...l }));
    for (const a of resolved) c = applyActions(c, [a], shown);
    return c;
  };
  const ask = (question: string, choices: Choice[]) => {
    if (!pending) pending = { question, choices };
  };

  /** Cart line for remove/update/replace: id → offer position in cart → ordinal → name → single line → pronoun-last-added. */
  const resolveCartTarget = (a: any, idField = "product_id"): { line?: CartLine; ambiguous?: CartLine[] } => {
    let line = findCart(a?.[idField]);
    if (!line && a?.product_index) {
      const o = offerAt(a.product_index);
      if (o) line = findCart(o.id);
    }
    if (ordinal) line = (ordOffer && findCart(ordOffer.id)) || ordCart || line;
    if (!ordinal) {
      const n = narrow(line, cart, pickedCartIds);
      if (n.tie) return { ambiguous: n.tie };
      line = n.item;
    }
    if (!line && cart.length === 1) line = cart[0];
    if (!line) return { ambiguous: cart };
    if (pronoun && !mentioned(line, tt).length && !ordinal && cart.length > 1) {
      const focus = (input.focusIds || []).length === 1 ? cart.find((c) => c.id === input.focusIds![0]) : undefined;
      const lastAdded = cart[cart.length - 1];
      if (focus && focus.id !== line.id) line = focus;
      else if (!focus && line.id !== lastAdded.id) return { ambiguous: cart };
    }
    return { line };
  };

  /** Offer for add/replace-add: ordinal wins, then index, then id, then name; pronoun needs a single focus. */
  const resolveOffer = (a: any, idxField: string, idField: string): { offer?: Offer; ambiguous?: Offer[] } => {
    let offer = (raw.length === 1 && ordOffer) || offerAt(a?.[idxField]) || findShown(a?.[idField]);
    if (!(raw.length === 1 && ordOffer)) {
      const n = narrow(offer, shown, pickedAddIds);
      if (n.tie) return { ambiguous: n.tie };
      offer = n.item;
    }
    if (!offer) return { ambiguous: offers };
    if (pronoun && !mentioned(offer, tt).length && !ordinal && offers.length > 1) {
      const focus = (input.focusIds || []).length === 1 ? shown.find((o) => o.id === input.focusIds![0]) : undefined;
      if (focus) offer = focus;
      else return { ambiguous: offers };
    }
    return { offer };
  };

  for (const a of raw) {
    if (pending) break;
    const type = String(a?.type || "");
    if (type === "clear") {
      if (!cart.length) { notes.push("سبدت از قبل خالیه."); continue; }
      ask("مطمئنی همه‌ی اقلام سبد حذف بشن؟", [
        { label: "🧹 بله، سبد رو خالی کن", actions: [...resolved, { type: "clear" }], done: "سبدت خالی شد." },
        { label: "نه، بمونه", actions: [...resolved], done: "باشه، سبدت دست‌نخورده موند." },
      ]);
      continue;
    }
    if (type === "add") {
      const { offer, ambiguous } = resolveOffer(a, "product_index", "product_id");
      const qty = Math.max(1, clampQty(a?.quantity, 1));
      if (!offer) {
        const pool = (ambiguous || []).slice(0, 6);
        if (!pool.length) { notes.push("محصولی برای افزودن پیدا نکردم؛ اول بگو دنبال چی هستی تا نشونت بدم."); continue; }
        const choices: Choice[] = pool.map((o) => ({
          label: shortName(o.name) + priceTag(o.price),
          actions: [...resolved, { type: "add", product_id: o.id, quantity: qty }],
          done: `${qty > 1 ? `${faNum(qty)} عدد ` : ""}«${o.name}» به سبدت اضافه شد.`,
        }));
        if (pool.length > 1 && pool.length <= 3 && ambiguous !== offers) {
          choices.push({
            label: `همه‌شون (${faNum(pool.length)} مورد)`,
            actions: [...resolved, ...pool.map((o) => ({ type: "add" as const, product_id: o.id, quantity: qty }))],
            done: "همه‌شون به سبدت اضافه شدن.",
          });
        }
        ask("کدوم رو به سبدت اضافه کنم؟", choices);
        continue;
      }
      resolved.push({ type: "add", product_id: offer.id, quantity: qty });
      continue;
    }
    if (type === "remove" || type === "update_quantity") {
      const { line, ambiguous } = resolveCartTarget(a);
      if (!line) {
        if (!cart.length) { notes.push("سبدت الان خالیه."); continue; }
        // update on an item that isn't in the cart but was just shown → it's an add.
        if (type === "update_quantity" && Number(a?.quantity) > 0) {
          const o = offerAt(a?.product_index) || findShown(a?.product_id) || (raw.length === 1 ? ordOffer : undefined);
          if (o && !findCart(o.id)) { resolved.push({ type: "add", product_id: o.id, quantity: clampQty(a.quantity) }); continue; }
        }
        const pool = (ambiguous || cart).slice(0, 6);
        const qtyFor = (l: CartLine) => (a?.delta != null ? l.quantity + Number(a.delta) : clampQty(a?.quantity, l.quantity - 1));
        const choices: Choice[] = pool.map((l) => {
          const nq = type === "remove" ? 0 : qtyFor(l);
          return {
            label: shortName(l.name) + (l.quantity > 1 ? ` (${faNum(l.quantity)} عدد)` : ""),
            actions: [...resolved, nq <= 0 ? { type: "remove", product_id: l.id } : { type: "update_quantity", product_id: l.id, quantity: nq }],
            done: nq <= 0 ? `«${l.name}» از سبدت حذف شد.` : `تعداد «${l.name}» شد ${faNum(nq)} عدد.`,
          };
        });
        if (type === "remove" && pool.length > 1 && pool.length <= 3) {
          choices.push({
            label: pool.length === 2 ? "هر دو رو حذف کن" : "همه‌شون رو حذف کن",
            actions: [...resolved, ...pool.map((l) => ({ type: "remove" as const, product_id: l.id }))],
            done: "همه‌شون از سبدت حذف شدن.",
          });
        }
        ask(type === "remove" ? "کدوم از سبدت حذف بشه؟" : "تعداد کدوم قلم تغییر کنه؟", choices);
        continue;
      }
      const current = projected().find((c) => c.id === line.id)?.quantity ?? line.quantity;
      let next = 0;
      if (type === "update_quantity") {
        if (a?.delta != null && Number.isFinite(Number(a.delta))) next = current + Math.round(Number(a.delta));
        else if (a?.quantity != null) next = clampQty(a.quantity, current);
        else next = current + 1;
      }
      next = Math.min(50, next);
      if (next <= 0) {
        resolved.push({ type: "remove", product_id: line.id });
        if (type === "update_quantity") {
          silent.add(line.id);
          notes.push(`چون فقط ${faNum(current)} عدد توی سبد بود، «${line.name}» از سبدت حذف شد.`);
        }
        const back = [...(undo?.actions || []), { type: "add" as const, product_id: line.id, quantity: current }];
        undo = {
          label: "↩️ برگردون به سبد",
          actions: back,
          done: back.length > 1 ? "اقلام حذف‌شده به سبدت برگشتن." : `«${line.name}» دوباره به سبدت برگشت.`,
        };
      } else if (next !== current) {
        resolved.push({ type: "update_quantity", product_id: line.id, quantity: next });
      } else {
        notes.push(`تعداد «${line.name}» همین الان ${faNum(current)} عدده.`);
      }
      continue;
    }
    if (type === "replace") {
      const rem = resolveCartTarget(a, a?.remove_product_id ? "remove_product_id" : "product_id");
      const add = resolveOffer(a, "add_product_index", "add_product_id");
      if (rem.line && add.offer && rem.line.id === add.offer.id) { notes.push("این همون محصولیه که توی سبدته."); continue; }
      if (!rem.line && !add.offer) {
        ask("کدوم قلم سبد رو عوض کنم؟", (rem.ambiguous || cart).slice(0, 6).map((l) => ({
          label: shortName(l.name), say: `«${l.name}» رو با یکی از پیشنهادها عوض کن`,
        })));
        continue;
      }
      if (!rem.line) {
        const offer = add.offer!;
        ask(`«${shortName(offer.name)}» جای کدوم قلم سبد بیاد؟`, (rem.ambiguous || cart).slice(0, 6).map((l) => ({
          label: shortName(l.name),
          actions: [...resolved, { type: "replace", remove_product_id: l.id, add_product_id: offer.id, quantity: l.quantity }],
          done: `«${offer.name}» جای «${l.name}» گذاشته شد.`,
        })));
        continue;
      }
      if (!add.offer) {
        const line = rem.line;
        const pool = (add.ambiguous || offers).filter((o) => o.id !== line.id).slice(0, 6);
        if (!pool.length) { notes.push("اول یه جایگزین پیدا کنیم؛ بگو دنبال چه مدلی هستی."); continue; }
        ask(`به جای «${shortName(line.name)}» کدوم رو بذارم؟`, pool.map((o) => ({
          label: shortName(o.name) + priceTag(o.price),
          actions: [...resolved, { type: "replace", remove_product_id: line.id, add_product_id: o.id, quantity: line.quantity }],
          done: `«${o.name}» جای «${line.name}» گذاشته شد.`,
        })));
        continue;
      }
      const q = a?.quantity ? Math.max(1, clampQty(a.quantity)) : rem.line.quantity;
      resolved.push({ type: "replace", remove_product_id: rem.line.id, add_product_id: add.offer.id, quantity: q });
      continue;
    }
    trace.push(`dropped-unknown:${type}`);
  }

  if (pending) {
    const p = pending as { question: string; choices: Choice[] };
    return { actions: [], content: p.question, needs_clarification: true, choices: p.choices, changed: false, trace };
  }
  // The model asked on its own (no actions) — keep its options as spoken answers.
  if (!resolved.length && input.modelNeedsClarification && (input.modelOptions || []).length) {
    const opts = (input.modelOptions || []).map((o: any) => String(typeof o === "string" ? o : o?.label || "")).filter(Boolean).slice(0, 6);
    return { actions: [], content: input.modelMessage || "کدوم؟", needs_clarification: true, choices: opts.map((o) => ({ label: o, say: o })), changed: false, trace };
  }
  const content = [describeActions(resolved.filter((a) => !(a.type === "remove" && silent.has(a.product_id))), nameOf, cart), ...notes].filter(Boolean).join("\n") ||
    (input.modelMessage || "").trim() || "متوجه نشدم کدوم قلم منظورته؛ می‌تونی اسمش یا شماره‌اش رو بگی؟";
  return { actions: resolved, content, needs_clarification: false, choices: [], undo, changed: resolved.length > 0, trace };
}

/** Deterministic confirmation so the reply always matches what actually ran. */
export function describeActions(actions: CartAction[], nameOf: (id: string) => string, cart: CartLine[] = []) {
  return actions.map((a) => {
    if (a.type === "add") return `${a.quantity > 1 ? `${faNum(a.quantity)} عدد ` : ""}«${nameOf(a.product_id)}» به سبدت اضافه شد ✅`;
    if (a.type === "remove") return `«${nameOf(a.product_id)}» از سبدت حذف شد.`;
    if (a.type === "update_quantity") {
      const before = cart.find((c) => c.id === a.product_id)?.quantity;
      return `تعداد «${nameOf(a.product_id)}» ${before && before !== a.quantity ? `از ${faNum(before)} ` : ""}شد ${faNum(a.quantity)} عدد.`;
    }
    if (a.type === "replace") return `«${nameOf(a.add_product_id)}» جای «${nameOf(a.remove_product_id)}» گذاشته شد.`;
    return "سبدت خالی شد.";
  }).join("\n");
}

/** Reference implementation of the action semantics (clients mirror it). */
export function applyActions<T extends { id: string; quantity: number }>(cart: T[], actions: CartAction[], catalog: Array<{ id: string }>): T[] {
  let c = [...cart];
  const make = (id: string, quantity: number) => ({ ...(catalog.find((x) => x.id === id) as any), id, quantity }) as T;
  for (const a of actions) {
    if (a.type === "clear") c = [];
    else if (a.type === "remove") c = c.filter((l) => l.id !== a.product_id);
    else if (a.type === "update_quantity") c = c.map((l) => (l.id === a.product_id ? { ...l, quantity: a.quantity } : l)).filter((l) => l.quantity > 0);
    else if (a.type === "add") c = c.some((l) => l.id === a.product_id) ? c.map((l) => (l.id === a.product_id ? { ...l, quantity: l.quantity + a.quantity } : l)) : [...c, make(a.product_id, a.quantity)];
    else if (a.type === "replace") {
      c = c.filter((l) => l.id !== a.remove_product_id);
      c = c.some((l) => l.id === a.add_product_id) ? c.map((l) => (l.id === a.add_product_id ? { ...l, quantity: l.quantity + a.quantity } : l)) : [...c, make(a.add_product_id, a.quantity)];
    }
  }
  return c;
}

// ── Checkout selections ──
export const PETABAD_PAYMENTS = [
  { id: "wallet", label: "کیف پول", available: true },
  { id: "gateway", label: "درگاه پرداخت", available: true },
  { id: "bnpl", label: "پرداخت در ۴ قسط", available: true },
  { id: "direct-debit", label: "برداشت مستقیم", available: false },
] as const;

const PAYMENT_WORDS: Array<[RegExp, string]> = [
  [/کیف\s*پول|ولت|wallet|اعتبار\s*حساب/, "wallet"],
  [/درگاه|کارت\s*بانکی|آنلاین|انلاین|شتاب|کارت/, "gateway"],
  [/قسط|اقساط|بعدا\s*پرداخت|پرداخت\s*اقساطی|bnpl/, "bnpl"],
  [/برداشت\s*مستقیم|مستقیم/, "direct-debit"],
];
const SHIPPING_WORDS: Array<[RegExp, string]> = [
  [/اکسپرس|express/, "express"],
  [/پیک|موتوری|امروز/, "courier"],
  [/عادی|معمولی|پست|ارزون|ارزان/, "standard"],
];
const FAST_RE = /(سریع|زود|فوری|عجله|هرچه\s*زودتر|فورا)/;

export interface CheckoutTurn {
  response_type: "checkout" | "guide";
  content: string;
  directive?: CheckoutDirective;
  choices: Choice[];
  guide?: { target: GuideTarget; surface: Surface };
}

export function resolveCheckoutTurn(args: {
  kind: string; address_id?: string; address_query?: string; shipping_id?: string; payment_id?: string; target?: string;
  userText: string; ctx: CheckoutContext; surface: Surface; cartCount: number;
}): CheckoutTurn {
  const { ctx, surface } = args;
  const t = normFa(args.userText);
  if (args.kind === "guide") return guideTurn((args.target as GuideTarget) || "edit_profile", surface, ctx);

  if (args.kind === "select_address") {
    if (!ctx.logged_in) return guideTurn("login", surface, ctx);
    const list = ctx.addresses || [];
    if (!list.length) return guideTurn("add_address", surface, ctx, "هنوز آدرسی ثبت نکردی. ");
    const choose = (a: AddressRef): CheckoutTurn => ({
      response_type: "checkout",
      content: `آدرس تحویل روی «${a.title}» تنظیم شد 📍${args.cartCount ? "" : "\nهر وقت محصولی به سبد اضافه کردی، با همین آدرس ادامه می‌دیم."}`,
      directive: { kind: "select_address", id: a.id },
      choices: [],
    });
    const byId = list.find((a) => a.id === args.address_id);
    const ord = parseOrdinal(args.userText);
    const query = tokens(`${args.address_query || ""} ${args.userText}`);
    const exact = list.filter((a) => {
      const title = normFa(a.title).trim();
      return query.some((q) => q === title) || (args.address_query && normFa(args.address_query).trim() === title);
    });
    if (exact.length === 1) return choose(exact[0]);
    if (ord) {
      const a = ord === "last" ? list[list.length - 1] : list[ord - 1];
      if (a) return choose(a);
    }
    const partial = list.filter((a) => {
      const at = tokens(`${a.title} ${a.summary || ""}`);
      return query.some((q) => at.some((x) => tokenHit(q, x)));
    });
    const pool = exact.length > 1 ? exact : partial.length ? partial : [];
    if (pool.length === 1) return choose(pool[0]);
    if (pool.length > 1 && byId && exact.some((e) => e.id === byId.id)) return choose(byId);
    if (!pool.length && byId && !query.length) return choose(byId);
    const options = (pool.length ? pool : list).slice(0, 8);
    return {
      response_type: "checkout",
      content: pool.length ? "کدوم آدرس منظورته؟" : "این آدرس بین آدرس‌های ثبت‌شده‌ات نبود. یکی از این‌ها رو انتخاب کن یا اگه آدرس جدیده، باید دستی ثبتش کنی:",
      choices: options.map((a) => ({
        label: shortName(`${a.title}${a.summary ? ` · ${a.summary}` : ""}`, 40),
        checkout: { kind: "select_address", id: a.id },
        done: `آدرس تحویل روی «${a.title}» تنظیم شد 📍`,
      })),
    };
  }

  if (args.kind === "select_shipping") {
    let id = PETABAD_SHIPPING.find((m) => m.id === args.shipping_id)?.id as string | undefined;
    const said = SHIPPING_WORDS.find(([re]) => re.test(t))?.[1];
    if (said) id = said;
    const fast = FAST_RE.test(t) && !said;
    const method = !fast ? PETABAD_SHIPPING.find((m) => m.id === id) : undefined;
    if (!method) {
      const pool = fast ? PETABAD_SHIPPING.filter((m) => m.id !== "standard") : PETABAD_SHIPPING;
      return {
        response_type: "checkout",
        content: fast ? "سریع‌ترین روش‌ها این دوتاست؛ کدوم؟" : "کدوم روش ارسال؟",
        choices: pool.map((m) => ({
          label: `${m.label} · ${m.deliveryWindow} · ${m.priceLabel}`,
          checkout: { kind: "select_shipping", id: m.id },
          done: `روش ارسال: ${m.label} (${m.deliveryWindow}، ${m.priceLabel}) 🚚`,
        })),
      };
    }
    return {
      response_type: "checkout",
      content: `روش ارسال روی «${method.label}» تنظیم شد 🚚 (${method.deliveryWindow}، ${method.priceLabel})`,
      directive: { kind: "select_shipping", id: method.id },
      choices: [],
    };
  }

  if (args.kind === "select_payment") {
    const said = PAYMENT_WORDS.find(([re]) => re.test(t))?.[1];
    const id = said || args.payment_id;
    const method = PETABAD_PAYMENTS.find((p) => p.id === id);
    const available = PETABAD_PAYMENTS.filter((p) => p.available);
    if (!method || !method.available) {
      return {
        response_type: "checkout",
        content: method ? `«${method.label}» فعلاً فعال نیست. یکی از این روش‌ها رو انتخاب کن:` : "با کدوم روش پرداخت می‌کنی؟",
        choices: available.map((p) => ({ label: p.label, checkout: { kind: "select_payment", id: p.id }, done: `روش پرداخت: ${p.label} 💳` })),
      };
    }
    if (!args.cartCount) {
      return { response_type: "checkout", content: `باشه، پرداخت با «${method.label}» یادم می‌مونه؛ اول یه محصول به سبد اضافه کن.`, directive: { kind: "select_payment", id: method.id }, choices: [] };
    }
    const where = surface === "telegram"
      ? "پرداخت نهایی داخل اپ انجام می‌شه؛ بعد از انتخاب آدرس و روش ارسال، دکمه پرداخت مستقیم همین روش رو باز می‌کنه."
      : "برای تکمیل، دکمه پرداخت رو بزن.";
    return {
      response_type: "checkout",
      content: `روش پرداخت روی «${method.label}» تنظیم شد 💳\n${where}`,
      directive: { kind: "select_payment", id: method.id },
      choices: [],
    };
  }
  return guideTurn("edit_profile", surface, ctx);
}

/** Things chat must not do (forms, identity, money in/out) — guide to the exact native place per surface. */
export function guideTurn(target: GuideTarget, surface: Surface, ctx: CheckoutContext = {}, prefix = ""): CheckoutTurn {
  const bot = surface === "telegram";
  const onAddressStep = ctx.step === "address-confirmation";
  const copy: Record<GuideTarget, string> = {
    add_address: bot
      ? "ثبت آدرس جدید از داخل گفتگو انجام نمی‌شه تا آدرس دقیق و کامل ثبت بشه. دکمه زیر فرم آدرس رو توی اپ باز می‌کنه 👇"
      : onAddressStep
        ? "ثبت آدرس جدید باید دستی انجام بشه تا دقیق ثبت بشه. توی کارت «آدرس و نحوه ارسال» همین بالا، روی «افزودن آدرس جدید» (بالا سمت چپ کارت) بزن."
        : "ثبت آدرس جدید باید دستی انجام بشه. از «پروفایل ← آدرس‌های ذخیره‌شده ← افزودن آدرس» ثبتش کن؛ یا موقع نهایی کردن خرید، توی کارت آدرس روی «افزودن آدرس جدید» بزن.",
    edit_address: bot
      ? "ویرایش آدرس از داخل گفتگو انجام نمی‌شه. با دکمه زیر پروفایلت توی اپ باز می‌شه؛ از بخش «آدرس‌های ذخیره‌شده» اصلاحش کن 👇"
      : "ویرایش آدرس از داخل گفتگو انجام نمی‌شه. از «پروفایل ← آدرس‌های ذخیره‌شده» آدرس رو اصلاح کن.",
    delete_address: bot
      ? "حذف آدرس از داخل گفتگو انجام نمی‌شه. با دکمه زیر پروفایلت توی اپ باز می‌شه؛ از «آدرس‌های ذخیره‌شده» حذفش کن 👇"
      : "حذف آدرس از داخل گفتگو انجام نمی‌شه. از «پروفایل ← آدرس‌های ذخیره‌شده» حذفش کن.",
    edit_profile: bot
      ? "تغییر اطلاعات حساب از داخل گفتگو انجام نمی‌شه. با دکمه زیر پروفایلت توی اپ باز می‌شه 👇"
      : "تغییر اطلاعات حساب از داخل گفتگو انجام نمی‌شه؛ از بخش «پروفایل» انجامش بده.",
    change_phone: "شماره موبایل همون شماره‌ی ورود به حسابته و از داخل گفتگو عوض نمی‌شه. اگه می‌خوای با شماره‌ی دیگه خرید کنی، از حساب خارج شو و با شماره‌ی جدید وارد شو.",
    wallet: "شارژ کیف پول و دیدن موجودیش فعلاً توی پت‌آباد فعال نیست. موقع پرداخت می‌تونی کیف پول، درگاه پرداخت یا پرداخت اقساطی رو انتخاب کنی.",
    coupon: "اعمال کد تخفیف فعلاً از داخل گفتگو ممکن نیست.",
    orders: bot ? "برای دیدن سفارش‌ها دکمه «📦 پیگیری سفارش» پایین چت رو بزن." : "برای دیدن و پیگیری سفارش‌هات، به بخش «سفارش‌ها» برو.",
    login: bot
      ? "برای استفاده از آدرس‌های ذخیره‌شده، اول با دکمه زیر شماره‌ات رو تأیید کن (بدون پیامک) 👇"
      : "برای استفاده از آدرس‌های ذخیره‌شده اول وارد حسابت شو؛ موقع نهایی کردن خرید ازت شماره می‌پرسم.",
  };
  return { response_type: "guide", content: prefix + copy[target], choices: [], guide: { target, surface } };
}

/** Deterministic pre-routing for requests that must never go through the model's cart/checkout tools. */
export function detectGuideIntent(text: string): GuideTarget | null {
  const t = normFa(text);
  if (/(شارژ|موجودی|افزایش\s*اعتبار).{0,12}کیف|کیف\s*پول.{0,12}(شارژ|موجودی|چقدر)/.test(t)) return "wallet";
  if (/(کد\s*تخفیف|کوپن|تخفیف\s*بزن)/.test(t)) return "coupon";
  // Address/phone questions that are not "how do I…" (e.g. delivery time to a new address) stay with the agent.
  if (/[?؟]\s*$/.test(t) && !/(چطور|چجوری|کجا|میشه|می شه|چکار|چیکار)/.test(t)) return null;
  if (/(شماره|موبایل|تلفن).{0,15}(عوض|تغییر|ویرایش|اصلاح)|(عوض|تغییر).{0,10}(شماره|موبایل)/.test(t)) return "change_phone";
  if (/(آدرس|ادرس).{0,25}(جدید|اضافه|ثبت|بساز|وارد)|(اضافه|ثبت|وارد).{0,10}(آدرس|ادرس)\s*(جدید)?/.test(t) && !/انتخاب/.test(t)) return "add_address";
  if (/(پلاک|کد\s*پستی|کدپستی|واحد|طبقه|زنگ).{0,25}(عوض|تغییر|اشتباه|اصلاح|بکن|کن)|(ویرایش|اصلاح|ادیت).{0,10}(آدرس|ادرس)/.test(t)) return "edit_address";
  if (/(حذف|پاک).{0,10}(آدرس|ادرس)|(آدرس|ادرس).{0,15}(حذف|پاک)\s*(کن)?/.test(t)) return "delete_address";
  if (/(اسمم|اسم\s*من|نامم|نام\s*خانوادگی|ایمیل).{0,15}(عوض|تغییر|ویرایش|اصلاح)/.test(t)) return "edit_profile";
  return null;
}

/** Deterministic checkout picks (payment / shipping) — exact words, no model needed. */
export function detectCheckoutIntent(text: string): { kind: "select_payment" | "select_shipping" } | null {
  const t = normFa(text);
  if (/[?؟]\s*$/.test(t) || /(چقدر|چنده|چیه|چطوریه|چند\s*روز|کی\s*می\s*رسه|فرقش)/.test(t)) return null;
  if (/(شارژ|موجودی)/.test(t)) return null;
  if (/(کیف\s*پول|درگاه|قسط|اقساط|برداشت\s*مستقیم)/.test(t) && /(پرداخت|بپرداز|حساب|کم\s*کن|بزن|انتخاب|میدم|می\s*دم|میخرم|بخرم)/.test(t)) return { kind: "select_payment" };
  if (/(اکسپرس|پیک|ارسال\s*عادی|پست\s*عادی)/.test(t) && /(بفرست|ارسال|برسه|بیار|بیاد|باشه|انتخاب|می\s*خوام|میخوام)/.test(t)) return { kind: "select_shipping" };
  if (/(سریع|زود|فوری|فورا)/.test(t) && /(بفرست|برسه|بیاد|ارسال\s*کن|ارسالش)/.test(t)) return { kind: "select_shipping" };
  return null;
}
