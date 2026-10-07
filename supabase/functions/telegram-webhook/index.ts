// Telegram bot (@Flowcartbot) webhook for the PetAbad storefront.
// Routes chat to petabad-agent (agentic mode, with cart + product memory),
// executes cart operations, renders photo cards, and opens the PetAbad
// Mini App (web_app buttons) carrying the same conversation via ?tg=<token>.
import { createClient } from "npm:@supabase/supabase-js@2";
import { AsyncLocalStorage } from "node:async_hooks";
import { applyActions, describeActions, type CartAction, type Choice } from "../_shared/commerceActions.ts";
import { PETABAD_GREETING, PETABAD_SHIPPING, resolvePetabadShipping, topicName, transientPair } from "../_shared/petabadExperience.ts";

const TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
if (!TOKEN || !SUPABASE_URL || !SERVICE_KEY) throw new Error("Telegram configuration missing");
const SITE = "https://flowcart.space/petabad";
const API = `https://api.telegram.org/bot${TOKEN}`;
const db = createClient(SUPABASE_URL, SERVICE_KEY);

const fa = (n: number | string) => String(n).replace(/[0-9]/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[+d]);
const money = (n: number) => fa(Math.round(n || 0).toLocaleString("en-US")).replace(/,/g, "٬");
const price = (n: number) => `${money(n)} تومان`;
const esc = (s: string) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const stripMd = (s: string) => String(s ?? "").replace(/\*\*|__|#+\s?|`/g, "").replace(/SELECTED_IDS:.*$/gm, "").trim();
const pname = (p: any) => p?.name_fa || p?.name || "";

// Threaded Mode (Topics): each shopping session lives in its own topic. The current update's topic is
// carried per-request so every outgoing message lands in the active session's thread.
const thread = new AsyncLocalStorage<{ id?: number }>();
const THREADED = new Set(["sendMessage", "sendPhoto", "sendChatAction", "sendMessageDraft"]);
async function tg(method: string, body: any) {
  const t = thread.getStore()?.id;
  if (t && THREADED.has(method) && body && body.message_thread_id === undefined) body = { ...body, message_thread_id: t };
  const r = await fetch(`${API}/${method}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!j.ok) console.error(`telegram ${method} failed`, JSON.stringify(j));
  return j;
}

async function deriveSecret() {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`telegram-webhook:${TOKEN}`));
  return btoa(String.fromCharCode(...new Uint8Array(d))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// One clean persistent button row replaces Telegram's standard Commands menu.
// New conversations are Telegram's own "new topic" button, so only cart + order tracking remain.
const BTN_CART = "🛒 سبد خرید", BTN_TRACK = "📦 پیگیری سفارش", BTN_NEW = "➕ گفتگوی جدید";
const MAIN_KB = { keyboard: [[{ text: BTN_CART }, { text: BTN_TRACK }], [{ text: BTN_NEW }]], resize_keyboard: true, is_persistent: true };
const PHONE_KB = { keyboard: [[{ text: "📱 ارسال شماره تماس", request_contact: true }]], resize_keyboard: true, one_time_keyboard: true };
const NEW_BTN = { text: "➕ شروع گفتگوی جدید", callback_data: "new" };
const DAY = 24 * 60 * 60 * 1000;

// Inline option button that "says" the text back; callback_data is capped at 64 bytes.
function sayBtn(text: string) {
  let t = text;
  while (new TextEncoder().encode(`q:${t}`).length > 64) t = t.slice(0, -1);
  return { text, callback_data: `q:${t}` };
}
const optionsKb = (opts: string[]) => ({ inline_keyboard: opts.map((o) => [sayBtn(o)]) });
// Multi-select checklist: state lives in the keyboard itself (◻️/✅ prefix), toggled via editMessageReplyMarkup.
const OFF = "◻️ ", ON = "✅ ";
const confirmBtn = (n: number) => ({ text: n ? `🏁 تأیید انتخاب‌ها (${fa(n)} مورد)` : "🏁 یکی یا چندتا رو انتخاب کن", callback_data: "mok" });
const multiKb = (opts: string[]) => ({
  inline_keyboard: [...opts.map((o, i) => [{ text: OFF + o, callback_data: `m:${i}` }]), [confirmBtn(0)]],
});

const appUrl = (chat: any) => `${SITE}?tg=${chat.session_token}`;

// Lazy Session: an unknown chat lives only in memory until the first real interaction is saved.
async function loadChat(chatId: number, from: any) {
  const { data } = await db.from("telegram_chats").select("*").eq("chat_id", chatId).maybeSingle();
  if (data) return data;
  return {
    _new: true, chat_id: chatId, username: from?.username ?? null, first_name: from?.first_name ?? null,
    session_token: crypto.randomUUID(), history: [], cart: [], last_products: [], archived: [], locked: false,
    updated_at: new Date().toISOString(),
  };
}

// Checkout requires the one-tap Telegram contact first, so the order and history attach to a phone.
const checkoutBtn = (chat: any) =>
  ({ text: "✅ نهایی کردن خرید", callback_data: "checkout" });
const appCheckoutBtn = (chat: any, label = "✅ ادامه در اپ") => ({ text: label, web_app: { url: `${appUrl(chat)}&intent=checkout` } });

// In-bot address step: verified users pick a saved address here and only go to the app for payment;
// without a saved address they continue in the app's chat to add one.
async function sendAddressStep(chat: any) {
  if (!(chat.cart || []).length) return sendCart(chat);
  const { data } = chat.user_id
    ? await db.from("user_addresses").select("id,title,full_address,is_default").eq("user_id", chat.user_id).order("is_default", { ascending: false }).order("created_at", { ascending: false })
    : { data: [] as any[] };
  if (!data?.length) {
    return tg("sendMessage", {
      chat_id: chat.chat_id,
      text: `سبدت آماده‌ست (${price(cartTotal(chat.cart))}) ✅\n\nهنوز آدرسی ثبت نکردی؛ توی اپ آدرست رو وارد کن و همون‌جا خرید رو تموم کن 👇`,
      reply_markup: { inline_keyboard: [[{ text: "📍 ثبت آدرس و ادامه خرید", web_app: { url: `${appUrl(chat)}&intent=new_address` } }]] },
    });
  }
  const rows = data.map((a: any) => [{ text: `📍 ${a.title} · ${String(a.full_address).slice(0, 36)}`, callback_data: `addr:${a.id}` }]);
  return tg("sendMessage", {
    chat_id: chat.chat_id,
    text: `سبدت آماده‌ست (${price(cartTotal(chat.cart))}) ✅\n\nبه کدوم آدرس بفرستیم؟`,
    reply_markup: { inline_keyboard: [...rows, [{ text: "➕ آدرس جدید (در اپ)", web_app: { url: `${appUrl(chat)}&intent=new_address` } }]] },
  });
}

// Topic helpers: create a fresh topic for a new session, rename topics after their content/outcome.
async function openTopic(chat: any, name: string) {
  const r = await tg("createForumTopic", { chat_id: chat.chat_id, name: name.slice(0, 128) });
  const id = r?.ok ? r.result.message_thread_id : null;
  const store = thread.getStore();
  if (id && store) store.id = id;
  return id as number | null;
}
const renameTopic = (chat: any, id: number | null | undefined, name: string) =>
  id ? tg("editForumTopic", { chat_id: chat.chat_id, message_thread_id: id, name: name.slice(0, 128) }) : null;

// Mirror the Telegram conversation into the linked user's Flowcart history.
async function mirrorToBasket(chat: any) {
  if (!chat.user_id) return;
  const messages = (chat.history || []).map((m: any, i: number) => ({
    id: `tg-${i}`,
    role: m.role,
    content: String(m.content || "").replace(/\n?\[محصولات نمایش داده شده:[\s\S]*\]$/, ""),
    ...(m.products?.length ? { products: m.products } : {}),
    timestamp: new Date().toISOString(),
  }));
  const first = (chat.history || []).find((m: any) => m.role === "user")?.content;
  const { data: ex } = await db.from("baskets").select("id").eq("id", chat.session_token).maybeSingle();
  const payload = {
    cart_items: chat.cart_full || [],
    messages,
    last_activity: new Date().toISOString(),
  };
  if (ex) await db.from("baskets").update(payload).eq("id", chat.session_token);
  else await db.from("baskets").insert({ id: chat.session_token, user_id: chat.user_id, title: String(first || "گفتگوی تلگرام").slice(0, 40), status: "active", ...payload });
}

async function saveChat(chat: any, patch: Record<string, unknown>) {
  Object.assign(chat, patch);
  const now = new Date().toISOString();
  chat.updated_at = now;
  if (chat._new) {
    const { _new, cart_full, ...row } = chat;
    const { error } = await db.from("telegram_chats").insert(row);
    if (error) console.error("insert chat failed", error);
    else delete chat._new;
  } else {
    await db.from("telegram_chats").update({ ...patch, updated_at: now }).eq("chat_id", chat.chat_id);
  }
  if (chat.user_id && ("history" in patch || "cart" in patch)) {
    const ids = (chat.cart || []).map((i: any) => i.id);
    const { data } = ids.length ? await db.from("pet_products").select("*").in("id", ids) : { data: [] };
    chat.cart_full = (chat.cart || []).map((i: any) => {
      const p = (data || []).find((d: any) => d.id === i.id) || {};
      return { ...p, id: i.id, name: i.name, price: i.price, image: p.image_url, quantity: i.qty };
    });
    await mirrorToBasket(chat).catch((e) => console.error("mirror failed", e));
  }
}

const cartTotal = (cart: any[]) => cart.reduce((s, i) => s + i.price * i.qty, 0);

async function sendCart(chat: any, editMessageId?: number) {
  const cart: any[] = chat.cart || [];
  if (!cart.length) {
    const body = { chat_id: chat.chat_id, text: "سبد خریدت فعلاً خالیه. بگو دنبال چی هستی تا پیدا کنم 🙂" };
    return editMessageId ? tg("editMessageText", { ...body, message_id: editMessageId }) : tg("sendMessage", { ...body, reply_markup: MAIN_KB });
  }
  const count = cart.reduce((s, i) => s + i.qty, 0);
  const lines = cart.map((i, k) => `${fa(k + 1)}. ${esc(i.name)}\n     ${fa(i.qty)} × ${money(i.price)} = <b>${price(i.price * i.qty)}</b>`);
  const text =
    `🛒 <b>سبد خرید تو</b>  ·  ${fa(count)} کالا\n━━━━━━━━━━━━\n\n${lines.join("\n\n")}\n\n━━━━━━━━━━━━\n💳 <b>جمع کل: ${price(cartTotal(cart))}</b>\n\n` +
    `💬 می‌تونی همین‌جا بنویسی سبد رو چطور تغییر بدم؛ مثلاً «دومی رو دوتا کن»، «اولی رو حذف کن» یا «یه غذای ارزون‌تر جاش بذار».`;
  const rows = cart.slice(0, 8).flatMap((i, k) => [
    [{ text: `${fa(k + 1)}. ${String(i.name).slice(0, 48)}`, web_app: { url: `${SITE}?p=${encodeURIComponent(i.id)}` } }],
    [
      { text: "−", callback_data: `dec:${k}` },
      { text: `${fa(i.qty)} عدد`, callback_data: "noop" },
      { text: "+", callback_data: `inc:${k}` },
      { text: "حذف", callback_data: `del:${k}` },
    ],
  ]);
  const reply_markup = {
    inline_keyboard: [
      ...rows,
      [checkoutBtn(chat)],
      [{ text: "🧹 خالی کردن سبد", callback_data: "clear" }],
    ],
  };
  const body = { chat_id: chat.chat_id, parse_mode: "HTML", text, reply_markup };
  if (editMessageId) {
    const r = await tg("editMessageText", { ...body, message_id: editMessageId });
    if (r.ok) return r;
  }
  return tg("sendMessage", body);
}

async function fetchProduct(id: string) {
  const { data } = await db.from("pet_products").select("id,name,price,in_stock").eq("id", id).maybeSingle();
  return data;
}

function addToCart(cart: any[], p: { id: string; name: string; price: number }, qty = 1) {
  const ex = cart.find((i) => i.id === p.id);
  return ex ? cart.map((i) => (i.id === p.id ? { ...i, qty: i.qty + qty } : i)) : [...cart, { id: p.id, name: pname(p), price: p.price, qty, brand: (p as any).brand ?? null }];
}

const ORDINALS: Record<string, number> = { اول: 1, اولی: 1, یک: 1, دوم: 2, دومی: 2, سوم: 3, سومی: 3, چهارم: 4, چهارمی: 4, پنجم: 5, ششم: 6 };
function parseOrdinalAdd(text: string): { index: number; qty: number } | null {
  const t = text.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));
  if (!/(اضافه|بریز|بذار|بزار|بخر|می‌خوام|میخوام|سبد)/.test(t)) return null;
  if (/(حذف|کم کن|بردار|مقایسه|عوض)/.test(t)) return null;
  let index = 0;
  for (const [w, n] of Object.entries(ORDINALS)) if (new RegExp(`(محصول|گزینه|مورد)?\\s*${w}(ی|و|رو|م)?(\\s|$)`).test(t)) { index = n; break; }
  const m = t.match(/(?:شماره|#)\s*(\d)/);
  if (!index && m) index = +m[1];
  if (!index) return null;
  const WORDS: Record<string, number> = { دو: 2, سه: 3, چهار: 4, پنج: 5 };
  const q = t.match(/(\d+|دو|سه|چهار|پنج)\s*(تا|عدد|بسته)/);
  const n = q ? (WORDS[q[1]] ?? +q[1]) : 1;
  return { index, qty: Math.max(1, Math.min(20, n)) };
}

// Splits the agent's answer into a short intro and per-product reasons (numbered "۱. name\nreason" blocks),
// so each Telegram card carries its own explanation and the first message stays a brief overview.
const DIG = "0-9۰-۹";
function splitProductText(content: string) {
  const re = new RegExp(`^\\s*([${DIG}]+)\\s*[.)\\-–]\\s*(.*)$`);
  const lines = content.split("\n");
  const first = lines.findIndex((l) => re.test(l));
  if (first < 0) return { intro: content, reasons: [] as string[], outro: "" };
  const blocks: string[][] = [];
  let outro: string[] = [];
  for (const l of lines.slice(first)) {
    const m = l.match(re);
    if (m) { blocks.push([m[2]]); outro = []; continue; }
    if (!l.trim() && blocks.length) { outro.push(l); continue; }
    if (outro.length && blocks.length > 0) { outro.push(l); continue; }
    blocks[blocks.length - 1].push(l);
  }
  const reasons = blocks.map((b) => b.slice(1).join("\n").trim() || "");
  return { intro: lines.slice(0, first).join("\n").trim(), reasons, outro: outro.join("\n").trim() };
}

function productCaption(p: any, i: number, reason = "") {
  const name = esc(pname(p));
  const parts = [`<b>${fa(i + 1)} │ ${name}</b>`];
  if (reason) parts.push("", esc(reason.length > 600 ? reason.slice(0, 597) + "…" : reason));
  if (p.rating) {
    const r = Number(p.rating);
    if (reason) parts.push("");
    parts.push(`⭐️ <b>${fa(r.toFixed(1))}</b>${p.review_count ? ` (${fa(p.review_count)} نظر)` : ""}`);
  }
  parts.push("");
  if (p.original_price && p.original_price > p.price) {
    const off = Math.round((1 - p.price / p.original_price) * 100);
    parts.push(`<s>${money(p.original_price)}</s>  🔥 ${fa(off)}٪ تخفیف`);
  }
  parts.push(`💰 <b>${price(p.price)}</b>`);
  if (p.in_stock === false) parts.push("⛔️ ناموجود");
  return parts.join("\n");
}

// Streaming Replies: Telegram renders sendMessageDraft as a live-typing bubble, then the final sendMessage replaces it.
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function streamDraft(chatId: number, text: string) {
  const draft_id = Math.floor(Math.random() * 2 ** 31) || 1;
  const words = text.split(/(\s+)/);
  const steps = Math.min(8, Math.max(2, Math.ceil(words.length / 6)));
  for (let k = 1; k <= steps; k++) {
    const r = await tg("sendMessageDraft", { chat_id: chatId, draft_id, text: words.slice(0, Math.ceil((words.length * k) / steps)).join("") || "…" });
    if (!r?.ok) return;
    await sleep(120);
  }
}

async function runAgent(chat: any, text: string) {
  const history = [...(chat.history || []), { role: "user", content: text }].slice(-14);
  const last: any[] = chat.last_products || [];
  const cart: any[] = chat.cart || [];
  const memory = last.length
    ? last.map((p, i) => `#${i + 1} [${p.id}] ${p.name} - ${p.price} تومان${p.brand ? ` (${p.brand})` : ""}`).join("\n")
    : "";
  const { data: addrs } = chat.user_id && chat.phone
    ? await db.from("user_addresses").select("id,title,full_address,is_default").eq("user_id", chat.user_id).order("is_default", { ascending: false }).order("created_at", { ascending: false })
    : { data: [] as any[] };
  const sel = chat.checkout_selection || {};
  const res = await fetch(`${SUPABASE_URL}/functions/v1/petabad-agent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${SERVICE_KEY}` },
    body: JSON.stringify({
      messages: history.map((m: any) => ({ role: m.role, content: m.content })),
      mode: "agentic",
      surface: "telegram",
      is_first_message: history.length <= 1,
      checkout_context: {
        logged_in: !!(chat.user_id && chat.phone),
        addresses: (addrs || []).map((a: any) => ({ id: a.id, title: a.title, summary: String(a.full_address || "").slice(0, 60), is_default: a.is_default })),
        selected_address_id: sel.address_id || null, shipping_id: sel.shipping_id || null, payment_id: sel.payment_id || null,
      },
      cart_context: { items: cart.map((i) => ({ id: i.id, name: i.name, price: i.price, quantity: i.qty, brand: i.brand ?? null })), total: cartTotal(cart) },
      product_memory: memory,
      products_context: last.map((p) => ({ id: p.id, name: p.name, price: p.price, brand: p.brand })),
      memory_index: [{ group_id: "tg", turn: 1, query: "", items: last.map((p, i) => ({ position: i + 1, id: p.id, name: p.name, price: p.price, brand: p.brand ?? null })) }],
    }),
  });
  if (!res.ok) throw new Error(`agent ${res.status}: ${await res.text()}`);
  return { ans: await res.json(), history };
}

