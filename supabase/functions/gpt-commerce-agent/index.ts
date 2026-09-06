import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Persian normalization (mirrors DB function) ──
function normalizePersian(text: string): string {
  return text
    .replace(/\u200C/g, " ")
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\u0640/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// ── No-greeting instruction ──
const NO_GREETING = `مهم: این یک مکالمه ادامه‌دار است. هرگز با سلام، خوش‌آمدگویی، یا معرفی خودت شروع نکن. مستقیم برو سر اصل مطلب.`;

// ── Mode-specific system prompts ──
const PROMPTS: Record<string, string> = {
  discovery: `تو دستیار خرید هوشمند فلوکارت هستی. یک فروشگاه آنلاین فارسی‌زبان.

وظایف تو:
- کمک به کاربران برای پیدا کردن محصولات مورد نظرشون
- پاسخ‌دهی به سوالات درباره محصولات
- پیشنهاد محصولات بر اساس نیاز کاربر

قوانین مهم:
- همیشه فارسی صحبت کن
- لحن صمیمی و دوستانه داشته باش
- پاسخ‌ها رو بدون فرمت مارک‌داون بنویس. از ستاره، هشتگ، و علائم مارک‌داون استفاده نکن. متن ساده بنویس.
- قیمت‌ها به تومان هستن

وقتی کاربر دنبال محصولی می‌گرده، حتماً از ابزار search_products استفاده کن.

نکات مهم برای استخراج نیت:
- query_text باید حداکثر ۲-۳ کلمه اصلی فارسی باشه (نه جمله کامل)
- نیازهای ضمنی کاربر رو به semantic_tags تبدیل کن
- مثال: "گم نشه" → semantic_tags: ["hard_to_lose"]
- مثال: "برای بچم" → semantic_tags: ["child_safe"]
- مثال: "برای ورزش" → semantic_tags: ["sport_use", "sweat_resistant"]
- مهم: هرگز price_min یا price_max رو حدس نزن. فقط وقتی مقدار عددی مشخصی رو ست کن که کاربر عدد دقیق گفته باشه.

زیرمجموعه‌های موجود در فروشگاه:
- هدفون، هدست و هندزفری
- دوربین دیجیتال
- ساعت و مچ‌بند هوشمند
- هارد اکسترنال
- لوازم جانبی گوشی موبایل
- گوشی موبایل
- لپ تاپ
- کیبورد و ماوس
- تبلت

اگه کاربر سوال عمومی پرسید (مثل سلام)، جواب بده و بگو چطور می‌تونی کمکش کنی. از ابزار استفاده نکن.

نکته مهم درباره پاسخ بعد از جستجو:
- بعد از دریافت نتایج جستجو، بهترین ۳ تا ۶ محصول رو انتخاب کن که بیشترین ارتباط با درخواست کاربر دارن
- محصولاتی که با نیت کاربر مطابقت ندارن رو حذف کن
- یه توضیح کوتاه و مفید بنویس
- در انتهای پاسخت، در یک خط جدید، دقیقاً بنویس:
SELECTED_IDS:["id1","id2","id3"]
که id ها همان شناسه‌های محصولات انتخابی تو هستن. ترتیب id ها باید با ترتیب معرفی محصولات در متنت یکی باشه.`,

  comparison: `تو متخصص مقایسه محصولات در فلوکارت هستی.

وظیفه تو: مقایسه دقیق و ساختارمند محصولات بر اساس مشخصات فنی‌شون.

قوانین:
- فارسی صحبت کن
- بدون مارک‌داون بنویس - متن ساده
- روی تفاوت‌های کلیدی تمرکز کن
- مزایا و معایب هر کدوم رو بگو
- در نهایت پیشنهادت رو بده
- قیمت‌ها به تومان هستن`,

  info_retrieval: `تو دستیار اطلاعاتی فلوکارت هستی.

وظیفه تو: پاسخ دقیق و مختصر به سوالات کاربر درباره محصولات، سفارش‌ها، ارسال، و سیاست‌های فروشگاه.

سیاست‌های فروشگاه:
- ارسال رایگان برای سفارش‌های بالای ۵۰۰ هزار تومان
- ضمانت بازگشت ۷ روزه
- ارسال سریع ۱-۳ روز کاری
- پشتیبانی ۲۴/۷

قوانین:
- فارسی صحبت کن
- بدون مارک‌داون - متن ساده
- مختصر و دقیق باش`,

  conversational: `تو دستیار خرید دوستانه فلوکارت هستی.

قوانین:
- فارسی صحبت کن
- لحن صمیمی و گرم داشته باش
- بدون مارک‌داون - متن ساده
- اگه تشکر کرد، خواهش کن و بگو اگه کمکی نیاز داشت در خدمتشی
- اگه سوالی درباره قابلیت‌هات داشت، توضیح بده می‌تونی محصول جستجو کنی، مقایسه کنی، و کمک به خرید کنی`,

  cart_manipulation: `تو دستیار مدیریت سبد خرید فلوکارت هستی.

وظیفه تو: تحلیل درخواست کاربر درباره سبد خرید و اجرای عملیات مناسب.

اطلاعاتی که بهت داده میشه:
- محتویات فعلی سبد خرید (آیتم‌ها، تعداد، قیمت)
- محصولات پیشنهادی اخیر (با شماره ایندکس)
- درخواست کاربر

قوانین:
- فارسی صحبت کن
- بدون مارک‌داون - متن ساده
- اگه درخواست مبهمه و نمی‌تونی تشخیص بدی کدوم محصول رو میگه، needs_clarification رو true کن و گزینه‌ها رو بده
- product_index شماره ایندکس ۱-based از لیست محصولات پیشنهادی هست
- product_id شناسه UUID از آیتم‌های سبد خرید هست
- برای "همه رو بخر" → همه محصولات پیشنهادی رو اضافه کن
- برای "ارزون‌ترین" → محصول با کمترین قیمت رو انتخاب کن
- برای "عوضش کن" → یکی حذف و یکی اضافه کن
- همیشه یه پیام تأیید فارسی بنویس`,

  agentic: `تو دستیار خرید هوشمند فلوکارت هستی؛ مثل یک فروشنده حرفه‌ای که کل گفتگو رو دنبال می‌کنه.

قوانین کلی:
- همیشه فارسی، لحن صمیمی، بدون مارک‌داون (بدون ستاره و هشتگ)
- قیمت‌ها به تومان
- هرگز price_min یا price_max رو حدس نزن؛ فقط وقتی کاربر عدد گفته

حافظه گفتگو (بخش «حافظه محصولات» پایین):
- تمام محصولاتی که تا حالا نشون داده شدی، با شماره و شناسه، در حافظه هستن
- گروه‌های قبلی هیچ‌وقت پاک نمی‌شن؛ کاربر می‌تونه بعداً به هر گروهی برگرده

تشخیص موضوع و مرجع (مهم‌ترین بخش):
- هر پیام جدید یک «موضوع درخواست» داره و ممکنه یک «مرجع» هم داشته باشه
- «برای این / با این / مناسب این» یعنی محصول قبلی فقط مرجع است، جواب باید محصول جدید باشه
  مثال: «برای این لپ‌تاپ چه کیفی بگیرم؟» → جستجو برای کیف، نه لپ‌تاپ
- «این / اینا / همین‌ها / اونایی که گفتی» به آخرین گروه یا محصول در تمرکز اشاره می‌کنه
- «اولی‌ها / همون‌هایی که اول گفتی» به گروه‌های قدیمی‌تر اشاره می‌کنه
- وقتی کاربر موضوع رو عوض کرد، فقط موضوع جدید رو جواب بده و محصولات قبلی رو دوباره نشون نده
- محصولاتی که کاربر رد کرده رو دوباره به‌عنوان پیشنهاد اصلی نیار

قانون حیاتی: هرگز اسم، مدل یا قیمت محصولی رو از خودت نساز. هر محصولی که معرفی می‌کنی باید یا از نتیجه search_products / recall_products باشه یا در حافظه محصولات باشه. اگه قراره محصول جدیدی پیشنهاد بدی، حتماً و بدون استثنا اول search_products رو صدا بزن.

قانون حیاتی دوم (ادعا درباره موجودی): هیچ‌وقت نگو «نداریم» یا «موجود نیست» یا فهرست برند/دسته نده، مگر اینکه در همین نوبت catalog_facets یا search_products رو صدا زده باشی. حافظه محصولات فقط چیزهایی هست که تا حالا نشون دادی، نه کل فروشگاه.
- «چه برندهایی داری؟ / همه‌شو لیست کن» → catalog_facets، ولی در متن فقط «اسم برندها» رو بگو؛ عدد و تعداد و بازه قیمت رو ننویس مگه کاربر خودش خواسته باشه
- «چند مدل دارید؟ / چندتا؟ / تعداد؟» → catalog_facets و این‌جا تعداد رو بگو
- تعداد کل و بازه قیمت فقط وقتی گفته میشه که کاربر درباره تعداد یا قیمت پرسیده باشه
- «X داری؟» یا «از برند X چی داری؟» → search_products با filters.brand = X (اسم برند رو هر شکلی که کاربر گفت بده؛ فارسی و انگلیسی هر دو کار می‌کنه)
- «از برند X در دسته Y چند مدل داری؟» → catalog_facets با subcategory = Y و تعداد همون برند رو از نتیجه بگو؛ عدد را از جستجو حدس نزن
- وقتی برند و دسته هر دو مشخصه، در search_products هم subcategory رو بده تا matched_total مربوط به همون دسته باشه؛ هرگز matched_totalِ بدون دسته رو به عنوان تعداد آن دسته نگو
- اگه نتیجه خالی بود، بعد می‌تونی بگی موجود نیست

کامل بودن پاسخ:
- عددها و شمارش‌ها (تعداد کل، matched_total، تعداد کاندیدا، بازه قیمت) فقط وقتی در متن گفته میشن که کاربر خودش درباره تعداد یا قیمت پرسیده باشه؛ در بقیه موارد هیچ عددی از این‌ها ننویس
- هیچ‌وقت از فرایند داخلی حرف نزن؛ جمله‌هایی مثل «از بین ۱۲ کاندیدا» یا «کلاً ۱۴۸۹ مدل پیدا کردم» ممنوعه
- برای درخواست‌های «همه / کلا / تمام»، limit رو ۱۲ تا ۲۴ بذار
- ویژگی‌هایی مثل «بی‌سیم، بلوتوث، گیمینگ، ایرانی» فیلد ساختاریافته ندارن؛ اون‌ها رو در evidence_terms بفرست (چند شکل نوشتاری: مثلا ["بی سیم","بلوتوث","وایرلس"])
- اگه اطلاعات یک ویژگی برای محصولی موجود نیست، بگو «مشخص نشده»، نگو «نداره»


دامنه سؤال (SCOPE در پایین، اگه بود):
- SHOWN_SET یعنی سؤال فقط درباره همون محصولاتی هست که نشون دادی → بدون جستجوی جدید از حافظه جواب بده
- CATALOG یا CATALOG_ALL یعنی سؤال درباره کل فروشگاهه → ابزار صدا بزن

هدف خرید (بخش «هدف خرید» پایین، اگه بود):
- هدف و کاربری کاربر بین دسته‌ها ادامه داره (مثلا گیمینگ → موس گیمینگ)
- بودجه فقط برای همون دسته‌ای که کاربر گفته اعمال میشه؛ به دسته بعدی منتقلش نکن
- اگه کاربر صریحاً هدف رو عوض کرد، هدف قبلی رو کنار بذار

پرسیدن سؤال (قانون قطعی):
- هیچ‌وقت سؤال‌هات رو به شکل متن یا لیست بولت‌دار در پاسخ ننویس. هر سؤالی که از کاربر داری فقط و فقط با ask_clarification پرسیده میشه (کارت تعاملی)
- درخواست‌های «راهنماییم کن / کمکم کن انتخاب کنم / نمی‌دونم چی بخرم / چی پیشنهاد می‌دی» یعنی کاربر هنوز نیازش رو نگفته → ask_clarification با steps (کاربری → بودجه → اولویت) و هر مرحله ۳ تا ۵ گزینه کوتاه
- اگه دو برداشت مختلف به محصولات کاملاً متفاوتی می‌رسه، ask_clarification (سؤال + گزینه‌ها)
- اگه فقط یک برداشت منطقیه، سؤال نپرس و جواب بده

نمایش محصول:
- هرگز شناسه (id/UUID) محصول رو در متن پاسخ ننویس؛ شناسه فقط در ابزارها و سیگنال‌ها استفاده میشه
- اگه داری محصولی از حافظه رو دوباره معرفی می‌کنی یا می‌فرستی، حتماً recall_products رو با شناسه‌هاش صدا بزن تا کارت محصول نمایش داده شه

انتخاب ابزار:
- محصول جدید لازمه (حتی وقتی مرجعش محصول قبلیه، مثل «برای این لپ‌تاپ چه هدفونی؟») → search_products با کلمات موضوع جدید
- سؤال شمارشی/فهرستی درباره کل فروشگاه → catalog_facets
- کاربر می‌خواد محصولی که قبلاً دیده رو دوباره ببینه یا بفرستی → recall_products با شناسه‌های همون محصولات
- جزئیات یک محصول → get_product_details
- افزودن/حذف/تغییر تعداد سبد → execute_cart_operations (می‌تونی product_id از حافظه بدی)
- ابهام واقعی یا هر سؤالی از کاربر → ask_clarification
- مقایسه یا سوال درباره اطلاعاتی که قبلاً گفتی → بدون ابزار جواب بده

زیرمجموعه‌های موجود در فروشگاه:
- هدفون، هدست و هندزفری
- دوربین دیجیتال
- ساعت و مچ‌بند هوشمند
- هارد اکسترنال
- لوازم جانبی گوشی موبایل
- گوشی موبایل
- لپ تاپ
- کیبورد و ماوس
- تبلت

سیگنال‌ها (اختیاری، در خط‌های آخر پاسخ، فقط وقتی مطمئنی):
REFERENCE_IDS:["id"]  محصولاتی که مرجع این درخواست بودن
LIKED_IDS:["id"]  محصولاتی که کاربر پسندید یا انتخاب کرد
REJECTED_IDS:["id"]  محصولاتی که کاربر رد کرد
GOAL:{"use_case":"","recipient":"","category":"","budget_max":0}  فقط فیلدهایی که کاربر واقعاً گفته`,
};


// ── Tool definitions ──
const SEARCH_TOOL = {
  type: "function",
  function: {
    name: "search_products",
    description: "Search product catalog. Extract structured intent from user query.",
    parameters: {
      type: "object",
      properties: {
        query_text: {
          type: "string",
          description: "Cleaned search keywords (max 2-3 core Persian words)",
        },
        subcategory: {
          type: "string",
          description: "Exact subcategory filter",
        },
        filters: {
          type: "object",
          properties: {
            price_min: { type: "number" },
            price_max: { type: "number" },
            brand: { type: "string" },
            features: { type: "array", items: { type: "string" } },
          },
        },
        semantic_tags: {
          type: "array",
          items: { type: "string" },
          description: "Abstract inferred intent: hard_to_lose, child_safe, budget, premium, etc.",
        },
        evidence_terms: {
          type: "array",
          items: { type: "string" },
          description: "Persian wording variants of an unstructured requirement (wireless, gaming, Iranian...). A product matches if ANY term appears in its name/description/tags.",
        },
        limit: {
          type: "number",
          description: "How many products to retrieve (default 20, max 60). Use 24 for comprehensive 'show me all' requests.",
        },
        offset: {
          type: "number",
          description: "Skip this many results — used for 'more results' paging.",
        },
        sort_by: {
          type: "string",
          enum: ["relevance", "price_low", "price_high", "rating"],
        },
      },
      required: ["query_text"],

      additionalProperties: false,
    },
  },
};

const DETAILS_TOOL = {
  type: "function",
  function: {
    name: "get_product_details",
    description: "Get full details of a specific product by its ID.",
    parameters: {
      type: "object",
      properties: {
        product_id: { type: "string", description: "The UUID of the product" },
      },
      required: ["product_id"],
      additionalProperties: false,
    },
  },
};

// ── Cart operations tool ──
const CART_OPERATIONS_TOOL = {
  type: "function",
  function: {
    name: "execute_cart_operations",
    description: "Execute one or more cart operations based on user request. Use product_index (1-based) to reference recommended products, product_id (UUID) to reference cart items.",
    parameters: {
      type: "object",
      properties: {
        actions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              type: {
                type: "string",
                enum: ["add", "remove", "update_quantity", "replace"],
              },
              product_index: {
                type: "number",
                description: "1-based index from recommended products list (for add operations)",
              },
              product_id: {
                type: "string",
                description: "UUID from cart items (for remove/update operations)",
              },
              remove_product_id: {
                type: "string",
                description: "UUID of cart item to remove (for replace operations)",
              },
              add_product_index: {
                type: "number",
                description: "1-based index of recommended product to add (for replace operations)",
              },
              quantity: {
                type: "number",
                description: "Quantity for add or update_quantity operations",
              },
            },
            required: ["type"],
          },
          description: "List of cart operations to execute",
        },
        message: {
          type: "string",
          description: "Persian confirmation message to show the user",
        },
        needs_clarification: {
          type: "boolean",
          description: "True if the request is ambiguous and needs user clarification",
        },
        clarification_options: {
          type: "array",
          items: { type: "string" },
          description: "Quick-reply options for disambiguation when needs_clarification is true",
        },
      },
      required: ["actions", "message", "needs_clarification"],
      additionalProperties: false,
    },
  },
};


