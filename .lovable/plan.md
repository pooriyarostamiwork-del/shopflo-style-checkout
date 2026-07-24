## Scope

Add a new dashboard section **"هوش مشتری و بازار"** (Customer & Market Intelligence) to `src/features/shift-dashboard/`. It is a full chat *workspace*, not a small chat widget — modeled after ChatGPT: left rail with New Chat + thread history, main pane with messages + composer, empty-state with suggested prompts. Front-end only, threads stored in browser localStorage. Pro-only; Lite shows the ProLock veil.

## Placement

- New nav item in `ShiftDashboard.tsx` NAV under the "مدیریت" group, between "کنترل ایجنت" and "شخصی‌سازی بصری". Id `intelligence`, icon `Sparkles` (or `Brain` from lucide), component `CustomerIntelligence`.
- Route stays `/shift/dash/lite` and `/shift/dash/pro` — the section is a tab inside the shell, no new route.

## Section layout

Two-column workspace that fits inside the existing `<main>` container. Uses the current design tokens (`--sd-*`), hairline strokes, 20-26px radii, Vazirmatn, RTL.

```text
┌─────────────────────────────────────────────────────────┐
│ SectionHeader: eyebrow "دستیار هوشمند" · title "هوش    │
│ مشتری و بازار" · action: "چت جدید" pill button          │
├──────────────┬──────────────────────────────────────────┤
│  Threads     │  Messages transcript                     │
│  rail        │  (scrollable, sticky-to-bottom)          │
│  (260px)     │                                          │
│              │                                          │
│  + New chat  │  Empty state:                            │
│  ─ Today     │   • hero prompt "از دیتای مشتریانت      │
│    · thread  │     چی می‌خوای بدونی؟"                    │
│    · thread  │   • 4 suggestion chips (see below)       │
│  ─ Last 7d   │                                          │
│    · thread  ├──────────────────────────────────────────┤
│  ─ Older     │  Composer: textarea + send + hint row    │
│              │  (auto-grow, Enter=send, Shift+Enter=NL) │
└──────────────┴──────────────────────────────────────────┘
```

On viewports < `lg` the rail collapses into a top drawer opened by a "چت‌ها" pill button next to the section header action; the transcript takes full width.

## Files to add (`src/features/shift-dashboard/`)

- `sections/CustomerIntelligence.tsx` — section shell, composes rail + transcript, mounts ProLock on Lite.
- `intelligence/ThreadsRail.tsx` — sidebar list grouped by Today / Last 7 days / Older, active-state pill, delete-on-hover (`⋯` menu with delete + rename). Non-nested buttons per row (row = `div`, select + delete = sibling buttons).
- `intelligence/ChatTranscript.tsx` — message list, auto-scroll, streamed typing shimmer ("در حال تحلیل…"), copy-message icon, regenerate on last assistant turn.
- `intelligence/MessageBubble.tsx` — user (right, filled `--sd-ink` bubble with `--sd-bg` text) vs assistant (right-aligned in RTL, no background, plain body text with strong headings). Renders markdown via a tiny inline formatter (bold, lists, inline code) — no new deps.
- `intelligence/ChatComposer.tsx` — auto-grow textarea, send button, keyboard shortcuts, disabled while "thinking", char hint.
- `intelligence/EmptyState.tsx` — hero title, subtitle, 4 suggestion chips derived from scope (below). Clicking a chip prefills the composer.
- `intelligence/InsightBlock.tsx` — a stylized card the mock assistant can emit inline (KPI row + a mini list). Used by seeded canned replies so responses feel like a real intelligence tool, not just paragraphs.
- `intelligence/useIntelligenceChat.ts` — hook: threads state, active thread id, `sendMessage`, `createThread`, `deleteThread`, `renameThread`, localStorage sync, mock "AI" reply generator.
- `intelligence/mockIntelligence.ts` — seed thread(s), canned intelligent-sounding responses keyed by keyword (e.g., "بازگشتی", "قیف", "دسته").

## Data model (localStorage)

Key: `shift-dash-intel-threads-v1`

