import { useState, useRef, useEffect } from "react";
import { Send, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChatMessage, Product, mockProducts } from "@/data/gptCommerceData";
import { ProductCard } from "./ProductCard";

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  onAddToCart: (product: Product) => void;
  onCompare: (product: Product) => void;
  cartItems: Product[];
  isProcessing: boolean;
  onCheckout: () => void;
}

export const ChatInterface = ({
  messages,
  onSendMessage,
  onAddToCart,
  onCompare,
  cartItems,
  isProcessing,
  onCheckout,
}: ChatInterfaceProps) => {
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isProcessing) {
      onSendMessage(inputValue.trim());
      setInputValue("");
    }
  };

  const quickActions = [
    { label: 'هدفون بی‌سیم می‌خوام', action: 'هدفون بی‌سیم خوب با ارسال سریع می‌خوام' },
    { label: 'مقایسه محصولات', action: 'این محصولات رو با هم مقایسه کن' },
    { label: 'خودت خرید رو انجام بده', action: 'خودت خرید رو انجام بده' },
  ];

  return (
    <div className="flex-1 flex flex-col h-screen bg-white" dir="rtl">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[820px] mx-auto p-6 space-y-6">
          {messages.map((msg) => (
            <div key={msg.id} className="space-y-4">
              {/* Message Bubble */}
              <div
                className={`flex gap-3 ${
                  msg.role === 'user' ? 'justify-start flex-row-reverse' : 'justify-start'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[70%] px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-[#EEF2FF] rounded-[16px_16px_4px_16px] text-[#111827]'
                      : 'bg-[#F9FAFB] rounded-[16px_16px_16px_4px] text-foreground'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </p>
                </div>
              </div>

              {/* Product Cards */}
              {msg.products && msg.products.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mr-11">
                  {msg.products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAddToCart={onAddToCart}
                      onCompare={onCompare}
                      isInCart={cartItems.some(item => item.id === product.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Processing Indicator */}
          {isProcessing && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div className="bg-[#F9FAFB] rounded-[16px_16px_16px_4px] px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Quick Actions */}
      {messages.length <= 1 && (
        <div className="border-t border-[#E5E7EB] bg-[#F9FAFB]">
          <div className="max-w-[820px] mx-auto px-6 py-3">
            <p className="text-xs text-muted-foreground mb-2">پیشنهادها:</p>
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action, i) => (
                <button
                  key={i}
                  onClick={() => {
                    if (action.action.includes('خرید')) {
                      onCheckout();
                    } else {
                      setInputValue(action.action);
                    }
                  }}
                  className="text-xs px-3 py-1.5 rounded-full bg-white border border-[#E5E7EB] text-foreground hover:bg-primary/5 hover:border-primary/30 transition-colors"
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-[#E5E7EB] bg-white">
        <form onSubmit={handleSubmit} className="max-w-[820px] mx-auto p-4">
          <div className="flex gap-3">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="چی می‌خوای بخری؟ بگو تا پیدا کنم..."
              disabled={isProcessing}
              className="flex-1 h-12 rounded-xl border-[#E5E7EB] focus:border-primary text-right"
              dir="rtl"
            />
            <Button
              type="submit"
              disabled={!inputValue.trim() || isProcessing}
              className="h-12 px-6 rounded-xl"
            >
              <Send className="w-4 h-4 rotate-180" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
