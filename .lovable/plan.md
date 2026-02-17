

# Add Intent-Driven Product Groups for Agentic Commerce

Currently, the `/gptcommerce` page only has **one product category** (headphones - 6 items) and the chat only responds to "هدفون" or "ایرپاد" queries. This severely limits the demo's ability to showcase agentic shopping value.

This plan adds **5 new product groups**, each designed around a specific **user intent** that highlights why AI-driven shopping beats traditional browse-and-filter ecommerce.

---

## New Product Groups & Intents

### 1. Skincare / Beauty - "Gift Recommendation" Intent
**Demo prompt:** "یه هدیه برای مادرم می‌خوام، به پوستش حساسه"
**Why agentic wins:** Traditional ecommerce can't understand "gift for mom with sensitive skin." The agent interprets context (gift, recipient persona, skin sensitivity) and curates a bundle.

**Products (6 items):**
- ست مراقبت پوست سراوی (CeraVe) - ۲,۸۰۰,۰۰۰ تومان
- سرم ویتامین C اوردینری - ۱,۹۰۰,۰۰۰ تومان  
- کرم مرطوب‌کننده لاروش پوزای - ۳,۵۰۰,۰۰۰ تومان
- ماسک ورقه‌ای کره‌ای (بسته ۱۰ عددی) - ۸۵۰,۰۰۰ تومان
- ست هدیه بادی شاپ - ۴,۲۰۰,۰۰۰ تومان
- روغن آرگان خالص - ۱,۲۰۰,۰۰۰ تومان

### 2. Coffee & Kitchen - "Routine Optimization" Intent
**Demo prompt:** "قهوه‌خور شدم، چی لازمه برای شروع؟"
**Why agentic wins:** Instead of searching "coffee maker" then "grinder" then "beans" separately, the agent understands the full intent ("I'm starting coffee as a hobby") and recommends a complete starter kit across categories.

**Products (6 items):**
- اسپرسوساز دلونگی - ۱۸,۵۰۰,۰۰۰ تومان
- آسیاب قهوه باراتزا - ۸,۹۰۰,۰۰۰ تومان
- قهوه تازه‌رست ایلی (۱ کیلو) - ۱,۴۰۰,۰۰۰ تومان
- فنجان اسپرسو ست ۶ تایی - ۹۵۰,۰۰۰ تومان
- تمپر و توزیع‌کننده قهوه - ۶۵۰,۰۰۰ تومان
- کتابچه آموزش باریستا - ۳۵۰,۰۰۰ تومان

### 3. Gaming Setup - "Budget-Constrained Bundle" Intent
**Demo prompt:** "با ۲۰ میلیون یه ست گیمینگ می‌خوام"
**Why agentic wins:** The agent respects a hard budget constraint, allocates spend optimally across monitor + keyboard + mouse + headset, and explains trade-offs -- impossible with traditional category filters.

**Products (6 items):**
- مانیتور گیمینگ ایسوس ۲۷ اینچ - ۹,۸۰۰,۰۰۰ تومان
- کیبورد مکانیکی ریزر - ۳,۲۰۰,۰۰۰ تومان
- موس گیمینگ لاجیتک G Pro - ۲,۸۰۰,۰۰۰ تومان
- هدست گیمینگ هایپرایکس - ۲,۵۰۰,۰۰۰ تومان
- پد موس بزرگ RGB - ۸۵۰,۰۰۰ تومان
- صندلی گیمینگ DXRacer - ۱۲,۵۰۰,۰۰۰ تومان

### 4. Baby & Kids - "Safety-First Decision" Intent
**Demo prompt:** "بچه‌م ۶ ماهشه، صندلی غذا و وسایل غذاخوری می‌خوام"
**Why agentic wins:** The agent factors in age-appropriateness, safety certifications, and material safety (BPA-free) -- nuances that traditional filters can't capture. Shows trust-building through expert recommendations.

