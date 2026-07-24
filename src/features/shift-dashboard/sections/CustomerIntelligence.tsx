import { useState } from "react";
import { MessagesSquare, X, Sparkles } from "lucide-react";
import { SectionHeader } from "../shared/SectionHeader";
import { ProLock } from "../shared/ProLock";
import { useDashboard } from "../context/DashboardContext";
import { useIntelligenceChat } from "../intelligence/useIntelligenceChat";
import { ThreadsRail } from "../intelligence/ThreadsRail";
import { ChatTranscript } from "../intelligence/ChatTranscript";
import { ChatComposer } from "../intelligence/ChatComposer";

export const CustomerIntelligence = () => {
  const { plan } = useDashboard();
  const chat = useIntelligenceChat();
  const [input, setInput] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);

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
        <ChatComposer
          value={input}
          onChange={setInput}
          onSend={handleSend}
          disabled={plan === "lite" || chat.status === "thinking"}
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
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDrawerOpen(true)}
              className="sd-btn-ghost lg:hidden flex items-center gap-2"
            >
              <MessagesSquare className="w-4 h-4" />
              چت‌ها
            </button>
            <button
              onClick={handleNewChat}
              className="sd-btn-primary flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" strokeWidth={2} />
              چت جدید
            </button>
          </div>
        }
      />

      {plan === "lite" ? (
        <ProLock reason="گفتگو با دیتای مشتری و بازار در پلن Shift Pro فعال می‌شود">
          {workspace}
        </ProLock>
      ) : (
        workspace
      )}
    </div>
  );
};
