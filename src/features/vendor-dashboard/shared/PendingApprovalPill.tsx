import { Clock } from "lucide-react";

export const PendingApprovalPill = ({ onCancel }: { onCancel?: () => void }) => (
  <span className="inline-flex items-center gap-1 rounded-full bg-[hsl(var(--vd-warning-soft))] text-[hsl(var(--vd-warning))] px-2 py-0.5 text-[10px] font-medium">
    <Clock className="w-2.5 h-2.5" />
    در انتظار تأیید ادمین
    {onCancel && (
      <button
        onClick={onCancel}
        className="mr-1 underline underline-offset-2 hover:opacity-70"
        type="button"
      >
        لغو
      </button>
    )}
  </span>
);
