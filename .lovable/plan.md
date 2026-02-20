
# Fix: "New Chat" Should Show Empty Chat Thread, Not the Landing Page

## The Problem

When the user clicks "New Chat" and `pendingNewChat` is set to `true`, the code passes:

```tsx
hasStartedChat={pendingNewChat ? false : hasStartedChat}
```

This forces `hasStartedChat=false`, which causes `ChatInterface` to render `ChatLanding` — the full homepage with the logo, hero section, product carousels, quick actions, and footer. That is the wrong view.

The user expects: an **empty chat thread** — the same UI as an ongoing conversation, but with no messages yet, just the input box ready to type. This is exactly how ChatGPT handles "New Chat".

## The Fix

In `ChatInterface.tsx`, add a third rendering path: if `isPendingNewChat` is true, skip the landing page entirely and render `ChatThread` directly with an empty messages array and all props wired through.

In `GPTCommerceShell.tsx`, pass a new `isPendingNewChat` prop to `ChatInterface` when in pending mode.

### Changes Required

#### 1. `src/components/gpt-commerce/ChatInterface.tsx`

Add a `isPendingNewChat?: boolean` prop. When it is `true`, render `ChatThread` with empty messages instead of `ChatLanding`:

```tsx
interface ChatInterfaceProps {
  // ... existing props
  isPendingNewChat?: boolean;
}

export const ChatInterface = (props: ChatInterfaceProps) => {
  // NEW: pending new chat → show empty thread, not landing page
  if (props.isPendingNewChat) {
    return (
      <ChatThread
        messages={[]}         // empty — no messages yet
        onSendMessage={props.onSendMessage}
        // ... all other ChatThread props
      />
    );
  }

  if (!props.hasStartedChat) {
    return <ChatLanding ... />;
  }

  return <ChatThread ... />;
};
```

#### 2. `src/features/gpt-commerce/GPTCommerceShell.tsx`

- Remove the `hasStartedChat={pendingNewChat ? false : hasStartedChat}` override
- Pass `isPendingNewChat={pendingNewChat}` instead
- Restore `hasStartedChat={hasStartedChat}` to its normal value

```tsx
<ChatInterface
  hasStartedChat={hasStartedChat}           // restored to normal
  isPendingNewChat={pendingNewChat}          // new prop controls pending state
  onSendMessage={handleSendMessageWithPending}
  // ... rest unchanged
/>
```

## End Result

| State | What Renders |
|---|---|
| First visit, no chat | `ChatLanding` (homepage with carousels) |
| Click "New Chat" | `ChatThread` with empty messages (input box only) |
| Send first message | Basket created, message sent, thread fills with AI reply |
| Existing basket selected | `ChatThread` with full message history |

## Files to Modify

| File | Change |
|---|---|
| `src/components/gpt-commerce/ChatInterface.tsx` | Add `isPendingNewChat` prop; render empty `ChatThread` when true |
| `src/features/gpt-commerce/GPTCommerceShell.tsx` | Pass `isPendingNewChat={pendingNewChat}`; restore normal `hasStartedChat` prop |

**Two small file changes. No hooks, no database, no state logic changes.**