// Resolve a cart line the model referred to: exact id, 1-based position, or (partial) name; single-item carts resolve to it.
function cartIdx(cart: any[], ref: unknown) {
  if (!cart.length) return -1;
  const r = String(ref ?? "").trim();
  let k = cart.findIndex((i) => i.id === r);
  if (k < 0 && /^\d{1,2}$/.test(r) && cart[+r - 1]) k = +r - 1;
  if (k < 0 && r.length > 2) k = cart.findIndex((i) => String(i.name).includes(r) || r.includes(String(i.name)));
  if (k < 0 && cart.length === 1) k = 0;
  return k;
}

async function applyCartActions(chat: any, actions: any[]) {
  let cart: any[] = [...(chat.cart || [])];
  const last: any[] = chat.last_products || [];
  const byIndex = (n: number) => last[n - 1];
  for (const a of actions || []) {
    const qty = Math.max(1, Number(a.quantity) || 1);
    if (a.type === "clear") { cart = []; continue; }
    if (a.type === "add") {
      const src = a.product_index ? byIndex(a.product_index) : a.product_id ? last.find((p) => p.id === a.product_id) || await fetchProduct(a.product_id) : null;
      if (src) cart = addToCart(cart, src, qty);
    } else if (a.type === "remove") {
      const k = cartIdx(cart, a.product_id ?? a.remove_product_id);
      if (k >= 0) cart = cart.filter((_, j) => j !== k);
    } else if (a.type === "update_quantity") {
      const k = cartIdx(cart, a.product_id);
      if (k >= 0) cart = cart.map((i, j) => (j === k ? { ...i, qty: Math.max(0, Number(a.quantity) || 0) } : i)).filter((i) => i.qty > 0);
    } else if (a.type === "replace") {
      const k = cartIdx(cart, a.remove_product_id ?? a.product_id);
      const keepQty = k >= 0 ? cart[k].qty : qty;
      const src = a.add_product_index ? byIndex(a.add_product_index) : a.add_product_id ? last.find((p) => p.id === a.add_product_id) || await fetchProduct(a.add_product_id) : null;
      if (k >= 0 && src) cart = cart.filter((_, j) => j !== k);
      if (src) cart = addToCart(cart, src, a.quantity ? qty : keepQty);
    }
  }
  return cart;
}

