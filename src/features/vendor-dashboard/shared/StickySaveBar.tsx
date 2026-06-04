import { Button } from "@/components/ui/button";

interface Props {
  visible: boolean;
  onSave: () => void;
  onCancel?: () => void;
  saveLabel?: string;
  saving?: boolean;
}

export const StickySaveBar = ({ visible, onSave, onCancel, saveLabel = "ذخیره تغییرات", saving }: Props) => {
  if (!visible) return null;
  return (
    <div className="fixed bottom-16 inset-x-0 z-40 px-4 pb-2">
      <div className="bg-[hsl(var(--vd-surface))] border border-[hsl(var(--vd-stroke))] rounded-2xl p-2 flex items-center gap-2">
        {onCancel && (
          <Button variant="ghost" size="sm" className="flex-1 rounded-full" onClick={onCancel}>
            انصراف
          </Button>
        )}
        <Button size="sm" className="flex-1 rounded-full" onClick={onSave} disabled={saving}>
          {saving ? "در حال ارسال..." : saveLabel}
        </Button>
      </div>
    </div>
  );
};
