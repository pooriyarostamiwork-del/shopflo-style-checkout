import { useEffect, useRef } from "react";
import { IntelMessage } from "./types";
import { MessageBubble, TypingBubble } from "./MessageBubble";
import { EmptyState } from "./EmptyState";

interface Props {
  messages: IntelMessage[];
  isThinking: boolean;
  onPickSuggestion: (s: string) => void;
}

export const ChatTranscript = ({ messages, isThinking, onPickSuggestion }: Props) => {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, isThinking]);

  if (messages.length === 0 && !isThinking) {
    return <EmptyState onPick={onPickSuggestion} />;
  }

  return (
    <div
      aria-live="polite"
      className="flex-1 overflow-y-auto px-4 sm:px-6 py-6"
    >
      <div className="max-w-[760px] mx-auto flex flex-col gap-5">
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
        {isThinking && <TypingBubble />}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};