const RECALL_TOOL = {
  type: "function",
  function: {
    name: "recall_products",
    description: "Re-show products the user has ALREADY seen in this conversation (from the product memory). Use for 'show those again', 'compare these', references to earlier groups.",
    parameters: {
      type: "object",
      properties: {
        product_ids: { type: "array", items: { type: "string" }, description: "IDs from the product memory" },
      },
      required: ["product_ids"],
      additionalProperties: false,
    },
  },
};

const FACETS_TOOL = {
  type: "function",
  function: {
    name: "catalog_facets",
    description: "Get the COMPLETE, exact list of brands with product counts (plus subcategory counts, total and price range) for a slice of the catalog. Use for 'which brands do you have', 'list them all', 'how many X do you have'. Never guess these numbers.",
    parameters: {
      type: "object",
      properties: {
        subcategory: { type: "string", description: "Exact subcategory, e.g. لپ تاپ" },
        query_text: { type: "string", description: "Free-text narrowing when there is no exact subcategory" },
        criterion: { type: "string", description: "Extra wording requirement, e.g. بی سیم" },
        include_counts: { type: "boolean", description: "true ONLY when the user asked about quantities/totals/price range. Otherwise names only." },
      },
      additionalProperties: false,
    },
  },
};

const CLARIFY_TOOL = {
  type: "function",
  function: {
    name: "ask_clarification",
    description: "Ask the user ONE or a few short structured questions when two readings of the request lead to materially different products. The question is rendered as an interactive card — do not repeat it in text.",
    parameters: {
      type: "object",
      properties: {
        question: { type: "string", description: "Persian question (single-step form)" },
        helper: { type: "string", description: "Optional short Persian helper line" },
        options: {
          type: "array",
          items: {
            type: "object",
            properties: {
              label: { type: "string" },
              hint: { type: "string" },
            },
            required: ["label"],
          },
          description: "Options for a single question",
        },
        steps: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              question: { type: "string" },
              options: {
                type: "array",
                items: {
                  type: "object",
                  properties: { label: { type: "string" }, hint: { type: "string" } },
                  required: ["label"],
                },
              },
            },
            required: ["title", "question", "options"],
          },
          description: "Use ONLY when several attributes are missing — renders a multi-step selector",
        },
      },
      additionalProperties: false,
    },
  },
};

