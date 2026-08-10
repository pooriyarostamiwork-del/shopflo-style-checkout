import { useState } from "react";
import { MessagesSquare, X, Lock } from "lucide-react";
import { SectionHeader } from "../shared/SectionHeader";
import { useDashboard } from "../context/DashboardContext";
import { faNum } from "../data/mockDashboard";
import { useIntelligenceChat } from "../intelligence/useIntelligenceChat";
import { ThreadsRail } from "../intelligence/ThreadsRail";
import { ChatTranscript } from "../intelligence/ChatTranscript";
import { ChatComposer } from "../intelligence/ChatComposer";

const LITE_LIMIT = 3;

export const CustomerIntelligence = () => {
  const { plan } = useDashboard();
  const chat = useIntelligenceChat();
  const [input, setInput] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isLite = plan === "lite";
  const used = chat.threads.reduce(
    (n, t) => n + t.messages.filter(m => m.role === "user").length,
    0,
  );
  const remaining = Math.max(0, LITE_LIMIT - used);
  const limitReached = isLite && remaining === 0;


  const handleSend = () => {
    const v = input.trim();
    if (!v) return;
    chat.sendMessage(v);
    setInput("");
  };

  const handleNewChat = () => {
    chat.createThread();
    setInput("");
    setDrawerOpen(false);
  };

  const handleSelect = (id: string) => {
    chat.selectThread(id);
    setInput("");
    setDrawerOpen(false);
  };

  const workspace = (
    <div className="sd-intel-shell sd-anim-in">
      {/* Desktop rail */}
      <div className="hidden lg:flex sd-intel-rail-wrap">
        <ThreadsRail
          threads={chat.threads}
          activeId={chat.activeId}
          onSelect={handleSelect}
          onCreate={handleNewChat}
          onDelete={chat.deleteThread}
          onRename={chat.renameThread}
        />
      </div>

      {/* Chat pane */}
      <div className="flex-1 min-w-0 flex flex-col">
        <ChatTranscript
          messages={chat.activeThread?.messages ?? []}
          isThinking={chat.status === "thinking"}
          onPickSuggestion={(s) => {
            setInput(s);
          }}
        />
        {isLite && (
          <div className="px-4 sm:px-6 pb-2">
            <div
              className="max-w-[760px] mx-auto rounded-2xl border px-3.5 py-2.5 flex items-center gap-3"
              style={{
                borderColor: limitReached
                  ? "hsl(var(--sd-primary) / .28)"
                  : "hsl(var(--sd-stroke))",
                background: "hsl(var(--sd-surface))",
              }}
            >
              <span
                className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: limitReached
                    ? "hsl(var(--sd-primary-soft))"
                    : "hsl(var(--sd-surface-2))",
                  color: limitReached
                    ? "hsl(var(--sd-primary-ink))"
                    : "hsl(var(--sd-muted))",
                }}
              >
                {limitReached ? <Lock className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
              </span>

              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-semibold text-[hsl(var(--sd-ink))]">
                  {limitReached ? "سهمیه پلن Lite تمام شد" : "سهمیه گفتگوی پلن Lite"}
                </div>
                <div className="text-[11px] text-[hsl(var(--sd-muted))] mt-0.5 sd-num">
                  {limitReached
                    ? "برای گفتگوی نامحدود به Shift Pro ارتقا بده."
                    : `${faNum(remaining)} از ${faNum(LITE_LIMIT)} پیام باقی مانده`}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0" aria-hidden>
                {Array.from({ length: LITE_LIMIT }).map((_, i) => (
                  <span
                    key={i}
                    className="h-1.5 rounded-full transition-all"
                    style={{
                      width: i < remaining ? 18 : 10,
                      background:
                        i < remaining
                          ? "hsl(var(--sd-primary))"
                          : "hsl(var(--sd-stroke-strong))",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <ChatComposer
          value={input}
          onChange={setInput}
          onSend={handleSend}
          disabled={limitReached || chat.status === "thinking"}
          isThinking={chat.status === "thinking"}
          autoFocusKey={chat.activeId}
        />
      </div>


      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setDrawerOpen(false)}
          />
          <div
            className="absolute top-0 right-0 h-full flex flex-col"
            style={{
              width: "min(320px, 88vw)",
              background: "hsl(var(--sd-bg))",
              borderLeft: "1px solid hsl(var(--sd-stroke))",
            }}
          >
            <div
              className="flex items-center justify-between px-3 py-3 border-b"
              style={{ borderColor: "hsl(var(--sd-stroke))" }}
            >
              <span className="text-[13px] font-semibold">چت‌ها</span>
              <button
                onClick={() => setDrawerOpen(false)}
                className="sd-btn-ghost !p-0 !min-h-[36px] !w-9 flex items-center justify-center"
                aria-label="بستن"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <ThreadsRail
              threads={chat.threads}
              activeId={chat.activeId}
              onSelect={handleSelect}
              onCreate={handleNewChat}
              onDelete={chat.deleteThread}
              onRename={chat.renameThread}
            />
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div>
      <SectionHeader
        eyebrow="دستیار هوشمند"
        title="هوش مشتری و بازار"
        subtitle="سوال بپرس، الگوهای رفتار مشتری و سیگنال‌های بازارت رو کشف کن."
        actions={
          <button
            onClick={() => setDrawerOpen(true)}
            className="sd-btn-ghost lg:hidden flex items-center gap-2"
          >
            <MessagesSquare className="w-4 h-4" />
            چت‌ها
          </button>
        }
      />

      {workspace}
    </div>
  );

};
