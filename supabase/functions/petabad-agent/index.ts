import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Fixed single-store id for the PetAbad catalog RPCs.
const PETABAD_STORE_ID = "00000000-0000-0000-0000-000000000000";

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
  discovery: `تو دستیار خرید هوشمند پت‌آباد هستی. یک پت‌شاپ آنلاین پت‌آباد.

وظایف تو:
- کمک به کاربران برای پیدا کردن محصولات مورد نظرشون برای حیوان خانگیشون
- پاسخ‌دهی به سوالات درباره محصولات
- پیشنهاد محصولات بر اساس نیاز کاربر و نوع حیوان خانگی

قوانین مهم:
- همیشه فارسی صحبت کن
- لحن صمیمی و دوستانه داشته باش
- پاسخ‌ها رو بدون فرمت مارک‌داون بنویس. از ستاره، هشتگ، و علائم مارک‌داون استفاده نکن. متن ساده بنویس.
- قیمت‌ها به تومان هستن

وقتی کاربر دنبال محصولی می‌گرده، حتماً از ابزار search_products استفاده کن.

نکات مهم برای استخراج نیت:
- query_text باید حداکثر ۲-۳ کلمه اصلی فارسی باشه (نه جمله کامل)
- نیازهای ضمنی کاربر رو به semantic_tags تبدیل کن
- مثال: "برای توله سگ" → semantic_tags: ["puppy"]
- مثال: "حساسیت داره" → semantic_tags: ["sensitive_stomach"]
- مثال: "برای گربه پیر" → semantic_tags: ["senior_cat"]
- مهم: هرگز price_min یا price_max رو حدس نزن. فقط وقتی مقدار عددی مشخصی رو ست کن که کاربر عدد دقیق گفته باشه.

زیرمجموعه‌های موجود در پت‌شاپ:
- غذای سگ
- غذای گربه
- تشویقی و بیسکویت
- اسباب‌بازی حیوانات
- بهداشت و مراقبت
- قفس و لانه
- آکواریوم و ماهی
- پرنده و لوازم پرنده
- دارو و مکمل

اگه کاربر سوال عمومی پرسید (مثل سلام)، جواب بده و بگو چطور می‌تونی کمکش کنی. از ابزار استفاده نکن.

نکته مهم درباره پاسخ بعد از جستجو:
- بعد از دریافت نتایج جستجو، بهترین ۳ تا ۶ محصول رو انتخاب کن که بیشترین ارتباط با درخواست کاربر دارن
- محصولاتی که با نیت کاربر مطابقت ندارن رو حذف کن
- یه توضیح کوتاه و مفید بنویس
- در انتهای پاسخت، در یک خط جدید، دقیقاً بنویس:
SELECTED_IDS:["id1","id2","id3"]
که id ها همان شناسه‌های محصولات انتخابی تو هستن. ترتیب id ها باید با ترتیب معرفی محصولات در متنت یکی باشه.`,

  comparison: `تو متخصص مقایسه محصولات در پت‌آباد هستی.

وظیفه تو: مقایسه دقیق و ساختارمند محصولات بر اساس مشخصات فنی‌شون.

قوانین:
- فارسی صحبت کن
- بدون مارک‌داون بنویس - متن ساده
- روی تفاوت‌های کلیدی تمرکز کن
- مزایا و معایب هر کدوم رو بگو
- در نهایت پیشنهادت رو بده
- قیمت‌ها به تومان هستن`,

  info_retrieval: `تو دستیار اطلاعاتی پت‌آباد هستی.

وظیفه تو: پاسخ دقیق و مختصر به سوالات کاربر درباره محصولات، سفارش‌ها، ارسال، و سیاست‌های پت‌شاپ.

سیاست‌های پت‌شاپ:
- ارسال رایگان برای سفارش‌های بالای ۵۰۰ هزار تومان
- ضمانت بازگشت ۷ روزه
- ارسال سریع ۱-۳ روز کاری
- پشتیبانی ۲۴/۷

قوانین:
- فارسی صحبت کن
- بدون مارک‌داون - متن ساده
- مختصر و دقیق باش`,

  conversational: `تو دستیار خرید دوستانه پت‌آباد هستی.

قوانین:
- فارسی صحبت کن
- لحن صمیمی و گرم داشته باش
- بدون مارک‌داون - متن ساده
- اگه تشکر کرد، خواهش کن و بگو اگه کمکی نیاز داشت در خدمتشی
- اگه سوالی درباره قابلیت‌هات داشت، توضیح بده می‌تونی محصول جستجو کنی، مقایسه کنی، و کمک به خرید کنی`,

  cart_manipulation: `تو دستیار مدیریت سبد خرید پت‌آباد هستی.

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

  agentic: `تو دستیار خرید هوشمند پت‌آباد هستی؛ مثل یک فروشنده حرفه‌ای که کل گفتگو رو دنبال می‌کنه.

قوانین کلی:
- همیشه فارسی، لحن صمیمی، بدون مارک‌داون (بدون ستاره و هشتگ)
- قیمت‌ها به تومان
- هرگز price_min یا price_max رو حدس نزن؛ فقط وقتی کاربر عدد گفته
- اگر کاربر یکی از گزینه‌های بودجه کارت را انتخاب کرد، همون اعداد را به تومان تبدیل کن و در price_min/price_max بگذار (۱ میلیون = 1000000). این حدس نیست، انتخاب خود کاربره
- اگر بودجه‌ی گفته‌شده از ارزان‌ترین محصول موجود کمتره، صادقانه بگو از چه قیمتی شروع می‌شه و نزدیک‌ترین گزینه‌ها را نشون بده

حافظه گفتگو (بخش «حافظه محصولات» پایین):
- تمام محصولاتی که تا حالا نشون داده شدی، با شماره و شناسه، در حافظه هستن
- گروه‌های قبلی هیچ‌وقت پاک نمی‌شن؛ کاربر می‌تونه بعداً به هر گروهی برگرده

تشخیص موضوع و مرجع (مهم‌ترین بخش):
- هر پیام جدید یک «موضوع درخواست» داره و ممکنه یک «مرجع» هم داشته باشه
- «برای این / با این / مناسب این» یعنی محصول قبلی فقط مرجع است، جواب باید محصول جدید باشه
  مثال: «برای این سگ چه غذایی خوبه؟» → جستجو برای غذای سگ
- «این / اینا / همین‌ها / اونایی که گفتی» به آخرین گروه یا محصول در تمرکز اشاره می‌کنه
- «اولی‌ها / همون‌هایی که اول گفتی» به گروه‌های قدیمی‌تر اشاره می‌کنه
- وقتی کاربر موضوع رو عوض کرد، فقط موضوع جدید رو جواب بده و محصولات قبلی رو دوباره نشون نده
- محصولاتی که کاربر رد کرده رو دوباره به‌عنوان پیشنهاد اصلی نیار

قانون حیاتی: هرگز اسم، مدل یا قیمت محصولی رو از خودت نساز. هر محصولی که معرفی می‌کنی باید یا از نتیجه search_products / recall_products باشه یا در حافظه محصولات باشه. اگه قراره محصول جدیدی پیشنهاد بدی، حتماً و بدون استثنا اول search_products رو صدا بزن.

قانون حیاتی دوم (ادعا درباره موجودی): هیچ‌وقت نگو «نداریم» یا «موجود نیست» یا فهرست برند/دسته نده، مگر اینکه در همین نوبت catalog_facets یا search_products رو صدا زده باشی. حافظه محصولات فقط چیزهایی هست که تا حالا نشون دادی، نه کل فروشگاه.
- «چه برندهایی داری؟ / همه‌شو لیست کن» → catalog_facets، ولی در متن فقط «اسم برندها» رو بگو؛ عدد و تعداد و بازه قیمت رو ننویس مگه کاربر خودش خواسته باشه
- «چند مدل دارید؟ / چندتا؟ / تعداد؟» → catalog_facets و این‌جا تعداد رو بگو
- تعداد کل و بازه قیمت فقط وقتی گفته میشه که کاربر درباره تعداد یا قیمت پرسیده باشه
- «X داری؟» یا «از برند X چی داری؟» → search_products با filters.brand = X
- «از برند X در دسته Y چند مدل داری؟» → catalog_facets با subcategory = Y و تعداد همون برند رو از نتیجه بگو؛ عدد را از جستجو حدس نزن
- وقتی برند و دسته هر دو مشخصه، در search_products هم subcategory رو بده تا matched_total مربوط به همون دسته باشه
- اگه نتیجه خالی بود، بعد می‌تونی بگی موجود نیست

