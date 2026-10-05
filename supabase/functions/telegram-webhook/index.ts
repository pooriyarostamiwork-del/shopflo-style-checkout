// Telegram bot (@Flowcartbot) webhook for the PetAbad storefront.
// Routes chat to petabad-agent (agentic mode, with cart + product memory),
// executes cart operations, renders photo cards, and opens the PetAbad
// Mini App (web_app buttons) carrying the same conversation via ?tg=<token>.
import { createClient } from "npm:@supabase/supabase-js@2";

const TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SITE = "https://flowcart.space/petabad";
const API = `https://api.telegram.org/bot${TOKEN}`;
const db = createClient(SUPABASE_URL, SERVICE_KEY);

const fa = (n: number | string) => String(n).replace(/[0-9]/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[+d]);
const money = (n: number) => fa(Math.round(n || 0).toLocaleString("en-US")).replace(/,/g, "٬");
const price = (n: number) => `${money(n)} تومان`;
const esc = (s: string) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const stripMd = (s: string) => String(s ?? "").replace(/\*\*|__|#+\s?|`/g, "").replace(/SELECTED_IDS:.*$/gm, "").trim();
const pname = (p: any) => p?.name_fa || p?.name || "";

async function tg(method: string, body: unknown) {
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
const BTN_CART = "🛒 سبد خرید", BTN_HIST = "📜 گفتگوها", BTN_NEW = "✨ گفتگوی جدید";
const MAIN_KB = { keyboard: [[{ text: BTN_CART }, { text: BTN_HIST, web_app: { url: `${SITE}?view=history` } }, { text: BTN_NEW }]], resize_keyboard: true, is_persistent: true };
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
    ? await db.from("user_addresses").select("id,title,full_address,is_default").eq("user_id", chat.user_id).order("is_default", { ascending: false }).order("created_at", { ascending: false }).limit(5)
    : { data: [] as any[] };
  if (!data?.length) {
    return tg("sendMessage", {
      chat_id: chat.chat_id,
      text: `سبدت آماده‌ست (${price(cartTotal(chat.cart))}) ✅\n\nهنوز آدرسی ثبت نکردی؛ توی اپ آدرست رو وارد کن و همون‌جا خرید رو تموم کن 👇`,
      reply_markup: { inline_keyboard: [[appCheckoutBtn(chat, "📍 ثبت آدرس و ادامه خرید")]] },
    });
  }
  const rows = data.map((a: any) => [{ text: `📍 ${a.title} · ${String(a.full_address).slice(0, 36)}`, callback_data: `addr:${a.id}` }]);
  return tg("sendMessage", {
    chat_id: chat.chat_id,
    text: `سبدت آماده‌ست (${price(cartTotal(chat.cart))}) ✅\n\nبه کدوم آدرس بفرستیم؟`,
    reply_markup: { inline_keyboard: [...rows, [appCheckoutBtn(chat, "➕ آدرس جدید (در اپ)")]] },
  });
}

// Pinned session header: every new session gets one, replacing the previous pin.
async function pinSession(chatId: number, text: string) {
  const r = await tg("sendMessage", { chat_id: chatId, parse_mode: "HTML", text, reply_markup: MAIN_KB });
  if (r.ok) {
    await tg("unpinAllChatMessages", { chat_id: chatId });
    await tg("pinChatMessage", { chat_id: chatId, message_id: r.result.message_id, disable_notification: true });
  }
}
const sessionHeader = (title: string) => `📌 <b>${title}</b>\n🕒 ${new Date().toLocaleDateString("fa-IR", { timeZone: "Asia/Tehran" })}\nپیام‌های بالای این خط مربوط به گفتگوهای قبلی‌ان و توی «📜 گفتگوها» در دسترسن.`;

// Mirror the Telegram conversation into the linked user's Flowcart history.
async function mirrorToBasket(chat: any) {
  if (!chat.user_id) return;
  const messages = (chat.history || []).map((m: any, i: number) => ({
    id: `tg-${i}`,
    role: m.role,
    content: String(m.content || "").replace(/\n?\[محصولات نمایش داده شده:[\s\S]*\]$/, ""),
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
  return ex ? cart.map((i) => (i.id === p.id ? { ...i, qty: i.qty + qty } : i)) : [...cart, { id: p.id, name: pname(p), price: p.price, qty }];
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

function productCaption(p: any, i: number) {
  const name = esc(pname(p));
  const parts = [`<b>${fa(i + 1)} │ ${name}</b>`];
  if (p.rating) {
    const r = Number(p.rating);
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

async function runAgent(chat: any, text: string) {
  const history = [...(chat.history || []), { role: "user", content: text }].slice(-14);
  const last: any[] = chat.last_products || [];
  const cart: any[] = chat.cart || [];
  const memory = last.length
    ? last.map((p, i) => `#${i + 1} [${p.id}] ${p.name} - ${p.price} تومان${p.brand ? ` (${p.brand})` : ""}`).join("\n")
    : "";
  const res = await fetch(`${SUPABASE_URL}/functions/v1/petabad-agent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${SERVICE_KEY}` },
    body: JSON.stringify({
      messages: history,
      mode: "agentic",
      is_first_message: history.length <= 1,
      cart_context: { items: cart.map((i) => ({ id: i.id, name: i.name, price: i.price, quantity: i.qty })), total: cartTotal(cart) },
      product_memory: memory,
      products_context: last.map((p) => ({ id: p.id, name: p.name, price: p.price, brand: p.brand })),
      memory_index: [{ group_id: "tg", turn: 1, query: "", items: last.map((p, i) => ({ position: i + 1, id: p.id, name: p.name, price: p.price })) }],
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
    if (a.type === "add") {
      const src = a.product_index ? byIndex(a.product_index) : a.product_id ? await fetchProduct(a.product_id) : null;
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
      const src = a.add_product_index ? byIndex(a.add_product_index) : a.add_product_id ? await fetchProduct(a.add_product_id) : null;
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
    });
  }
  await saveChat(chat, { session_token: crypto.randomUUID(), history: [], cart: [], last_products: [], locked: false, archived: archived.slice(0, 10) });
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

async function sendHistory(chat: any) {
  const list: any[] = (chat.archived || []).slice(0, 3);
  const rows = list.map((a) => [{
    text: `${a.reason === "completed" ? "✅" : "💬"} ${String(a.title).slice(0, 28)}${a.count ? ` · ${fa(a.count)} کالا` : ""} · ${ago(a.ended_at)}`,
    ...(a.reason === "completed" ? { web_app: { url: `${SITE}?tg=${a.token}` } } : { callback_data: `resume:${a.token}` }),
  }]);
  rows.push([{ text: "📂 همه گفتگوها در مینی‌اپ", web_app: { url: SITE } }]);
  await tg("sendMessage", {
    chat_id: chat.chat_id,
    parse_mode: "HTML",
    text: list.length ? "📜 <b>گفتگوهای قبلی تو</b>\nیکی رو برای ادامه انتخاب کن یا یه گفتگوی تازه شروع کن:" : "هنوز گفتگوی قبلی‌ای نداری. هر وقت خواستی یه گفتگوی تازه شروع کن 🙂",
    reply_markup: { inline_keyboard: rows },
  });
}

async function resume(chat: any, token: string) {
  const archived: any[] = chat.archived || [];
  const entry = archived.find((a) => a.token === token);
  if (!entry) return false;
  const rest = archived.filter((a) => a.token !== token);
  if ((chat.history || []).length || (chat.cart || []).length) {
    const first = (chat.history || []).find((m: any) => m.role === "user")?.content || "گفتگوی تلگرام";
    rest.unshift({ token: chat.session_token, title: String(first).slice(0, 40), count: (chat.cart || []).reduce((s: number, i: any) => s + i.qty, 0), reason: "manual", ended_at: new Date().toISOString(), history: chat.history, cart: chat.cart, last_products: chat.last_products });
  }
  await saveChat(chat, { session_token: entry.token, history: entry.history || [], cart: entry.cart || [], last_products: entry.last_products || [], locked: false, archived: rest.slice(0, 10) });
  const lastBot = [...(entry.history || [])].reverse().find((m: any) => m.role === "assistant")?.content || "";
  await tg("sendMessage", { chat_id: chat.chat_id, text: `برگشتیم به گفتگوی «${entry.title}» 🐾${lastBot ? `\n\nآخرین حرفم این بود:\n${String(lastBot).replace(/\n?\[محصولات نمایش داده شده:[\s\S]*\]$/, "").slice(0, 300)}` : ""}\n\nادامه بدیم؟`, reply_markup: MAIN_KB });
  if ((entry.cart || []).length) await sendCart(chat);
  return true;
}

async function startNew(chat: any, intro = "گفتگوی جدید شروع شد ✨") {
  if (!chat._new && ((chat.history || []).length || (chat.cart || []).length)) await rotate(chat, "manual");
  await pinSession(chat.chat_id, `${sessionHeader(intro)}\n\nبگو برای کی دنبال چی هستی؟`);
}

async function handleText(chatId: number, from: any, text: string) {
  const chat = await loadChat(chatId, from);
  if (text === "/new" || text === BTN_NEW) return startNew(chat);
  if (text === "/history" || text === BTN_HIST) return sendHistory(chat);
  if (text === "/phone") return tg("sendMessage", { chat_id: chatId, text: "با دکمه زیر شماره‌ات رو بفرست تا بدون پیامک تأیید بشه:", reply_markup: PHONE_KB });
  if (!text.startsWith("/start") && text !== BTN_CART && text !== "/cart") {
    if (await askIfStale(chat, text)) return;
  }

  if (text.startsWith("/start")) {
    const payload = text.split(" ")[1];
    await tg("deleteMyCommands", {});
    await tg("setChatMenuButton", { chat_id: chatId, menu_button: { type: "default" } });
    if (!chat._new && ((chat.history || []).length || (chat.cart || []).length)) await rotate(chat, "manual");
    await pinSession(chatId, sessionHeader("گفتگوی جدید شروع شد ✨"));
    await tg("sendMessage", {
      chat_id: chatId,
      text: `سلام ${from?.first_name ?? ""}! 🐾 من دستیار خرید هوشمند پت‌آباد هستم (قدرت‌گرفته از Flowcart).\n\nبگو برای کی دنبال چی هستی، مثلاً «غذای خشک گربه عقیم‌شده زیر ۸۰۰ هزار تومن» یا «خاک گربه بی‌بو»؛ بهترین گزینه‌ها رو برات پیدا می‌کنم و همین‌جا به سبدت اضافه می‌کنم.`,
      reply_markup: MAIN_KB,
    });
    if (payload?.startsWith("p_")) {
      const p = await db.from("pet_products").select("name").eq("id", payload.slice(2)).maybeSingle();
      text = p.data ? `درباره «${p.data.name}» بیشتر توضیح بده` : "";
      if (!text) return;
    } else return;
  }
  if (text === "/cart" || text === BTN_CART || text === "🛒 سبد خرید من") return sendCart(chat);

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

  if (ans.response_type === "cart") {
    const before = JSON.stringify(chat.cart || []);
    const cart = ans.needs_clarification ? chat.cart || [] : await applyCartActions(chat, ans.cart_actions);
    await saveChat(chat, { cart, history: [...history, { role: "assistant", content }].slice(-14) });
    const opts: string[] = ans.clarification_options || [];
    await tg("sendMessage", {
      chat_id: chatId,
      text: content || "انجام شد ✅",
      reply_markup: opts.length ? optionsKb(opts.slice(0, 4)) : MAIN_KB,
    });
    if (JSON.stringify(cart) !== before) await sendCart(chat);
    return;
  }

  // Clarification cards → reply keyboard options
  const card = ans.clarification || ans.card;
  const cardOpts: string[] = (card?.options || card?.steps?.[0]?.options || []).map((o: any) => (typeof o === "string" ? o : o?.label)).filter(Boolean);
  const cardQ = card?.question || card?.steps?.[0]?.question;
  const cardMulti = !!(card?.multi || card?.kind === "multi" || card?.steps?.[0]?.multi);
  const products: any[] = (ans.products || []).slice(0, 4);

  const textOut = [content, cardQ && !content.includes(cardQ) ? cardQ : ""].filter(Boolean).join("\n\n") || "…";
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
    const caption = productCaption(p, i);
    const r = photo ? await tg("sendPhoto", { chat_id: chatId, photo, caption, parse_mode: "HTML", reply_markup: kb }) : null;
    if (!r?.ok) await tg("sendMessage", { chat_id: chatId, text: caption, parse_mode: "HTML", reply_markup: kb });
  }

  const patch: Record<string, unknown> = {};
  if (products.length) {
    patch.last_products = products.map((p) => ({ id: p.id, name: pname(p), price: p.price, brand: p.brand ?? null }));
  }
  const summary = products.length ? `${textOut}\n[محصولات نمایش داده شده: ${products.map((p, i) => `#${i + 1} ${pname(p)} (id:${p.id})`).join("، ")}]` : textOut;
  patch.history = [...history, { role: "assistant", content: summary }].slice(-14);
  await saveChat(chat, patch);
}

async function handleCallback(cb: any) {
  const chatId = cb.message?.chat?.id;
  const data: string = cb.data || "";
  const chat = await loadChat(chatId, cb.from);
  let cart: any[] = chat.cart || [];
  const ack = (text?: string) => tg("answerCallbackQuery", { callback_query_id: cb.id, ...(text ? { text } : {}) });

  if (data === "new") { await ack(); return startNew(chat); }
  if (data === "history") { await ack(); return sendHistory(chat); }
  if (data.startsWith("resume:")) {
    await ack();
    if (!(await resume(chat, data.slice(7)))) await tg("sendMessage", { chat_id: chatId, text: "این گفتگو دیگه در دسترس نیست." });
    return;
  }
  if (data.startsWith("q:")) { await ack(); return handleText(chatId, cb.from, data.slice(2)); }
  if (data === "noop") return ack();
  if (data.startsWith("addr:")) {
    const id = data.slice(5);
    const { data: a } = chat.user_id ? await db.from("user_addresses").select("id,title,full_address").eq("id", id).eq("user_id", chat.user_id).maybeSingle() : { data: null };
    if (!a) return ack("این آدرس پیدا نشد");
    await ack("✅ آدرس انتخاب شد");
    await tg("editMessageReplyMarkup", { chat_id: chatId, message_id: cb.message.message_id, reply_markup: { inline_keyboard: [] } });
    return tg("sendMessage", {
      chat_id: chatId,
      text: `📍 ارسال به «${a.title}»\n${a.full_address}\n\nفقط مونده انتخاب روش پرداخت 👇`,
      reply_markup: { inline_keyboard: [[{ text: "💳 انتخاب روش پرداخت", web_app: { url: `${appUrl(chat)}&intent=payment&addr=${a.id}` } }]] },
    });
  }
  if (data.startsWith("m:") || data === "mok") {
    const rows: any[][] = cb.message?.reply_markup?.inline_keyboard || [];
    const opts = rows.filter((r) => String(r[0]?.callback_data || "").startsWith("m:")).map((r) => r[0]);
    if (data === "mok") {
      const picked = opts.filter((b) => b.text.startsWith(ON)).map((b) => b.text.slice(ON.length));
      if (!picked.length) return ack("حداقل یه گزینه رو انتخاب کن");
      await ack();
      await tg("editMessageReplyMarkup", { chat_id: chatId, message_id: cb.message.message_id, reply_markup: { inline_keyboard: [] } });
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
    if (update.callback_query) await handleCallback(update.callback_query);
    else if (update.message?.contact) await handleContact(update.message);
    else if (update.message?.text) await handleText(update.message.chat.id, update.message.from, update.message.text.trim());
  } catch (e) {
    console.error("webhook error", e);
  }
  return new Response(JSON.stringify({ ok: true }));
});
