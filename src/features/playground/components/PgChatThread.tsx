import { useEffect, useRef, useState } from "react";
import { ArrowUp, Sparkle } from "lucide-react";
import { PgChat } from "../hooks/usePlaygroundChat";
import { PG_ADDRESSES, PG_PAYMENTS, PG_SHIPPING, PG_STORE } from "../data/mockStore";
import { PgProductCard } from "./PgProductCard";
import { usePgSlots } from "../slots";
import {
  PgAddressBlock,
  PgInlinePdp,
  PgPaymentBlock,
  PgShippingBlock,
  PgSuccessBlock,
  PgSummaryBlock,
} from "./PgCheckoutBlocks";
import {
  PgBudgetSlider,
  PgMultiStepSelector,
  PgQuizCard,
} from "./PgDiscoveryBlocks";
import { PgCrossSellCarousel } from "./PgCrossSellCarousel";
import { PG_CROSS_SELL } from "../data/mockCrossSell";
import { PgComparisonBlock } from "./PgComparison";

interface Props {
  chat: PgChat;
  columns?: 2 | 3;
}

export const PgChatThread = ({ chat, columns = 3 }: Props) => {
  const [value, setValue] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const slots = usePgSlots();
  const Card = slots.productCard ?? PgProductCard;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat.messages, chat.isProcessing]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || chat.isProcessing) return;
    chat.send(value.trim());
    setValue("");
  };

  return (
    <div className="flex flex-col h-full min-h-0" dir="rtl">
      <div className="flex-1 overflow-y-auto pg-scroll-hidden">
        <div className="max-w-[820px] mx-auto p-4 md:p-6 space-y-5">
          {chat.messages.map((m) => (
            <div key={m.id} className="space-y-3">
              <div className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                {m.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <Sparkle className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
                {m.role === "user" ? (
                  <div className="max-w-[75%] px-4 py-3 rounded-[16px_16px_4px_16px] bg-primary text-primary-foreground">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>
                  </div>
                ) : (
                  <div className="max-w-[80%] pt-1">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                      {m.content}
                    </p>
                  </div>
                )}
              </div>

              {m.products && m.products.length > 0 && (
                <div
                  className={`grid gap-3 md:mr-11 ${
                    columns === 3 ? "grid-cols-2 md:grid-cols-3" : "grid-cols-2"
                  }`}
                >
                  {m.products.map((p, i) => (
                    <Card
                      key={p.id}
                      product={p}
                      index={(m.productIndexStart || 1) + i}
                      isInCart={chat.cart.some((c) => c.id === p.id)}
                      isSaved={chat.savedIds.includes(p.id)}
                      onAddToCart={chat.addToCart}
                      onSave={chat.toggleSave}
                      onDetails={chat.showInlineDetails}
                      onCompare={chat.compareFromChip}
                    />
                  ))}
                </div>
              )}

              {m.inlineProduct && (
                <div className="md:mr-11 max-w-[600px]">
                  <PgInlinePdp
                    product={m.inlineProduct}
                    isInCart={chat.cart.some((c) => c.id === m.inlineProduct!.id)}
                    onAddToCart={chat.addToCart}
                  />
                </div>
              )}

              {m.interactive && (
                <div className="md:mr-11 max-w-[440px]">
                  {m.interactive === "quiz" && (
                    <PgQuizCard onAnswer={chat.send} onSkip={chat.send} />
                  )}
                  {m.interactive === "wizard" && (
                    <PgMultiStepSelector onComplete={chat.send} onSkip={chat.send} />
                  )}
                  {m.interactive === "budget" && (
                    <PgBudgetSlider onConfirm={chat.send} onSkip={chat.send} />
                  )}
                </div>
              )}

              {m.comparison && (
                <div className="md:mr-11 max-w-[680px]">
                  <PgComparisonBlock
                    comparison={m.comparison}
                    cartIds={chat.cart.map((c) => c.id)}
                    onAddToCart={chat.addToCart}
                    onSend={chat.send}
                  />
                </div>
              )}

              {m.crossSell && (
                <div className="md:mr-11 max-w-[680px]">
                  <PgCrossSellCarousel
                    bundle={PG_CROSS_SELL}
                    cartIds={chat.cart.map((c) => c.id)}
                    onAdd={chat.addToCart}
                    onAddAll={chat.addManyToCart}
                  />
                </div>
              )}

              {m.booking && (
                <div className="md:mr-11 max-w-[600px]">
                  <PgBookingRenderer chat={chat} payload={m.booking} />
                </div>
              )}

              {m.block && (

                <div className="md:mr-11 max-w-[520px]">
                  {m.block === "address" && (
                    <PgAddressBlock
                      addresses={PG_ADDRESSES}
                      selectedId={chat.selectedAddressId}
                      onSelect={chat.setSelectedAddressId}
                    />
                  )}
                  {m.block === "shipping" && (
                    <PgShippingBlock
                      options={PG_SHIPPING}
                      selectedId={chat.selectedShippingId}
                      onSelect={chat.setSelectedShippingId}
                    />
                  )}
                  {m.block === "payment" && (
                    <PgPaymentBlock
                      options={PG_PAYMENTS}
                      selectedId={chat.selectedPaymentId}
                      onSelect={chat.setSelectedPaymentId}
                    />
                  )}
                  {m.block === "summary" && <PgSummaryBlock summary={chat.summary} />}
                  {m.block === "success" && <PgSuccessBlock summary={chat.summary} />}
                </div>
              )}

              {m.quickReplies && (
                <div className="flex flex-wrap gap-2 md:mr-11">
                  {m.quickReplies.map((q) => (
                    <button
                      key={q.id}
                      onClick={() => chat.send(q.send || q.label)}
                      className="px-3.5 py-2 rounded-xl text-xs border border-border bg-background hover:border-primary/40 transition-colors"
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
              )}

              {m.cta && (
                <div className="md:mr-11 max-w-[300px]">
                  <button
                    onClick={chat.finalize}
                    disabled={!chat.selectedPaymentId}
                    className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm disabled:opacity-50"
                  >
                    {m.cta.label}
                  </button>
                  {!chat.selectedPaymentId && (
                    <p className="text-[11px] text-muted-foreground mt-2 text-center">
                      اول روش پرداخت را انتخاب کن
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}

          {chat.isProcessing && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                <Sparkle className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="flex gap-1 items-center pt-3">
                {[0, 150, 300].map((d) => (
                  <span
                    key={d}
                    className="w-2 h-2 rounded-full bg-primary/60 animate-bounce"
                    style={{ animationDelay: `${d}ms` }}
                  />
                ))}
              </div>
            </div>
          )}

          <div ref={endRef} />
        </div>
      </div>

      <div className="border-t border-border bg-background">
        <form onSubmit={submit} className="max-w-[820px] mx-auto p-3 md:p-4">
          <div className="flex items-end gap-2 p-2 rounded-xl border border-border bg-background">
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) submit(e);
              }}
              rows={1}
              placeholder={PG_STORE.suggested_prompts[0]}
              className="flex-1 min-h-[44px] max-h-[140px] bg-transparent border-none resize-none focus:outline-none text-sm px-2 py-3"
              dir="rtl"
            />
            <button
              type="submit"
              disabled={!value.trim() || chat.isProcessing}
              className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50"
              aria-label="ارسال"
            >
              <ArrowUp className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