// Mode → tools mapping
const MODE_TOOLS: Record<string, any[]> = {
  agentic: [SEARCH_TOOL, FACETS_TOOL, DETAILS_TOOL, RECALL_TOOL, CART_OPERATIONS_TOOL, CLARIFY_TOOL],
  discovery: [SEARCH_TOOL, FACETS_TOOL, DETAILS_TOOL],
  comparison: [],
  info_retrieval: [DETAILS_TOOL],
  conversational: [],
  cart_manipulation: [CART_OPERATIONS_TOOL],
};

// ── Generate query embedding ──
async function generateQueryEmbedding(text: string): Promise<number[] | null> {
  try {
    // @ts-ignore
    const session = new Supabase.ai.Session("gte-small");
    // @ts-ignore
    const embedding = await session.run(text, { mean_pool: true, normalize: true });
    return Array.from(embedding);
  } catch (e) {
    console.error("Query embedding error:", e);
    return null;
  }
}

// ── Execute tool calls ──
async function executeSearch(supabase: any, args: any, precomputedEmbedding: number[] | null): Promise<any> {
  const { query_text, subcategory, filters, sort_by, evidence_terms, limit, offset } = args;
  const normalizedQuery = normalizePersian(query_text || "");

  const rpcParams: any = { p_query: normalizedQuery, p_in_stock: true };
  if (precomputedEmbedding) rpcParams.p_embedding = JSON.stringify(precomputedEmbedding);
  if (subcategory) rpcParams.p_subcategory = subcategory;
  if (filters?.price_max) rpcParams.p_max_price = filters.price_max;
  if (filters?.price_min) rpcParams.p_min_price = filters.price_min;
  if (filters?.brand) rpcParams.p_brand = filters.brand;
  const terms = [
    ...(Array.isArray(evidence_terms) ? evidence_terms : []),
    ...(Array.isArray(filters?.features) ? filters.features : []),
  ].filter((t: any) => typeof t === "string" && t.trim()).slice(0, 8);
  if (terms.length > 0) rpcParams.p_evidence = terms;
  rpcParams.p_limit = Math.min(Math.max(Number(limit) || 20, 1), 60);
  if (Number(offset) > 0) rpcParams.p_offset = Math.floor(Number(offset));

  let { data, error } = await supabase.rpc("hybrid_product_search", rpcParams);

  // Evidence terms are a hard filter — if nothing matches, retry without them so we never
  // report "not available" just because the wording is missing from the text fields.
  if (!error && (!data || data.length === 0) && terms.length > 0) {
    delete rpcParams.p_evidence;
    const retry = await supabase.rpc("hybrid_product_search", rpcParams);
    if (!retry.error) {
      data = retry.data;
      if (data?.length) data = data.map((p: any) => ({ ...p, evidence_unconfirmed: true }));
    }
  }

  if (error) {
    console.error("Hybrid search error:", error);
    return { products: [], message: "جستجو با مشکل مواجه شد" };
  }

  let results = data || [];
  if (sort_by === "price_low") results.sort((a: any, b: any) => a.price - b.price);
  else if (sort_by === "price_high") results.sort((a: any, b: any) => b.price - a.price);
  else if (sort_by === "rating") results.sort((a: any, b: any) => b.rating - a.rating);

  const matchedTotal = results[0]?.matched_total ?? results.length;
  return {
    matched_total: matchedTotal,
    shown: results.length,
    evidence_unconfirmed: results[0]?.evidence_unconfirmed === true,
    products: results,
  };
}

