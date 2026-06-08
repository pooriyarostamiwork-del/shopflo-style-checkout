import { ReactNode } from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { Sheet, SheetPortal, SheetOverlay } from "@/components/ui/sheet";
import { X } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  children: ReactNode;
  maxBodyHeight?: string;
}

export const VendorBottomSheet = ({
  open,
  onOpenChange,
  title,
  children,
  maxBodyHeight = "70vh",
}: Props) => (
  <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetPortal>
      <SheetOverlay className="bg-black/50 z-50" />
      <SheetPrimitive.Content
        dir="rtl"
        className="vendor-dash fixed inset-x-0 bottom-0 z-50 rounded-t-3xl border-t border-[hsl(var(--vd-stroke))] p-0 max-h-[92vh] bg-white shadow-[0_-8px_32px_rgba(0,0,0,0.18)] pb-[max(env(safe-area-inset-bottom),16px)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom data-[state=closed]:duration-300 data-[state=open]:duration-400"
      >
        <div className="mx-auto w-10 h-1.5 rounded-full bg-[hsl(var(--vd-stroke))] mt-2" />
        <div className="flex items-center justify-between px-5 pt-3 pb-3">
          <SheetPrimitive.Title className="text-base font-semibold text-foreground">
            {title}
          </SheetPrimitive.Title>
          <button
            onClick={() => onOpenChange(false)}
            aria-label="بستن"
            className="vd-interactive w-8 h-8 rounded-full border border-[hsl(var(--vd-stroke))] flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 pb-5 overflow-y-auto" style={{ maxHeight: maxBodyHeight }}>
          {children}
        </div>
      </SheetPrimitive.Content>
    </SheetPortal>
  </Sheet>
);