**Products (6 items):**
- صندلی غذای کودک چیکو - ۷,۲۰۰,۰۰۰ تومان
- ست ظرف غذای بامبو - ۱,۱۰۰,۰۰۰ تومان
- قاشق سیلیکونی حساس به دما (ست ۴ تایی) - ۴۵۰,۰۰۰ تومان
- پیش‌بند سیلیکونی با جیب - ۳۸۰,۰۰۰ تومان
- لیوان آموزشی ۳۶۰ درجه - ۵۵۰,۰۰۰ تومان
- کتاب راهنمای تغذیه تکمیلی - ۲۸۰,۰۰۰ تومان

### 5. Fitness & Wellness - "Lifestyle Transition" Intent
**Demo prompt:** "می‌خوام ورزش رو شروع کنم، از کجا شروع کنم؟"
**Why agentic wins:** Understands vague, aspirational intent. Instead of dumping "fitness" category products, the agent asks clarifying questions and builds a personalized starter pack based on fitness level and goals.

**Products (6 items):**
- دمبل قابل تنظیم ست - ۴,۵۰۰,۰۰۰ تومان
- مت یوگا حرفه‌ای - ۱,۲۰۰,۰۰۰ تومان
- کش مقاومتی ست ۵ تایی - ۶۵۰,۰۰۰ تومان
- ساعت هوشمند شیائومی Band 8 - ۲,۸۰۰,۰۰۰ تومان
- بطری آب ورزشی ۱ لیتری - ۳۵۰,۰۰۰ تومان
- پودر پروتئین وی ۱ کیلویی - ۱,۸۰۰,۰۰۰ تومان

---

## Technical Changes

### File 1: `src/data/gptCommerceData.ts`

**Add 2 new merchants** to support the new categories:
- `m4`: "آرایشی‌بهداشتی آنلاین" (Health & Beauty marketplace)
- `m5`: "کالای ورزشی پرو" (Sports D2C)

**Add 30 new products** (6 per category) to `mockProducts` array with:
- Persian names, realistic Toman prices
- Unsplash images matching each product
- Distributed across merchants (m1-m5)
- Categories: `skincare`, `coffee`, `gaming`, `baby`, `fitness`
- Proper `rating`, `fastDelivery`, `returnGuarantee`, `originalPrice` (for some)

### File 2: `src/pages/GPTCommerce.tsx`

**Update `handleSendMessage`** (around line 635-648) to recognize new intent keywords:

Current matching logic only handles:
```
content.includes('هدفون') || content.includes('ایرپاد')
```

Expand to match:
- **Skincare/Gift:** هدیه, مراقبت پوست, کرم, زیبایی, آرایشی, مادر
- **Coffee:** قهوه, اسپرسو, باریستا, کافی
- **Gaming:** گیمینگ, بازی, مانیتور, کیبورد, ست گیمینگ
- **Baby:** بچه, کودک, نوزاد, صندلی غذا, سیسمونی
- **Fitness:** ورزش, فیتنس, بدنسازی, دمبل, یوگا

Each category returns a contextual agent response that demonstrates intent understanding, not just keyword matching. For example:
- Gift intent: "برای هدیه مادرت این محصولات عالین، مخصوصاً اگه پوست حساسی داره..."
- Budget intent: "با ۲۰ میلیون این ست رو می‌تونم پیشنهاد بدم..."
- Lifestyle intent: "عالیه که می‌خوای ورزش رو شروع کنی! این وسایل پایه‌ای رو نیاز داری..."

Also update the **default fallback message** (line 648) to include the new example prompts.

---

## Summary

| What | Where | Lines |
|------|-------|-------|
| Add 2 merchants + 30 products | `gptCommerceData.ts` | After existing mockProducts |
| Add keyword matching for 5 new categories | `GPTCommerce.tsx` | Lines ~635-648 |
| Add contextual agent responses per intent | `GPTCommerce.tsx` | Lines ~635-648 |
| Update fallback help text with new examples | `GPTCommerce.tsx` | Line ~648 |