async function executeFacets(supabase: any, args: any): Promise<any> {
  const { data, error } = await supabase.rpc("product_facets", {
    p_subcategory: args?.subcategory || null,
    p_criterion: args?.criterion || null,
    p_query: args?.query_text ? normalizePersian(args.query_text) : null,
    p_in_stock: true,
  });
  if (error) {
    console.error("Facets error:", error);
    return { error: "شمارش کاتالوگ با مشکل مواجه شد" };
  }
  // Counts / totals / price range are opt-in: a plain "list the brands" request
  // must not come back stuffed with numbers.
  if (args?.include_counts === true) return data;
  return {
    brands: (data?.brands || []).map((b: any) => b?.brand).filter(Boolean),
    subcategories: (data?.subcategories || []).map((s: any) => s?.subcategory).filter(Boolean),
    counts_hidden: true,
  };
}

// ── Visible-text hygiene ────────────────────────────────────────────────
const UUID_RE = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi;

/** Pulls machine signal lines (LABEL:[...] / LABEL:{...}) out of the model text. */
function extractSignals(raw: string): {
  text: string;
  referenceIds: string[];
  likedIds: string[];
  rejectedIds: string[];
  selectedIds: string[];
  goal: any;
} {
  let text = raw || "";
  const takeArray = (label: string): string[] => {
    const m = text.match(new RegExp(label + ":\\s*(\\[[\\s\\S]*?\\])"));
    if (!m) return [];
    text = text.replace(new RegExp("\\n?" + label + ":\\s*\\[[\\s\\S]*?\\]"), "").trim();
    try {
      const parsed = JSON.parse(m[1]);
      return Array.isArray(parsed) ? parsed.filter((v: any) => typeof v === "string") : [];
    } catch {
      return [];
    }
  };
  const selectedIds = takeArray("SELECTED_IDS");
  const referenceIds = takeArray("REFERENCE_IDS");
  const likedIds = takeArray("LIKED_IDS");
  const rejectedIds = takeArray("REJECTED_IDS");
  let goal: any = null;
  const goalMatch = text.match(/GOAL:\s*(\{[\s\S]*?\})/);
  if (goalMatch) {
    try { goal = JSON.parse(goalMatch[1]); } catch { goal = null; }
    text = text.replace(/\n?GOAL:\s*\{[\s\S]*?\}/, "").trim();
  }
  return { text, referenceIds, likedIds, rejectedIds, selectedIds, goal };
}

