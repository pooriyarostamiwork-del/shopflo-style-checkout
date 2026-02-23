

# Three Changes: Auto-Finalize on Order, Recent Max 5, Account Panel Merge

## 1. Auto-finalize basket after successful order

After a successful order completes (both in `useCheckoutFlow.ts` conversational flow and `handleCheckoutSuccess` modal flow), automatically mark the basket as `isSaved: true` so it moves to "سبدهای نهایی شده" and a new basket is created for the user.

### Changes

**`src/features/gpt-commerce/hooks/useCheckoutFlow.ts`**
- In `handlePaymentSelect` (the conversational checkout flow), after the success message is appended and cart is cleared (~line 375), also set `isSaved: true` on the basket via `updateCurrentBasket`.
- In `handleCheckoutSuccess` (~line 421), after clearing the cart, mark the current basket as saved. This requires calling a new callback or directly updating baskets.

**`src/features/gpt-commerce/GPTCommerceShell.tsx`**
- Update `handleCheckoutSuccess` or add post-order logic: after the checkout flow marks `agenticState.step === 'order-complete'`, set `isSaved: true` on the active basket in the `baskets` array and create a new active basket for the user (reuse logic from `handleSaveBasket`).
- Add an `useEffect` that watches for `order-complete` step and auto-finalizes the basket, OR inject the finalization directly into the checkout flow callbacks.

The simplest approach: In `useCheckoutFlow.ts`, the `handlePaymentSelect` setTimeout callback already clears the cart. Add basket finalization there by accepting a new `onFinalizeBasket` callback prop. In `GPTCommerceShell.tsx`, pass a `onFinalizeBasket` that sets `isSaved: true` on the active basket and creates a new one.

---

## 2. Update recent baskets max from 14 to 5

**`src/components/gpt-commerce/Sidebar.tsx`**
- Change line 82 from `unsavedBaskets.slice(7, 21)` to `unsavedBaskets.slice(7, 12)` (7 active + 5 recent = 12 total max visible unsaved baskets).

---

## 3. Merge Profile + Addresses, Remove Favorites tab

**`src/components/gpt-commerce/AccountPanel.tsx`**

Remove the `saved` tab entirely and merge `profile` and `addresses` into a single unified tab.

- Remove `'saved'` from the `AccountTab` type (line 7): change to `type AccountTab = 'profile' | 'orders';`
- Remove the `addresses` and `saved` entries from the `tabs` array (line 301-306). Keep only `profile` and `orders`.
- Rename `profile` tab label to something like "پروفایل و آدرس‌ها" or keep it as "پروفایل" since it will now contain both.
- Move the addresses section content (lines 452-521) into the profile tab content, below the profile card and sign-out button. Add a visual separator (heading or divider) between the profile info and addresses list.
- Delete the `saved` tab content (lines 620-630).

The unified profile tab will look like:
1. Profile card (avatar, name, phone, email, edit)
2. Sign out button
3. Divider / section heading "آدرس‌های ذخیره‌شده"
4. Add address button + address cards list

This creates a clean two-tab layout: "پروفایل" (profile + addresses) and "سفارش‌ها" (orders).

---

## Files Modified

| File | Change |
|---|---|
| `src/features/gpt-commerce/hooks/useCheckoutFlow.ts` | Add `onFinalizeBasket` callback prop; call it after order-complete in both `handlePaymentSelect` and `handleCheckoutSuccess` |
| `src/features/gpt-commerce/GPTCommerceShell.tsx` | Pass `onFinalizeBasket` to checkout flow that marks basket `isSaved: true` and creates new basket |
| `src/components/gpt-commerce/Sidebar.tsx` | Change recent baskets slice from `(7, 21)` to `(7, 12)` |
| `src/components/gpt-commerce/AccountPanel.tsx` | Remove `saved` tab, merge addresses into profile tab as unified section, reduce to 2-tab layout |

