import { forwardRef, ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  label: string;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  type?: "text" | "textarea" | "email" | "tel" | "date" | "number" | "password";
  helper?: string;
  error?: string;
  rightSlot?: ReactNode;
  inputClassName?: string;
  dir?: "ltr" | "rtl";
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  registerProps?: Record<string, unknown>;
}

export const FormField = forwardRef<HTMLInputElement | HTMLTextAreaElement, FormFieldProps>(
  ({ label, value, defaultValue, placeholder, type = "text", helper, error, rightSlot, inputClassName, dir, onChange, registerProps }, ref) => {
    const baseInput = "rounded-2xl border-[hsl(var(--vd-stroke))] bg-[hsl(var(--vd-surface))]";
    const errCls = error ? "border-[hsl(var(--vd-danger))] focus-visible:ring-[hsl(var(--vd-danger))]" : "";
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <label className="text-xs text-muted-foreground">{label}</label>
          {rightSlot}
        </div>
        {type === "textarea" ? (
          <Textarea
            ref={ref as React.Ref<HTMLTextAreaElement>}
            value={value}
            defaultValue={defaultValue}
            placeholder={placeholder}
            dir={dir}
            onChange={onChange as any}
            {...registerProps}
            className={cn("min-h-[80px]", baseInput, errCls, inputClassName)}
          />
        ) : (
          <Input
            ref={ref as React.Ref<HTMLInputElement>}
            type={type}
            value={value}
            defaultValue={defaultValue}
            placeholder={placeholder}
            dir={dir}
            onChange={onChange as any}
            {...registerProps}
            className={cn(baseInput, errCls, inputClassName)}
          />
        )}
        {error ? (
          <p className="text-[11px] text-[hsl(var(--vd-danger))]" dir="rtl">{error}</p>
        ) : helper ? (
          <p className="text-[11px] text-muted-foreground" dir="rtl">{helper}</p>
        ) : null}
      </div>
    );
  },
);
FormField.displayName = "FormField";
