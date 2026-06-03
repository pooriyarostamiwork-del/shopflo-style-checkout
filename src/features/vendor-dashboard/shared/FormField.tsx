import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface FormFieldProps {
  label: string;
  value?: string;
  placeholder?: string;
  type?: "text" | "textarea" | "email" | "tel" | "date";
  helper?: string;
}

export const FormField = ({ label, value, placeholder, type = "text", helper }: FormFieldProps) => (
  <div className="space-y-1.5">
    <label className="text-xs text-muted-foreground">{label}</label>
    {type === "textarea" ? (
      <Textarea defaultValue={value} placeholder={placeholder} className="min-h-[80px]" />
    ) : (
      <Input type={type} defaultValue={value} placeholder={placeholder} />
    )}
    {helper && <p className="text-[11px] text-muted-foreground">{helper}</p>}
  </div>
);