// Archive the current conversation and start a clean session (new token = new basket).
async function rotate(chat: any, reason: "completed" | "expired" | "manual") {
  const hist: any[] = chat.history || [];
  const archived: any[] = chat.archived || [];
  if (hist.length || (chat.cart || []).length) {
    const first = hist.find((m) => m.role === "user")?.content || "گفتگوی تلگرام";
    archived.unshift({
      token: chat.session_token,
      title: String(first).slice(0, 40),
      count: (chat.cart || []).reduce((s: number, i: any) => s + i.qty, 0),
      reason: chat.locked ? "completed" : reason,
      ended_at: new Date().toISOString(),
      history: hist,
      cart: chat.cart || [],
      last_products: chat.last_products || [],
      thread_id: chat.thread_id ?? null,
    });
  }
  await saveChat(chat, { session_token: crypto.randomUUID(), history: [], cart: [], last_products: [], locked: false, archived: archived.slice(0, 10), thread_id: null, checkout_selection: {} });
}

// Lazy 24h expiry, checked on every incoming update.
// After 24h idle, ask: continue this conversation or start a new one (the message waits in pending_text).
async function askIfStale(chat: any, pending: string | null) {
  const idle = Date.now() - new Date(chat.updated_at || 0).getTime();
  if (chat._new || idle <= DAY || !(chat.history || []).length) return false;
  await db.from("telegram_chats").update({ pending_text: pending }).eq("chat_id", chat.chat_id);
  const title = (chat.history || []).find((m: any) => m.role === "user")?.content || "گفتگوی قبلی";
  await tg("sendMessage", {
    chat_id: chat.chat_id,
    text: `خوش برگشتی 🐾 از گفتگوی قبلی‌مون («${String(title).slice(0, 30)}») بیشتر از یه روز گذشته.\nهمون رو ادامه بدیم یا یه گفتگوی تازه شروع کنیم؟`,
    reply_markup: { inline_keyboard: [[{ text: "↩️ ادامه همین گفتگو", callback_data: "cont" }, { text: "✨ گفتگوی جدید", callback_data: "fresh" }]] },
  });
  return true;
}

