import { useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const AIAssistantBubble = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");

  const suggestions = [
    "Why did orders spike today?",
    "How can I improve conversion?",
    "Explain the revenue drop",
  ];

  return (
    <>
      {/* Chat panel */}
      <div
        className={cn(
          "fixed bottom-24 right-6 w-80 bg-card border rounded-xl shadow-2xl z-50",
          "transition-all duration-300 transform",
          isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
        )}
      >
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[hsl(var(--success))] animate-pulse" />
            <h3 className="font-semibold">Flowcart AI Assistant</h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 space-y-4 h-64 overflow-y-auto">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Hi! I'm your AI assistant. I can help you understand your data, recommend actions, and warn you about performance issues.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Quick questions:</p>
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                className="w-full text-left text-sm p-2 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              placeholder="Ask anything..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  // Handle send
                  setMessage("");
                }
              }}
            />
            <Button size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Floating button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 right-6 z-50",
          "h-14 w-14 rounded-full bg-primary text-primary-foreground",
          "shadow-lg hover:shadow-xl transition-all duration-300",
          "flex items-center justify-center",
          isOpen && "scale-0"
        )}
        style={{ boxShadow: '0 0 30px hsl(var(--primary) / 0.4)' }}
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    </>
  );
};
