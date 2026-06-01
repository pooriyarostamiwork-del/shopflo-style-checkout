import { useEffect, useMemo, useState } from "react";
import { ArrowUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface PromptSlot {
  key: string;
  label: string;
  placeholder: string;
  default: string;
}

export interface PromptTemplate {
  title: string;
  template: string; // e.g. "بهترین {category} زیر {budget} تومان"
  slots: PromptSlot[];
  iconBg: string;
  IconComp: React.ComponentType<{ className?: string }>;
}

interface Props {
  open: boolean;
  onClose: () => void;
  template: PromptTemplate | null;
  onSubmit: (text: string) => void;
}

const renderTemplate = (tpl: string, values: Record<string, string>) =>
  tpl.replace(/\{(\w+)\}/g, (_m, k) => (values[k] ?? "").trim() || `{${k}}`);

export const MobilePromptTemplateModal = ({ open, onClose, template, onSubmit }: Props) => {
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (template) {
      const init: Record<string, string> = {};
      for (const s of template.slots) init[s.key] = s.default;
      setValues(init);
    }
  }, [template]);

  const preview = useMemo(
    () => (template ? renderTemplate(template.template, values) : ""),
    [template, values]
  );

  if (!open || !template) return null;
  const Icon = template.IconComp;

  const handleSubmit = () => {
    const text = preview.trim();
    if (!text) return;
    onSubmit(text);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end" dir="rtl">
      <div
        className="absolute inset-0"
        style={{ background: "hsl(0 0% 0% / 0.4)" }}
        onClick={onClose}
      />
      <div
        className="relative w-full bg-background rounded-t-3xl flex flex-col"
        style={{
          maxHeight: "88vh",
          borderTop: "1px solid hsl(0 0% 0% / 0.08)",
        }}
      >
        {/* Header — non-scrolling */}
        <div className="px-5 pt-3 pb-3 flex-shrink-0">
          <div
            className="mx-auto mb-4 rounded-full"
            style={{ width: 38, height: 4, background: "hsl(0 0% 0% / 0.12)" }}
          />
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: template.iconBg }}
            >
              <Icon className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-[15px] font-semibold text-foreground leading-tight">
                {template.title}
              </h3>
              <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                مقادیر دلخواه‌ت رو وارد کن
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="بستن"
              className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90"
              style={{ border: "1px solid hsl(0 0% 0% / 0.08)" }}
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Scrollable middle */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-4">
          {/* Live preview */}
          <div
            className="rounded-2xl px-3.5 py-3 mb-4"
            style={{
              background: "hsl(var(--primary) / 0.06)",
              border: "1px solid hsl(var(--primary) / 0.15)",
            }}
          >
            <p className="text-[11px] text-muted-foreground mb-1">پیش‌نمایش</p>
            <p className="text-[14px] text-foreground leading-relaxed">{preview}</p>
          </div>

          {/* Slot inputs */}
          <div className="space-y-3">
            {template.slots.map((s) => (
              <div key={s.key}>
                <label className="text-[12px] text-foreground/80 block mb-1.5">
                  {s.label}
                </label>
                <input
                  type="text"
                  value={values[s.key] ?? ""}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, [s.key]: e.target.value }))
                  }
                  placeholder={s.placeholder}
                  className="w-full px-3.5 py-2.5 rounded-xl text-[14px] bg-transparent focus:outline-none text-right"
                  style={{
                    border: "1px solid hsl(0 0% 0% / 0.12)",
                    background: "hsl(0 0% 100%)",
                  }}
                  dir="rtl"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Sticky footer CTA */}
        <div
          className="flex-shrink-0 px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]"
          style={{ borderTop: "1px solid hsl(0 0% 0% / 0.06)", background: "hsl(0 0% 100%)" }}
        >
          <Button
            type="button"
            onClick={handleSubmit}
            className="w-full h-11 rounded-xl text-[14px] font-medium gap-2"
          >
            ارسال به دستیار
            <ArrowUp className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