```ts
type IntelMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
  insight?: { title: string; kpis: {label:string; value:string; delta?:string}[]; bullets?: string[] };
};
type IntelThread = {
  id: string;
  title: string;         // auto-derived from first user msg (first ~40 chars)
  updatedAt: number;
  messages: IntelMessage[];
};
```

Idempotent bootstrap: if the persisted array is empty, seed **one** demo thread ("نمونه: بازگشت مشتریان ۳۰ روز اخیر") with a canned user question + rich assistant reply that uses `InsightBlock`. Load and default-thread selection happens in one client-safe path guarded by `typeof window !== "undefined"` — not in a `useEffect` that could double-run under StrictMode.

Active thread id lives in component state (no URL route — the whole section is a dashboard tab, not its own page).

## Mock assistant behavior

`useIntelligenceChat.sendMessage`:
1. Push user message, set `status = "thinking"`, show typing shimmer.
2. After ~900–1400ms, resolve a canned reply from `mockIntelligence.ts` by matching Persian keywords in the prompt (customer retention, segments, funnel, drop-off, agent quality, top questions, etc.). Fallback: a generic "بر اساس داده‌های موجود…" reply that still emits an `InsightBlock` with mock KPIs so the UI stays visually rich.
3. Auto-rename thread from "چت جدید" to a truncated first-user-message on the first turn.

No backend, no edge function, no AI Gateway call in this phase. The hook is shaped so a real streamed backend can drop in later without UI changes.

## Suggestion chips (empty state)

Scope selected: customer behavior & segments + agent/funnel performance, framed as *customer & market intelligence*.
- "کدوم دسته از مشتریام بیشترین ارزش رو دارن؟"
- "چرا نرخ بازگشت مشتری این ماه پایین اومده؟"
- "بیشترین سوالات بدون‌پاسخ ایجنت چی بوده؟"
- "کجای قیف بیشترین ریزش رو داریم؟"

## Plan gating

`CustomerIntelligence.tsx` reads `plan` from `useDashboard()`. On `plan === "lite"`, wrap the whole workspace in `<ProLock reason="گفتگو با دیتای مشتریان و بازار در پلن Pro فعال می‌شود">`; the rail + one seeded thread stay visible behind the veil so the value is legible. Pro renders fully interactive.

## Visual details

- Threads rail: `--sd-surface` background, hairline right border in LTR terms (i.e., left in RTL). Group labels use `.sd-nav-label`. Active row: soft `--sd-primary` tinted background + `--sd-ink` text, matching existing sidebar active state so nothing feels foreign.
- Empty state hero title uses `.sd-headline` scale.
- User bubble: max-width 78%, radius `18px 18px 4px 18px` (RTL flips), `--sd-ink` bg, `--sd-bg` text.
- Assistant messages: no bubble, plain text on canvas; the optional `InsightBlock` renders as a hairline card with a mini KPI strip.
- Composer: hairline pill, primary send button (icon-only), disabled state = muted; keyboard hint "Enter برای ارسال · Shift+Enter برای خط جدید" under it.
- Skeletons on first section mount: rail = 6 shimmer rows; transcript = empty state (already lightweight, no skeleton needed).

## Accessibility & RTL

- `aria-live="polite"` on transcript for new assistant messages.
- Focus-visible rings on every interactive element (reuses `--sd-focus`).
- Thread row = `div` container with two sibling buttons (select, menu) — no nested `<button>`s.
- Composer keeps focus on mount, after send, after switching threads, after "New chat".

## Out of scope (this pass)

- Real backend / real AI call.
- Cross-device sync.
- Exporting a conversation.
- Persian dictation / voice input.

## Verification

- Typecheck the project.
- Playwright: `/shift/dash/pro` — screenshot empty state, send a prompt, screenshot rich reply with `InsightBlock`, create second thread, reload, confirm both threads persist and messages route correctly.
- Playwright: `/shift/dash/lite` — confirm ProLock veil shows over the workspace.
- Playwright mobile viewport: confirm rail collapses into the drawer and composer stays usable with the keyboard-safe area.
