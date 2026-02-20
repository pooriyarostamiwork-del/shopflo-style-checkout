
# GPTCommerce Refactor: Layered Commerce Architecture

## Current Problem: The Monolith

`GPTCommerce.tsx` is **1,265 lines** and does everything at once:
- All basket state management
- All localStorage persistence
- All database read/write (addresses, orders)
- All agentic checkout flow orchestration (OTP, address, shipping, payment)
- All product/cart handlers
- All sidebar/section navigation logic
- UI rendering of the full layout

`ChatInterface.tsx` is a further **724 lines** that also contains:
- Landing page rendering
- Chat rendering
- Payment handler logic
- Quick action handlers
- Placeholder animation logic
- Product modal state

The result is a component that cannot be tested in isolation, cannot be extended without touching the monolith, and cannot be understood without reading 2,000+ lines of mixed concerns.

---

## Target Architecture: 4 Layers

```text
┌─────────────────────────────────────────────┐
│  LAYER 4: PAGES                             │
│  src/pages/GPTCommerce.tsx                  │
│  (orchestration only, ~80 lines)            │
└──────────────────┬──────────────────────────┘
                   │ uses
┌──────────────────▼──────────────────────────┐
│  LAYER 3: FEATURE CONTROLLERS               │
│  src/features/gpt-commerce/                 │
│  - BasketController.tsx  (basket mgmt)      │
│  - CheckoutController.tsx (checkout flow)   │
│  - AccountController.tsx  (user/addresses)  │
└──────────────────┬──────────────────────────┘
                   │ uses
┌──────────────────▼──────────────────────────┐
│  LAYER 2: HOOKS (business logic)            │
│  src/features/gpt-commerce/hooks/           │
│  - useBasketState.ts                        │
│  - useCheckoutFlow.ts                       │
│  - useAgentMessages.ts                      │
│  - useUserData.ts                           │
└──────────────────┬──────────────────────────┘
                   │ uses
┌──────────────────▼──────────────────────────┐
│  LAYER 1: UI COMPONENTS (display only)      │
│  src/components/gpt-commerce/               │
│  (unchanged — already well-scoped)          │
└─────────────────────────────────────────────┘
```

---

## File-by-File Implementation Plan

### New Directory: `src/features/gpt-commerce/`

This is the new home for all business logic extracted from `GPTCommerce.tsx`.

---

### Hook 1: `src/features/gpt-commerce/hooks/useBasketState.ts`

**Extracts from GPTCommerce.tsx lines 49–245:**

All basket persistence logic moves here:
- `BasketState` interface definition
- `createDefaultBasketState()`
- `STORAGE_VERSION_KEY`, `CURRENT_VERSION` migration guard
- `BASKETS_STORAGE_KEY`, `ACTIVE_BASKET_KEY`, `BASKET_STATES_KEY` constants
- `getInitialBaskets()`, `getInitialActiveBasketId()`, `getInitialBasketStates()` initializers
- `useState` for `baskets`, `activeBasketId`, `basketStates`
- `useEffect` for persisting all three to localStorage
- `getCurrentBasketState()` + `updateCurrentBasket()` helpers
- `useEffect` to initialize missing basket states

**Returns:**
```typescript
{
  baskets, activeBasketId, basketStates,
  setBaskets, setActiveBasketId, setBasketStates,
  currentState, updateCurrentBasket,
}
```

---

### Hook 2: `src/features/gpt-commerce/hooks/useUserData.ts`

**Extracts from GPTCommerce.tsx lines 150–185, 1063–1102:**

All user data I/O with the database:
- `globalAddresses` state + `GLOBAL_ADDRESSES_KEY` localStorage constant
- `getInitialGlobalAddresses()` initializer
- `useEffect` loading addresses from DB on auth change
- `dbOrders` state + `useEffect` loading orders from DB
- `handleAccountAddAddress`, `handleAccountDeleteAddress`, `handleAccountUpdateAddress`
- Persisting globalAddresses to localStorage when not authenticated

