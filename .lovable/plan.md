

# RTL Fixes for Farsi Checkout Modal (`/farsi`)

All changes are limited to two files: `src/components/CheckoutModalLocalized.tsx` and `src/components/EnhancedUpsellCarouselLocalized.tsx`. No backend code.

---

## Issues Identified from Screenshots

### 1. Cart Step - Progress Bar Numbers (Screenshot 1)
The progress text `۱۴,۴۹۵,۰۰۰ / ۱۸,۰۰۰,۰۰۰ تومان` reads awkwardly in RTL. The numbers and "تومان" label should flow naturally right-to-left: the label "تومان" should come first (right), then the numbers.

**Fix:** Restructure the progress stats line so the currency unit ("تومان") is placed before the numbers in RTL, and wrap the numeric portion in a `dir="ltr"` span so digit groups render in the correct order.

### 2. Cart Step - Price Row Alignment (Screenshot 1)
The price rows for each cart item (e.g., `۲,۴۹۹,۰۰۰ تومان` with strikethrough) use `flex-row-reverse justify-end` which causes inconsistent alignment. In RTL, the current price should appear on the left side and old price on the right (natural RTL reading).

**Fix:** Remove `justify-end` from the price `flex` container in RTL mode. Let `flex-row-reverse` handle the ordering naturally without forcing end alignment.

### 3. Cart Step - Summary Labels vs Values (Screenshot 3)
The price breakdown section ("مجموع کالاها", "هزینه ارسال", "مبلغ نهایی") has labels appearing on the LEFT and values on the RIGHT. In a proper RTL layout, labels should be on the RIGHT and values on the LEFT.

**Fix:** The `flex-row-reverse` on these rows is already applied, but the issue is that `justify-between` with `flex-row-reverse` should already work. The actual problem is likely the parent `dir` attribute conflicting. Ensure each summary row has consistent `dir="rtl"` and that the label `<span>` comes first in DOM order (so `flex-row-reverse` places it on the right).

### 4. OTP Step - Phone Number Display (Screenshot 4)
The phone number `۹۲۹۲ ۹۲۹ ۲۹۲۹` is rendering with digit groups in reversed order. The formatted phone `۰۹۱۲ ۲۷۵ ۲۵۴۰` should display left-to-right even within the RTL context since phone numbers are always read LTR.

**Fix:** Wrap the phone number display in a `<span dir="ltr">` with `unicode-bidi: embed` or `isolate` to ensure digit groups maintain LTR order. The current code has `dir="ltr"` on the parent `<p>` but the mixing of RTL text ("کد ارسال شده به") with LTR numbers causes BiDi algorithm confusion. Separate the Farsi text and the number into distinct elements with explicit directionality.

### 5. OTP Step - Back Arrow Position (Screenshot 4)
The back arrow `->` appears on the LEFT side of the step header. In RTL, the back arrow should be on the RIGHT side (since "back" in RTL means going right).

**Fix:** The `StepHeader` component uses `BackArrow` which is already set to `ArrowRight` for RTL, but the flex layout places it incorrectly. The `flex-row-reverse` on the header container should handle this, but verify the arrow button is not being pushed to the wrong side by the flex layout. Ensure `flex-row-reverse` is correctly applied to the header row.

### 6. Payment Step - Address Block Numbers (Screenshot 5)
In the "تحویل به" section, the phone number `۰۹۱۲ ۳۴۵ ۶۷۸۹` and postal code `۱۲۳۴۵۶۷۸۹۰` are rendering with digit groups in wrong order due to BiDi conflicts.

**Fix:** Wrap phone numbers and postal codes in `<span dir="ltr" className="inline-block">` to isolate them from the RTL context.

### 7. Payment Step - Flowpoints Numbers (Screenshot 5)
The Flowpoints earned/redeemable values (`+۱۴۴` and `۴۲`) appear on the LEFT. In RTL they should be on the RIGHT (since flex-row-reverse is applied but the numbers are the second element).

**Fix:** Verify `flex-row-reverse` is correctly ordering label (right) and value (left) in the Flowpoints section. The current code has `flex-row-reverse` but the DOM order may need swapping.

### 8. Upsell Carousel - Select Dropdown RTL (Screenshot 2)
The Select dropdown items (e.g., "اینچ ۱۳", "اینچ ۱۵") show text in LTR order within the dropdown. The variant options with price modifiers show parenthesized prices in wrong position.

**Fix:** Add `dir="rtl"` to `SelectContent` and ensure `SelectItem` text flows right-to-left. The price modifier should appear in a natural position after the variant name in RTL reading order.

### 9. Upsell Carousel - Scroll Direction (Screenshot 2)
The carousel uses `flex-row-reverse` for RTL but this causes the scroll to start from the wrong end.

**Fix:** Remove `flex-row-reverse` from the carousel container. Instead, use CSS `direction: rtl` on the scroll container which naturally handles both layout and scroll origin.

---

## Technical Summary of Changes

### File: `src/components/CheckoutModalLocalized.tsx`
- **Lines ~372-377**: Restructure progress stats to use proper RTL number formatting with `dir="ltr"` spans for digit groups
- **Lines ~434**: Fix price row alignment - remove `justify-end`  
- **Lines ~514-533**: Ensure summary rows have proper RTL structure
- **Lines ~576-579**: Fix OTP phone number display - isolate number in its own `dir="ltr"` block, separate from Farsi text
- **Lines ~700-710**: Wrap phone numbers and postal codes in address block with `dir="ltr"` isolation
- **Lines ~757-771**: Verify Flowpoints number positioning
- **Lines ~856-860**: Ensure discount badge and title maintain correct RTL order

### File: `src/components/EnhancedUpsellCarouselLocalized.tsx`
- **Line ~125**: Change carousel scroll direction approach - use CSS `direction: rtl` instead of `flex-row-reverse`
- **Lines ~170-181**: Add `dir="rtl"` to Select components and fix variant option text order