const ago = (iso: string) => {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / DAY);
  return d <= 0 ? "امروز" : d === 1 ? "دیروز" : `${fa(d)} روز پیش`;
};

// Map the incoming topic to its session: an archived topic is resumed, an unknown one starts a fresh session.
async function syncThread(chat: any, t: number | undefined) {
  if (!t || chat.thread_id === t) return true;
  const archived: any[] = chat.archived || [];
  const entry = archived.find((a) => a.thread_id === t);
  if (entry?.reason === "completed") {
    await tg("sendMessage", { chat_id: chat.chat_id, text: "این خرید ثبت و تموم شده ✅ برای خرید تازه یه تاپیک جدید باز کن یا توی تاپیک فعلی ادامه بده 🐾", reply_markup: MAIN_KB });
    return false;
  }
  const rest = archived.filter((a) => a !== entry);
  if ((chat.history || []).length || (chat.cart || []).length) {
    const first = (chat.history || []).find((m: any) => m.role === "user")?.content || "گفتگوی تلگرام";
    rest.unshift({ token: chat.session_token, title: String(first).slice(0, 40), count: (chat.cart || []).reduce((s: number, i: any) => s + i.qty, 0), reason: "manual", ended_at: new Date().toISOString(), history: chat.history, cart: chat.cart, last_products: chat.last_products, thread_id: chat.thread_id ?? null, checkout_selection: chat.checkout_selection || {} });
  }
  if (entry) await saveChat(chat, { session_token: entry.token, history: entry.history || [], cart: entry.cart || [], last_products: entry.last_products || [], locked: false, archived: rest.slice(0, 10), thread_id: t, pending_text: null, checkout_selection: entry.checkout_selection || {} });
  else if (chat._new) Object.assign(chat, { thread_id: t });
  else await saveChat(chat, { session_token: crypto.randomUUID(), history: [], cart: [], last_products: [], locked: false, archived: rest.slice(0, 10), thread_id: t, pending_text: null, checkout_selection: {} });
  return true;
}

async function greetTopic(chat: any) {
  await tg("sendMessage", { chat_id: chat.chat_id, text: PETABAD_GREETING, reply_markup: MAIN_KB });
  await saveChat(chat, { history: [{ role: "assistant", content: PETABAD_GREETING }] });
}

async function cleanupTransientMessages(chatId: number) {
  const { data: chat } = await db.from("telegram_chats").select("transient_messages").eq("chat_id", chatId).maybeSingle();
  const pairs: any[] = chat?.transient_messages || [];
  const remaining = [];
  for (const pair of pairs) {
    if (Number(pair.expires_at) > Date.now()) { remaining.push(pair); continue; }
    const result = await tg("deleteMessages", { chat_id: chatId, message_ids: pair.message_ids });
    if (!result.ok) remaining.push(pair);
  }
  if (remaining.length !== pairs.length) await db.from("telegram_chats").update({ transient_messages: remaining }).eq("chat_id", chatId);
}

async function startNew(chat: any, commandMessageId?: number) {
  const previousThread = thread.getStore()?.id || chat.thread_id;
  if (!chat._new && ((chat.history || []).length || (chat.cart || []).length)) await rotate(chat, "manual");
  const id = await openTopic(chat, "خرید جدید");
  if (!id) return tg("sendMessage", { chat_id: chat.chat_id, text: "گفتگوی جدید ساخته نشد؛ دوباره امتحان کن." });
  await saveChat(chat, { thread_id: id });
  await greetTopic(chat);
  const navigation = await tg("sendMessage", {
    chat_id: chat.chat_id, message_thread_id: previousThread || 0,
    text: "گفتگوی جدید ساخته شد ✅\nاز لیست گفتگوها (بالای صفحه) واردش شو.",
  });
  if (navigation.ok) {
    const ids = [commandMessageId, navigation.result.message_id].filter((n): n is number => typeof n === "number");
    await saveChat(chat, { transient_messages: [...(chat.transient_messages || []), transientPair(ids)] });
  }
}

// A topic opened from Telegram's native compose button: bind a fresh session and greet inside it.
async function handleTopicCreated(msg: any) {
  if (msg.from?.is_bot) return; // bot-created topics are greeted by startNew
  if (String(msg.forum_topic_created?.name || "").startsWith("/")) return; // /start topic is greeted by the /start handler
  const chat = await loadChat(msg.chat.id, msg.from);
  if (!(await syncThread(chat, msg.message_thread_id))) return;
  if ((chat.history || []).length) return;
  await greetTopic(chat);
}

