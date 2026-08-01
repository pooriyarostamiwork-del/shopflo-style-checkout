import { useState } from "react";
import { FlaskConical, RotateCcw, X, ChevronLeft } from "lucide-react";
import { PG_JOURNEY_STEPS } from "../data/mockJourney";
import { PgChat, PgCartSeed } from "../hooks/usePlaygroundChat";
import { PG_EXPERIMENTS } from "../registry";
import { PgSlotName } from "../slots";

const SEEDS: { id: PgCartSeed; label: string }[] = [
  { id: "empty", label: "خالی" },
  { id: "single", label: "یک کالا" },
  { id: "multi", label: "چند کالا" },
  { id: "out-of-stock", label: "شامل ناموجود" },
];

const STATUS_LABEL: Record<string, string> = {
  draft: "پیش‌نویس",
  review: "بازبینی",
  shipped: "منتشرشده",
};

interface Props {
  chat: PgChat;
  active: Partial<Record<PgSlotName, string | null>>;
  onToggleExperiment: (slot: PgSlotName, id: string) => void;
}

const Chip = ({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
      active
        ? "border-primary bg-primary text-primary-foreground"
        : "border-border text-muted-foreground hover:border-primary/40"
    }`}
  >
    {children}
  </button>
);

export const PgDevDrawer = ({ chat, active, onToggleExperiment }: Props) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 left-4 z-40 h-11 px-4 rounded-full bg-foreground text-background text-xs flex items-center gap-2 pg-dev-fab"
      >
        <FlaskConical className="w-4 h-4" />
        آزمایشگاه
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex" dir="rtl">
          <button
            className="flex-1 bg-foreground/40"
            onClick={() => setOpen(false)}
            aria-label="بستن"
          />
          <div className="w-[320px] max-w-[85vw] h-full bg-background border-s border-border overflow-y-auto pg-scroll-hidden pg-anim-in">
            <div className="px-4 py-3.5 border-b border-border flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">پنل آزمایشگاه</span>
              <button
                onClick={() => setOpen(false)}
                className="ms-auto w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground"
                aria-label="بستن"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-6">
              <section>
                <h3 className="text-xs text-muted-foreground mb-2">پرش به مرحله سفر</h3>
                <div className="flex flex-wrap gap-2">
                  {PG_JOURNEY_STEPS.map((s) => (
                    <Chip
                      key={s.id}
                      active={chat.step === s.id}
                      onClick={() => chat.jumpTo(s.id)}
                    >
                      {s.label}
                    </Chip>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-xs text-muted-foreground mb-2">وضعیت سبد</h3>
                <div className="flex flex-wrap gap-2">
                  {SEEDS.map((s) => (
                    <Chip
                      key={s.id}
                      active={chat.cartSeed === s.id}
                      onClick={() => chat.applySeed(s.id)}
                    >
                      {s.label}
                    </Chip>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-xs text-muted-foreground mb-2">وضعیت کاربر</h3>
                <div className="flex flex-wrap gap-2">
                  <Chip active={chat.auth === "guest"} onClick={() => chat.setAuth("guest")}>
                    مهمان
                  </Chip>
                  <Chip
                    active={chat.auth === "signed-in"}
                    onClick={() => chat.setAuth("signed-in")}
                  >
                    وارد‌شده
                  </Chip>
                </div>
              </section>

              <section>
                <h3 className="text-xs text-muted-foreground mb-2">
                  سؤال‌های پویا در گفتگو
                </h3>
                <div className="flex flex-wrap gap-2">
                  <Chip active={false} onClick={() => chat.showInteractive("quiz")}>
                    کارت کوییز
                  </Chip>
                  <Chip active={false} onClick={() => chat.showInteractive("wizard")}>
                    انتخابگر چندمرحله‌ای
                  </Chip>
                  <Chip active={false} onClick={() => chat.showInteractive("budget")}>
                    اسلایدر بودجه
                  </Chip>
                  <Chip active={false} onClick={chat.showCrossSell}>
                    کاروسل فروش مکمل
                  </Chip>
                </div>
              </section>

              <section>
                <h3 className="text-xs text-muted-foreground mb-2">
                  مقایسه محصولات در گفتگو
                </h3>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      ["two", "۲ ستونه"],
                      ["three", "۳ ستونه"],
                      ["external", "داخلی/خارجی"],
                      ["mixed", "دسته‌های ناهمگون"],
                      ["incomplete", "داده ناقص"],
                      ["low-confidence", "اعتماد پایین"],
                      ["single", "تک محصول"],
                      ["duplicate", "تکراری"],
                      ["overflow", "بیش از ۳ مورد"],
                    ] as const
                  ).map(([id, label]) => (
                    <Chip key={id} active={false} onClick={() => chat.showComparison(id)}>
                      {label}
                    </Chip>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-xs text-muted-foreground mb-2">
                  کامپوننت‌های آزمایشی
                </h3>

                <div className="space-y-2">
                  {PG_EXPERIMENTS.map((e) => {
                    const isOn = active[e.slot] === e.id;
                    return (
                      <button
                        key={e.id}
                        onClick={() => onToggleExperiment(e.slot, e.id)}
                        className={`w-full text-right p-3 rounded-xl border transition-colors ${
                          isOn ? "border-primary bg-primary/5" : "border-border"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-xs font-medium">{e.title}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md border border-border text-muted-foreground">
                            {STATUS_LABEL[e.status]}
                          </span>
                          {isOn && (
                            <span className="text-[10px] text-primary ms-auto">فعال</span>
                          )}
                        </span>
                        <span className="block text-[11px] text-muted-foreground mt-1 leading-relaxed">
                          {e.description}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

              <button
                onClick={chat.reset}
                className="w-full h-10 rounded-xl border border-border text-xs flex items-center justify-center gap-2 text-muted-foreground"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                بازنشانی محیط
              </button>

              <a
                href="/shift"
                className="w-full h-10 rounded-xl text-xs flex items-center justify-center gap-1 text-muted-foreground"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                بازگشت به محصول اصلی
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