**Returns:**
```typescript
{
  globalAddresses, setGlobalAddresses,
  dbOrders, setDbOrders,
  handleAccountAddAddress,
  handleAccountDeleteAddress,
  handleAccountUpdateAddress,
}
```

---

### Hook 3: `src/features/gpt-commerce/hooks/useCheckoutFlow.ts`

**Extracts from GPTCommerce.tsx lines 257–575, 577–608, 862–870:**

All agentic checkout orchestration:
- `getMerchantShipping()` — builds per-merchant shipping options from cart
- `parseProductSelection()` — parses Persian number references like «محصول شماره ۲»
- `handleQuickReply()` — routes confirm-cart / add-more / track-order
- `handleOTPVerified()` — post-OTP flow into address step
- `handleAddressSelect()` / `handleSelectShipping()` / `handleAddressConfirm()`
- `handleAddNewAddress()` — creates address in DB or local, updates chat messages
- `handlePaymentSelect()` — processes payment, saves order to DB, emits success message
- `handleFinalizePurchase()` — initiates cart confirmation step
- `handleCheckout()` / `handleCheckoutSuccess()` / `handleSuccessClose()`
- The `useEffect` that pre-populates shipping defaults on address step entry

**Dependencies injected via parameters:** `updateCurrentBasket`, `globalAddresses`, `isAuthenticated`, `isOTPVerified`, `isNewUser`, `setDbOrders`

**Returns:**
```typescript
{
  getMerchantShipping, handleQuickReply, handleOTPVerified,
  handleAddressSelect, handleSelectShipping, handleAddressConfirm,
  handleAddNewAddress, handlePaymentSelect, handleFinalizePurchase,
  handleCheckout, handleCheckoutSuccess, handleSuccessClose,
}
```

---

### Hook 4: `src/features/gpt-commerce/hooks/useAgentMessages.ts`

**Extracts from GPTCommerce.tsx lines 610–792, 794–861:**

All agent-related message handling:
- `mapDbProduct()` — maps raw DB product rows to the `Product` interface
- `handleSendMessage()` — the main entry point: parses intent, routes to product-add / direct-payment / buy-and-send / AI-search / finalize flows, calls the `gpt-commerce-agent` edge function
- `handleAddToCart()` — updates cart AND appends confirmation message
- `handleUpdateQuantity()` / `handleRemoveItem()`
- `handleCompare()` / `handleInlineProductDetails()` — inject comparison/details messages into chat
- `handleSaveProduct()` — toggles product in basket's savedItems

**Dependencies injected:** `updateCurrentBasket`, `setBaskets`, `activeBasketId`, `globalAddresses`, `isOTPVerified`, `handleFinalizePurchase`, `setIsCartOpen`

**Returns:**
```typescript
{
  mapDbProduct, handleSendMessage, handleAddToCart,
  handleUpdateQuantity, handleRemoveItem,
  handleCompare, handleInlineProductDetails, handleSaveProduct,
}
```

---

### Controller: `src/features/gpt-commerce/BasketController.tsx`

**Extracts from GPTCommerce.tsx lines 876–1060:**

All basket lifecycle management (these are complex enough to be their own concern):
- `handleCreateBasket()` — creates new basket, adds to state, switches to it
- `handleDeleteBasket()` — removes basket, auto-selects next one
- `handleMergeBasket()` — merges two baskets' carts
- `handleSaveBasket()` / `handleResumeBasket()` — archive/unarchive flows
- `handleBasketSelect()` — switches active basket
- `handleRemoveSavedItem()` / `handleTransferToCart()` — saved items management
- The `useEffect` syncing basket item counts

This is a **renderless controller** — it takes basket state and returns handlers. No JSX.

---

### New Entry Point: `src/features/gpt-commerce/GPTCommerceShell.tsx`

**Replaces the 1,265-line `GPTCommerceContent` component:**

This is the composition root — it imports all 4 hooks plus BasketController, wires them together, and renders:
- `<Sidebar />`
- `<AccountPanel />` or `<ChatInterface />`
- `<RightPanel />`
- `<CheckoutModalLocalized />`
- `<SuccessScreenLocalized />`
- `<OTPModal />`
- Local UI state only: `showCheckout`, `showSuccess`, `activeSection`, `isCartOpen`, `showOTPModal`

