import { Sparkles } from "lucide-react";
import { suggestionChips } from "./mockIntelligence";

export const EmptyState = ({ onPick }: { onPick: (s: string) => void }) => (
  <div className="flex-1 overflow-y-auto">
    <div className="max-w-[720px] mx-auto px-6 py-14 flex flex-col items-center text-center sd-anim-in">
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
        style={{
          background: "hsl(var(--sd-primary-soft))",
          border: "1px solid hsl(var(--sd-stroke))",
          color: "hsl(var(--sd-primary-ink))",
        }}
      >
        <Sparkles className="w-5 h-5" strokeWidth={1.75} />
      </div>

      <h2 className="sd-headline text-[26px] sm:text-[30px]">
        از دیتای مشتری و بازار چی می‌خوای بدونی؟
      </h2>
      <p className="sd-sublead max-w-[520px]">
        هوش مشتری، الگوهای خرید و سیگنال‌های بازار فروشگاهت رو تحلیل می‌کنه.
        یه سوال بپرس یا از پیشنهادهای زیر شروع کن.
      </p>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
        {suggestionChips.map((s) => (
          <button
            key={s}
            onClick={() => onPick(s)}
            className="text-right px-4 py-3 rounded-2xl transition-all sd-suggestion-chip"
          >
            <div className="text-[12.5px] leading-[1.7] text-[hsl(var(--sd-ink))]">
              {s}
            </div>
          </button>
        ))}
      </div>
    </div>
  </div>
);
