

# Fix: CTA Button and Landing Prompt Issues

## Issue 1: CTA Button Does Nothing for Authenticated Users

**Root cause:** In `GPTCommerceShell.tsx` (line 382-389), `handleSignInClick` returns early when `isAuthenticated` is true, doing nothing. The CTA button on the landing page calls `onSignIn` which maps to this handler. For authenticated users, clicking "پیمان جان خوش اومدی، ورود به فضای خرید" should transition into chat mode.

**Fix:** When `isAuthenticated` is true, `handleSignInClick` should call `setPendingNewChat(true)` to enter the chat/new-basket flow instead of silently returning.

### Change in `src/features/gpt-commerce/GPTCommerceShell.tsx`

Update `handleSignInClick` (lines 382-389):
```typescript
const handleSignInClick = useCallback(() => {
  if (isAuthenticated) {
    setPendingNewChat(true); // Enter chat mode
    return;
  }
  setOtpContext('login');
  setShowOTPModal(true);
}, [isAuthenticated]);
```

---

## Issue 2: Landing Prompt Not Appearing in Chat

**Root cause:** In `ChatLanding.tsx` (line 128-135), `handleSubmit` calls `onStartChat()` then immediately `onSendMessage(inputValue.trim())` in the same synchronous execution. `onStartChat` maps to `handleStartChat` which calls `setPendingNewChat(true)`. But React state updates are asynchronous -- `pendingNewChat` is still `false` when `handleSendMessageWithPending` runs in the next line. So the message goes through `handleSendMessage` on the current (empty/old) basket instead of creating a new one, and the message is effectively lost.

**Fix:** Instead of relying on the state being set synchronously, modify `ChatLanding.handleSubmit` to pass both signals together. The simplest approach: make `handleSendMessageWithPending` accept an optional flag to force the "pending new chat" path, bypassing the stale state check.

### Change in `src/features/gpt-commerce/GPTCommerceShell.tsx`

Update `handleSendMessageWithPending` to accept an optional `forceNew` parameter:
```typescript
const handleSendMessageWithPending = useCallback(async (message: string, forceNew?: boolean) => {
  if (pendingNewChat || forceNew) {
    // Create new basket and send message...
    // (existing logic stays the same)
  }
  handleSendMessage(message);
}, [...]);
```

### Change in `src/components/gpt-commerce/ChatLanding.tsx`

Update `handleSubmit` to pass the `forceNew` flag:
```typescript
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  if (inputValue.trim() && !isProcessing) {
    onSendMessage(inputValue.trim(), true); // forceNew = true
    setInputValue("");
  }
};
```

Also update `handleAskAbout` similarly:
```typescript
const handleAskAbout = (productName: string) => {
  const message = `درباره ${productName} بیشتر توضیح بده`;
  onSendMessage(message, true);
  setQuickViewProduct(null);
};
```

Update the `onSendMessage` prop type in `ChatLandingProps` and `ChatInterfaceProps` to accept the optional second argument: `(message: string, forceNew?: boolean) => void`.

### Change in `src/components/gpt-commerce/ChatInterface.tsx`

Update the `onSendMessage` type in `ChatInterfaceProps` to match: `(message: string, forceNew?: boolean) => void`.

---

## Files Summary

| File | Change |
|---|---|
| `src/features/gpt-commerce/GPTCommerceShell.tsx` | Fix `handleSignInClick` for auth users; add `forceNew` param to `handleSendMessageWithPending` |
| `src/components/gpt-commerce/ChatLanding.tsx` | Pass `forceNew: true` from `handleSubmit` and `handleAskAbout`; update prop type; remove separate `onStartChat` call |
| `src/components/gpt-commerce/ChatInterface.tsx` | Update `onSendMessage` prop type signature |