async function sendTracking(chat: any) {
  if (!chat.user_id) {
    return tg("sendMessage", { chat_id: chat.chat_id, text: "برای دیدن سفارش‌هات اول شماره‌ات رو تأیید کن 👇", reply_markup: PHONE_KB });
  }
  const { data } = await db.from("orders").select("order_number,status,total,created_at").eq("user_id", chat.user_id).order("created_at", { ascending: false }).limit(3);
  if (!data?.length) return tg("sendMessage", { chat_id: chat.chat_id, text: "هنوز سفارشی ثبت نکردی 🙂", reply_markup: MAIN_KB });
  const ST: Record<string, string> = { pending: "در انتظار پرداخت", paid: "پرداخت‌شده", processing: "در حال آماده‌سازی", confirmed: "تأییدشده", shipped: "ارسال‌شده", delivered: "تحویل‌شده", cancelled: "لغوشده" };
  const lines = data.map((o: any) => `📦 <code>${esc(o.order_number)}</code>\n     ${ST[o.status] || esc(o.status)} · ${price(o.total)} · ${new Date(o.created_at).toLocaleDateString("fa-IR", { timeZone: "Asia/Tehran" })}`);
  return tg("sendMessage", { chat_id: chat.chat_id, parse_mode: "HTML", text: `<b>آخرین سفارش‌هات</b>\n\n${lines.join("\n\n")}`, reply_markup: MAIN_KB });
}

// ── Executional choices: one 64-byte callback carries exactly what a tap runs ──
// x:<sig>:<ops> — ops: a<r|c><i>.<q> add · d<c> remove · s<c>.<q> set qty · r<c>.<r>.<q> replace · k clear.
// <sig> pins the cart the question was asked about; a changed cart makes the old buttons refuse.
const cartSig = (cart: any[]) => (cart.map((i) => `${i.id}:${i.qty}`).join("|").split("").reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) % 1296, 7)).toString(36).padStart(2, "0");
function encodeActions(chat: any, actions: CartAction[]): string | null {
  const cart: any[] = chat.cart || [], last: any[] = chat.last_products || [];
  const ref = (id: string) => { const r = last.findIndex((p) => p.id === id); if (r >= 0) return `r${r}`; const c = cart.findIndex((i) => i.id === id); return c >= 0 ? `c${c}` : null; };
  const ops: string[] = [];
  for (const a of actions) {
    if (a.type === "clear") ops.push("k");
    else if (a.type === "add") { const r = ref(a.product_id); if (!r) return null; ops.push(`a${r}.${a.quantity}`); }
    else if (a.type === "remove") { const k = cart.findIndex((i) => i.id === a.product_id); if (k < 0) return null; ops.push(`d${k}`); }
    else if (a.type === "update_quantity") { const k = cart.findIndex((i) => i.id === a.product_id); if (k < 0) return null; ops.push(`s${k}.${a.quantity}`); }
    else if (a.type === "replace") { const k = cart.findIndex((i) => i.id === a.remove_product_id); const r = last.findIndex((p) => p.id === a.add_product_id); if (k < 0 || r < 0) return null; ops.push(`r${k}.${r}.${a.quantity}`); }
  }
  const data = `x:${cartSig(cart)}:${ops.join(",")}`;
  return new TextEncoder().encode(data).length <= 64 ? data : null;
}
function decodeActions(chat: any, ops: string): CartAction[] | null {
  const cart: any[] = chat.cart || [], last: any[] = chat.last_products || [];
  const out: CartAction[] = [];
  for (const op of ops.split(",").filter(Boolean)) {
    let m;
    if (op === "k") out.push({ type: "clear" });
    else if ((m = op.match(/^a([rc])(\d+)\.(\d+)$/))) { const p = (m[1] === "r" ? last : cart)[+m[2]]; if (!p) return null; out.push({ type: "add", product_id: p.id, quantity: +m[3] }); }
    else if ((m = op.match(/^d(\d+)$/))) { if (!cart[+m[1]]) return null; out.push({ type: "remove", product_id: cart[+m[1]].id }); }
    else if ((m = op.match(/^s(\d+)\.(\d+)$/))) { if (!cart[+m[1]]) return null; out.push({ type: "update_quantity", product_id: cart[+m[1]].id, quantity: +m[2] }); }
    else if ((m = op.match(/^r(\d+)\.(\d+)\.(\d+)$/))) { if (!cart[+m[1]] || !last[+m[2]]) return null; out.push({ type: "replace", remove_product_id: cart[+m[1]].id, add_product_id: last[+m[2]].id, quantity: +m[3] }); }
    else return null;
  }
  return out;
}
const CK: Record<string, string> = { select_address: "addr", select_shipping: "ship", select_payment: "pay" };
function choiceButton(chat: any, c: Choice) {
  if (c.checkout) return { text: c.label, callback_data: `${CK[c.checkout.kind]}:${c.checkout.id}`.slice(0, 64) };
  if (c.actions) {
    const data = encodeActions(chat, c.actions);
    if (data) return { text: c.label, callback_data: data };
  }
  const b = sayBtn(c.say || c.label);
  return { text: c.label, callback_data: b.callback_data };
}
const choicesKb = (chat: any, choices: Choice[]) => ({ inline_keyboard: choices.slice(0, 8).map((c) => [choiceButton(chat, c)]) });

// Checkout steps reused by buttons and by chat commands («بفرست خونه»، «با اکسپرس»، «از کیف پول»).
async function ownedAddress(chat: any, id: unknown) {
  if (!chat.user_id || !id) return null;
  const { data } = await db.from("user_addresses").select("id,title,full_address").eq("id", String(id)).eq("user_id", chat.user_id).maybeSingle();
  return data;
}
function shipPrompt(chat: any, a: any) {
  return tg("sendMessage", {
    chat_id: chat.chat_id,
    text: `📍 ارسال به «${a.title}»\n${a.full_address}\n\nروش ارسال رو انتخاب کن:`,
    reply_markup: { inline_keyboard: PETABAD_SHIPPING.map(method => [{ text: `${method.label} · ${method.priceLabel} · ${method.deliveryWindow}`, callback_data: `ship:${method.id}` }]) },
  });
}
function summaryBody(chat: any, address: any, method: any) {
  const pay = { wallet: "کیف پول", gateway: "درگاه پرداخت", bnpl: "پرداخت اقساطی" }[String(chat.checkout_selection?.payment_id || "")] as string | undefined;
  return {
    text: `📍 ارسال به «${address.title}»\n${address.full_address}\n\n🚚 روش ارسال: ${method.label} · ${method.deliveryWindow}\nهزینه ارسال: ${method.priceLabel}\n💰 مجموع پرداختی: ${price(cartTotal(chat.cart) + method.fee)}${method.id === "courier" ? " (هزینه پیک جداگانه، پس کرایه)" : ""}${pay ? `\n💳 روش پرداخت: ${pay}` : ""}`,
    reply_markup: { inline_keyboard: [[{ text: pay ? `💳 پرداخت با ${pay}` : "💳 پرداخت و ثبت سفارش", web_app: { url: `${appUrl(chat)}&intent=payment&addr=${address.id}&ship=${method.id}` } }]] },
  };
}
/** Applies a validated checkout directive from chat and shows the next checkout step. */
async function applyDirective(chat: any, d: { kind: string; id: string }) {
  const sel = { ...(chat.checkout_selection || {}) };
  if (d.kind === "select_address") {
    const a = await ownedAddress(chat, d.id);
    if (!a) return tg("sendMessage", { chat_id: chat.chat_id, text: "این آدرس بین آدرس‌هات پیدا نشد." });
    await saveChat(chat, { checkout_selection: { ...sel, address_id: a.id } });
    chat.checkout_selection = { ...sel, address_id: a.id };
    if (!(chat.cart || []).length) return;
    const m = resolvePetabadShipping(sel.shipping_id);
    return m ? tg("sendMessage", { chat_id: chat.chat_id, ...summaryBody(chat, a, m) }) : shipPrompt(chat, a);
  }
  if (d.kind === "select_shipping" || d.kind === "select_payment") {
    const next = d.kind === "select_shipping" ? { ...sel, shipping_id: d.id } : { ...sel, payment_id: d.id };
    await saveChat(chat, { checkout_selection: next });
    chat.checkout_selection = next;
    if (!(chat.cart || []).length) return;
    const a = await ownedAddress(chat, next.address_id);
    const m = resolvePetabadShipping(next.shipping_id);
    if (a && m) return tg("sendMessage", { chat_id: chat.chat_id, ...summaryBody(chat, a, m) });
    if (!a) return chat.phone ? sendAddressStep(chat) : undefined;
    return shipPrompt(chat, a);
  }
}

