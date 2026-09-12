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
- اگر نتیجه جستجو filters_relaxed: true داشت، حتماً به کاربر بگو کدوم شرایط رو کم کردی تا محصول پیدا کنی (مثلاً بگو برای پوست و مو گزینه سنیور نداشتیم، ولی غذاهای سالمند گربه رو نشونت میدم). هرگز بدون اطلاع‌رسانی فیلتر رو برندار.
- اگر evidence_unconfirmed: true بود، بگو دقیقاً چه ویژگی رو در متن محصولات ندیدی و این گزینه‌ها نزدیک‌ترین‌ها هستن.
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

قوانین:
- فارسی صحبت کن
- بدون مارک‌داون - متن ساده
- مختصر و دقیق باش
- هیچ سیاستی (هزینه ارسال، زمان تحویل، مرجوعی، ضمانت، پرداخت) رو از خودت نساز؛ فقط از business_faq_lookup`,


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
- نوع محصول (غذای تر، کنسرو، پوچ، غذای خشک، تشویقی، خاک، شامپو، مکمل، اسباب‌بازی...) رو همون‌طور که کاربر گفته در query_text بیار؛ سیستم خودش کل قفسه‌های اون نوع رو فیلتر می‌کنه. برای «غذای تر» هر سه نوع کنسرو، پوچ و سوپ در نظر گرفته می‌شه، پس ۴ تا ۶ گزینه‌ی متنوع نشون بده، نه یکی.
- هیچ‌وقت درباره‌ی محصولی که در نتایج هست ولی به حیوون کاربر نمی‌خوره حرف نزن و توضیح نده؛ فقط گزینه‌های درست رو معرفی کن. تعداد گزینه‌هایی که در متن می‌شماری باید دقیقاً برابر تعداد کارت‌ها باشه.
- برای سؤال‌های دانشی و معرفی برند بیرون از داده‌های فروشگاه (مثل «در مورد برند فیدار بهم بگو») از brand_or_general_lookup استفاده کن و بعد جواب رو کوتاه و انسانی بگو؛ قیمت و موجودی همیشه از کاتالوگ.



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

const WEB_LOOKUP_TOOL = {
  type: "function",
  function: {
    name: "brand_or_general_lookup",
    description:
      "Look up general knowledge on the web — brand background ('در مورد برند فیدار بهم بگو'), a company's origin/reputation, or pet-care facts that are NOT catalog data. Never use it for prices, stock or which products exist; those come from the catalog tools.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Short Persian or Latin search query, e.g. برند فیدار غذای حیوانات" },
      },
      required: ["query"],
      additionalProperties: false,
    },
  },
};

/** Firecrawl web search (direct API connection). Returns compact snippets only. */
async function executeWebLookup(args: any): Promise<any> {
  const key = Deno.env.get("FIRECRAWL_API_KEY");
  const query = String(args?.query || "").trim();
  if (!key || !query) {
    return { available: false, note: "دسترسی به اطلاعات بیرون از فروشگاه در دسترس نیست؛ فقط بر اساس کاتالوگ پاسخ بده." };
  }
  try {
    const res = await fetch("https://api.firecrawl.dev/v2/search", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query, limit: 4, lang: "fa" }),
      signal: AbortSignal.timeout(9000),
    });
    if (!res.ok) {
      console.error(`Firecrawl search failed [${res.status}]: ${await res.text()}`);
      return { available: false, note: "جستجوی وب ناموفق بود؛ فقط بر اساس کاتالوگ پاسخ بده." };
    }
    const json = await res.json();
    const rows = Array.isArray(json?.data) ? json.data : Array.isArray(json?.data?.web) ? json.data.web : [];
    return {
      available: true,
      results: rows.slice(0, 4).map((r: any) => ({
        title: String(r?.title || "").slice(0, 140),
        snippet: String(r?.description || r?.markdown || "").slice(0, 600),
      })),
    };
  } catch (e) {
    console.error("Firecrawl search error:", e);
    return { available: false, note: "جستجوی وب ناموفق بود؛ فقط بر اساس کاتالوگ پاسخ بده." };
  }
}

// ── Business / policy questions: answered ONLY from the official FAQ knowledge base ──
const FAQ_CATEGORIES = [
  "ordering_account", "payment", "discounts", "shipping_cost", "shipping_timing",
  "shipping_methods", "order_tracking", "order_changes", "returns", "refunds",
  "guarantees", "store_info_trust", "support_channels",
];

const BUSINESS_RE =
  /(ارسال|پست|پیک|تیپاکس|کرایه|هزینه\s*ارسال|بسته\s*بند|تحویل|چند\s*روز|زمان\s*رسیدن|مرجوع|بازگشت|عودت|پس\s*دادن|گارانتی|ضمانت|اصل\s*بودن|تقلبی|پرداخت|اقساط|اسنپ\s*پی|snapp|کارت\s*به\s*کارت|درگاه|فاکتور|تخفیف|کد\s*تخفیف|کوپن|سفارش(م|ت|ات)?\s*(رو|را)?\s*(لغو|پیگیری|تغییر|ویرایش)|لغو\s*سفارش|پیگیری\s*سفارش|رهگیری|کد\s*رهگیری|شماره\s*تماس|پشتیبان|تلفن|حضوری|فروشگاه\s*فیزیک|آدرس\s*فروشگاه|انقضا|تاریخ\s*مصرف|محدودیت\s*خرید|سفارش\s*تلفن)/;

/**
 * Informational questions ABOUT the store's assortment or a brand — these want a written
 * answer (brand names, brand background), never a product carousel.
 */
const INFO_QUESTION_RE =
  /((چه|کدوم|کدام)\s*(برند|مارک|کشور|دسته|شرکت)|برند\s*ها|برندها|برندهاتو|برندهات|مارک\s*ها|(لیست|فهرست)\s*(برند|مارک|کشور|دسته)|(برند|مارک)\s*(ها)?\s*(تو|ت|ات|هاتون|هاتو)?\s*(رو|را)?\s*(بگو|لیست|نام\s*ببر|معرفی)|(درباره|در\s*مورد|راجع\s*به)\s*(برند|مارک|شرکت)|برند\s*\S+\s*(چطوره|چجوریه|چیه|خوبه|معتبره|کجاییه|مال\s*کجاست)|(خارجی|ایرانی|داخلی|وارداتی)\s*(ا|ها|هاش|اش)?(شون|ون)?\s*(کدوم|کدام|چیا|رو\s*بگو|را\s*بگو))/;

/** «مقایسه کن», «X و Y رو مقایسه», «تفاوتشون چیه» → compare, don't recommend a new list. */
const COMPARE_RE = /(مقایسه|مقایسش|تفاوت|فرقش|فرق\s*(بین|این)|کدوم\s*بهتره|بهتره\s*یا)/;


/** Retrieve official PetAbad FAQ answers (hybrid FTS + trigram + embeddings). */
async function executeFaqLookup(
  supabase: any,
  args: any,
  precomputedEmbedding?: number[] | null,
): Promise<any> {
  const query = normalizePersian(String(args?.query || "")).trim();
  if (!query) return { entries: [], note: "سؤال مشخص نیست." };
  const cats = Array.isArray(args?.categories)
    ? args.categories.filter((c: any) => FAQ_CATEGORIES.includes(String(c)))
    : null;
  const embedding = precomputedEmbedding ?? (await generateQueryEmbedding(query));
  try {
    const { data, error } = await supabase.rpc("pet_faq_search", {
      p_query: query,
      p_embedding: embedding ? JSON.stringify(embedding) : null,
      p_categories: cats && cats.length ? cats : null,
      p_limit: 5,
    });
    if (error) {
      console.error("pet_faq_search error:", error);
      return { entries: [], note: "دسترسی به دانش فروشگاه ممکن نشد." };
    }
    const rows = (data || []) as any[];
    return {
      entries: rows.map((r) => ({
        faq_id: r.id,
        question: r.question,
        official_answer: r.answer,
        category: r.category,
        subtopic: r.subtopic,
        phone_numbers: r.phone_numbers || [],
        match: r.match_kind,
      })),
      best_match: rows[0]?.match_kind || "none",
    };
  } catch (e) {
    console.error("FAQ lookup error:", e);
    return { entries: [], note: "دسترسی به دانش فروشگاه ممکن نشد." };
  }
}

const FAQ_TOOL = {
  type: "function",
  function: {
    name: "business_faq_lookup",
    description:
      "Answer questions about PetAbad the business — shipping cost/time/methods, delivery, order placement or changes or cancellation, tracking, payment methods and instalments, discounts and coupons, returns, refunds, guarantees/authenticity, expiry, purchase limits, phone orders, in-person purchase, support channels. This is the ONLY allowed source for store policies. Never answer such a question from your own knowledge.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "The user's business question in Persian, as asked" },
        categories: {
          type: "array",
          items: { type: "string", enum: FAQ_CATEGORIES },
          description: "Optional topic narrowing",
        },
      },
      required: ["query"],
      additionalProperties: false,
    },
  },
};

const FAQ_GROUNDING_RULES = `