/** Final guard: no leftover signal lines, no raw ids in the chat bubble. */
/** Removes unrequested totals / candidate-count / internal-process sentences. */
function stripCountTalk(raw: string): string {
  const sentenceRe =
    /[^.!؟?\n]*(?:کاندیدا|از\s*بین\s*[\d۰-۹]+|کلاً?\s*[\d۰-۹,٬]+\s*(?:مدل|محصول|مورد)|[\d۰-۹,٬]+\s*(?:مدل|محصول|مورد)\s*(?:پیدا|موجود|هست|داریم|برات))[^.!؟?\n]*[.!؟?]?/g;
  return (raw || "")
    .split("\n")
    .map((line) => (/^\s*(?:[•\-*▪]|\d+[.)])/.test(line) ? line : line.replace(sentenceRe, "")))
    .join("\n")
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function sanitizeVisibleText(raw: string): string {

  let t = raw || "";
  t = t.replace(/^[ \t]*[A-Z][A-Z0-9_]{2,}\s*:\s*(\[[\s\S]*?\]|\{[\s\S]*?\})[ \t]*$/gm, "");
  t = t.replace(/[ \t]*[（(]\s*(?:شناسه|آیدی|کد محصول|id)\s*[:：]?\s*[0-9a-fA-F-]{8,}\s*[）)]/g, "");
  t = t.replace(UUID_RE, "");
  t = t.replace(/[ \t]*[（(]\s*[）)]/g, "");
  return t.replace(/[ \t]+$/gm, "").replace(/\n{3,}/g, "\n\n").trim();
}

/** Fetches full product rows for ids, preserving the given order. */
async function hydrateProducts(supabase: any, ids: string[]): Promise<any[]> {
  const unique = Array.from(new Set(ids.filter(Boolean))).slice(0, 12);
  if (unique.length === 0) return [];
  const { data } = await supabase.from("products").select("*").in("id", unique);
  return unique.map((id) => (data || []).find((p: any) => p.id === id)).filter(Boolean);
}

// Vague "help me choose" phrasings — these turns must ask through the card.
const GUIDANCE_RE =
  /(راهنمایی(م)?\s*کن|راهنماییم|کمکم?\s*کن.*(انتخاب|بخرم|بگیرم)|نمی\s*دونم\s*(چی|کدوم)|چی\s*(پیشنهاد|توصیه)|کدوم\s*(رو|را)?\s*(بخرم|بگیرم|پیشنهاد)|مشاوره|چی\s*بگیرم|چی\s*بخرم)/;

/** Did the user actually ask about quantities / totals / price range? */
const COUNT_QUESTION_RE =
  /(چند\s*(تا|مدل|عدد|نوع)|چندتا|تعداد|چقدر|قیمت(ش|شون)?\s*(چند|چقدر)|ارزون\s*ترین|گرون\s*ترین|بازه\s*قیمت|از\s*چند)/;

/**
 * Turns a reply that asked questions in plain text into a card.
 * Handles both a single question with bullet options and several question blocks.
 */
function extractQuestionCard(text: string): any | null {
  const lines = (text || "").split("\n").map((l) => l.trim());
  const bulletRe = /^(?:[•\-*▪]|\d+[.)])\s+(.{1,60})$/;
  type Block = { question: string; options: { label: string }[] };
  const blocks: Block[] = [];
  let current: Block | null = null;
  let lastQuestion = "";

  for (const line of lines) {
    if (!line) continue;
    const bullet = line.match(bulletRe);
    if (bullet) {
      const label = bullet[1].replace(/[؟?]\s*$/, "").trim();
      if (!label) continue;
      if (!current) {
        if (!lastQuestion) continue;
        current = { question: lastQuestion, options: [] };
        blocks.push(current);
      }
      current.options.push({ label });
      continue;
    }
    current = null;
    if (/[؟?]/.test(line)) lastQuestion = line.replace(/^[•\-*]\s*/, "").trim();
  }

  const usable = blocks.filter((b) => b.options.length >= 2);
  if (usable.length === 0) return null;

  if (usable.length === 1) {
    return {
      kind: "single",
      question: usable[0].question,
      helper: "",
      options: usable[0].options.slice(0, 6),
    };
  }
  return {
    kind: "steps",
    helper: "چند سؤال کوتاه تا دقیق‌ترین پیشنهاد رو برات پیدا کنم",
    steps: usable.slice(0, 4).map((b, i) => ({
      title: `سؤال ${i + 1}`,
      question: b.question,
      options: b.options.slice(0, 6),
    })),
  };
}

/** Text that is mostly questions → the model wrote a question list instead of a card. */
function isQuestionHeavy(text: string): boolean {
  const marks = (text.match(/[؟?]/g) || []).length;
  return marks >= 2;
}

/** Usage the user already stated — that guidance step is then skipped. */
const USAGE_HINTS: Array<[RegExp, string]> = [
  [/گیمینگ|بازی|گیمر/, "بازی و گیمینگ"],
  [/دانشجو|درس|تحصیل/, "دانشجویی و درسی"],
  [/طراحی|رندر|ادیت|مونتاژ|گرافیک/, "طراحی و کارهای سنگین"],
  [/برنامه\s*نویس|کدنویسی|دولوپ/, "برنامه‌نویسی"],
  [/اداری|روزمره|آفیس|کار\s*معمولی/, "کارهای روزمره و اداری"],
];

function detectUsage(text: string): string | null {
  const norm = normalizePersian(text || "");
  for (const [re, label] of USAGE_HINTS) if (re.test(norm)) return label;
  return null;
}