کامل بودن پاسخ:
- عددها و شمارش‌ها (تعداد کل، matched_total، تعداد کاندیدا، بازه قیمت) فقط وقتی در متن گفته میشن که کاربر خودش درباره تعداد یا قیمت پرسیده باشه؛ در بقیه موارد هیچ عددی از این‌ها ننویس
- هیچ‌وقت از فرایند داخلی حرف نزن؛ جمله‌هایی مثل «از بین ۱۲ کاندیدا» یا «کلاً ۱۴۸۹ مدل پیدا کردم» ممنوعه
- برای درخواست‌های «همه / کلا / تمام»، limit رو ۱۲ تا ۲۴ بذار
- ویژگی‌هایی که فیلد ساختاریافته ندارن (مثلا بی‌بو، ارگانیک، ضدحساسیت) رو در evidence_terms بفرست (چند شکل نوشتاری)
- اگه اطلاعات یک ویژگی برای محصولی موجود نیست، بگو «مشخص نشده»، نگو «نداره»

دامنه سؤال (SCOPE در پایین، اگه بود):
- SHOWN_SET یعنی سؤال فقط درباره همون محصولاتی هست که نشون دادی → بدون جستجوی جدید از حافظه جواب بده
- CATALOG یا CATALOG_ALL یعنی سؤال درباره کل فروشگاهه → ابزار صدا بزن

هدف خرید (بخش «هدف خرید» پایین، اگه بود):
- هدف و نوع حیوان خانگی کاربر بین دسته‌ها ادامه داره (مثلا سگ نژاد بزرگ → غذای سگ نژاد بزرگ)
- بودجه فقط برای همون دسته‌ای که کاربر گفته اعمال میشه؛ به دسته بعدی منتقلش نکن
- اگه کاربر صریحاً هدف رو عوض کرد، هدف قبلی رو کنار بذار

پرسیدن سؤال (قانون قطعی):
- هیچ‌وقت سؤال‌هات رو به شکل متن یا لیست بولت‌دار در پاسخ ننویس. هر سؤالی که از کاربر داری فقط و فقط با ask_clarification پرسیده میشه (کارت تعاملی)
- درخواست‌های «راهنماییم کن / کمکم کن انتخاب کنم / نمی‌دونم چی بخرم / چی پیشنهاد می‌دی» یعنی کاربر هنوز نیازش رو نگفته → ask_clarification با steps (نوع حیوان → نیازها → بودجه) و هر مرحله ۳ تا ۵ گزینه کوتاه
- هر چیزی که کاربر خودش گفته (مثل نوع حیوان: گربه/سگ) رو دوباره نپرس؛ اون مرحله رو حذف کن
- مرحله‌ای که کاربر می‌تونه چند جواب داشته باشه (مثل «چه چیزهایی لازم داری» یا نیازها/دسته‌ها) رو با multi: true بفرست تا کاربر چندتایی انتخاب کنه
- اگه کاربر چند دسته انتخاب کرد (مثل غذا + بهداشت + اسباب‌بازی) برای هر دسته جداگانه جست‌وجو کن و یک سبد چنددسته‌ای پیشنهاد بده، نه فقط یک دسته
- اگه دو برداشت مختلف به محصولات کاملاً متفاوتی می‌رسه، ask_clarification (سؤال + گزینه‌ها)
- اگه فقط یک برداشت منطقیه، سؤال نپرس و جواب بده

نمایش محصول:
- هرگز شناسه (id/UUID) محصول رو در متن پاسخ ننویس؛ شناسه فقط در ابزارها و سیگنال‌ها استفاده میشه
- اگه داری محصولی از حافظه رو دوباره معرفی می‌کنی یا می‌فرستی، حتماً recall_products رو با شناسه‌هاش صدا بزن تا کارت محصول نمایش داده شه

انتخاب ابزار:
- محصول جدید لازمه (حتی وقتی مرجعش محصول قبلیه) → search_products با کلمات موضوع جدید
- سؤال شمارشی/فهرستی درباره کل فروشگاه → catalog_facets
- کاربر می‌خواد محصولی که قبلاً دیده رو دوباره ببینه یا بفرستی → recall_products با شناسه‌های همون محصولات
- جزئیات یک محصول → get_product_details
- افزودن/حذف/تغییر تعداد سبد → execute_cart_operations (می‌تونی product_id از حافظه بدی)
- ابهام واقعی یا هر سؤالی از کاربر → ask_clarification
- مقایسه یا سوال درباره اطلاعاتی که قبلاً گفتی → بدون ابزار جواب بده

زیرمجموعه‌های موجود در پت‌شاپ:
- غذای سگ
- غذای گربه
- تشویقی و بیسکویت
- اسباب‌بازی حیوانات
- بهداشت و مراقبت
- قفس و لانه
- آکواریوم و ماهی
- پرنده و لوازم پرنده
- دارو و مکمل

