import { Wand2, Ticket, ClipboardList, UserCircle, Lock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface FutureModuleCardProps {
  title: string;
  description: string;
  icon: string;
  comingSoon?: boolean;
}

export const FutureModuleCard = ({ title, description, icon, comingSoon }: FutureModuleCardProps) => {
  const getIcon = () => {
    switch (icon) {
      case 'wand':
        return <Wand2 className="h-6 w-6" />;
      case 'ticket':
        return <Ticket className="h-6 w-6" />;
      case 'clipboard':
        return <ClipboardList className="h-6 w-6" />;
      case 'userCircle':
        return <UserCircle className="h-6 w-6" />;
      default:
        return null;
    }
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border p-6",
        "transition-all duration-300",
        comingSoon
          ? "bg-card/50 cursor-not-allowed opacity-60"
          : "bg-card hover:shadow-lg hover:shadow-primary/10 cursor-pointer hover:border-primary/50"
      )}
    >
      {comingSoon && (
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-muted text-xs font-medium">
          <Lock className="h-3 w-3" />
          <span>Soon</span>
        </div>
      )}

      <div className="space-y-4">
        <div className={cn("text-primary", comingSoon && "opacity-50")}>
          {getIcon()}
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        {comingSoon && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3" />
            <span>Coming in Phase 2</span>
          </div>
        )}
      </div>
    </div>
  );
};