سؤال‌های مربوط به خود فروشگاه (ارسال، هزینه ارسال، زمان تحویل، پرداخت، اقساط، تخفیف، لغو یا تغییر یا پیگیری سفارش، مرجوعی، بازگشت وجه، ضمانت و اصالت کالا، خرید حضوری، شماره تماس و پشتیبانی، محدودیت خرید، تاریخ انقضا):
- همیشه اول business_faq_lookup را صدا بزن. هرگز از دانش عمومی خودت سیاست فروشگاه نساز و هیچ عدد، مهلت، هزینه یا شرطی را حدس نزن.
- جواب را فقط از official_answer بنویس؛ همه شرط‌ها و استثناها و مبالغ و مهلت‌ها را نگه دار (مثلاً «۷۲ ساعت»، «۷ روز»، «تهران/غیر تهران»).
- اگر جواب فقط بخشی از سؤال را پوشش می‌دهد، همان بخش را دقیق بگو و صادقانه بگو بقیه‌اش را باید از پشتیبانی بپرسد؛ چیزی از خودت اضافه نکن.
- اگر هیچ ورودی مرتبطی برنگشت (entries خالی یا best_match = weak)، بگو مطمئن نیستی و کاربر را به پشتیبانی ارجاع بده؛ سیاست جدید نساز.
- اگر شماره تماس در phone_numbers بود، همان را بگو؛ شماره از خودت نساز.
- اگر سؤال هم درباره محصول است و هم درباره فروشگاه، هر دو ابزار را صدا بزن و جواب را در دو بخش کوتاه بده.
- لحن صمیمی و ساده، بدون مارک‌داون، و بدون اشاره به «پایگاه دانش» یا فرایند داخلی.`;


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
  agentic: [SEARCH_TOOL, FACETS_TOOL, DETAILS_TOOL, RECALL_TOOL, CART_OPERATIONS_TOOL, CLARIFY_TOOL, WEB_LOOKUP_TOOL, FAQ_TOOL],
  discovery: [SEARCH_TOOL, FACETS_TOOL, DETAILS_TOOL, WEB_LOOKUP_TOOL, FAQ_TOOL],

  comparison: [],
  info_retrieval: [DETAILS_TOOL, FAQ_TOOL],
  conversational: [FAQ_TOOL],

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

/**
 * Functional product taxonomy: a shopper word ("غذای تر", "کنسرو", "خاک", "شامپو")
 * maps to the catalog's product_type values, so a request never depends on the
 * literal wording appearing inside a product name.
 */
const TYPE_SYNONYMS: Array<[RegExp, string[]]> = [
  [/غذای\s*تر|غذای\s*مرطوب|وت\s*فود/, ["کنسرو", "پوچ", "سوپ", "غذای تر"]],
  [/کنسرو/, ["کنسرو"]],
  [/پوچ|کاسه\s*ای|موس/, ["پوچ"]],
  [/سوپ/, ["سوپ"]],
  [/غذای\s*خشک|دراي|درای|خشک/, ["غذای خشک"]],
  [/تشویقی|بیسکویت|اسنک|بستنی/, ["تشویقی"]],
  [/شیر\s*خشک/, ["شیر خشک"]],
  [/غذای\s*درمانی|رژیم\s*درمانی/, ["غذای درمانی"]],
  [/خاک|بستر\s*بهداشتی|ظرف\s*بهداشتی|توالت/, ["خاک و ظرف بهداشتی"]],
  [/شامپو|نرم\s*کننده|صابون/, ["شامپو و نرم‌کننده"]],
  [/اسپری|فوم|ادکلن|عطر|بو\s*گیر/, ["اسپری و فوم"]],
  [/مسواک|خمیر\s*دندان|خمیردندان|بهداشت\s*دهان/, ["بهداشت دهان"]],
  [/برس|پرزگیر|شانه|ناخن\s*گیر|قیچی|ماشین\s*اصلاح/, ["ابزار آرایش و نظافت"]],
  [/قطره|شربت|قرص|ضد\s*انگل|پماد|دارو|درمان\s*کرم/, ["دارو و درمان"]],
  [/مکمل|ویتامین|پروبیوتیک|کلسیم|امگا/, ["مکمل و ویتامین"]],
  [/خمیر\s*مالت|گلوله\s*مویی/, ["خمیر مالت"]],
  [/اسکرچر|درخت\s*گربه/, ["اسکرچر و درخت"]],
  [/اسباب\s*بازی|توپ|تونل|عروسک|لیزر/, ["اسباب‌بازی"]],
  [/ظرف\s*آب|آبخوری|فواره|غذاخوری|ظرف\s*غذا/, ["ظرف آب و غذا"]],
  [/تخت|تشک|جای\s*خواب|لانه|پتو/, ["جای خواب"]],
  [/باکس\s*حمل|کریر|حمل\s*و\s*نقل|کوله/, ["حمل و نقل"]],
  [/قلاده|هارنس|افسار|پلاک/, ["قلاده و هارنس"]],
  [/لباس|کاپشن|بارانی/, ["لباس"]],
  [/قفس|آکواریوم|اکواریوم|فیلتر\s*آب/, ["قفس و آکواریوم"]],
];

/** All product_type values implied by the shopper's wording (longest intent wins first). */
function detectProductTypes(text: string): string[] {
  const norm = normalizePersian(text || "");
  const out: string[] = [];
  for (const [re, types] of TYPE_SYNONYMS) {
    if (re.test(norm)) for (const t of types) if (!out.includes(t)) out.push(t);
    if (out.length >= 4) break;
  }
  return out;
}

/** Words already handled by the taxonomy must not also be used as text evidence. */
const TAXONOMY_WORDS =
  /غذای\s*تر|غذای\s*مرطوب|کنسرو|پوچ|سوپ|غذای\s*خشک|تشویقی|خاک|شامپو|اسپری|مسواک|مکمل|ویتامین|اسکرچر|اسباب\s*بازی|قلاده|جای\s*خواب|ظرف/;



// ── Part 5: closed taxonomy vocabulary (database-owned) ──
type TaxonomyMap = Record<string, Record<string, string>>;
let TAXONOMY_CACHE: TaxonomyMap | null = null;

async function loadTaxonomy(supabase: any): Promise<TaxonomyMap> {
  if (TAXONOMY_CACHE) return TAXONOMY_CACHE;
  const map: TaxonomyMap = {};
  const add = (dim: string, key: string, canonical: string) => {
    map[dim] = map[dim] || {};
    map[dim][normalizePersian(key)] = canonical;
  };
  try {
    const [terms, aliases] = await Promise.all([
      supabase.from("pet_taxonomy_terms").select("dimension_key, canonical_fa").eq("is_active", true),
      supabase.from("pet_taxonomy_aliases").select("dimension_key, alias, canonical_fa"),
    ]);
    for (const t of terms.data || []) add(t.dimension_key, t.canonical_fa, t.canonical_fa);
    for (const a of aliases.data || []) add(a.dimension_key, a.alias, a.canonical_fa);
    TAXONOMY_CACHE = map;
  } catch (e) {
    console.log("Taxonomy load failed:", String(e));
  }
  return map;
}

/** Canonical term, or null when the value is outside the closed vocabulary. */
function canonicalTerm(tax: TaxonomyMap, dimension: string, value: string | null | undefined): string | null {
  if (!value) return null;
  const dim = tax[dimension];
  if (!dim) return value; // taxonomy unavailable → keep caller value
  return dim[normalizePersian(String(value))] || null;
}


// ── Catalog brand vocabulary ────────────────────────────────────────────────
// Brands are recognised ONLY from the real catalog (+ alias table). Colloquial
// Persian words the model sometimes mistakes for a brand («چیا» in «چانک چیا
// دارین») must never become a brand filter or an "we don't carry it" claim.
let BRAND_CACHE: { canonical: string[]; keys: Set<string> } | null = null;
const BRAND_STOPWORDS = new Set(
  [
    "چیا", "چیه", "چی", "چه", "کدوم", "کدام", "دارین", "دارید", "داری", "دارین؟",
    "خارجی", "داخلی", "ایرانی", "اصل", "ارزون", "گران", "گرون", "خوب", "بهترین",
    "چانک", "پوچ", "کنسرو", "غذا", "تشویقی", "گربه", "سگ", "خرگوش", "پرنده",
    "برند", "مارک", "لیست", "همه", "موجود", "بگو", "معرفی",
  ].map((w) => normalizePersian(w)),
);

async function loadBrands(supabase: any): Promise<{ canonical: string[]; keys: Set<string> }> {
  if (BRAND_CACHE) return BRAND_CACHE;
  const keys = new Set<string>();
  const canonical: string[] = [];
  try {
    const [prods, aliases] = await Promise.all([
      supabase.from("pet_products").select("brand").not("brand", "is", null),
      supabase.from("brand_aliases").select("alias_key, canonical"),
    ]);
    for (const row of prods.data || []) {
      const b = String(row.brand || "").trim();
      if (!b) continue;
      if (!canonical.includes(b)) canonical.push(b);
      keys.add(normalizePersian(b));
    }
    for (const a of aliases.data || []) {
      if (a.alias_key) keys.add(normalizePersian(String(a.alias_key)));
      if (a.canonical) keys.add(normalizePersian(String(a.canonical)));
    }
    BRAND_CACHE = { canonical, keys };
  } catch (e) {
    console.log("Brand vocabulary load failed:", String(e));
  }
  return BRAND_CACHE || { canonical, keys };
}

/**
 * 'catalog'  → a brand we actually stock (filter it)
 * 'unknown'  → looks like a brand name but we don't stock it (honest disclosure)
 * 'not-a-brand' → a colloquial word the model mislabelled (ignore silently)
 */
function classifyBrand(raw: string, vocab: { keys: Set<string> }): "catalog" | "unknown" | "not-a-brand" {
  const n = normalizePersian(raw).trim();
  if (!n) return "not-a-brand";
  if (BRAND_STOPWORDS.has(n)) return "not-a-brand";
  for (const key of vocab.keys) {
    if (key.length >= 3 && (key.includes(n) || n.includes(key))) return "catalog";
  }
  const latin = /^[a-z0-9\s&'.-]+$/i.test(n);
  if (latin && n.length >= 3) return "unknown";
  return n.length >= 4 ? "unknown" : "not-a-brand";
}

/**
 * Catalog-grounded brand list for questions like «چه برندهای خارجی برای پوچ گربه
 * دارین» or the follow-up «خارجیاشون کدومن؟». Returns prose, never product cards.
 */
async function brandListAnswer(
  supabase: any,
  text: string,
  lockedSpecies?: string | null,
): Promise<string | null> {
  const norm = normalizePersian(text || "");
  const wantsForeign = /(خارجی|وارداتی|اورجینال|import)/.test(norm);
  const wantsIranian = /(ایرانی|داخلی|تولید ایران)/.test(norm);
  const species = lockedSpecies || detectSpecies(norm);
  const types = detectProductTypes(norm);

  let q = supabase
    .from("pet_products")
    .select("brand, origin_country, species, product_type")
    .eq("in_stock", true)
    .not("brand", "is", null)
    .limit(3000);
  if (species && !["سایر حیوانات خانگی", "ماهی و آکواریوم"].includes(species)) q = q.eq("species", species);
  if (types.length > 0) q = q.in("product_type", types);

  const { data, error } = await q;
  if (error || !data || data.length === 0) return null;

  const brands: string[] = [];
  for (const row of data) {
    const origin = normalizePersian(String(row.origin_country || ""));
    if (wantsForeign && (!origin || /ایران/.test(origin))) continue;
    if (wantsIranian && !/ایران/.test(origin)) continue;
    const b = String(row.brand || "").trim();
    if (b && !brands.includes(b)) brands.push(b);
  }
  if (brands.length === 0) return null;

  const scope = [
    wantsForeign ? "خارجی" : wantsIranian ? "ایرانی" : "",
    types.length > 0 ? types[0] : "",
    species ? species : "",
  ].filter(Boolean).join(" ");
  const list = brands.slice(0, 25).join("، ");
  return scope
    ? `برای ${scope} این برندها رو موجود داریم: ${list}.`
    : `این برندها رو موجود داریم: ${list}.`;
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
  // Umbrella buckets ("سایر حیوانات خانگی", "ماهی و آکواریوم") are NOT catalog values —
  // the catalog stores جوندگان / خرگوش / ... , so a literal filter would return nothing.
  // For those we skip the SQL filter and rely on the post-retrieval species lock.
  const UMBRELLA_SPECIES = ["سایر حیوانات خانگی", "ماهی و آکواریوم"];
  const rawSpecies = lockedSpecies || species || null;
  const taxForSpecies = await loadTaxonomy(supabase);
  const rpcSpecies = canonicalTerm(taxForSpecies, "species", rawSpecies) || rawSpecies;
  if (rpcSpecies && !UMBRELLA_SPECIES.includes(rpcSpecies)) rpcParams.p_species = rpcSpecies;

  const brandVocab = await loadBrands(supabase);
  const brandClass = filters?.brand ? classifyBrand(String(filters.brand), brandVocab) : "not-a-brand";
  if (filters?.brand && brandClass !== "not-a-brand") rpcParams.p_brand = filters.brand;
  else if (filters?.brand) console.log(`Ignoring non-brand word as brand filter: ${filters.brand}`);

  if (filters?.product_line) rpcParams.p_product_line = filters.product_line;
  if (filters?.origin_country) rpcParams.p_origin_country = filters.origin_country;
  // Closed vocabulary: non-canonical values never become filters, they degrade to
  // free-text evidence so the shopper still gets grounded results.
  const tax = await loadTaxonomy(supabase);
  const degraded: string[] = [];
  const canon = (dim: string, v: any) => {
    const c = canonicalTerm(tax, dim, v);
    if (!c && v) degraded.push(String(v));
    return c;
  };
  const canonStage = canon("life_stage", filters?.life_stage);
  if (canonStage) rpcParams.p_life_stage = canonStage;
  const rawBreedSize = filters?.breed_size || inferBreedSize(`${breed || ""} ${query_text || ""}`);
  const breedSize = canon("breed_size", rawBreedSize);
  if (breedSize) rpcParams.p_breed_size = breedSize;
  if (Array.isArray(filters?.needs) && filters.needs.length > 0) {
    const canonNeeds = filters.needs.map((n: string) => canon("health_need", n)).filter(Boolean);
    if (canonNeeds.length > 0) rpcParams.p_needs = canonNeeds;
  }
  if (degraded.length > 0) console.log("Non-canonical filter values degraded to evidence:", degraded.join(", "));
  if (filters?.price_max) rpcParams.p_max_price = filters.price_max;
  if (filters?.price_min) rpcParams.p_min_price = filters.price_min;
  // Deterministic taxonomy: the shopper's category word decides the shelf, not the
  // literal product names. When it resolves, it replaces the model's shelf guess.
  const requestedTypes = detectProductTypes(
    `${query_text || ""} ${Array.isArray(evidence_terms) ? evidence_terms.join(" ") : ""}`
  );
  if (requestedTypes.length > 0) {
    rpcParams.p_product_types = requestedTypes;
    delete rpcParams.p_subcategory;
    delete rpcParams.p_subcategory_prefix;
  }
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
  const { p_embedding: _emb, ...logParams } = rpcParams;
  console.log("search:", JSON.stringify(logParams), "→", data.length);

  // Part 3 — Pet-specific context-aware relaxation tiers.
  // Tier 0 hard compatibility is never removed: species, product type/group, subcategory, price, stock.
  // Tier 1 critical fit (life stage, medical needs, explicit breed size) is kept unless relaxation is unavoidable.
  // Tier 2 strong preference (non-critical needs, brand, country) is relaxed with disclosure.
  // Tier 3 soft preference (flavour, product line, sorting) is relaxed first.
  const relaxedLabels: string[] = [];
  // Medical/therapeutic needs are Tier 1: they are only dropped as a last resort,
  // while cosmetic/comfort needs (skin&coat, dental, indoor...) are Tier 2.
  const CRITICAL_NEEDS = ["درمانی", "کلیه و مجاری ادرار", "گوارش حساس", "ضد حساسیت", "مفاصل"];
  const askedNeeds: string[] = Array.isArray(rpcParams.p_needs) ? rpcParams.p_needs : [];
  const criticalNeeds = askedNeeds.filter((n) => CRITICAL_NEEDS.includes(n));
  const softNeeds = askedNeeds.filter((n) => !CRITICAL_NEEDS.includes(n));

  const tieredRelaxations: Array<{ label: string; apply: (p: any) => void }> = [
    { label: "product_line", apply: (p) => { delete p.p_product_line; } },
    ...(softNeeds.length > 0 && criticalNeeds.length > 0
      ? [{ label: "non_critical_needs", apply: (p: any) => { p.p_needs = criticalNeeds; } }]
      : []),
    { label: "brand", apply: (p) => { delete p.p_brand; } },
    { label: "origin_country", apply: (p) => { delete p.p_origin_country; } },
    { label: "breed_size", apply: (p) => { delete p.p_breed_size; } },
    ...(criticalNeeds.length === 0
      ? [{ label: "needs", apply: (p: any) => { delete p.p_needs; } }]
      : []),
    { label: "life_stage", apply: (p) => { delete p.p_life_stage; } },
    ...(criticalNeeds.length > 0
      ? [{ label: "medical_needs", apply: (p: any) => { delete p.p_needs; } }]
      : []),
  ];

  let currentParams = { ...rpcParams };
  for (const step of tieredRelaxations) {
    if (data.length > 0) break;
    step.apply(currentParams);
    relaxedLabels.push(step.label);
    const retry = await runSearch(currentParams);
    if (retry && retry.length > 0) {
      data = retry;
      break;
    }
  }
  if (data.length === 0) relaxedLabels.length = 0;

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
  ]
    .filter((t: any) => typeof t === "string" && t.trim())
    // A word the taxonomy already enforced must not shrink the shelf again:
    // catalog names rarely spell out "غذای تر", so text evidence would wrongly empty it.
    .filter((t: string) => !(requestedTypes.length > 0 && TAXONOMY_WORDS.test(normalizePersian(t))))
    .slice(0, 8);

  // Part 2 — three-valued evidence: boost rows that mention the concept,
  // penalize rows that do not, but never remove them entirely.
  let evidenceUnconfirmed = false;
  if (terms.length > 0) {
    const normTerms = terms.map((t) => normalizePersian(t));
    const scored = results.map((p: any) => {
      const specText = Object.values(p.specs || {})
        .filter((v: any) => v && typeof v === "string")
        .join(" ");
      const haystack = normalizePersian(
        `${p.name_fa || ""} ${p.description_fa || ""} ${(p.tags || []).join(" ")} ${(p.health_needs || []).join(" ")} ${specText}`
      );
      const matched = normTerms.filter((t) => haystack.includes(t)).length;
      const boost = matched > 0 ? 0.12 + 0.04 * (matched - 1) : -0.06;
      return { ...p, _evidence_boost: boost, _evidence_matched: matched > 0 };
    });
    if (scored.every((p: any) => !p._evidence_matched)) evidenceUnconfirmed = true;
    results = scored
      .sort((a: any, b: any) => {
        const scoreDiff = (b.final_score + b._evidence_boost) - (a.final_score + a._evidence_boost);
        if (Math.abs(scoreDiff) > 0.0001) return scoreDiff;
        return (b.rating || 0) - (a.rating || 0);
      })
      .map(({ _evidence_boost, _evidence_matched, ...p }: any) => p);
  }

  if (Number(offset) > 0) results = results.slice(Math.floor(Number(offset)));

  if (sort_by === "price_low") results.sort((a: any, b: any) => a.price - b.price);
  else if (sort_by === "price_high") results.sort((a: any, b: any) => b.price - a.price);
  else if (sort_by === "rating") results.sort((a: any, b: any) => b.rating - a.rating);

  // Stated life stage: matching rows lead, contradictory rows are kept but deprioritized
  // because the SQL already applies a three-valued penalty; here we just re-sort for stability.
  results = applyStagePreference(results, lock?.lifeStage || filters?.life_stage || null);


  // Honest fallback signal: the shopper named a REAL brand we cannot serve.
  // Colloquial words misread as brands never produce this claim.
  const requestedBrand = filters?.brand && brandClass !== "not-a-brand" ? String(filters.brand).trim() : "";
  const brandUnavailable =
    requestedBrand.length > 0 &&
    !results.some((r: any) =>
      normalizePersian(String(r.brand || "")).includes(normalizePersian(requestedBrand)),
    );

  return {
    matched_total: results.length,
    shown: results.length,
    requested_brand: requestedBrand || null,
    brand_unavailable: brandUnavailable,

    evidence_unconfirmed: evidenceUnconfirmed,
    filters_relaxed: relaxedLabels.length > 0,
    relaxed_filters: relaxedLabels,
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

const FA_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
const faNum = (n: number | string) => String(n).replace(/\d/g, (d) => FA_DIGITS[Number(d)]);

/**
 * Deterministic, always-correctly-shaped product answer built from catalog data:
 * a short intro (max 3 lines) + per product one numbered line and one "why" line.
 * Used whenever the answer model returns empty or shapeless content, so the shopper
 * never sees a bare placeholder sentence.
 */
function composeProductAnswer(products: any[], query: string): string {
  const list = (products || []).filter(Boolean);
  if (list.length === 0) {
    return "نتیجه مناسبی پیدا نکردم؛ می‌تونی نیازت رو کمی دقیق‌تر بگی؟";
  }
  // A shop assistant never repeats the customer's sentence back at them.
  const q = normalizePersian(String(query || ""));
  const animal = /گربه/.test(q) ? "گربه" : /سگ/.test(q) ? "سگ" : /خرگوش/.test(q) ? "خرگوش" : /پرنده|مرغ عشق|طوطی/.test(q) ? "پرنده" : "";
  const intro = animal
    ? `چند گزینه خوب برای ${animal}ت دارم:`
    : "چند گزینه خوب برات پیدا کردم:";

  const blocks = list.map((p: any, i: number) => {
    const name = p.name_fa || p.name || "محصول";
    const price = typeof p.price === "number" ? `${faNum(p.price.toLocaleString("en-US"))} تومان` : "";
    const head = `${faNum(i + 1)}. ${name}${price ? ` — ${price}` : ""}`;

    // One human sentence, built from what actually makes THIS product a fit.
    const parts: string[] = [];
    if (Array.isArray(p.health_needs) && p.health_needs.length) {
      parts.push(`برای ${p.health_needs.slice(0, 2).join(" و ")} فرموله شده`);
    }
    if (p.life_stage) parts.push(`مناسب ${p.life_stage}`);
    if (p.breed_size && p.species === "سگ") parts.push(`برای نژاد ${p.breed_size}`);
    if (p.brand && p.origin_country) parts.push(`از ${p.brand} ساخت ${p.origin_country}`);
    else if (p.brand) parts.push(`از برند ${p.brand}`);
    else if (p.origin_country) parts.push(`ساخت ${p.origin_country}`);
    if (p.weight) parts.push(`بسته ${p.weight}`);

    const why = parts.length
      ? `${parts.slice(0, 3).join("، ")}.`
      : "یکی از پرفروش‌ترین گزینه‌های همین دسته‌ست.";
    return `${head}\n${why}`;
  });
  return [intro, "", blocks.join("\n\n")].join("\n");
}


/** True when the text has no numbered product lines (so it can't carry per-product reasons). */
function hasNumberedProducts(text: string): boolean {
  return (text.match(/^\s*[0-9۰-۹]{1,2}[.)\-–]\s*\S/gmu) || []).length > 0;
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
  // Leftover candidate brackets after id removal: "[]", "[7]"
  t = t.replace(/\[\s*[0-9\u06F0-\u06F9]{0,3}\s*\]/g, "");
  t = t.replace(/[ \t]{2,}/g, " ");
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

// "چندتا ... پیشنهاد بده" asks for a few products, not for a count.
const ASKS_FOR_SOME_RE = /(چند\s*تا|چندتا|چند\s*مدل)[^؟]{0,40}(پیشنهاد|معرفی|بگو|بده|نشون|بیار)/;


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
  ["گربه", /گربه|گربم|گربه\s*م|پیشی|پیشیم|بچه\s*گربه|cat/i],
  ["سگ", /سگ|سگم|توله|پاپی|dog/i],

  ["پرنده", /پرنده|پرندگان|طوطی|قناری|مینا|عروس\s*هلندی|کاسکو|فنچ|کبوتر|مرغ\s*عشق/],
  ["ماهی و آکواریوم", /ماهی|آبزیان|آکواریوم|اکواریوم/],
  // NOTE: "موش" is deliberately excluded — «پوست و موش» (its skin and coat) would
  // otherwise be read as a rodent and hijack the species lock.
  ["سایر حیوانات خانگی", /جونده|جوندگان|خرگوش|همستر|خوکچه|خزنده|لاک\s*پشت|سنجاب|فرت/],
];

function speciesRe(label: string | null): RegExp | null {
  if (!label) return null;
  for (const [name, re] of SPECIES_TOKENS) if (name === label) return re;
  return null;
}

/** The animal named LAST in this text — a message can mention two. */
function lastNamedSpecies(text: string): string | null {
  const norm = normalizePersian(text || "");
  let best: string | null = null;
  let bestAt = -1;
  for (const [name, re] of SPECIES_TOKENS) {
    const g = new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g");
    let m: RegExpExecArray | null;
    while ((m = g.exec(norm)) !== null) {
      if (m.index >= bestAt) { bestAt = m.index; best = name; }
      if (m.index === g.lastIndex) g.lastIndex++;
    }
  }
  return best;
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
  const exact = (rows || []).filter((r) => r?.life_stage === stage);
  const rest = (rows || []).filter((r) => r?.life_stage !== stage);
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

/**
 * Umbrella buckets ("سایر حیوانات خانگی", "ماهی و آکواریوم") are not shelf words.
 * Use the concrete animal the shopper actually named so shelf queries hit real rows.
 */
const CONCRETE_PET_WORDS: Array<[string, RegExp]> = [
  ["خرگوش", /خرگوش/],
  ["همستر", /همستر/],
  ["خوکچه هندی", /خوکچه/],
  ["جوندگان", /جونده|جوندگان|سنجاب/],
  ["خزندگان", /خزنده|لاک\s*پشت|مارمولک/],
  ["فرت", /فرت/],
  ["ماهی", /ماهی|آبزیان|آکواریوم|اکواریوم/],
];

function concreteSpeciesWord(species: string, userText: string): string {
  const norm = normalizePersian(userText || "");
  if (species === "سایر حیوانات خانگی" || species === "ماهی و آکواریوم") {
    const hit = CONCRETE_PET_WORDS.find(([, re]) => re.test(norm));
    if (hit) return hit[0];
  }
  return species;
}

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

// ── Bounded agentic tool loop helpers ──
type ToolRoundResult = {
  products: any[];
  toolResults: any[];
  searchExecuted: boolean;
  extractedIntent: any;
  bundleGroups: Array<{ label: string; products: any[] }>;
  emptyNeedLabels: string[];
  unavailableBrand: string | null;
};

async function runToolRound(
  supabase: any,
  choice: any,
  precomputedEmbedding: number[] | null,
  speciesLock: { species?: string | null; lifeStage?: string | null },
  lockedSpecies: string | null,
  isBundleTurn: boolean,
  bundleNeeds: NeedSpec[],
  lastUserText = "",
): Promise<ToolRoundResult> {
  const result: ToolRoundResult = {
    products: [],
    toolResults: [],
    searchExecuted: false,
    extractedIntent: null,
    bundleGroups: [],
    emptyNeedLabels: [],
    unavailableBrand: null,
  };

  for (const toolCall of choice.message.tool_calls) {
    const funcName = toolCall.function?.name;
    let funcArgs: any;
    try {
      funcArgs = JSON.parse(toolCall.function?.arguments || "{}");
    } catch {
      funcArgs = {};
    }

    console.log(`Tool: ${funcName}`, JSON.stringify(funcArgs));

    let toolResult: any;
    if (funcName === "search_products") {
      result.searchExecuted = true;
      result.extractedIntent = funcArgs;
      const searched = await executeSearch(supabase, funcArgs, precomputedEmbedding, speciesLock);
      if (searched.products) result.products = [...result.products, ...searched.products];
      if (searched.brand_unavailable && searched.requested_brand) result.unavailableBrand = searched.requested_brand;
      toolResult = {
        matched_total: searched.matched_total ?? 0,
        shown: searched.shown ?? 0,
        evidence_unconfirmed: searched.evidence_unconfirmed || false,
        requested_brand: searched.requested_brand || null,
        brand_unavailable: searched.brand_unavailable || false,
        filters_relaxed: searched.filters_relaxed || false,
        relaxed_filters: searched.relaxed_filters || [],
        searched_with: searched.searched_with || {},
        products: (searched.products || []).map((p: any) => ({
          id: p.id, name: p.name_fa, price: p.price, brand: p.brand, rating: p.rating,
        })),
      };
    } else if (funcName === "business_faq_lookup") {
      toolResult = await executeFaqLookup(supabase, funcArgs, precomputedEmbedding);
    } else if (funcName === "brand_or_general_lookup") {
      toolResult = await executeWebLookup(funcArgs);
    } else if (funcName === "catalog_facets") {
      toolResult = await executeFacets(supabase, funcArgs, lockedSpecies);
    } else if (funcName === "recall_products") {
      const ids: string[] = Array.isArray(funcArgs.product_ids) ? funcArgs.product_ids.slice(0, 12) : [];
      if (ids.length > 0) {
        const { data: recalled } = await supabase.from("pet_products").select("*").in("id", ids);
        const ordered = filterBySpecies(
          ids.map((id) => (recalled || []).find((p: any) => p.id === id)).filter(Boolean),
          lockedSpecies,
        );
        result.products = [...result.products, ...ordered];
        toolResult = { products: ordered.map((p: any) => ({ id: p.id, name: p.name, price: p.price })) };
      } else {
        toolResult = { products: [] };
      }
    } else if (funcName === "get_product_details") {
      toolResult = await getProductDetails(supabase, funcArgs.product_id);
    } else {
      toolResult = { error: "Unknown tool" };
    }

    result.toolResults.push({
      role: "tool",
      tool_call_id: toolCall.id,
      content: JSON.stringify(toolResult),
    });
  }

  if (isBundleTurn && result.searchExecuted) {
    // For umbrella buckets the bucket label is not a shelf word — use the animal the shopper named.
    const sp = concreteSpeciesWord(lockedSpecies as string, lastUserText);
    const groups = await Promise.all(
      bundleNeeds.slice(0, 5).map(async (need) => {
        const queries = needShelfQueries(need, sp);
        const found: any[] = [];
        for (const q of queries) {
          const r = await executeSearch(supabase, { query_text: q, species: sp, limit: 6 }, null, speciesLock);
          for (const p of r.products || []) if (!found.some((f) => f.id === p.id)) found.push(p);
          if (found.length >= 3) break;
        }
        return { label: need.label, products: found.slice(0, 2) };
      }),
    );
    result.bundleGroups = groups.filter((g) => g.products.length > 0);
    result.emptyNeedLabels = groups.filter((g) => g.products.length === 0).map((g) => g.label);
    const bundleProducts: any[] = [];
    for (const g of result.bundleGroups) {
      for (const p of g.products) if (!bundleProducts.some((x) => x.id === p.id)) bundleProducts.push(p);
    }
    if (bundleProducts.length > 0) result.products = bundleProducts.slice(0, 9);
  }

  return result;
}

function mergeProducts(existing: any[], incoming: any[]): any[] {
  const seen = new Set(existing.map((p) => p.id));
  const merged = [...existing];
  for (const p of incoming) {
    if (p && p.id && !seen.has(p.id)) {
      merged.push(p);
      seen.add(p.id);
    }
  }
  return merged;
}

function buildDiscoveryGuardQuery(
  userText: string,
  lockedSpecies: string | null,
  lockedStage: string | null,
  facetFamily: string | null,
): any {
  const norm = normalizePersian(userText);
  const detectedTypes = detectProductTypes(userText);

  const family = facetFamily ||
    (detectedTypes.includes("غذای خشک") && lockedSpecies === "گربه" ? "غذای خشک گربه" :
     detectedTypes.includes("غذای خشک") && lockedSpecies === "سگ" ? "غذای خشک سگ" :
     detectedTypes.some((t) => ["کنسرو", "پوچ", "سوپ", "غذای تر"].includes(t)) && lockedSpecies === "گربه" ? "کنسرو و پوچ و غذای تر گربه" :
     detectedTypes.some((t) => ["کنسرو", "پوچ", "سوپ", "غذای تر"].includes(t)) && lockedSpecies === "سگ" ? "کنسرو و پوچ و غذای تر سگ" :
     lockedSpecies === "گربه" ? "غذای خشک گربه" :
     lockedSpecies === "سگ" ? "غذای خشک سگ" : "");

  const evidenceTerms: string[] = [];
  if (/پوست و مو|پوست|مو|ریزش مو|hair|skin/i.test(norm)) evidenceTerms.push("پوست و مو", "پوست", "مو");
  if (/گوارش|حساسیت|معده|digest|sensitive/i.test(norm)) evidenceTerms.push("گوارش", "حساسیت");
  if (/کلیه|مجاری ادرار|kidney|urinary/i.test(norm)) evidenceTerms.push("کلیه", "مجاری ادرار");
  if (/عقیم|steril/i.test(norm)) evidenceTerms.push("عقیم شده");
  if (/وزن|رژیم|چاق|diet|weight/i.test(norm)) evidenceTerms.push("کنترل وزن");
  if (/گلوله مویی|هربال|hairball/i.test(norm)) evidenceTerms.push("گلوله مویی", "هربال");
  if (/دندان|مفاصل|ایمنی|سلامت/i.test(norm)) evidenceTerms.push("دندان", "مفاصل", "ایمنی");

  return {
    query_text: userText.slice(0, 80),
    subcategory_family: family || undefined,
    species: lockedSpecies || undefined,
    filters: {
      ...(lockedStage ? { life_stage: lockedStage } : {}),
    },
    evidence_terms: evidenceTerms.length > 0 ? Array.from(new Set(evidenceTerms)) : undefined,
    limit: 20,
  };
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
    const wantsCounts = COUNT_QUESTION_RE.test(normLastUser) && !ASKS_FOR_SOME_RE.test(normLastUser);
    const isBusinessQuestion = BUSINESS_RE.test(normLastUser);
    // Assortment/brand knowledge questions are answered in words (facts, brand names),
    // so they must not be turned into a product-recommendation turn.
    const isInfoQuestion = INFO_QUESTION_RE.test(normLastUser);
    if (isInfoQuestion) {
      systemPrompt += `\n\nINFO_QUESTION_TURN: این سؤال درباره‌ی خودِ برندها یا ترکیب کاتالوگه، نه درخواست محصول.
