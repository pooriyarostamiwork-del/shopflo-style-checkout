import { useEffect, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";
import { ChatMessage, Product, QuickReply, CartItem, encodeJourneyAnswer } from "@/data/petabadData";
import { ClarificationBlock, JourneyCard, answerAfter } from "@/components/petabad/ClarificationBlocks";
import { PDPProductComponent } from "@/components/petabad/PDPProductComponent";
import { QuickReplyButtons } from "@/components/petabad/AgenticMessageComponents";
import { ProductDetailsModal } from "@/components/petabad/ProductDetailsModal";
import { PetabadMark } from "@/components/petabad/PetabadBrand";
import { WanderingEyes } from "@/components/petabad/WanderingEyes";
import { ShiningText } from "@/components/petabad/ShiningText";
import { TypingText } from "@/components/petabad/TypingText";
import { getThinkingLabel } from "@/features/petabad/hooks/loadingLabel";
import { FloatingProductCard } from "./FloatingProductCard";

const PLACEHOLDERS = [
  "«غذای خشک بچه‌گربه»",
  "«شامپو گربه پوست حساس»",
  "«اسباب‌بازی سگ نژاد بزرگ»",
];

const clean = (t: string) =>
  t
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^[-*]\s+/gm, "• ");

interface Props {
  messages: ChatMessage[];
  isProcessing: boolean;
  cartItems: CartItem[];
  onSendMessage: (m: string) => void;
  onAddToCart: (p: Product) => void;
  onInlineDetails?: (p: Product) => void;
  onQuickReply?: (r: QuickReply) => void;
}

/**
 * Embedded conversation surface: assistant on the right, shopper on the left,
 * compact cards for the narrow column. Discovery only — no checkout surfaces.
 */
export const FloatingChatThread = ({
  messages,
  isProcessing,
  cartItems,
  onSendMessage,
  onAddToCart,
  onInlineDetails,
  onQuickReply,
}: Props) => {
  const [value, setValue] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [quickView, setQuickView] = useState<Product | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isProcessing]);

  useEffect(() => {
    if (value) return;
    const id = setInterval(() => setPlaceholderIndex((p) => (p + 1) % PLACEHOLDERS.length), 3500);
    return () => clearInterval(id);
  }, [value]);

  useEffect(() => {
    if (!taRef.current) return;
    taRef.current.style.height = "36px";
    taRef.current.style.height = `${Math.min(taRef.current.scrollHeight, 132)}px`;
  }, [value]);

  const send = () => {
    const text = value.trim();
    if (!text || isProcessing) return;
    onSendMessage(text);
    setValue("");
  };

  const thinkingLabel = getThinkingLabel([...messages].reverse().find((m) => m.role === "user")?.content);

  return (
    <div className="flex h-full min-h-0 flex-col bg-muted/30" dir="rtl">
      <div className="flex-1 overflow-y-auto px-4 py-4">

        <div className="space-y-5">
          {messages.map((msg) => (
            <div key={msg.id} className="animate-fade-in space-y-3">
              {msg.content?.trim() && (
                <div className={`flex items-end gap-2 ${msg.role === "assistant" ? "justify-start" : "justify-end"}`}>
                  {msg.role === "assistant" && (
                    <div className="mb-0.5 shrink-0">
                      <PetabadMark size="avatar" />
                    </div>
                  )}
                  <div
                    className={
                      msg.role === "assistant"
                        ? "max-w-[86%] rounded-2xl rounded-br-md border border-border/70 bg-card px-3.5 py-2.5"
                        : "max-w-[86%] rounded-2xl rounded-bl-md bg-primary px-3.5 py-2.5 text-primary-foreground"
                    }
                  >
                    <p className="whitespace-pre-wrap text-[13px] leading-7">{clean(msg.content)}</p>
                  </div>
                </div>
              )}

              {msg.clarification && (
                <div className="ps-9">
                  <ClarificationBlock
                    clarification={msg.clarification}
                    onAnswer={onSendMessage}
                    resolvedWith={answerAfter(messages, msg.id)}
                  />
                </div>
              )}

              {msg.journey && (
                <div className="ps-9">
                  <JourneyCard
                    journey={msg.journey}
                    onAnswer={(answer) => onSendMessage(encodeJourneyAnswer({ messageId: msg.id, answer }))}
                    onRedo={(redoIndex) => onSendMessage(encodeJourneyAnswer({ messageId: msg.id, answer: "", redoIndex }))}
                  />
                </div>
              )}

              {msg.products && msg.products.length > 0 && (
                <div className="space-y-2 ps-9">
                  {msg.products.slice(0, 12).map((product, i) => (
                    <FloatingProductCard
                      key={product.id}
                      product={product}
                      index={(msg.productIndexStart || 1) + i}
                      isInCart={cartItems.some((c) => c.id === product.id)}
                      onAdd={onAddToCart}
                      onDetails={onInlineDetails || setQuickView}
                    />
                  ))}
                </div>
              )}

              {msg.inlineProduct && (
                <div className="ps-9">
                  <PDPProductComponent
                    product={msg.inlineProduct}
                    isInCart={cartItems.some((c) => c.id === msg.inlineProduct?.id)}
                    onAddToCart={onAddToCart}
                    showContextLabel={false}
                  />
                </div>
              )}

              {msg.quickReplies && onQuickReply && (
                <div className="ps-9">
                  <QuickReplyButtons replies={msg.quickReplies} onSelect={onQuickReply} />
                </div>
              )}
            </div>
          ))}

          {isProcessing && (
            <div className="flex items-end gap-2">
              <PetabadMark size="avatar" />
              <div className="rounded-2xl rounded-br-md border border-border/70 bg-card px-3.5 py-2.5">
                <div className="flex items-center gap-2">
                  <WanderingEyes className="h-5 w-[45px] text-primary" />
                  <ShiningText text={thinkingLabel} className="text-xs" />
                </div>
              </div>
            </div>
          )}

          <div ref={endRef} />
        </div>
      </div>

      {/* Composer */}
      <div className="border-t border-border bg-background p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="flex items-center gap-2 rounded-2xl border border-border bg-card p-2 transition-colors focus-within:border-primary/50"
        >
          <div className="relative flex-1">
            <textarea
              ref={taRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              disabled={isProcessing}
              dir="rtl"
              className="max-h-[132px] min-h-[36px] w-full resize-none bg-transparent px-2 py-1.5 text-[13px] leading-6 text-foreground outline-none"
            />
            {!value && (
              <div className="pointer-events-none absolute inset-0 flex items-center px-2" dir="rtl">
                <TypingText
                  key={placeholderIndex}
                  text={PLACEHOLDERS[placeholderIndex]}
                  className="w-full text-[13px] leading-6 text-muted-foreground/60"
                />
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={!value.trim() || isProcessing}
            aria-label="ارسال"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </form>
      </div>

      <ProductDetailsModal
        product={quickView}
        isOpen={!!quickView}
        onClose={() => setQuickView(null)}
        onAddToCart={onAddToCart}
        isInCart={cartItems.some((c) => c.id === quickView?.id)}
      />
    </div>
  );
};
