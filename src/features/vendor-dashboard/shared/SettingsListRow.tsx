import { ChevronLeft } from "lucide-react";
import { ReactNode } from "react";

interface Props {
  label: string;
  value: string;
  helper?: string;
  rightAccessory?: ReactNode;
  onClick?: () => void;
}

export const SettingsListRow = ({ label, value, helper, rightAccessory, onClick }: Props) => (
  <button
    type="button"
    onClick={onClick}
    className="vd-interactive w-full bg-[hsl(var(--vd-surface))] border border-[hsl(var(--vd-stroke))] rounded-2xl px-4 py-3 flex items-center gap-3 text-right"
  >
    <div className="flex-1 min-w-0">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-medium text-foreground truncate mt-0.5" style={{ unicodeBidi: "isolate" }}>
        {value}
      </div>
      {helper && <div className="text-[11px] text-muted-foreground mt-1 leading-5">{helper}</div>}
    </div>
    {rightAccessory}
    <ChevronLeft className="w-4 h-4 text-muted-foreground shrink-0" />
  </button>
);