async function handleText(chatId: number, from: any, text: string, messageId?: number) {
  const chat = await loadChat(chatId, from);
  if (!(await syncThread(chat, thread.getStore()?.id))) return;
  if (text === "/new" || text === BTN_NEW || text === "✨ گفتگوی جدید") return startNew(chat, messageId);
  if (text === "/track" || text === BTN_TRACK || text === "📜 گفتگوها") return sendTracking(chat);
  if (text === "/phone") return tg("sendMessage", { chat_id: chatId, text: "با دکمه زیر شماره‌ات رو بفرست تا بدون پیامک تأیید بشه:", reply_markup: PHONE_KB });
  if (!text.startsWith("/start") && text !== BTN_CART && text !== "/cart") {
    if (await askIfStale(chat, text)) return;
  }

  if (text.startsWith("/start")) {
    const payload = text.split(" ")[1];
    await tg("deleteMyCommands", {});
    await tg("setChatMenuButton", { chat_id: chatId, menu_button: { type: "default" } });
    const hasUser = (chat.history || []).some((m: any) => m.role === "user");
    if (!chat._new && (hasUser || (chat.cart || []).length)) await rotate(chat, "manual");
    await renameTopic(chat, thread.getStore()?.id || chat.thread_id, "خرید جدید");
    if (!(chat.history || []).some((m: any) => m.role === "assistant" && m.content === PETABAD_GREETING) || hasUser) await greetTopic(chat);
    if (payload?.startsWith("p_")) {
      const p = await db.from("pet_products").select("name").eq("id", payload.slice(2)).maybeSingle();
      text = p.data ? `درباره «${p.data.name}» بیشتر توضیح بده` : "";
      if (!text) return;
    } else return;
  }
  if (text === "/cart" || text === BTN_CART || text === "🛒 سبد خرید من") return sendCart(chat);

  if (!(chat.history || []).some((m: any) => m.role === "user")) {
    await renameTopic(chat, chat.thread_id, topicName(text));
  }

  // Fast path: "محصول چهارم رو اضافه کن"
  const ord = parseOrdinalAdd(text);
  const last: any[] = chat.last_products || [];
  if (ord && last[ord.index - 1]) {
    const p = last[ord.index - 1];
    const cart = addToCart(chat.cart || [], p, ord.qty);
    const reply = `حتماً؛ ${fa(ord.qty)} عدد «${p.name}» به سبدت اضافه شد ✅`;
    await saveChat(chat, { cart, history: [...(chat.history || []), { role: "user", content: text }, { role: "assistant", content: reply }].slice(-14) });
    await tg("sendMessage", { chat_id: chatId, text: reply, reply_markup: MAIN_KB });
    return sendCart(chat);
  }

  await tg("sendChatAction", { chat_id: chatId, action: "typing" });
  let out;
  try {
    out = await runAgent(chat, text);
  } catch (e) {
    console.error(e);
    return tg("sendMessage", { chat_id: chatId, text: "یه لحظه مشکلی پیش اومد، دوباره امتحان کن 🙏" });
  }
  const { ans, history } = out;
  const content = stripMd(ans.content || "");

  // Finalize intent (typed decision in petabad-agent): open the interactive address step, never text lists.
  if (ans.response_type === "start_checkout") {
    await saveChat(chat, { history: [...history, { role: "assistant", content: "آدرس و نحوه ارسال را انتخاب کنید:" }].slice(-14) });
    if (!(chat.cart || []).length) return tg("sendMessage", { chat_id: chatId, text: "سبدت هنوز خالیه؛ اول یه محصول اضافه کن 🐾", reply_markup: MAIN_KB });
    if (chat.phone) return sendAddressStep(chat);
    return tg("sendMessage", { chat_id: chatId, text: "قبل از پرداخت، با یه لمس شماره‌ات رو تأیید کن (بدون پیامک) 👇", reply_markup: PHONE_KB });
  }
  // Checkout picks and native-UI guidance: validated in petabad-agent, executed here.
  if (ans.response_type === "checkout" || ans.response_type === "guide") {
    await saveChat(chat, { history: [...history, { role: "assistant", content }].slice(-14) });
    const target = ans.guide?.target;
    const appBtn = (label: string, intent: string) => ({ inline_keyboard: [[{ text: label, web_app: { url: `${appUrl(chat)}&intent=${intent}` } }]] });
    const markup = (ans.choices || []).length ? choicesKb(chat, ans.choices)
      : target === "add_address" ? appBtn("📍 ثبت آدرس جدید در اپ", "new_address")
      : ["edit_address", "delete_address", "edit_profile"].includes(target) ? appBtn("👤 باز کردن پروفایل در اپ", "profile")
      : target === "login" ? PHONE_KB : MAIN_KB;
    await streamDraft(chatId, content || "…");
    await tg("sendMessage", { chat_id: chatId, text: content || "…", reply_markup: markup });
    if (ans.directive?.kind) await applyDirective(chat, ans.directive);
    return;
  }

  if (ans.response_type === "cart") {
    const before = JSON.stringify(chat.cart || []);
    const cart = (ans.cart_actions || []).length ? await applyCartActions(chat, ans.cart_actions) : chat.cart || [];
    await saveChat(chat, { cart, history: [...history, { role: "assistant", content }].slice(-14) });
    // Choice buttons are encoded against the cart the question was asked about.
    const choices: Choice[] = ans.needs_clarification ? ans.choices || (ans.clarification_options || []).map((o: string) => ({ label: o, say: o })) : ans.undo ? [ans.undo] : [];
    await streamDraft(chatId, content || "انجام شد ✅");
    await tg("sendMessage", {
      chat_id: chatId,
      text: content || "انجام شد ✅",
      reply_markup: choices.length ? choicesKb({ ...chat, cart }, choices) : MAIN_KB,
    });
    if (JSON.stringify(cart) !== before) await sendCart(chat);
    return;
  }

  // Clarification cards → reply keyboard options
  const card = ans.clarification || ans.card;
  const cardOpts: string[] = (card?.options || card?.steps?.[0]?.options || []).map((o: any) => (typeof o === "string" ? o : o?.label)).filter(Boolean);
  const cardQ = card?.question || card?.steps?.[0]?.question;
  const cardMulti = !!(card?.multi || card?.kind === "multi" || card?.steps?.[0]?.multi);
  const products: any[] = (ans.products || []).slice(0, 6);

  const split = products.length ? splitProductText(content) : { intro: content, reasons: [] as string[], outro: "" };
  const perCard = split.reasons.length > 0 && !!split.intro;
  const lead = perCard ? split.intro : content;
  const textOut = [lead, cardQ && !content.includes(cardQ) ? cardQ : ""].filter(Boolean).join("\n\n") || "…";
  await streamDraft(chatId, textOut);
  await tg("sendMessage", {
    chat_id: chatId,
    text: textOut,
    reply_markup: cardOpts.length ? (cardMulti ? multiKb(cardOpts.slice(0, 8)) : optionsKb(cardOpts.slice(0, 6))) : MAIN_KB,
  });

  for (const [i, p] of products.entries()) {
    const kb = {
      inline_keyboard: [
        [{ text: "➕ افزودن به سبد", callback_data: `add:${p.id}`.slice(0, 64) }],
        [{ text: "🔍 مشخصات کامل", web_app: { url: `${SITE}?p=${encodeURIComponent(p.id)}` } }],
      ],
    };
    const photo = p.image_url || p.image || p.image_urls?.[0];
    const caption = productCaption(p, i, perCard ? split.reasons[i] || "" : "");
    const r = photo ? await tg("sendPhoto", { chat_id: chatId, photo, caption, parse_mode: "HTML", reply_markup: kb }) : null;
    if (!r?.ok) await tg("sendMessage", { chat_id: chatId, text: caption, parse_mode: "HTML", reply_markup: kb });
  }
  if (perCard && split.outro) await tg("sendMessage", { chat_id: chatId, text: split.outro, reply_markup: MAIN_KB });

  const patch: Record<string, unknown> = {};
  if (products.length) {
    patch.last_products = products.map((p) => ({ id: p.id, name: pname(p), price: p.price, brand: p.brand ?? null }));
  }
  const summary = products.length ? `${textOut}\n[محصولات نمایش داده شده: ${products.map((p, i) => `#${i + 1} ${pname(p)} (id:${p.id})`).join("، ")}]` : textOut;
  const slim = products.map((p) => ({ id: p.id, name_fa: pname(p), price: p.price, original_price: p.original_price ?? null, image_url: p.image_url || p.image || p.image_urls?.[0] || null, image_urls: p.image_urls || null, brand: p.brand ?? null, rating: p.rating ?? null, review_count: p.review_count ?? 0, in_stock: p.in_stock !== false, category: p.category ?? null, subcategory: p.subcategory ?? null, species: p.species ?? null, weight: p.weight ?? null }));
  patch.history = [...history, { role: "assistant", content: summary, ...(slim.length ? { products: slim } : {}) }].slice(-14);
  await saveChat(chat, patch);
}