قوانین حیاتی جستجو و موجودی:
- قفسه‌های کاتالوگ برندی‌اند (مثل «غذای خشک گربه جوسرا»). پس همیشه subcategory_family بده (مثل «غذای خشک گربه») نه یک قفسه دقیق، تا محصولات همه برندها دیده بشن.
- اگه کاربر برند گفت، حتماً filters.brand رو پر کن. اگه اسم یک خط محصول یا مدل گفت (کتلوکس، Catelux، گلدن رتریور)، filters.product_line رو پر کن.
- اگه کشور سازنده خواست (آلمانی، ایرانی، فرانسوی)، filters.origin_country رو پر کن؛ فیلتر کشور سازنده وجود داره و هرگز نگو ممکن نیست.
- سن/مرحله زندگی و اندازه نژاد رو با filters.life_stage و filters.breed_size بده. نژاد رو در breed بنویس (گلدن رتریور = نژاد بزرگ).
- نیازهای سلامتی (پوست و مو، گوارش حساس، کلیه، عقیم شده، کنترل وزن...) رو در filters.needs بده.
- هرگز نگو «نداریم» مگه وقتی یک جستجوی دقیق با همون برند/خط محصول/کشور (بدون فیلترهای اضافه) صفر نتیجه برگردونده باشه. اگه شک داری، دوباره با filters دقیق‌تر جستجو کن.
- برای فهرست برندها، کشورها یا معرفی برند، همیشه catalog_facets صدا بزن؛ هرگز از حافظه‌ی خودت اسم برند نساز.
- معرفی برند = کشور سازنده و جایگاه برند + واقعیت‌های پت‌آباد (قفسه‌ها، خط‌های محصول، بازه قیمت) از catalog_facets.
- چیزی که کاربر قبلاً گفته (حیوان، نژاد، سن، نیاز، بودجه، برند) رو دوباره نپرس؛ سؤال بعدی باید بعد سؤال‌نشده رو بپرسه.
- در پیشنهادها تنوع بده؛ چند وزن یا چند سایز از یک خط محصول رو به‌جای گزینه‌های متفاوت نفرست.

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
    description: "Search the pet product catalog. Extract structured intent from user query.",
    parameters: {
      type: "object",
      properties: {
        query_text: {
          type: "string",
          description: "Cleaned search keywords (max 2-3 core Persian words)",
        },
        subcategory: {
          type: "string",
          description:
            "Exact subcategory from the catalog. Only use one of these exact values (leave empty if none fits): کنسرو و پوچ و غذای تر گربه | تشویقی سگ | تشویقی و بستنی گربه | کنسرو و پوچ و غذای تر سگ | غذای خشک گربه | غذای خشک سگ | اسباب بازی گربه | قلاده سگ | اسباب بازی پرندگان | شامپو و نرم کننده سگ | درخت گربه نیناپت | غذای خشک گربه رویال کنین | غذای خشک سگ رویال کنین | تشک و تخت سگ | انواع اسپری و فوم گربه | غذای خشک گربه جوسرا | مکمل های پرندگان | اسباب بازی سگ | شامپو و نرم کننده گربه | اسکرچر و درخت گربه | ظرف آب و غذا سگ | غذای خشک گربه رفلکس | غذای خشک گربه فیدار | غذای خرگوش | مکمل و ویتامین گربه | غذای خشک گربه سلبن | انواع اسپری و فوم سگ | خمیر مالت گربه | باکس حمل و نقل سگ | انواع قطره سگ | جای خواب (تخت و تشک) گربه | ظرف آب و غذا گربه | خاک گربه",
        },

        subcategory_family: {
          type: "string",
          description:
            "PREFERRED over subcategory. Shelf FAMILY prefix — matches every shelf that starts with it, including the brand-specific ones. Examples: غذای خشک گربه (also covers غذای خشک گربه جوسرا / رویال کنین / رفلکس ...), غذای خشک سگ, کنسرو و پوچ و غذای تر گربه, اسباب بازی سگ, شامپو و نرم کننده گربه. Use subcategory ONLY when the user named one exact brand shelf.",
        },
        species: {
          type: "string",
          description: "Target pet species/animal, e.g. سگ، گربه، پرنده، ماهی",
        },
        breed: {
          type: "string",
          description: "Breed the user named, e.g. گلدن رتریور، پامرانیان، پرشین. Used to infer breed size.",
        },
        filters: {
          type: "object",
          properties: {
            price_min: { type: "number" },
            price_max: { type: "number" },
            brand: { type: "string", description: "Brand name in Persian or Latin, e.g. جوسرا / Josera" },
            product_line: { type: "string", description: "Product line / exact model wording, e.g. Catelux، کتلوکس، Golden Retriever" },
            origin_country: { type: "string", description: "Manufacturing country in Persian, e.g. آلمان، ایران، فرانسه" },
            life_stage: { type: "string", enum: ["نابالغ", "بالغ", "سنیور"], description: "نابالغ = puppy/kitten, بالغ = adult, سنیور = senior" },
            breed_size: { type: "string", enum: ["کوچک", "متوسط", "بزرگ"] },
            needs: {
              type: "array",
              items: { type: "string", enum: ["پوست و مو", "گوارش حساس", "کلیه و مجاری ادرار", "عقیم شده", "کنترل وزن", "ضد حساسیت", "گلوله مویی", "داخل خانه", "درمانی", "سلامت دندان", "مفاصل"] },
              description: "Structured health needs the user stated",
            },
            features: { type: "array", items: { type: "string" } },
          },
        },
        semantic_tags: {
          type: "array",
          items: { type: "string" },
          description: "Abstract inferred intent: puppy, senior_cat, sensitive_stomach, budget, premium, etc.",
        },
        evidence_terms: {
          type: "array",
          items: { type: "string" },
          description: "Persian wording variants of an unstructured requirement (organic, hypoallergenic, grain-free...). A product matches if ANY term appears in its name/description/tags.",
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
    description: "Get the COMPLETE, exact catalog facts for a slice of the catalog: brands, manufacturing countries, brands per country, life stages, breed sizes, health needs, shelves, species (plus totals and price range). Use for 'which brands do you have', 'which German/Iranian brands', 'list them all', brand profiles, and any listing/counting question. Never guess these lists or numbers.",
    parameters: {
      type: "object",
      properties: {
        subcategory: { type: "string", description: "Exact subcategory, e.g. غذای خشک سگ، کنسرو و پوچ و غذای تر گربه" },
        species: { type: "string", description: "Exact species filter, e.g. سگ" },
        subcategory_family: { type: "string", description: "Shelf family prefix, e.g. غذای خشک گربه — covers brand-specific shelves too" },
        brand: { type: "string", description: "Restrict to one brand, e.g. جوسرا" },
        origin_country: { type: "string", description: "Restrict to one manufacturing country, e.g. آلمان" },
        query_text: { type: "string", description: "Free-text narrowing when there is no exact subcategory" },
        criterion: { type: "string", description: "Extra wording requirement, e.g. ارگانیک" },
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
        multi: { type: "boolean", description: "true when the user may pick several options at once" },
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
              multi: { type: "boolean", description: "true when the user may pick several options in this step (e.g. needed categories)" },
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
// Breed → breed size (and default life stage) mapping. Category-agnostic fallback: unknown breeds are ignored.
const BREED_SIZE: Array<[RegExp, string]> = [
  [/گلدن|رتریور|لابرادور|ژرمن|شپرد|روتوایلر|هاسکی|سنت\s*برنارد|دوبرمن|قفقازی|آکیتا|بوکسر|دوگ|مالاموت|بلک\s*راشن/, "بزرگ"],
  [/بردر\s*کولی|بیگل|کوکر|اسپانیل|پیت\s*بول|بول\s*تریر|سامویید|شارپی|چاو/, "متوسط"],
  [/پامرانیان|شیتزو|پودل|چیهواهوا|مالتیز|یورک|تریر|پاگ|اسپیتز|پکینز|داشهوند|جک\s*راسل/, "کوچک"],
];

// Breed → the wording a breed-specific product actually uses in its title.
const BREED_LINE: Array<[RegExp, string]> = [
  [/گلدن|golden/i, "Golden Retriever"],
  [/لابرادور|labrador/i, "Labrador"],
  [/ژرمن|شپرد|german\s*shepherd/i, "German Shepherd"],
  [/پامرانیان|pomeranian/i, "Pomeranian"],
  [/شیتزو|shih/i, "Shih Tzu"],
  [/یورک|yorkshire/i, "Yorkshire"],
  [/چیهواهوا|chihuahua/i, "Chihuahua"],
  [/پودل|poodle/i, "Poodle"],
  [/هاسکی|husky/i, "Husky"],
  [/بولداگ|bulldog/i, "Bulldog"],
  [/روتوایلر|rottweiler/i, "Rottweiler"],
  [/پرشین|persian/i, "Persian"],
  [/مین\s*کون|maine/i, "Maine Coon"],
  [/بریتیش|british/i, "British"],
  [/اسکاتیش|scottish/i, "Scottish"],
  [/سیامی|siamese/i, "Siamese"],
  [/پاگ|pug/i, "Pug"],
  [/بیگل|beagle/i, "Beagle"],
];

function inferBreedLine(text: string): string | null {
  const norm = normalizePersian(text || "");
  for (const [re, line] of BREED_LINE) if (re.test(norm)) return line;
  return null;
}

function inferBreedSize(text: string): string | null {
  const norm = normalizePersian(text || "");
  for (const [re, size] of BREED_SIZE) if (re.test(norm)) return size;
  return null;
}

async function executeSearch(
  supabase: any,
  args: any,
  precomputedEmbedding: number[] | null,
  lock?: { species?: string | null; lifeStage?: string | null },
): Promise<any> {
  const { query_text, subcategory, subcategory_family, species, breed, filters, sort_by, evidence_terms, limit, offset } = args;
  const normalizedQuery = normalizePersian(query_text || "");
  const lockedSpecies = lock?.species || null;

  const rpcParams: any = { p_store_id: PETABAD_STORE_ID, p_query: normalizedQuery, p_in_stock: true };
  if (precomputedEmbedding) rpcParams.p_embedding = JSON.stringify(precomputedEmbedding);
  // A single exact shelf is a hard filter only when the user named a brand shelf;
  // otherwise search the whole shelf family so brand-split shelves stay visible.
  const family = subcategory_family || (subcategory && !/(جوسرا|رویال کنین|رفلکس|فیدار|سلبن|نیناپت)/.test(subcategory)
    ? subcategory
    : null);
  if (family) rpcParams.p_subcategory_prefix = family;
  else if (subcategory) rpcParams.p_subcategory = subcategory;
  // The species lock always wins over whatever the model asked for.
  if (lockedSpecies) rpcParams.p_species = lockedSpecies;
  else if (species) rpcParams.p_species = species;

  if (filters?.brand) rpcParams.p_brand = filters.brand;
  if (filters?.product_line) rpcParams.p_product_line = filters.product_line;
  if (filters?.origin_country) rpcParams.p_origin_country = filters.origin_country;
  if (filters?.life_stage) rpcParams.p_life_stage = filters.life_stage;
  const breedSize = filters?.breed_size || inferBreedSize(`${breed || ""} ${query_text || ""}`);
  if (breedSize) rpcParams.p_breed_size = breedSize;
  if (Array.isArray(filters?.needs) && filters.needs.length > 0) rpcParams.p_needs = filters.needs;
  if (filters?.price_max) rpcParams.p_max_price = filters.price_max;
  if (filters?.price_min) rpcParams.p_min_price = filters.price_min;
  rpcParams.p_limit = Math.min(Math.max(Number(limit) || 20, 1), 60);

  const runSearch = async (params: any) => {
    const { data, error } = await supabase.rpc("pet_hybrid_search", params);
    if (error) {
      console.error("Hybrid search error:", error);
      return null;
    }
    return data || [];
  };

  let data = await runSearch(rpcParams);
  if (data === null) return { products: [], message: "جستجو با مشکل مواجه شد" };

  // Progressive widening: never report "we don't have it" because a filter was too tight.
  const relaxations: Array<(p: any) => void> = [
    (p) => { delete p.p_needs; },
    (p) => { delete p.p_breed_size; delete p.p_life_stage; },
    (p) => { delete p.p_subcategory_prefix; delete p.p_subcategory; },
    (p) => { delete p.p_max_price; delete p.p_min_price; },
  ];
  const relaxed: string[] = [];
  for (const relax of relaxations) {
    if (data.length > 0) break;
    const next = { ...rpcParams };
    for (let i = 0; i <= relaxations.indexOf(relax); i++) relaxations[i](next);
    const retry = await runSearch(next);
    if (retry && retry.length > 0) {
      data = retry;
      relaxed.push("filters_relaxed");
      break;
    }
  }

  // HARD species lock: a row from another animal never reaches the answer model.
  let results = filterBySpecies(data, lockedSpecies);


  // A breed-specific product (e.g. Royal Canin Golden Retriever) must lead the answer.
  const breedLine = filters?.product_line ? null : inferBreedLine(`${breed || ""} ${query_text || ""}`);
  if (breedLine) {
    const exact = await runSearch({
      p_store_id: PETABAD_STORE_ID,
      p_query: normalizedQuery,
      p_in_stock: true,
      p_product_line: breedLine,
      ...(rpcParams.p_species ? { p_species: rpcParams.p_species } : {}),
      p_limit: 6,
    });
    const exactSafe = filterBySpecies(exact || [], lockedSpecies);
    if (exactSafe.length > 0) {
      const seen = new Set(exactSafe.map((p: any) => p.id));
      results = [...exactSafe, ...results.filter((p: any) => !seen.has(p.id))];
    }

  }

  const terms = [
    ...(Array.isArray(evidence_terms) ? evidence_terms : []),
    ...(Array.isArray(filters?.features) ? filters.features : []),
  ].filter((t: any) => typeof t === "string" && t.trim()).slice(0, 8);
  let evidenceUnconfirmed = false;
  if (terms.length > 0) {
    const normTerms = terms.map((t) => normalizePersian(t));
    const filtered = results.filter((p: any) => {
      const haystack = normalizePersian(
        `${p.name_fa || ""} ${p.description_fa || ""} ${(p.tags || []).join(" ")} ${(p.health_needs || []).join(" ")}`
      );
      return normTerms.some((t) => haystack.includes(t));
    });
    if (filtered.length > 0) results = filtered;
    else evidenceUnconfirmed = true;
  }

  if (Number(offset) > 0) results = results.slice(Math.floor(Number(offset)));

  if (sort_by === "price_low") results.sort((a: any, b: any) => a.price - b.price);
  else if (sort_by === "price_high") results.sort((a: any, b: any) => b.price - a.price);
  else if (sort_by === "rating") results.sort((a: any, b: any) => b.rating - a.rating);

  // Stated life stage: matching rows lead, contradictory rows removed.
  results = applyStagePreference(results, lock?.lifeStage || filters?.life_stage || null);


  return {
    matched_total: results.length,
    shown: results.length,
    evidence_unconfirmed: evidenceUnconfirmed,
    filters_relaxed: relaxed.length > 0,
    searched_with: {
      family: rpcParams.p_subcategory_prefix || rpcParams.p_subcategory || null,
      brand: rpcParams.p_brand || null,
      product_line: rpcParams.p_product_line || null,
      origin_country: rpcParams.p_origin_country || null,
      life_stage: rpcParams.p_life_stage || null,
      breed_size: rpcParams.p_breed_size || null,
    },
    products: results,
  };
}

async function executeFacets(supabase: any, args: any, lockedSpecies?: string | null): Promise<any> {
  const { data, error } = await supabase.rpc("pet_question_facets", {
    p_query: args?.query_text ? normalizePersian(args.query_text) : null,
    p_subcategory: args?.subcategory || null,
    p_subcategory_prefix: args?.subcategory_family || null,
    p_species: lockedSpecies || args?.species || null,

    p_brand: args?.brand || null,
    p_origin_country: args?.origin_country || null,
    p_in_stock: true,
  });
  if (error) {
    console.error("Facets error:", error);
    return { error: "شمارش کاتالوگ با مشکل مواجه شد" };
  }
  // Counts / totals / price range are opt-in: a plain "list the brands" request
  // must not come back stuffed with numbers.
  if (args?.include_counts === true) {
    if (!lockedSpecies) return data;
    return { ...data, species: undefined };
  }
  const own = speciesRe(lockedSpecies || null);
  const shelfAllowed = (value: string) =>
    !lockedSpecies ||
    own!.test(normalizePersian(value)) ||
    !SPECIES_TOKENS.some(([name, re]) => name !== lockedSpecies && re.test(normalizePersian(value)));
  return {
    brands: (data?.brands || []).map((b: any) => b?.brand).filter(Boolean),
    countries: (data?.countries || []).map((c: any) => c?.value).filter(Boolean),
    brands_by_country: (data?.brands_by_country || []).map((b: any) => ({ country: b?.country, brand: b?.brand })),
    life_stages: (data?.life_stages || []).map((l: any) => l?.value).filter(Boolean),
    breed_sizes: (data?.breed_sizes || []).map((b: any) => b?.value).filter(Boolean),
    needs: (data?.needs || []).map((n: any) => n?.value).filter(Boolean),
    // Shelves belonging to another animal never enter a locked conversation.
    subcategories: (data?.subcategories || []).map((sc: any) => sc?.value).filter(Boolean).filter(shelfAllowed),
    ...(lockedSpecies ? {} : { species: (data?.species || []).map((sp: any) => sp?.value).filter(Boolean) }),
    counts_hidden: true,
  };

}

// ── Catalog-grounded question options ───────────────────────────────────
// Every option offered to the shopper has to exist in the catalog. We take one
// cheap SQL snapshot of the candidate set and rewrite the option lists from it.

type QuestionFacets = {
  total: number;
  price: { min: number; q1: number; median: number; q3: number; max: number } | null;
  brands: Array<{ brand: string; count: number }>;
  tags: Array<{ value: string; count: number }>;
};

/** Conversational filler that must not narrow the candidate set. */
const FACET_STOPWORDS = [
  "بگیرم", "بخرم", "بخرم؟", "میخوام", "می‌خوام", "خوام", "چی", "چه", "کدوم", "برام", "برای",
  "راهنمایی", "راهنماییم", "کمک", "کمکم", "کن", "کنی", "بهترین", "پیشنهاد", "معرفی", "لطفا",
  "لطفاً", "میشه", "می‌شه", "یه", "یک", "خوب", "مناسب", "دنبال", "هستم", "باشه", "میگردم",
  "می‌گردم", "دارید", "داری", "نشونم", "بده", "تومان", "تومن", "قیمت",
];

async function fetchQuestionFacets(
  supabase: any,
  queryText: string,
  subcategory?: string | null,
  species?: string | null,
  subcategoryFamily?: string | null
): Promise<QuestionFacets | null> {
  try {
    const cleaned = normalizePersian(queryText || "")
      .split(/\s+/)
      .filter((t) => t && !FACET_STOPWORDS.includes(t))
      .join(" ")
      .trim();
    const { data, error } = await supabase.rpc("pet_question_facets", {
      p_query: cleaned || null,
      p_subcategory: subcategory || null,
      p_subcategory_prefix: subcategoryFamily || null,
      p_species: species || null,
      p_in_stock: true,
    });
    if (error) {
      console.error("Question facets error:", error);
      return null;
    }
    if (!data) return null;
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
      brands: Array.isArray(data.brands) ? data.brands : [],
      tags: Array.isArray(data.tags) ? data.tags : [],
    };
  } catch (e) {
    console.error("Question facets exception:", e);
    return null;
  }
}

const faDigits = (s: string) => s.replace(/[0-9]/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);

/** "۹۲ میلیون" / "۱٫۲ میلیارد" — rounded, human, never zero-padded noise. */
function formatToman(v: number): string {
  if (!Number.isFinite(v)) return "";
  if (v < 1_000_000) {
    return `${faDigits(String(Math.max(1, Math.round(v / 1_000)) * 1))} هزار`;
  }
  if (v >= 1_000_000_000) {
    const b = v / 1_000_000_000;
    return `${faDigits((Math.round(b * 10) / 10).toString().replace(".", "٫"))} میلیارد`;
  }
  return `${faDigits(String(Math.round(v / 1_000_000)))} میلیون`;
}

/** Adjacent budget buckets built from the real price quantiles of the candidate set. */
function buildBudgetOptions(price: QuestionFacets["price"]): any[] | null {
  if (!price) return null;
  const round = (v: number) => {
    if (v >= 1_000_000) return Math.round(v / 1_000_000) * 1_000_000;
    return Math.max(100_000, Math.round(v / 100_000) * 100_000);
  };
  // Buckets are open-ended at the bottom ("تا X") — a "۰ تا X" label is meaningless.
  const edges = Array.from(
    new Set([round(price.q1), round(price.median), round(price.q3)])
  ).sort((a, b) => a - b);
  if (edges.length < 2) return null;

  const options: any[] = [
    { label: `تا ${formatToman(edges[0])} تومان`, value: { price_max: edges[0] } },
  ];
  for (let i = 0; i < edges.length - 1; i++) {
    options.push({
      label: `${formatToman(edges[i])} تا ${formatToman(edges[i + 1])} تومان`,
      value: { price_min: edges[i], price_max: edges[i + 1] },
    });
  }
  const last = edges[edges.length - 1];
  if (round(price.max) > last) {
    options.push({ label: `بالای ${formatToman(last)} تومان`, value: { price_min: last } });
  }
  options.push({ label: "مهم نیست، بهترین رو نشونم بده", value: {} });
  return options.length >= 3 ? options : null;
}

const BUDGET_STEP_RE = /بودجه|قیمت|تومان|هزینه/;

/**
 * Rewrites a clarification card against the catalog:
 * budget options come from real quantiles, brand options only list existing brands,
 * and a step that ends up with fewer than two usable options is dropped.
 */
function groundClarification(card: any, facets: QuestionFacets | null): any {
  if (!card || !facets || facets.total === 0) return card;
  const brandKeys = new Set(
    facets.brands.map((b) => normalizePersian(String(b.brand || "")).replace(/[\s‌]/g, ""))
  );
  const budgetOptions = facets.total >= 4 ? buildBudgetOptions(facets.price) : null;

  const groundStep = (step: any) => {
    const text = normalizePersian(`${step?.title || ""} ${step?.question || ""}`);
    const optionsText = normalizePersian(
      (step?.options || []).map((o: any) => o?.label || "").join(" ")
    );
    const isBudget = BUDGET_STEP_RE.test(text) || /میلیون|میلیارد|تومان/.test(optionsText);

    if (isBudget) {
      // Tiny candidate sets get no budget question at all.
      if (!budgetOptions) return null;
      return {
        ...step,
        title: step?.title || "بودجه",
        question: step?.question || "بودجه‌ات حدوداً چقدره؟",
        options: budgetOptions,
      };
    }

    const isBrand = /برند|مارک/.test(text);
    if (isBrand) {
      const kept = (step?.options || []).filter((o: any) => {
        const key = normalizePersian(String(o?.label || "")).replace(/[\s‌]/g, "");
        return [...brandKeys].some((b) => b && (b.includes(key) || key.includes(b)));
      });
      const options = kept.length >= 2
        ? kept
        : facets.brands.slice(0, 5).map((b) => ({ label: b.brand, value: { brand: b.brand } }));
      return options.length >= 2 ? { ...step, options } : null;
    }

    return (step?.options || []).length >= 2 ? step : null;
  };

  if (card.kind === "steps") {
    const steps = (card.steps || []).map(groundStep).filter(Boolean);
    if (steps.length === 0) return null;
    return { ...card, steps };
  }
  const single = groundStep({ title: "", question: card.question, options: card.options });
  if (!single) return card;
  return { ...card, question: single.question || card.question, options: single.options };
}

function isValidClarification(card: any): boolean {
  if (!card || (card.kind !== "single" && card.kind !== "steps")) return false;
  if (card.kind === "single") {
    return typeof card.question === "string" && card.question.trim().length > 0 &&
      Array.isArray(card.options) && card.options.length >= 2 &&
      card.options.every((o: any) => typeof o?.label === "string" && o.label.trim().length > 0);
  }
  return Array.isArray(card.steps) && card.steps.length > 0 && card.steps.every((step: any) =>
    typeof step?.question === "string" && step.question.trim().length > 0 &&
    Array.isArray(step.options) && step.options.length >= 2 &&
    step.options.every((o: any) => typeof o?.label === "string" && o.label.trim().length > 0)
  );
}

function clarificationResponse(card: any, source: string): Response | null {
  if (!isValidClarification(card)) return null;
  const steps = card.kind === "steps" ? card.steps : [];
  console.log("Clarification response:", JSON.stringify({
    source,
    kind: card.kind,
    step_count: steps.length,
    option_counts: card.kind === "single" ? [card.options.length] : steps.map((s: any) => s.options.length),
  }));
  return new Response(
    JSON.stringify({ response_type: "clarification", content: "", products: [], quickReplies: [], clarification: card }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

/** Compact snapshot line so the model never invents a budget or brand. */
function snapshotLine(facets: QuestionFacets | null): string {
  if (!facets || facets.total === 0 || !facets.price) return "";
  const brands = facets.brands.slice(0, 8).map((b) => b.brand).join("، ");
  return `CATALOG_SNAPSHOT: تعداد کاندیدا ${facets.total} | قیمت واقعی از ${facets.price.min} تا ${facets.price.max} تومان (میانه ${facets.price.median}) | برندهای موجود: ${brands}
قانون: هیچ بازه قیمتی یا برندی بیرون از این محدوده پیشنهاد نکن. گزینه‌های بودجه باید داخل همین بازه باشن.`;
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
  const cleaned = (raw || "")
    .split("\n")
    .map((line) => (/^\s*(?:[•\-*▪]|\d+[.)])/.test(line) ? line : line.replace(sentenceRe, "")))
    .join("\n")
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return cleaned || (raw || "").trim();
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
  const { data } = await supabase.from("pet_products").select("*").in("id", unique);
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
  [/توله|بچه\s*سگ|بچه\s*گربه/, "توله و بچه حیوان"],
  [/پیر|مسن|سالمند/, "حیوان مسن"],
  [/حساسیت|معده\s*حساس/, "مشکل گوارشی و حساسیت"],
  [/نژاد\s*بزرگ|سگ\s*بزرگ/, "نژاد بزرگ"],
  [/چاق|رژیم|کاهش\s*وزن/, "کنترل وزن"],
];

function detectUsage(text: string): string | null {
  const norm = normalizePersian(text || "");
  for (const [re, label] of USAGE_HINTS) if (re.test(norm)) return label;
  return null;
}

/** Species the user already named — that guidance step is then skipped. */
const SPECIES_HINTS: Array<[RegExp, string]> = [
  [/گربه|بچه\s*گربه|پیشی|cat/i, "گربه"],
  [/سگ|توله\s*سگ|dog|پاپی/i, "سگ"],
  [/پرنده|مرغ\s*عشق|طوطی|قناری|کاسکو/, "پرنده"],
  [/ماهی|آکواریوم|اکواریوم/, "ماهی و آکواریوم"],
  [/خرگوش|همستر|جوندگان|لاک\s*پشت|خوکچه/, "سایر حیوانات خانگی"],
];

function detectSpecies(text: string): string | null {
  const norm = normalizePersian(text || "");
  for (const [re, label] of SPECIES_HINTS) if (re.test(norm)) return label;
  return null;
}

// ── Species lock ────────────────────────────────────────────────────────
// Once the shopper names their animal, NOTHING from another animal may enter
// the experience: not a card, not a sentence, not an explanation.

const SPECIES_TOKENS: Array<[string, RegExp]> = [
  ["گربه", /گربه|پیشی|cat/i],
  ["سگ", /سگ|dog|پاپی/i],
  ["پرنده", /پرنده|پرندگان|طوطی|قناری|مینا|عروس\s*هلندی|کاسکو|فنچ|کبوتر|مرغ\s*عشق/],
  ["ماهی و آکواریوم", /ماهی|آبزیان|آکواریوم|اکواریوم/],
  ["سایر حیوانات خانگی", /جونده|جوندگان|خرگوش|همستر|خوکچه|خزنده|لاک\s*پشت|موش|سنجاب|فرت/],
];

function speciesRe(label: string | null): RegExp | null {
  if (!label) return null;
  for (const [name, re] of SPECIES_TOKENS) if (name === label) return re;
  return null;
}

/** Is this catalog row acceptable for the locked species? */
function rowMatchesSpecies(row: any, locked: string): boolean {
  const own = speciesRe(locked);
  if (!own) return true;
  const speciesText = normalizePersian(String(row?.species || ""));
  const shelf = normalizePersian(`${row?.subcategory || ""} ${row?.category || ""}`);
  const haystack = `${speciesText} ${shelf}`;
  if (own.test(haystack)) return true;
  // No species signal at all → allow only when no OTHER animal is named either.
  const foreign = SPECIES_TOKENS.some(([name, re]) => name !== locked && re.test(haystack));
  return !foreign;
}

function filterBySpecies<T extends any>(rows: T[], locked: string | null): T[] {
  if (!locked) return rows;
  return (rows || []).filter((r) => rowMatchesSpecies(r, locked));
}

/** Life stage the shopper stated — kitten/puppy talk must never drift to adult copy. */
function detectLifeStage(text: string): string | null {
  const norm = normalizePersian(text || "");
  if (/بچه\s*گربه|توله|بچه\s*سگ|پاپی|نابالغ|kitten|puppy/i.test(norm)) return "نابالغ";
  if (/پیر|مسن|سالمند|سنیور|senior/i.test(norm)) return "سنیور";
  return null;
}

/** Soft stage ordering: matching stage first, contradictory stage dropped. */
function applyStagePreference(rows: any[], stage: string | null): any[] {
  if (!stage) return rows;
  const opposite = stage === "نابالغ" ? "سنیور" : stage === "سنیور" ? "نابالغ" : null;
  const kept = (rows || []).filter((r) => !(opposite && r?.life_stage === opposite));
  const exact = kept.filter((r) => r?.life_stage === stage);
  const rest = kept.filter((r) => r?.life_stage !== stage);
  return [...exact, ...rest];
}

// ── Multi-need bundle shopping ──────────────────────────────────────────
// A shopper who asks for food + hygiene + toys + supplements gets one grouped
// answer, each group retrieved separately but always inside the species lock.

type NeedSpec = { key: string; label: string; re: RegExp; query: (sp: string) => string };

const NEED_SPECS: NeedSpec[] = [
  {
    key: "food",
    label: "غذا",
    re: /غذا|خوراک|تشویقی|کنسرو|پوچ/,
    query: (sp) => `غذای ${sp}`,
  },
  {
    key: "hygiene",
    label: "بهداشت و مراقبت",
    re: /بهداشت|مراقبت|شامپو|حموم|حمام|خاک|شوینده|نظافت|مسواک|ناخن|گوش/,
    query: (sp) => `شامپو و بهداشت ${sp}`,
  },
  {
    key: "toys",
    label: "اسباب‌بازی",
    re: /اسباب\s*بازی|بازی|سرگرمی|تونل|توپ/,
    query: (sp) => `اسباب بازی ${sp}`,
  },
  {
    key: "gear",
    label: "لوازم نگهداری",
    re: /لوازم|نگهداری|حمل|قلاده|ظرف|باکس|لباس|جای\s*خواب|تشک|اسکرچر|درخت/,
    query: (sp) => `لوازم و ظرف و جای خواب ${sp}`,
  },
  {
    key: "health",
    label: "مکمل و درمان",
    re: /مکمل|درمان|دارو|ویتامین|پروبیوتیک|ضد\s*انگل|قرص|شربت/,
    query: (sp) => `مکمل و ویتامین ${sp}`,
  },
];

function detectNeeds(text: string): NeedSpec[] {
  const norm = normalizePersian(text || "");
  return NEED_SPECS.filter((n) => n.re.test(norm));
}

/** Extra hygiene shelves for cats/dogs so a need word can never drift shelves. */
function needShelfQueries(need: NeedSpec, species: string): string[] {
  if (need.key === "hygiene") {
    return [`شامپو ${species}`, `خاک ${species}`, `مسواک و خمیر دندان ${species}`];
  }
  return [need.query(species)];
}



const DEFAULT_GUIDANCE_STEPS = (
  category: string,
  knownUsage?: string | null,
  facets?: QuestionFacets | null,
  knownSpecies?: string | null
) => {
  const budgetOptions = facets && facets.total >= 4 ? buildBudgetOptions(facets.price) : null;
  return [
    // Species is asked only when the user hasn't already named their pet.
    ...(knownSpecies ? [] : [{
      title: "نوع حیوان",
      question: "برای چه حیوانی می‌خوای؟",
      options: [
        { label: "سگ" },
        { label: "گربه" },
        { label: "پرنده" },
        { label: "ماهی و آکواریوم" },
        { label: "سایر حیوانات خانگی" },
      ],
    }]),
    {
      title: "نیازها",
      question: knownSpecies
        ? `برای ${knownSpecies}‌ت دنبال چه چیزهایی هستی؟ (می‌تونی چندتا انتخاب کنی)`
        : "دنبال چه چیزهایی هستی؟ (می‌تونی چندتا انتخاب کنی)",
      multi: true,
      options: [
        { label: "غذا و تشویقی" },
        { label: "بهداشت و نگهداری" },
        { label: "اسباب‌بازی و سرگرمی" },
        { label: "لوازم جانبی و حمل" },
        { label: "مکمل و سلامت" },
      ],
    },
    ...(budgetOptions ? [{
      title: "بودجه",
      question: "بودجه‌ات حدوداً چقدره؟",
      options: budgetOptions,
    }] : []),
    ...(knownUsage ? [] : [{
      title: "اولویت",
      question: "چه چیزی برات مهم‌تره؟",
      options: [
        { label: "کیفیت و مواد اولیه" },
        { label: "برند شناخته‌شده" },
        { label: "بسته‌بندی اقتصادی" },
        { label: "بهترین قیمت" },
      ],
    }]),
  ];
};


async function getProductDetails(supabase: any, productId: string): Promise<any> {
  const { data, error } = await supabase
    .from("pet_products")
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
    console.log(`PetAbad agent mode: ${effectiveMode}, is_first_message: ${is_first_message}`);

    // Build system prompt with greeting control
    let systemPrompt = PROMPTS[effectiveMode];
    if (!is_first_message) {
      systemPrompt = NO_GREETING + "\n\n" + systemPrompt;
    }

    // For comparison mode, inject product data
    if (effectiveMode === "comparison" && products_context) {
      const productsList = products_context.map((p: any, i: number) =>
        `محصول ${i + 1}: ${p.name_fa || p.name}\n- قیمت: ${p.price?.toLocaleString()} تومان\n- برند: ${p.brand || "نامشخص"}\n- امتیاز: ${p.rating}\n- مشخصات: ${JSON.stringify(p.specs || {})}`
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
          `${i + 1}. [${p.id}] ${p.name_fa || p.name} - ${p.price?.toLocaleString()} تومان (${p.brand || "نامشخص"})`
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
    let knownSpecies = detectSpecies(lastUserText);

    // ── Species lock: newest mention across the whole conversation wins ──
    const userTurns = (userMessages || []).filter((m: any) => m.role === "user").map((m: any) => String(m.content || ""));
    let lockedSpecies: string | null = null;
    let lockedStage: string | null = null;
    for (let i = userTurns.length - 1; i >= 0; i--) {
      if (!lockedSpecies) lockedSpecies = detectSpecies(userTurns[i]);
      if (!lockedStage) lockedStage = detectLifeStage(userTurns[i]);
      if (lockedSpecies && lockedStage) break;
    }
    const speciesLock = { species: lockedSpecies, lifeStage: lockedStage };
    knownSpecies = lockedSpecies || knownSpecies;

    const bundleNeeds = detectNeeds(lastUserText);
    const isBundleTurn = Boolean(lockedSpecies) && bundleNeeds.length >= 2;

    const guidanceCategory = /غذا/.test(normLastUser) ? "غذای حیوان خانگی" : "";
    // Shelf FAMILY (prefix) — brand-split shelves must stay inside the candidate set.
    const facetFamily = /خشک/.test(normLastUser)
      ? (/سگ/.test(normLastUser) ? "غذای خشک سگ" : /گربه/.test(normLastUser) ? "غذای خشک گربه" : null)
      : /کنسرو|پوچ|غذای\s*تر/.test(normLastUser)
        ? (/سگ/.test(normLastUser) ? "کنسرو و پوچ و غذای تر سگ" : /گربه/.test(normLastUser) ? "کنسرو و پوچ و غذای تر گربه" : null)
        : null;
    const facetSubcategory = null;
    const facetSpecies = lockedSpecies === "سگ" || lockedSpecies === "گربه"
      ? lockedSpecies
      : (/سگ/.test(normLastUser) ? "سگ" : /گربه/.test(normLastUser) ? "گربه" : null);

    if (lockedSpecies) {
      systemPrompt += `\n\nSPECIES_LOCK: خرید این گفتگو فقط و فقط برای «${lockedSpecies}» است.
- هیچ محصول، جمله، توضیح یا مقایسه‌ای مربوط به حیوان دیگری (پرنده، سگ، گربه، ماهی، جوندگان یا هر حیوان دیگر جز «${lockedSpecies}») نباید در پاسخت بیاد.
- هرگز توضیح نده که نتایج پیداشده مربوط به حیوان دیگری بودن؛ درباره فرایند داخلی جستجو حرف نزن.
- اگر برای یک نیاز محصول مناسب «${lockedSpecies}» پیدا نشد، فقط صادقانه بگو برای همون بخش گزینه مناسبی پیدا نکردی و محصول جایگزین از حیوان دیگه پیشنهاد نده.`;
    }
    if (lockedStage) {
      systemPrompt += `\n\nLIFE_STAGE_LOCK: مرحله سنی مشخص شده «${lockedStage}» است؛ درباره مرحله سنی دیگر (مثلاً بالغ وقتی کاربر گفته بچه‌گربه) حرف نزن و محصول مخصوص مرحله دیگر پیشنهاد نده.`;
    }


    // ── Catalog snapshot: question options must come from real products ──
    let questionFacets: QuestionFacets | null = null;
    let facetsPromise: Promise<QuestionFacets | null> | null = null;
    if (wantsGuidance) {
      questionFacets = await fetchQuestionFacets(supabase, lastUserText, facetSubcategory, facetSpecies, facetFamily);
      const snap = snapshotLine(questionFacets);
      if (snap) systemPrompt += `\n\n${snap}`;
    } else if (effectiveMode === "agentic" || effectiveMode === "discovery") {
      facetsPromise = fetchQuestionFacets(supabase, lastUserText, facetSubcategory, facetSpecies, facetFamily);
    }
    const getFacets = async (): Promise<QuestionFacets | null> => {
      if (questionFacets) return questionFacets;
      if (facetsPromise) questionFacets = await facetsPromise;
      return questionFacets;
    };

    if (isBundleTurn) {
      systemPrompt += `\n\nBUNDLE_SEARCH_TURN: کاربر نوع حیوانش («${lockedSpecies}») و نیازهاش رو گفته. در این نوبت هرگز ask_clarification صدا نزن؛ حتماً search_products رو صدا بزن و بعد پاسخ گروه‌بندی‌شده بده.`;
    } else if (wantsGuidance) {
      systemPrompt += `\n\nGUIDANCE_TURN: کاربر درخواست راهنمایی داده${knownSpecies ? ` نوع حیوانش رو خودش گفته («${knownSpecies}») پس هرگز نپرس برای چه حیوانی؛` : ""} و نیازش کامل مشخص نیست. در این نوبت حتماً ask_clarification با steps صدا بزن و هیچ سؤالی رو در متن ننویس.${knownUsage ? ` نیاز رو خودش گفته («${knownUsage}») پس اون سؤال رو نپرس؛ از بودجه و اولویت شروع کن.` : " مراحل: نوع حیوان → نیازها (multi) → بودجه."} هر مرحله ۳ تا ۵ گزینه کوتاه. گزینه‌های بودجه باید از بازه واقعی CATALOG_SNAPSHOT باشن، نه اعداد ساختگی.`;
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
      model: "google/gemini-3.1-flash-lite",
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
      const rawText = choice.message?.content || "";
      const sig = extractSignals(rawText);
      const mentionedIds = [
        ...((sig.text.match(UUID_RE) || []) as string[]),
        ...sig.likedIds,
        ...sig.selectedIds,
      ];
      const hydrated = await hydrateProducts(supabase, mentionedIds);
      let visible = sanitizeVisibleText(sig.text);
      if (!wantsCounts) visible = stripCountTalk(visible);


      // Safety net: questions written as text become a tappable card on any turn.
      if (hydrated.length === 0) {
        const parsed = extractQuestionCard(visible);
        const facets = parsed || wantsGuidance ? await getFacets() : null;
        const rawCard =
          parsed ||
          (wantsGuidance && isQuestionHeavy(visible)
            ? {
                kind: "steps",
                helper: "چند سؤال کوتاه تا دقیق‌ترین پیشنهاد رو برات پیدا کنم",
                steps: DEFAULT_GUIDANCE_STEPS(guidanceCategory, knownUsage, facets, knownSpecies),
              }
            : null);
        const card = rawCard ? groundClarification(rawCard, facets) : null;
        const cardResponse = clarificationResponse(card, "direct-text");
        if (cardResponse) return cardResponse;
      }

      // A guidance turn must never end on the generic fallback line.
      if (wantsGuidance && hydrated.length === 0 && !visible) {
        const fallbackCard = {
          kind: "steps",
          helper: "چند سؤال کوتاه تا دقیق‌ترین پیشنهاد رو برات پیدا کنم",
          steps: DEFAULT_GUIDANCE_STEPS(guidanceCategory, knownUsage, await getFacets(), knownSpecies),
        };
        const fallbackResponse = clarificationResponse(fallbackCard, "guidance-fallback");
        if (fallbackResponse) return fallbackResponse;
      }



      return new Response(
        JSON.stringify({
          response_type: hydrated.length > 0 ? "products" : "message",
          content: visible || (hydrated.length > 0 ? "این گزینه‌ها به درخواستت می‌خوره:" : "متوجه نشدم. می‌تونی دوباره بگی؟"),
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
    // A bundle turn already has species + needs: asking again is not allowed.
    const clarifyToolCall = isBundleTurn ? null : choice.message.tool_calls.find(
      (t: any) => t.function?.name === "ask_clarification"
    );

    if (clarifyToolCall) {
      let payload: any = {};
      try { payload = JSON.parse(clarifyToolCall.function.arguments); } catch { payload = {}; }
      const normOptions = (arr: any) =>
        (Array.isArray(arr) ? arr : [])
          .map((o: any) => (typeof o === "string" ? { label: o } : { label: o?.label, hint: o?.hint }))
          .filter((o: any) => typeof o.label === "string" && o.label.trim());
      const SPECIES_QUESTION_RE = /(چه|کدوم|نوع)\s*(حیوان|پت)|حیوان\s*خونگی|حیوان\s*خانگی/;
      const steps = (Array.isArray(payload.steps) ? payload.steps : [])
        .map((s: any) => ({
          title: s?.title || "",
          question: s?.question || "",
          multi: s?.multi === true,
          options: normOptions(s?.options),
        }))
        .filter((s: any) => s.question && s.options.length > 0)
        // The user already named their pet — never ask which animal again.
        .filter((s: any) => !(knownSpecies && SPECIES_QUESTION_RE.test(normalizePersian(s.question))));
      const options = normOptions(payload.options);
      if (steps.length > 0 || options.length > 0) {
        const facets = await getFacets();
        const rawCard = steps.length > 0
          ? { kind: "steps", helper: payload.helper || "", steps }
          : { kind: "single", question: payload.question || "", helper: payload.helper || "", multi: payload.multi === true, options };
        const grounded = groundClarification(rawCard, facets);
        const fallbackCard = {
          kind: "steps",
          helper: "چند سؤال کوتاه تا دقیق‌ترین پیشنهاد رو برات پیدا کنم",
          steps: DEFAULT_GUIDANCE_STEPS(guidanceCategory, knownUsage, facets, knownSpecies),
        };
        const cardResponse = clarificationResponse(grounded, "ask-tool-grounded") ||
          clarificationResponse(fallbackCard, "ask-tool-fallback");
        if (cardResponse) return cardResponse;
        return new Response(
          JSON.stringify({ response_type: "message", content: "برای اینکه دقیق راهنماییت کنم، لطفاً نیازت رو کمی بیشتر توضیح بده.", products: [], quickReplies: [] }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      // Empty/invalid card payload on a guidance turn → use the built-in card.
      if (wantsGuidance) {
        const fallbackCard = {
          kind: "steps",
          helper: "چند سؤال کوتاه تا دقیق‌ترین پیشنهاد رو برات پیدا کنم",
          steps: DEFAULT_GUIDANCE_STEPS(guidanceCategory, knownUsage, await getFacets(), knownSpecies),
        };
        const fallbackResponse = clarificationResponse(fallbackCard, "invalid-ask-tool-fallback");
        if (fallbackResponse) return fallbackResponse;
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
          response_type: "cart",
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
        const searched = await executeSearch(supabase, funcArgs, precomputedEmbedding, speciesLock);
        if (searched.products) allProducts = [...allProducts, ...searched.products];
        // Compact tool payload — full product rows never go into the prompt.
        result = {
          matched_total: searched.matched_total ?? 0,
          shown: searched.shown ?? 0,
          evidence_unconfirmed: searched.evidence_unconfirmed || false,
          products: (searched.products || []).map((p: any) => ({
            id: p.id, name: p.name_fa, price: p.price, brand: p.brand, rating: p.rating,
          })),
        };
      } else if (funcName === "catalog_facets") {
        result = await executeFacets(supabase, funcArgs, lockedSpecies);
      } else if (funcName === "recall_products") {
        const ids: string[] = Array.isArray(funcArgs.product_ids) ? funcArgs.product_ids.slice(0, 12) : [];
        if (ids.length > 0) {
          const { data: recalled } = await supabase.from("pet_products").select("*").in("id", ids);
          const ordered = filterBySpecies(
            ids.map((id) => (recalled || []).find((p: any) => p.id === id)).filter(Boolean),
            lockedSpecies,
          );
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

    // ── Multi-need bundle: one grouped answer, each shelf retrieved separately ──
    let bundleGroups: Array<{ label: string; products: any[] }> = [];
    let emptyNeedLabels: string[] = [];
    if (isBundleTurn) {
      const sp = lockedSpecies as string;
      const groups = await Promise.all(
        bundleNeeds.slice(0, 5).map(async (need) => {
          const queries = needShelfQueries(need, sp);
          const found: any[] = [];
          for (const q of queries) {
            const r = await executeSearch(
              supabase,
              { query_text: q, species: sp, limit: 6 },
              null,
              speciesLock,
            );
            for (const p of r.products || []) if (!found.some((f) => f.id === p.id)) found.push(p);
            if (found.length >= 3) break;
          }
          return { label: need.label, products: found.slice(0, 2) };
        }),
      );
      bundleGroups = groups.filter((g) => g.products.length > 0);
      emptyNeedLabels = groups.filter((g) => g.products.length === 0).map((g) => g.label);
      const bundleProducts: any[] = [];
      for (const g of bundleGroups) {
        for (const p of g.products) if (!bundleProducts.some((x) => x.id === p.id)) bundleProducts.push(p);
      }
      if (bundleProducts.length > 0) allProducts = bundleProducts.slice(0, 9);
    }

    // ── Step 3: Single follow-up LLM call for response generation + re-ranking ──
    console.log("Step 3: Response generation...");
    const requestedLimit = Number(extractedIntent?.limit) || 0;
    const comprehensive = requestedLimit >= 12;
    const maxShown = isBundleTurn ? Math.min(allProducts.length, 9) : comprehensive ? 12 : 6;
    // Card set is authoritative: the model may only write about these exact rows.
    const candidatesForRerank = isBundleTurn ? allProducts.slice(0, maxShown) : allProducts.slice(0, comprehensive ? 24 : 12);
    const candidateList = candidatesForRerank.map((p: any, i: number) =>
      `${i + 1}. [${p.id}] ${p.name_fa || p.name} — ${p.price?.toLocaleString()} تومان${p.brand ? ` — ${p.brand}` : ""}`
    ).join("\n");

    const bundleInstruction = isBundleTurn
      ? `\n\nBUNDLE_TURN: کاربر چند نیاز هم‌زمان داره. پاسخ باید گروه‌بندی‌شده باشه و شماره‌گذاری محصولات پیوسته و از ۱ شروع بشه.
- گروه‌ها و محصولات مجاز فقط همین‌ها هستن (به همین ترتیب و هیچ محصول دیگری):
${bundleGroups.map((g) => `${g.label}: ${g.products.map((p: any) => p.name_fa || p.name).join(" | ")}`).join("\n")}
- دقیقاً به ${maxShown} محصول اشاره کن، نه بیشتر و نه کمتر.
${emptyNeedLabels.length ? `- برای این نیازها محصول مناسب پیدا نشد، فقط صادقانه بگو گزینه مناسبی نداریم و جایگزین از حیوان دیگه پیشنهاد نده: ${emptyNeedLabels.join("، ")}` : ""}`
      : "";


    const rerankerInstruction = candidatesForRerank.length > 0
      ? `\n\nبا توجه به درخواست اصلی کاربر ("${originalQuery}")${extractedIntent?.semantic_tags?.length ? ` و تگ‌های معنایی استخراج‌شده (${extractedIntent.semantic_tags.join(", ")})` : ""}:
- محصولاتی که با نیت کاربر مطابقت ندارن رو حذف کن
- بهترین ۳ تا ${comprehensive ? "۱۲" : "۶"} محصول رو انتخاب کن
- ساختار پاسخ دقیقاً این‌طوریه: برای هر محصول یک خط شماره‌دار با نام و مشخصات کلیدی و قیمت، و بعدش در یک خط جدا یک جمله کوتاه که می‌گه چرا همین محصول برای درخواست کاربر مناسبه. بین محصولات یک خط خالی بذار
- توضیح «چرا» باید مخصوص همون محصول باشه (نوع حیوان، برند، ترکیبات، وزن بسته، قیمت) نه جمله کلی تکراری
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
      ...(rerankerInstruction ? [{ role: "system", content: rerankerInstruction + bundleInstruction }] : []),
    ];


    const followUpResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-lite",
        messages: followUpMessages,
      }),
    });

    if (!followUpResponse.ok) {
      const errText = await followUpResponse.text();
      console.error("Re-ranker error:", followUpResponse.status, errText);
      return new Response(
        JSON.stringify({
          response_type: allProducts.length > 0 ? "products" : "message",
          content: allProducts.length > 0
            ? "این محصولات رو برات پیدا کردم:"
            : "متأسفانه محصولی پیدا نکردم. می‌خوای یه جستجوی دیگه انجام بدم؟",
          products: allProducts.slice(0, maxShown),
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

    // Last gate: nothing from another animal ships, and cards never exceed the cap.
    selectedProducts = filterBySpecies(selectedProducts, lockedSpecies);
    if (selectedProducts.length > maxShown) selectedProducts = selectedProducts.slice(0, maxShown);


    if (!finalContent) {
      finalContent = selectedProducts.length > 0
        ? "این گزینه‌ها به درخواستت می‌خوره:"
        : "نتیجه مناسبی پیدا نکردم؛ می‌تونی نیازت رو کمی دقیق‌تر بگی؟";
    }

    return new Response(
      JSON.stringify({
        response_type: selectedProducts.length > 0 ? "products" : "message",
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