- برای فهرست برند/کشور/دسته: در همین نوبت catalog_facets را صدا بزن و فقط «اسم‌ها» را بنویس (بدون تعداد و بدون قیمت مگر کاربر خواسته باشد).
- برای معرفی یک برند: catalog_facets و در صورت نیاز brand_or_general_lookup را صدا بزن و در چند خط کوتاه معرفی کن (کشور سازنده، جایگاه، چه دسته‌هایی از آن برند در پت‌آباد هست).
- محصول پیشنهاد نده و لیست شماره‌دار محصول نساز؛ جواب متنی و روان باشه. در پایان می‌تونی بپرسی از کدوم برند محصول ببینه.`;
    }
    // Comparison turns are about products already in the conversation, not a new list.
    const isCompareQuestion = COMPARE_RE.test(normLastUser);
    if (isCompareQuestion) {
      systemPrompt += `\n\nCOMPARE_TURN: کاربر مقایسه خواسته.
- اگر محصولات موردنظر در حافظه‌ی گفتگو (product_memory) هستند، همان‌ها را مقایسه کن و محصول جدید معرفی نکن.
- اگر فقط نام برند/مدل را گفته و در حافظه نیست، برای هر طرف مقایسه یک جستجوی جدا با فیلتر همان برند و همان دستهٔ محصول و همان حیوان انجام بده و فقط یک گزینهٔ شاخص از هر برند بیار.
- خروجی: چند خط مقایسهٔ واقعی (قیمت، کشور سازنده، مناسب چه نیازی، تفاوت اصلی) و در آخر یک جمله توصیه.
- هرگز محصولی از حیوان یا دستهٔ دیگر (مثلاً غذای سگ در مقایسهٔ گربه) نیاور.`;
    }
    if (isBusinessQuestion) {
      systemPrompt += `\n\nPOLICY_ABOUT_A_PRODUCT: اگر کاربر سیاستی را دربارهٔ «محصول اول/دوم/شماره X» یا محصولی که قبلاً نشان دادی پرسیده، اول با نام همان محصول جواب صریح بده (بله/خیر + توضیح کوتاه)، بعد شرط‌ها را بگو. جمله‌ی بی‌فاعل مثل «توجه داشته باشید...» ننویس.`;
    }

    const knownUsage = detectUsage(lastUserText);
    let knownSpecies = detectSpecies(lastUserText);

    // Store-policy questions are grounded in the official FAQ knowledge base only.
    if ((MODE_TOOLS[effectiveMode] || []).includes(FAQ_TOOL)) {
      systemPrompt += FAQ_GROUNDING_RULES;
      if (isBusinessQuestion) {
        systemPrompt += `\n\nBUSINESS_QUESTION_TURN: این پیام درباره سیاست‌ها یا خدمات فروشگاهه. در همین نوبت business_faq_lookup را صدا بزن و جواب را فقط از official_answer بنویس.`;
      }
    }


    // ── Species lock, re-resolved on every turn ──
    // The animal named LAST wins: last mention inside the newest message first,
    // then walking back. Switching animals mid-conversation is normal shopping.
    const userTurns = (userMessages || []).filter((m: any) => m.role === "user").map((m: any) => String(m.content || ""));
    let lockedSpecies: string | null = null;
    let lockedStage: string | null = null;
    let lockedFromTurn = 0;
    for (let i = userTurns.length - 1; i >= 0; i--) {
      const found = lastNamedSpecies(userTurns[i]);
      if (found) { lockedSpecies = found; lockedFromTurn = i; break; }
    }
    // Life stage counts only from the turn that named the current animal onwards,
    // so an earlier kitten mention cannot stick to a dog the shopper switched to.
    for (let i = userTurns.length - 1; i >= lockedFromTurn; i--) {
      const stage = detectLifeStage(userTurns[i]);
      if (stage) { lockedStage = stage; break; }
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
      systemPrompt += `\n\nSPECIES_LOCK: در این نوبت خرید برای «${lockedSpecies}» است.