// Answered questions keep their text plus the user's choice; the buttons disappear for every question type.
const markAnswered = (chatId: number, msg: any, choice: string) => {
  const base = String(msg?.text || msg?.caption || "").trim();
  return tg("editMessageText", { chat_id: chatId, message_id: msg.message_id, text: `${base}\n\n👈 انتخاب شما: ${choice}`.slice(0, 4096), reply_markup: { inline_keyboard: [] } });
};

async function handleCallback(cb: any) {
  const chatId = cb.message?.chat?.id;
  const data: string = cb.data || "";
  const chat = await loadChat(chatId, cb.from);
  const ack = (text?: string) => tg("answerCallbackQuery", { callback_query_id: cb.id, ...(text ? { text } : {}) });
  if (!(await syncThread(chat, thread.getStore()?.id))) return ack();
  let cart: any[] = chat.cart || [];

  if (data === "new") { await ack(); return startNew(chat); }
  if (data.startsWith("q:")) {
    await ack();
    const btn = (cb.message?.reply_markup?.inline_keyboard || []).flat().find((b: any) => b.callback_data === data);
    await markAnswered(chatId, cb.message, btn?.text || data.slice(2));
    return handleText(chatId, cb.from, data.slice(2));
  }
  if (data === "noop") return ack();
  if (data.startsWith("addr:")) {
    const a = await ownedAddress(chat, data.slice(5));
    if (!a) return ack("این آدرس پیدا نشد");
    await ack("✅ آدرس انتخاب شد");
    await markAnswered(chatId, cb.message, `📍 ${a.title}`);
    return applyDirective(chat, { kind: "select_address", id: a.id });
  }
  if (data.startsWith("ship:")) {
    const method = resolvePetabadShipping(data.slice(5));
    const selection = chat.checkout_selection || {};
    const address = await ownedAddress(chat, selection.address_id);
    if (!method || !address || !(chat.cart || []).length) {
      if (method) { await saveChat(chat, { checkout_selection: { ...selection, shipping_id: method.id } }); await ack("روش ارسال ثبت شد؛ حالا آدرس رو انتخاب کن"); chat.checkout_selection = { ...selection, shipping_id: method.id }; return chat.phone ? sendAddressStep(chat) : undefined; }
      return ack("اول آدرس و سبد خرید رو انتخاب کن");
    }
    const next = { ...selection, address_id: address.id, shipping_id: method.id };
    await saveChat(chat, { checkout_selection: next });
    chat.checkout_selection = next;
    await ack("روش ارسال انتخاب شد");
    return tg("editMessageText", { chat_id: chatId, message_id: cb.message.message_id, ...summaryBody(chat, address, method) });
  }
  if (data.startsWith("pay:")) {
    const id = data.slice(4);
    if (!["wallet", "gateway", "bnpl"].includes(id)) return ack("این روش فعال نیست");
    await ack("روش پرداخت ثبت شد");
    await markAnswered(chatId, cb.message, ({ wallet: "کیف پول", gateway: "درگاه پرداخت", bnpl: "پرداخت اقساطی" } as any)[id]);
    return applyDirective(chat, { kind: "select_payment", id });
  }
  if (data.startsWith("x:")) {
    const [, sig, ops = ""] = data.split(":");
    if (sig !== cartSig(cart)) return ack("سبدت از اون موقع تغییر کرده؛ دوباره بگو چی کار کنم");
    const actions = decodeActions(chat, ops);
    if (!actions) return ack("این گزینه دیگه معتبر نیست");
    const btn = (cb.message?.reply_markup?.inline_keyboard || []).flat().find((b: any) => b.callback_data === data);
    await ack();
    await markAnswered(chatId, cb.message, btn?.text || "انجام شد");
    const names = new Map<string, string>([...(chat.last_products || []), ...cart].map((p: any) => [p.id, p.name]));
    const next = await applyCartActions(chat, actions);
    await saveChat(chat, { cart: next });
    const text = actions.length ? describeActions(actions, (id) => names.get(id) || "محصول", cart.map((i) => ({ id: i.id, name: i.name, quantity: i.qty }))) : "باشه، سبدت دست‌نخورده موند.";
    await tg("sendMessage", { chat_id: chatId, text, reply_markup: MAIN_KB });
    if (actions.length) return sendCart({ ...chat, cart: next });
    return;
  }
  if (data.startsWith("m:") || data === "mok") {
    const rows: any[][] = cb.message?.reply_markup?.inline_keyboard || [];
    const opts = rows.filter((r) => String(r[0]?.callback_data || "").startsWith("m:")).map((r) => r[0]);
    if (data === "mok") {
      const picked = opts.filter((b) => b.text.startsWith(ON)).map((b) => b.text.slice(ON.length));
      if (!picked.length) return ack("حداقل یه گزینه رو انتخاب کن");
      await ack();
      await markAnswered(chatId, cb.message, picked.join("، "));
      return handleText(chatId, cb.from, picked.join(" و "));
    }
    const idx = Number(data.slice(2));
    const next = opts.map((b, i) => {
      const label = b.text.replace(/^(◻️ |✅ )/, "");
      const on = b.text.startsWith(ON) !== (i === idx);
      return [{ text: (on ? ON : OFF) + label, callback_data: b.callback_data }];
    });
    const n = next.filter((r) => r[0].text.startsWith(ON)).length;
    await ack();
    return tg("editMessageReplyMarkup", { chat_id: chatId, message_id: cb.message.message_id, reply_markup: { inline_keyboard: [...next, [confirmBtn(n)]] } });
  }
  if (data === "cont" || data === "fresh") {
    await ack();
    const pending = chat.pending_text;
    await db.from("telegram_chats").update({ pending_text: null }).eq("chat_id", chatId);
    chat.pending_text = null;
    if (data === "fresh") await startNew(chat);
    else {
      await saveChat(chat, {});
      await tg("sendMessage", { chat_id: chatId, text: "عالی، ادامه می‌دیم 🐾", reply_markup: MAIN_KB });
    }
    if (pending) return handleText(chatId, cb.from, pending);
    return;
  }
  if (data === "checkout") {
    await ack();
    if (chat.phone) return sendAddressStep(chat);
    return tg("sendMessage", { chat_id: chatId, text: "قبل از پرداخت، با یه لمس شماره‌ات رو تأیید کن (بدون پیامک) 👇", reply_markup: PHONE_KB });
  }
  if (await askIfStale(chat, null)) { await ack(); return; }
  cart = chat.cart || [];

  if (data === "clear") {
    await saveChat(chat, { cart: [] });
    await ack("سبد خالی شد");
    return sendCart(chat, cb.message?.message_id);
  }
  const m = data.match(/^(inc|dec|del):(\d+)$/);
  if (m) {
    const k = +m[2];
    if (!cart[k]) return ack();
    if (m[1] === "inc") cart = cart.map((i, j) => (j === k ? { ...i, qty: i.qty + 1 } : i));
    if (m[1] === "dec") cart = cart.map((i, j) => (j === k ? { ...i, qty: i.qty - 1 } : i)).filter((i) => i.qty > 0);
    if (m[1] === "del") cart = cart.filter((_, j) => j !== k);
    await saveChat(chat, { cart });
    await ack(m[1] === "del" ? "حذف شد" : "به‌روز شد");
    return sendCart(chat, cb.message?.message_id);
  }
  if (data.startsWith("add:")) {
    const p = await fetchProduct(data.slice(4));
    if (!p) return ack("این محصول پیدا نشد");
    cart = addToCart(cart, p);
    await saveChat(chat, { cart });
    await ack("✅ به سبدت اضافه شد");
    const count = cart.reduce((s, i) => s + i.qty, 0);
    await tg("sendMessage", {
      chat_id: chatId,
      text: `«${p.name}» به سبدت اضافه شد. الان ${fa(count)} کالا توی سبدته (${price(cartTotal(cart))}).`,
      reply_markup: { inline_keyboard: [[{ text: "🛒 مشاهده و ویرایش سبد", callback_data: "cart" }], [checkoutBtn(chat)]] },
    });
    return;
  }
  if (data === "cart") {
    await ack();
    return sendCart(chat);
  }
  await ack();
}