This file should be ~150 lines of clean wiring with no business logic.

---

### Updated: `src/pages/GPTCommerce.tsx` (~25 lines)

Becomes a thin provider wrapper only:

```typescript
const GPTCommerce = () => (
  <LanguageProvider defaultLanguage="fa">
    <AuthProvider>
      <HomepageSettingsProvider>
        <GPTCommerceShell />
      </HomepageSettingsProvider>
    </AuthProvider>
  </LanguageProvider>
);
```

---

### Updated: `src/components/gpt-commerce/ChatInterface.tsx`

This file is split into two components:

**`ChatLanding.tsx`** (new) — the pre-chat landing state (currently lines 230–428):
- Logo, hero section, bento background cards
- Centered chatbox with animated placeholder
- Quick action chips
- Product carousels
- Footer
- ProductDetailsModal
- `BentoCard` sub-component

**`ChatThread.tsx`** (renamed from ChatInterface) — the active chat state only (lines 430–724):
- Message list rendering
- Agentic message components (QuickReplies, CTAButton, CartSummary, etc.)
- Sticky bottom input
- Payment/address flow rendering

`ChatInterface.tsx` becomes a thin router:
```typescript
if (!hasStartedChat) return <ChatLanding ... />;
return <ChatThread ... />;
```

This reduces ChatInterface to a ~30-line coordinator, landing to ~200 lines, thread to ~300 lines.

---

## Complete List of Files Created/Modified

### New files (6):
1. `src/features/gpt-commerce/hooks/useBasketState.ts`
2. `src/features/gpt-commerce/hooks/useUserData.ts`
3. `src/features/gpt-commerce/hooks/useCheckoutFlow.ts`
4. `src/features/gpt-commerce/hooks/useAgentMessages.ts`
5. `src/features/gpt-commerce/GPTCommerceShell.tsx`
6. `src/components/gpt-commerce/ChatLanding.tsx`

### Modified files (2):
7. `src/pages/GPTCommerce.tsx` — stripped to ~25 lines
8. `src/components/gpt-commerce/ChatInterface.tsx` — stripped to ~30-line router that uses `ChatLanding` and `ChatThread`

### Unchanged files (all components):
All files in `src/components/gpt-commerce/` except `ChatInterface.tsx` remain **completely untouched**. This includes: `Sidebar`, `RightPanel`, `AccountPanel`, `OTPModal`, `ProductCarousels`, `ChatProductCard`, `AgenticMessageComponents`, `AddressShippingSelector`, `PDPProductComponent`, `ProductDetailsModal`, `ProductQuickViewModal`, `CouponChips`, `CategorySelector`, `Footer`, `ProductCard`.

No component APIs change — all props interfaces remain identical.

---

## Size Comparison

| File | Before | After |
|---|---|---|
| `GPTCommerce.tsx` | 1,265 lines | ~25 lines |
| `ChatInterface.tsx` | 724 lines | ~30 lines |
| `GPTCommerceShell.tsx` | (new) | ~150 lines |
| `ChatLanding.tsx` | (new) | ~200 lines |
| `ChatThread.tsx` | (new) | ~300 lines |
| `useBasketState.ts` | (new) | ~120 lines |
| `useUserData.ts` | (new) | ~90 lines |
| `useCheckoutFlow.ts` | (new) | ~230 lines |
| `useAgentMessages.ts` | (new) | ~200 lines |
| `BasketController` (in Shell) | (extracted) | ~160 lines |

**Total: same behavior, same UI, organized across focused files no longer than 300 lines each.**

---

## What Does NOT Change

- No UI changes — users see the exact same interface
- No database schema changes
- No API changes to edge functions
- No component props changes (Sidebar, RightPanel, AccountPanel, etc.)
- No routing changes
- All localStorage keys preserved — no session loss for existing users
- The `HomepageSettingsContext`, `AuthContext`, `LanguageContext` providers stay in place
