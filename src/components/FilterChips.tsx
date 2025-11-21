import { X } from "lucide-react";
import { Badge } from "./ui/badge";

export interface FilterState {
  maxPrice?: number;
  minRating?: number;
  eNAMADOnly?: boolean;
  fastestFirst?: boolean;
  cheapestFirst?: boolean;
}

interface FilterChipsProps {
  filters: FilterState;
  onRemoveFilter: (key: keyof FilterState) => void;
  onClearAll: () => void;
}

export const FilterChips = ({
  filters,
  onRemoveFilter,
  onClearAll,
}: FilterChipsProps) => {
  const activeFilters: { key: keyof FilterState; label: string }[] = [];

  if (filters.maxPrice) {
    activeFilters.push({
      key: "maxPrice",
      label: `Under ₹${filters.maxPrice.toLocaleString()}`,
    });
  }
  if (filters.minRating) {
    activeFilters.push({
      key: "minRating",
      label: `${filters.minRating}+ stars`,
    });
  }
  if (filters.eNAMADOnly) {
    activeFilters.push({ key: "eNAMADOnly", label: "eNAMAD Verified" });
  }
  if (filters.fastestFirst) {
    activeFilters.push({ key: "fastestFirst", label: "Fastest Delivery" });
  }
  if (filters.cheapestFirst) {
    activeFilters.push({ key: "cheapestFirst", label: "Lowest Price" });
  }

  if (activeFilters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium text-muted-foreground">
        Active Filters:
      </span>
      {activeFilters.map(({ key, label }) => (
        <Badge
          key={key}
          variant="secondary"
          className="pl-3 pr-2 py-1 gap-2 cursor-pointer hover:bg-destructive/10 transition-colors"
          onClick={() => onRemoveFilter(key)}
        >
          {label}
          <X className="w-3 h-3" />
        </Badge>
      ))}
      {activeFilters.length > 1 && (
        <button
          onClick={onClearAll}
          className="text-xs text-primary hover:underline font-medium"
        >
          Clear all
        </button>
      )}
    </div>
  );
};