function phoneVariants(raw: string) {
  const d = raw.replace(/\D/g, "");
  const local = d.startsWith("98") ? "0" + d.slice(2) : d.startsWith("0") ? d : "0" + d;
  return [local, "98" + local.slice(1), "+98" + local.slice(1), raw];
}

async function handleContact(msg: any) {
  const chat = await loadChat(msg.chat.id, msg.from);
  await syncThread(chat, thread.getStore()?.id);
  if (msg.contact.user_id && msg.contact.user_id !== msg.from?.id) {
    return tg("sendMessage", { chat_id: msg.chat.id, text: "لطفاً شماره‌ی خودت رو با همون دکمه بفرست 🙏", reply_markup: MAIN_KB });
  }
  const phone = msg.contact.phone_number;
  const { data: prof } = await db.from("profiles").select("id").in("phone", phoneVariants(phone)).limit(1).maybeSingle();
  await saveChat(chat, { phone, user_id: prof?.id ?? null });
  if (prof?.id) await saveChat(chat, { history: chat.history || [] }); // mirror to account history
  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text: prof?.id
      ? "شماره‌ات تأیید شد ✅ این گفتگو به حساب پت‌آبادت وصل شد و توی سابقه گفتگوهات هم دیده می‌شه."
      : "شماره‌ات ثبت شد ✅ موقع نهایی کردن خرید، با همین شماره وارد بشی گفتگو به حسابت اضافه می‌شه.",
    reply_markup: MAIN_KB,
  });
  if ((chat.cart || []).length) {
    await sendAddressStep(chat);
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("ok");
  const secret = await deriveSecret();
  if (req.headers.get("X-Telegram-Bot-Api-Secret-Token") !== secret) return new Response("Unauthorized", { status: 401 });
  try {
    const update = await req.json();
    const m = update.message ?? update.callback_query?.message;
    if (m?.chat?.id) await cleanupTransientMessages(m.chat.id);
    await thread.run({ id: m?.message_thread_id }, async () => {
      if (update.callback_query) await handleCallback(update.callback_query);
      else if (update.message?.contact) await handleContact(update.message);
      else if (update.message?.forum_topic_created) await handleTopicCreated(update.message);
      else if (update.message?.forum_topic_edited && update.message.from?.is_bot) await tg("deleteMessage", { chat_id: m.chat.id, message_id: m.message_id });
      else if (update.message?.text) await handleText(update.message.chat.id, update.message.from, update.message.text.trim(), update.message.message_id);
    });
  } catch (e) {
    console.error("webhook error", e);
  }
  return new Response(JSON.stringify({ ok: true }));
});