const DEFAULT_GUIDANCE_STEPS = (category: string, knownUsage?: string | null) => [
  ...(knownUsage ? [] : [{

    title: "کاربری",
    question: `${category ? category + " رو ' " : ""}برای چه کاری می‌خوای؟`.replace(" ' ", " "),
    options: [
      { label: "کارهای روزمره و اداری" },
      { label: "دانشجویی و درسی" },
      { label: "بازی و گیمینگ" },
      { label: "طراحی و کارهای سنگین" },
      { label: "برنامه‌نویسی" },
    ],
  }]),

  {
    title: "بودجه",
    question: "بودجه‌ات حدوداً چقدره؟",
    options: [
      { label: "تا ۳۰ میلیون تومان" },
      { label: "۳۰ تا ۵۰ میلیون تومان" },
      { label: "۵۰ تا ۸۰ میلیون تومان" },
      { label: "بالای ۸۰ میلیون تومان" },
      { label: "مهم نیست، بهترین رو نشونم بده" },
    ],
  },
  {
    title: "اولویت",
    question: "چه چیزی برات مهم‌تره؟",
    options: [
      { label: "قدرت و سرعت" },
      { label: "سبکی و حمل راحت" },
      { label: "کیفیت صفحه‌نمایش" },
      { label: "عمر باتری" },
      { label: "بهترین قیمت" },
    ],
  },
];