- هرگز نگو پت‌آباد فقط برای «${lockedSpecies}» محصول داره یا برای حیوان دیگه‌ای خدمات نداره؛ فروشگاه برای همه حیوانات خانگی محصول داره.
- اگر کاربر در پیام جدیدش حیوان دیگری رو نام برد، بدون مقاومت و بدون توضیح اضافه همون حیوان جدید رو ادامه بده.
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

    // ── Bounded agentic tool loop (max 2 tool rounds, then final prose) ──
    const MAX_TOOL_ROUNDS = 2;
    const WALL_CLOCK_BUDGET_MS = 9000;
    const startTime = Date.now();
    const precomputedEmbedding = embeddingPromise ? await embeddingPromise : null;

    let roundMessages = [...aiMessages];
    let allProducts: any[] = [];
    let extractedIntent: any = null;
    let unavailableBrand: string | null = null;
    let searchExecuted = false;
    let toolTrace: string[] = [];
    let bundleGroups: Array<{ label: string; products: any[] }> = [];
    let emptyNeedLabels: string[] = [];
    let finalAssistantMessage: any = null;
    let faqToolExecuted = false;

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      if (Date.now() - startTime > WALL_CLOCK_BUDGET_MS) {
        console.log(`Wall clock budget reached before tool round ${round + 1}`);
        break;
      }

      const llmBody: any = {
        model: "google/gemini-3.1-flash-lite",
        messages: roundMessages,
      };
      if (tools.length > 0) {
        llmBody.tools = tools;
      }

      console.log(`Tool round ${round + 1}: LLM call...`);
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(llmBody),
      });

      if (!response.ok) {
        const status = response.status;
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
        const errText = await response.text();
        console.error("AI gateway error:", status, errText);
        return new Response(
          JSON.stringify({ error: "خطا در سرویس هوش مصنوعی" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const data = await response.json();
      const choice = data.choices?.[0];

      if (!choice) {
        return new Response(
          JSON.stringify({ content: "متوجه نشدم. می‌تونی دوباره بگی؟", products: [], quickReplies: [] }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // No tool calls → this is the final assistant message, exit loop and use it
      if (!choice.message?.tool_calls || choice.message.tool_calls.length === 0) {
        finalAssistantMessage = choice.message;
        console.log(`Tool round ${round + 1}: no tool calls, final prose`);
        break;
      }

      const toolNames = choice.message.tool_calls.map((t: any) => t.function?.name).filter(Boolean);
      console.log(`Tool round ${round + 1} tools:`, toolNames.join(", "));
      toolTrace.push(...toolNames);

      // Short-circuit: clarification / cart on first round only (preserves current UX)
      if (round === 0) {
        const clarifyCall = choice.message.tool_calls.find(
          (t: any) => t.function?.name === "ask_clarification"
        );
        if (clarifyCall) {
          let payload: any = {};
          try {
            payload = JSON.parse(clarifyCall.function.arguments);
          } catch {
            payload = {};
          }
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

        const cartCall = choice.message.tool_calls.find(
          (t: any) => t.function?.name === "execute_cart_operations"
        );
        if (effectiveMode === "cart_manipulation" || cartCall) {
          const toolCall = cartCall || choice.message.tool_calls[0];
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
      }

      // Execute tools
      const roundResult = await runToolRound(
        supabase,
        choice,
        precomputedEmbedding,
        speciesLock,
        lockedSpecies,
        isBundleTurn,
        bundleNeeds,
        lastUserText,
      );
      if (roundResult.unavailableBrand) unavailableBrand = roundResult.unavailableBrand;
      if (roundResult.searchExecuted) {
        searchExecuted = true;
        extractedIntent = roundResult.extractedIntent;
      }
      if (toolNames.includes("business_faq_lookup")) faqToolExecuted = true;
      allProducts = mergeProducts(allProducts, roundResult.products);
      if (roundResult.bundleGroups.length > 0) {
        bundleGroups = roundResult.bundleGroups;
        emptyNeedLabels = roundResult.emptyNeedLabels;
      }

      roundMessages.push(choice.message, ...roundResult.toolResults);
    }

    // ── Discovery guard: a product-discovery turn must never end without a search ──

    const isDiscoveryIntent = effectiveMode === "discovery" || effectiveMode === "agentic";
    if (isDiscoveryIntent && !searchExecuted && !wantsGuidance && !isBusinessQuestion && !isInfoQuestion) {
      console.log("Discovery guard: no search executed in tool loop, running deterministic search...");
      const guardQuery = buildDiscoveryGuardQuery(lastUserText, lockedSpecies, lockedStage, facetFamily);
      const guardSearch = await executeSearch(supabase, guardQuery, precomputedEmbedding, speciesLock);
      if (guardSearch.products?.length > 0) {
        allProducts = mergeProducts(allProducts, guardSearch.products);
        searchExecuted = true;
        toolTrace.push("search_products (discovery-guard)");
        console.log(`Discovery guard returned ${guardSearch.products.length} products`);
      }
    }

    // ── Direct response path: no products, no discovery intent, final message exists ──
    if (finalAssistantMessage && allProducts.length === 0 && !isDiscoveryIntent) {
      // Business/policy question answered without the FAQ tool = ungrounded. Redo it grounded.
      if (isBusinessQuestion && !faqToolExecuted) {
        const faq = await executeFaqLookup(supabase, { query: lastUserText }, precomputedEmbedding);
        if (faq.entries?.length > 0) {
          const kb = faq.entries.map((e: any, i: number) =>
            `${i + 1}) [${e.faq_id}] موضوع: ${e.category}\nسؤال رسمی: ${e.question}\nپاسخ رسمی: ${e.official_answer}${e.phone_numbers?.length ? `\nشماره تماس: ${e.phone_numbers.join(" / ")}` : ""}`
          ).join("\n\n");
          const grounded = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "google/gemini-3.1-flash-lite",
              messages: [
                { role: "system", content: `تو دستیار پت‌آباد هستی. فقط بر اساس پاسخ‌های رسمی زیر جواب بده.${FAQ_GROUNDING_RULES}\n\nپاسخ‌های رسمی مرتبط (بهترین تطابق: ${faq.best_match}):\n${kb}` },
                ...userMessages.map((m: any) => ({ role: m.role, content: m.content })),
              ],
            }),
          });
          if (grounded.ok) {
            const gj = await grounded.json();
            const gText = sanitizeVisibleText(extractSignals(gj.choices?.[0]?.message?.content || "").text);
            if (gText) {
              return new Response(
                JSON.stringify({
                  response_type: "message",
                  content: gText,
                  products: [],
                  faq_ids: faq.entries.map((e: any) => e.faq_id),
                  quickReplies: [],
                }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } },
              );
            }
          }
        }
      }

      const rawText = finalAssistantMessage.content || "";
      const sig = extractSignals(rawText);
      const mentionedIds = [
        ...((sig.text.match(UUID_RE) || []) as string[]),
        ...sig.likedIds,
        ...sig.selectedIds,
      ];
      const hydrated = await hydrateProducts(supabase, mentionedIds);
      let visible = sanitizeVisibleText(sig.text);
      if (!wantsCounts) visible = stripCountTalk(visible);

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
          content: hydrated.length > 0
            ? (visible && hasNumberedProducts(visible) ? visible : composeProductAnswer(hydrated, originalQuery))
            : (visible || "متوجه نشدم. می‌تونی دوباره بگی؟"),
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

    // ── Final re-ranker / prose generation ──
    console.log("Final response generation...");
    const requestedLimit = Number(extractedIntent?.limit) || 0;
    const comprehensive = requestedLimit >= 12;
    const maxShown = isBundleTurn ? Math.min(allProducts.length, 9) : comprehensive ? 12 : 6;
    const candidatesForRerank = isBundleTurn ? allProducts.slice(0, maxShown) : allProducts.slice(0, comprehensive ? 24 : 12);
    const candidateList = candidatesForRerank.map((p: any, i: number) =>
      `${i + 1}. [${p.id}] ${p.name_fa || p.name} — ${p.price?.toLocaleString()} تومان${p.brand ? ` — ${p.brand}` : ""}`
    ).join("\n");

    const bundleInstruction = isBundleTurn
      ? `\n\nBUNDLE_TURN: کاربر چند نیاز هم‌زمان داره. پاسخ باید گروه‌بندی‌شده باشه و شماره‌گذاری محصولات پیوسته و از ۱ شروع بشه.\n- گروه‌ها و محصولات مجاز فقط همین‌ها هستن (به همین ترتیب و هیچ محصول دیگری):\n${bundleGroups.map((g) => `${g.label}: ${g.products.map((p: any) => p.name_fa || p.name).join(" | ")}`).join("\n")}\n- دقیقاً به ${maxShown} محصول اشاره کن، نه بیشتر و نه کمتر.\n${emptyNeedLabels.length ? `- برای این نیازها محصول مناسب پیدا نشد، فقط صادقانه بگو گزینه مناسبی نداریم و جایگزین از حیوان دیگه پیشنهاد نده: ${emptyNeedLabels.join("، ")}` : ""}`
      : "";

    const rerankerInstruction = candidatesForRerank.length > 0
      ? `\n\nبا توجه به درخواست اصلی کاربر ("${originalQuery}")${extractedIntent?.semantic_tags?.length ? ` و تگ‌های معنایی استخراج‌شده (${extractedIntent.semantic_tags.join(", ")})` : ""}:\n- محصولاتی که با نیت کاربر مطابقت ندارن رو حذف کن\n- بهترین ۳ تا ${comprehensive ? "۱۲" : "۶"} محصول رو انتخاب کن\n- ساختار پاسخ دقیقاً این‌طوریه: اول حداکثر ۳ خط توضیح کلی کوتاه، بعد برای هر محصول یک خط شماره‌دار با نام و مشخصات کلیدی و قیمت، و بعدش در یک خط جدا یک جمله کوتاه که می‌گه چرا همین محصول برای درخواست کاربر مناسبه. بین محصولات یک خط خالی بذار\n- توضیح «چرا» باید مخصوص همون محصول باشه (نوع حیوان، برند، ترکیبات، وزن بسته، قیمت) نه جمله کلی تکراری\n${wantsCounts ? "- کاربر درباره تعداد/قیمت پرسیده؛ می‌تونی تعداد کل مطابق را بگی" : "- هیچ عددی از تعداد کل، تعداد کاندیدا یا بازه قیمت ننویس و درباره فرایند داخلی حرف نزن"}\n- بدون مارک‌داون (بدون ستاره و هشتگ)\n\nلیست کاندیداها:\n${candidateList}\n\nمهم: در انتهای پاسخت، در یک خط جدید، دقیقاً بنویس:\nSELECTED_IDS:["id1","id2","id3"]\nکه id ها همان شناسه‌های محصولات انتخابی تو هستن. ترتیب id ها باید با ترتیب معرفی محصولات در متنت یکی باشه.`
      : (isInfoQuestion || isBusinessQuestion)
        ? `\n\nANSWER_TURN: این نوبت یک سؤال اطلاعاتی درباره برندها، کاتالوگ یا خدمات فروشگاهه، نه درخواست محصول.
- فقط بر پایه نتایج ابزارهای همین نوبت (catalog_facets / brand_or_general_lookup / business_faq_lookup) جواب بده.
- جواب متنی، روان و کوتاه باشه؛ اگر فهرست برند/کشور/دسته خواسته شده، اسم‌ها رو پشت سر هم یا خط‌به‌خط بنویس${wantsCounts ? "" : " و عدد و تعداد ننویس"}.
- محصول پیشنهاد نده و لیست شماره‌دار محصول نساز. چیزی از خودت اضافه نکن؛ اگر داده نداری، صادقانه بگو.
- بدون مارک‌داون. SELECTED_IDS ننویس.`
        : `\n\nNO_RESULTS_TURN: برای درخواست "${originalQuery}" هیچ محصول مناسبی در کاتالوگ پیدا نشد. صادقانه بگو گزینه‌ای نداریم، دلیل کوتاه بگو (مثلاً فیلتر خاص یا کمبود داده)، و یک سوال کوتاه بپرس که نیاز کاربر رو روشن‌تر کنه یا گزینه نزدیک‌تری پیشنهاد بده. هیچ محصولی اختراع نکن.`;

    const followUpMessages = [
      ...roundMessages,
      ...(finalAssistantMessage ? [finalAssistantMessage] : []),
      { role: "system", content: rerankerInstruction + bundleInstruction },
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
          trace: { rounds: toolTrace.length, tools: toolTrace, search_executed: searchExecuted },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const followUpData = await followUpResponse.json();
    let rawFinal = followUpData.choices?.[0]?.message?.content || "";
    console.log(
      "Re-ranker raw length:", rawFinal.length,
      "finish:", followUpData.choices?.[0]?.finish_reason,
    );
    // A reasoning model can burn its budget and return empty content. Retry once
    // with a shorter instruction so the shopper always gets the per-product "why".
    if (!rawFinal.trim() && candidatesForRerank.length === 0 && (isInfoQuestion || isBusinessQuestion)) {
      // Informational turn came back empty: answer straight from this turn's tool facts.
      const retryInfo = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3.1-flash-lite",
          messages: [
            ...roundMessages.filter((m: any) => m.role !== "system"),
            { role: "system", content: `به سؤال کاربر ("${originalQuery}") کوتاه و روان و فارسی جواب بده، فقط بر پایه نتایج ابزارهای بالا. بدون مارک‌داون، بدون پیشنهاد محصول${wantsCounts ? "" : "، بدون نوشتن تعداد"}. اگر داده کافی نیست، صادقانه بگو.` },
          ],
        }),
      });
      if (retryInfo.ok) {
        const d = await retryInfo.json();
        rawFinal = d.choices?.[0]?.message?.content || "";
        console.log("Info answer retry length:", rawFinal.length);
      }
    }
    if (!rawFinal.trim() && candidatesForRerank.length > 0) {
      const retry = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3.1-flash-lite",
          messages: [
            { role: "system", content: `تو مشاور فروش پت‌آباد هستی. برای درخواست کاربر ("${originalQuery}") از این لیست بهترین ۳ تا ۶ محصول رو انتخاب کن.\nاول حداکثر ۳ خط توضیح کلی کوتاه بنویس، بعد برای هر محصول یک خط شماره‌دار با نام و قیمت و بعدش در خط جدا یک جمله بگو چرا همین محصول مناسبه. بدون مارک‌داون، بدون عدد تعداد کل.\nدر آخر یک خط: SELECTED_IDS:["id1","id2"]\n\n${candidateList}` },
            { role: "user", content: originalQuery },
          ],
        }),
      });
      if (retry.ok) {
        const retryData = await retry.json();
        rawFinal = retryData.choices?.[0]?.message?.content || "";
        console.log("Re-ranker retry length:", rawFinal.length);
      }
    }

    if (!rawFinal.trim() && (isInfoQuestion || isBusinessQuestion)) {
      rawFinal = String(finalAssistantMessage?.content || "");
    }

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

    const numberedCount = (finalContent.match(/^\s*[0-9۰-۹]{1,2}[.)\-–]\s*\S/gmu) || []).length;
    const parityCap = Math.min(Math.max(maxShown, numberedCount), 12);
    if (numberedCount > selectedProducts.length) {
      const have = new Set(selectedProducts.map((p: any) => p.id));
      for (const p of candidatesForRerank) {
        if (selectedProducts.length >= parityCap) break;
        if (!have.has(p.id)) {
          selectedProducts.push(p);
          have.add(p.id);
        }
      }
      console.log(`Parity fill → ${selectedProducts.length} cards for ${numberedCount} numbered items`);
    }
    if (numberedCount > 0 && selectedProducts.length > numberedCount) {
      selectedProducts = selectedProducts.slice(0, numberedCount);
      console.log(`Parity trim → ${numberedCount} cards`);
    }

    if (selectedProducts.length === 0) {
      const mentionedIds = [
        ...((finalContent.match(UUID_RE) || []) as string[]),
        ...likedIds,
      ];
      selectedProducts = await hydrateProducts(supabase, mentionedIds);
    }

    finalContent = sanitizeVisibleText(finalContent);
    if (!wantsCounts) finalContent = stripCountTalk(finalContent);

    // An informational answer (brand list, brand background) never carries product cards
    // unless the shopper explicitly asked for products in the same message.
    if (isInfoQuestion && sig.selectedIds.length === 0 && numberedCount === 0) selectedProducts = [];

    selectedProducts = filterBySpecies(selectedProducts, lockedSpecies);
    if (selectedProducts.length > parityCap) selectedProducts = selectedProducts.slice(0, parityCap);
    // Text/card parity in the other direction: if the answer names no product at all,
    // never render cards next to it (that produced "we have no rabbit food" + 4 cards).
    if (
      finalContent &&
      numberedCount === 0 &&
      sig.selectedIds.length === 0 &&
      !UUID_RE.test(finalContent) &&
      !selectedProducts.some((p: any) => finalContent.includes(String(p.name_fa || "").slice(0, 18)))
    ) {
      selectedProducts = [];
    }

    // Never ship a bare placeholder: when the model gave no text (or text with no
    // numbered products next to product cards), compose the answer from catalog data
    // so the shape is always intro + product + why.
    if (!isInfoQuestion && selectedProducts.length > 0 && (!finalContent || !hasNumberedProducts(finalContent))) {
      finalContent = composeProductAnswer(selectedProducts.slice(0, parityCap), originalQuery);
      console.log("Composed deterministic product answer");
    } else if (!finalContent) {
      // A brand/assortment question always has a real answer in the catalog.
      const grounded = isInfoQuestion ? await brandListAnswer(supabase, originalQuery, lockedSpecies) : null;
      finalContent = grounded
        || (isInfoQuestion
          ? "برای این سؤال اطلاعات دقیقی پیدا نکردم؛ می‌تونی دوباره با جزئیات بیشتر بپرسی؟"
          : "نتیجه مناسبی پیدا نکردم؛ می‌تونی نیازت رو کمی دقیق‌تر بگی؟");
      if (grounded) selectedProducts = [];
    }

    // "I couldn't find anything" is never an acceptable answer to a brand question.
    if (isInfoQuestion && /پیدا نکردم|موجود ندارم/.test(finalContent)) {
      const grounded = await brandListAnswer(supabase, originalQuery, lockedSpecies);
      if (grounded) { finalContent = grounded; selectedProducts = []; }
    }



    // Honest fallback: never silently swap a brand the shopper asked for.
    if (unavailableBrand && finalContent && !finalContent.includes(unavailableBrand)) {
      finalContent = `برند ${unavailableBrand} رو فعلاً موجود ندارم؛ نزدیک‌ترین گزینه‌های موجود اینا هستن:\n\n${finalContent}`;
    }

    // Persian digits everywhere in the visible answer.
    finalContent = finalContent.replace(/\d/g, (d) => FA_DIGITS[Number(d)]);

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
        trace: { rounds: toolTrace.length, tools: toolTrace, search_executed: searchExecuted },
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