async function getProductDetails(supabase: any, productId: string): Promise<any> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .single();
  if (error) return { error: "محصول پیدا نشد" };
  return { product: data };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { messages: userMessages, mode = "discovery", products_context, cart_context, product_memory, memory_index, is_first_message = false, scope_hint, shopping_context, reference_hint } = await req.json();
    if (!userMessages || !Array.isArray(userMessages)) {
      return new Response(
        JSON.stringify({ error: "messages array required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const effectiveMode = mode in PROMPTS ? mode : "discovery";
    console.log(`Agent mode: ${effectiveMode}, is_first_message: ${is_first_message}`);

    // Build system prompt with greeting control
    let systemPrompt = PROMPTS[effectiveMode];
    if (!is_first_message) {
      systemPrompt = NO_GREETING + "\n\n" + systemPrompt;
    }

    // For comparison mode, inject product data
    if (effectiveMode === "comparison" && products_context) {
      const productsList = products_context.map((p: any, i: number) =>
        `محصول ${i + 1}: ${p.name}\n- قیمت: ${p.price?.toLocaleString()} تومان\n- برند: ${p.brand || "نامشخص"}\n- امتیاز: ${p.rating}\n- مشخصات: ${JSON.stringify(p.specs || {})}`
      ).join("\n\n");
      systemPrompt += `\n\nمحصولات برای مقایسه:\n${productsList}`;
    }

    // For cart_manipulation mode, inject cart + recommended products context
    if (effectiveMode === "cart_manipulation") {
      if (cart_context?.items?.length > 0) {
        const cartList = cart_context.items.map((item: any, i: number) =>
          `${i + 1}. [${item.id}] ${item.name} - ${item.price?.toLocaleString()} تومان × ${item.quantity}`
        ).join("\n");
        systemPrompt += `\n\nسبد خرید فعلی:\n${cartList}\nجمع: ${cart_context.total?.toLocaleString()} تومان`;
      } else {
        systemPrompt += `\n\nسبد خرید فعلی: خالی`;
      }
      if (products_context?.length > 0) {
        const recList = products_context.map((p: any, i: number) =>
          `${i + 1}. [${p.id}] ${p.name} - ${p.price?.toLocaleString()} تومان (${p.brand || "نامشخص"})`
        ).join("\n");
        systemPrompt += `\n\nمحصولات پیشنهادی اخیر:\n${recList}`;
      }
    }

    // ── Agentic mode: inject conversation working memory + cart ──
    if (effectiveMode === "agentic") {
      if (typeof product_memory === "string" && product_memory.trim()) {
        systemPrompt += `\n\nحافظه محصولات این گفتگو:\n${product_memory}`;
      } else {
        systemPrompt += `\n\nحافظه محصولات این گفتگو: خالی (هنوز محصولی نشون داده نشده)`;
      }
      if (cart_context?.items?.length > 0) {
        const cartList = cart_context.items.map((item: any, i: number) =>
          `${i + 1}. [${item.id}] ${item.name} - ${item.price?.toLocaleString()} تومان × ${item.quantity}`
        ).join("\n");
        systemPrompt += `\n\nسبد خرید فعلی:\n${cartList}\nجمع: ${cart_context.total?.toLocaleString()} تومان`;
      } else {
        systemPrompt += `\n\nسبد خرید فعلی: خالی`;
      }
      if (typeof shopping_context === "string" && shopping_context.trim()) {
        systemPrompt += `\n\nهدف خرید:\n${shopping_context.trim()}`;
      }
      if (typeof scope_hint === "string" && scope_hint.trim()) {
        systemPrompt += `\n\nSCOPE: ${scope_hint.trim()}`;
      }
      if (typeof reference_hint === "string" && reference_hint.trim()) {
        systemPrompt += `\n\nREFERENCE: ${reference_hint.trim()}`;
      }
    }

    // ── Deterministic guidance detection: "help me choose" turns must ask via card ──
    const lastUserText = String(userMessages[userMessages.length - 1]?.content || "");
    const normLastUser = normalizePersian(lastUserText);
    const wantsGuidance = GUIDANCE_RE.test(normLastUser);
    const wantsCounts = COUNT_QUESTION_RE.test(normLastUser);
    const knownUsage = detectUsage(lastUserText);
    const guidanceCategory = /لپ\s*تاپ/.test(normLastUser) ? "لپ‌تاپ" : "";
    if (wantsGuidance) {
      systemPrompt += `\n\nGUIDANCE_TURN: کاربر درخواست راهنمایی داده و نیازش کامل مشخص نیست. در این نوبت حتماً ask_clarification با steps صدا بزن و هیچ سؤالی رو در متن ننویس.${knownUsage ? ` کاربری رو خودش گفته («${knownUsage}») پس اون سؤال رو نپرس؛ از بودجه و اولویت شروع کن.` : " مراحل: کاربری → بودجه → اولویت."} هر مرحله ۳ تا ۵ گزینه کوتاه.`;
    }


    const aiMessages = [
      { role: "system", content: systemPrompt },
      ...userMessages.map((m: any) => ({ role: m.role, content: m.content })),
    ];

    const tools = MODE_TOOLS[effectiveMode] || [];

    // ── Start embedding generation in parallel for discovery mode ──
    const originalQuery = userMessages[userMessages.length - 1]?.content || "";
    let embeddingPromise: Promise<number[] | null> | null = null;
    if (effectiveMode === "discovery" || effectiveMode === "agentic") {
      embeddingPromise = generateQueryEmbedding(normalizePersian(originalQuery));
    }

    // ── Step 1: LLM call (with or without tools based on mode) ──
    console.log(`Step 1: ${effectiveMode} LLM call...`);
    const llmBody: any = {
      model: "google/gemini-2.5-flash",
      messages: aiMessages,
    };
    if (tools.length > 0) {
      llmBody.tools = tools;
    }

    const intentResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(llmBody),
    });

    if (!intentResponse.ok) {
      const status = intentResponse.status;
      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "سرعت درخواست‌ها زیاد شده، لطفاً کمی صبر کنید." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: "اعتبار سرویس هوش مصنوعی تمام شده." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await intentResponse.text();
      console.error("AI gateway error:", status, errText);
      return new Response(
        JSON.stringify({ error: "خطا در سرویس هوش مصنوعی" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const intentData = await intentResponse.json();
    const choice = intentData.choices?.[0];

    if (!choice) {
      return new Response(
        JSON.stringify({ content: "متوجه نشدم. می‌تونی دوباره بگی؟", products: [], quickReplies: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── No tool call = direct response (still sanitized + card-hydrated) ──
    if (!choice.message?.tool_calls || choice.message.tool_calls.length === 0) {
      const rawText = choice.message?.content || "متوجه نشدم. می‌تونی دوباره بگی؟";
      const sig = extractSignals(rawText);
      const mentionedIds = [
        ...((sig.text.match(UUID_RE) || []) as string[]),
        ...sig.likedIds,
        ...sig.selectedIds,
      ];
      const hydrated = await hydrateProducts(supabase, mentionedIds);
      const visible = sanitizeVisibleText(sig.text);

      // Safety net: questions written as text become a tappable card on any turn.
      if (hydrated.length === 0) {
        const parsed = extractQuestionCard(visible);
        const card =
          parsed ||
          (wantsGuidance && isQuestionHeavy(visible)
            ? {
                kind: "steps",
                helper: "چند سؤال کوتاه تا دقیق‌ترین پیشنهاد رو برات پیدا کنم",
                steps: DEFAULT_GUIDANCE_STEPS(guidanceCategory, knownUsage),
              }
            : null);
        if (card) {
          return new Response(
            JSON.stringify({ content: "", products: [], quickReplies: [], clarification: card }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      // A guidance turn must never end on the generic fallback line.
      if (wantsGuidance && hydrated.length === 0 && !visible) {
        return new Response(
          JSON.stringify({
            content: "",
            products: [],
            quickReplies: [],
            clarification: {
              kind: "steps",
              helper: "چند سؤال کوتاه تا دقیق‌ترین پیشنهاد رو برات پیدا کنم",
              steps: DEFAULT_GUIDANCE_STEPS(guidanceCategory, knownUsage),
            },
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }


      return new Response(
        JSON.stringify({
          content: visible || "متوجه نشدم. می‌تونی دوباره بگی؟",
          products: hydrated,
          reference_product_ids: sig.referenceIds,
          liked_product_ids: sig.likedIds,
          rejected_product_ids: sig.rejectedIds,
          goal: sig.goal,
          quickReplies: [],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Clarification tool call → return structured question (no second model call) ──
    const clarifyToolCall = choice.message.tool_calls.find(
      (t: any) => t.function?.name === "ask_clarification"
    );
    if (clarifyToolCall) {
      let payload: any = {};
      try { payload = JSON.parse(clarifyToolCall.function.arguments); } catch { payload = {}; }
      const normOptions = (arr: any) =>
        (Array.isArray(arr) ? arr : [])
          .map((o: any) => (typeof o === "string" ? { label: o } : { label: o?.label, hint: o?.hint }))
          .filter((o: any) => typeof o.label === "string" && o.label.trim());
      const steps = (Array.isArray(payload.steps) ? payload.steps : [])
        .map((s: any) => ({ title: s?.title || "", question: s?.question || "", options: normOptions(s?.options) }))
        .filter((s: any) => s.question && s.options.length > 0);
      const options = normOptions(payload.options);
      if (steps.length > 0 || options.length > 0) {
        return new Response(
          JSON.stringify({
            content: "",
            products: [],
            quickReplies: [],
            clarification: steps.length > 0
              ? { kind: "steps", helper: payload.helper || "", steps }
              : { kind: "single", question: payload.question || "", helper: payload.helper || "", options },
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      // Empty/invalid card payload on a guidance turn → use the built-in card.
      if (wantsGuidance) {
        return new Response(
          JSON.stringify({
            content: "",
            products: [],
            quickReplies: [],
            clarification: {
              kind: "steps",
              helper: "چند سؤال کوتاه تا دقیق‌ترین پیشنهاد رو برات پیدا کنم",
              steps: DEFAULT_GUIDANCE_STEPS(guidanceCategory, knownUsage),
            },
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }


    // ── Cart operations tool call → return structured actions ──

    const cartToolCall = choice.message.tool_calls.find(
      (t: any) => t.function?.name === "execute_cart_operations"
    );
    if (effectiveMode === "cart_manipulation" || cartToolCall) {
      const toolCall = cartToolCall || choice.message.tool_calls[0];
      let cartResult: any;
      try {
        cartResult = JSON.parse(toolCall.function.arguments);
      } catch {
        cartResult = { actions: [], message: "متوجه نشدم. دوباره بگو.", needs_clarification: false };
      }
      console.log("Cart manipulation result:", JSON.stringify(cartResult));
      return new Response(
        JSON.stringify({
          cart_actions: cartResult.actions || [],
          content: sanitizeVisibleText(cartResult.message || "") || "عملیات انجام شد.",
          needs_clarification: cartResult.needs_clarification || false,
          clarification_options: cartResult.clarification_options || [],
          products: [],
          quickReplies: [],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Step 2: Execute tool calls + get embedding result ──
    console.log("Step 2: Hybrid retrieval...");
    const precomputedEmbedding = embeddingPromise ? await embeddingPromise : null;
    const toolResults: any[] = [];
    let allProducts: any[] = [];
    let extractedIntent: any = null;

    for (const toolCall of choice.message.tool_calls) {
      const funcName = toolCall.function.name;
      let funcArgs: any;
      try {
        funcArgs = JSON.parse(toolCall.function.arguments);
      } catch {
        funcArgs = {};
      }

      console.log(`Tool: ${funcName}`, JSON.stringify(funcArgs));

      let result: any;
      if (funcName === "search_products") {
        extractedIntent = funcArgs;
        const searched = await executeSearch(supabase, funcArgs, precomputedEmbedding);
        if (searched.products) allProducts = [...allProducts, ...searched.products];
        // Compact tool payload — full product rows never go into the prompt.
        result = {
          matched_total: searched.matched_total ?? 0,
          shown: searched.shown ?? 0,
          evidence_unconfirmed: searched.evidence_unconfirmed || false,
          products: (searched.products || []).map((p: any) => ({
            id: p.id, name: p.name, price: p.price, brand: p.brand, rating: p.rating,
          })),
        };
      } else if (funcName === "catalog_facets") {
        result = await executeFacets(supabase, funcArgs);
      } else if (funcName === "recall_products") {
        const ids: string[] = Array.isArray(funcArgs.product_ids) ? funcArgs.product_ids.slice(0, 12) : [];
        if (ids.length > 0) {
          const { data: recalled } = await supabase.from("products").select("*").in("id", ids);
          const ordered = ids.map((id) => (recalled || []).find((p: any) => p.id === id)).filter(Boolean);
          allProducts = [...allProducts, ...ordered];
          result = { products: ordered.map((p: any) => ({ id: p.id, name: p.name, price: p.price })) };
        } else {
          result = { products: [] };
        }
      } else if (funcName === "get_product_details") {
        result = await getProductDetails(supabase, funcArgs.product_id);
      } else {
        result = { error: "Unknown tool" };
      }

      toolResults.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(result),
      });
    }

    // ── Step 3: Single follow-up LLM call for response generation + re-ranking ──
    console.log("Step 3: Response generation...");
    const requestedLimit = Number(extractedIntent?.limit) || 0;
    const comprehensive = requestedLimit >= 12;
    const maxShown = comprehensive ? 12 : 6;
    const candidatesForRerank = allProducts.slice(0, comprehensive ? 24 : 12);
    const candidateList = candidatesForRerank.map((p: any, i: number) =>
      `${i + 1}. [${p.id}] ${p.name} — ${p.price?.toLocaleString()} تومان${p.brand ? ` — ${p.brand}` : ""}`
    ).join("\n");

    const rerankerInstruction = candidatesForRerank.length > 0
      ? `\n\nبا توجه به درخواست اصلی کاربر ("${originalQuery}")${extractedIntent?.semantic_tags?.length ? ` و تگ‌های معنایی استخراج‌شده (${extractedIntent.semantic_tags.join(", ")})` : ""}:
- محصولاتی که با نیت کاربر مطابقت ندارن رو حذف کن
- بهترین ۳ تا ${comprehensive ? "۱۲" : "۶"} محصول رو انتخاب کن
- ساختار پاسخ دقیقاً این‌طوریه: برای هر محصول یک خط شماره‌دار با نام و مشخصات کلیدی و قیمت، و بعدش در یک خط جدا یک جمله کوتاه که می‌گه چرا همین محصول برای درخواست کاربر مناسبه. بین محصولات یک خط خالی بذار
- توضیح «چرا» باید مخصوص همون محصول باشه (پردازنده، رم، گرافیک، وزن، صفحه‌نمایش، قیمت) نه جمله کلی تکراری
${wantsCounts ? "- کاربر درباره تعداد/قیمت پرسیده؛ می‌تونی تعداد کل مطابق را بگی" : "- هیچ عددی از تعداد کل، تعداد کاندیدا یا بازه قیمت ننویس و درباره فرایند داخلی حرف نزن"}
- بدون مارک‌داون (بدون ستاره و هشتگ)


لیست کاندیداها:
${candidateList}

مهم: در انتهای پاسخت، در یک خط جدید، دقیقاً بنویس:
SELECTED_IDS:["id1","id2","id3"]
که id ها همان شناسه‌های محصولات انتخابی تو هستن. ترتیب id ها باید با ترتیب معرفی محصولات در متنت یکی باشه.`
      : "";


    const followUpMessages = [
      ...aiMessages,
      choice.message,
      ...toolResults,
      ...(rerankerInstruction ? [{ role: "system", content: rerankerInstruction }] : []),
    ];

    const followUpResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: followUpMessages,
      }),
    });

    if (!followUpResponse.ok) {
      const errText = await followUpResponse.text();
      console.error("Re-ranker error:", followUpResponse.status, errText);
      return new Response(
        JSON.stringify({
          content: allProducts.length > 0
            ? "این محصولات رو برات پیدا کردم:"
            : "متأسفانه محصولی پیدا نکردم. می‌خوای یه جستجوی دیگه انجام بدم؟",
          products: allProducts.slice(0, 6),
          quickReplies: [],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const followUpData = await followUpResponse.json();
    const rawFinal = followUpData.choices?.[0]?.message?.content || "محصولات رو ببین:";

    // ── One shared pass: pull every machine signal out of the visible text ──
    const sig = extractSignals(rawFinal);
    let finalContent = sig.text;
    const referenceIds = sig.referenceIds;
    const likedIds = sig.likedIds;
    const rejectedIds = sig.rejectedIds;
    const goalSignal = sig.goal;

    let selectedProducts = allProducts.slice(0, maxShown);
    if (sig.selectedIds.length > 0) {
      const idToProduct = new Map(allProducts.map((p: any) => [p.id, p]));
      const reordered = sig.selectedIds.map((id: string) => idToProduct.get(id)).filter(Boolean);
      if (reordered.length > 0) selectedProducts = reordered;
      console.log(`Re-ranker selected ${reordered.length} products`);
    }

    // Products named from memory (ids cited in the text) still get their cards.
    if (selectedProducts.length === 0) {
      const mentionedIds = [
        ...((finalContent.match(UUID_RE) || []) as string[]),
        ...likedIds,
      ];
      selectedProducts = await hydrateProducts(supabase, mentionedIds);
    }

    finalContent = sanitizeVisibleText(finalContent);
    if (!wantsCounts) finalContent = stripCountTalk(finalContent);


    if (selectedProducts.length > maxShown) selectedProducts = selectedProducts.slice(0, maxShown);

    return new Response(
      JSON.stringify({
        content: finalContent,
        products: selectedProducts,
        reference_product_ids: referenceIds,
        liked_product_ids: likedIds,
        rejected_product_ids: rejectedIds,
        goal: goalSignal,

        quickReplies: selectedProducts.length > 0
          ? [{ id: "more", label: "🔍 نتایج بیشتر", type: "custom", action: "more_results" }]
          : [],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Agent error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
