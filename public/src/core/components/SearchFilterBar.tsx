/**
 * SearchFilterBar — Reusable search bar with filter chips.
 */
import { Search, X, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";

interface FilterOption {
  key: string;
  label_en: string;
  label_ar: string;
  options: { value: string; label_en: string; label_ar: string }[];
}

interface Props {
  query: string;
  onQueryChange: (q: string) => void;
  placeholder_en?: string;
  placeholder_ar?: string;
  filters?: FilterOption[];
  activeFilters?: Record<string, string | string[] | boolean | number | null>;
  onFilterChange?: (key: string, value: string | null) => void;
  onClearFilters?: () => void;
  activeFilterCount?: number;
}

export default function SearchFilterBar({
  query,
  onQueryChange,
  placeholder_en = "Search...",
  placeholder_ar = "بحث...",
  filters = [],
  activeFilters = {},
  onFilterChange,
  onClearFilters,
  activeFilterCount = 0,
}: Props) {
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  return (
    <div className="space-y-3">
      {/* Search input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={isAr ? placeholder_ar : placeholder_en}
            className="ps-10"
          />
          {query && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute end-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => onQueryChange("")}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        {filters.length > 0 && (
          <Button variant="outline" size="icon" className="relative">
            <SlidersHorizontal className="h-4 w-4" />
            {activeFilterCount > 0 && (
              <Badge variant="destructive" className="absolute -top-1.5 -end-1.5 h-4 w-4 p-0 text-[9px] flex items-center justify-center">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        )}
      </div>

      {/* Filter chips */}
      {filters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <div key={filter.key} className="flex gap-1">
              {filter.options.map((opt) => {
                const active = activeFilters[filter.key] === opt.value;
                return (
                  <Button
                    key={opt.value}
                    variant={active ? "default" : "outline"}
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => onFilterChange?.(filter.key, active ? null : opt.value)}
                  >
                    {isAr ? opt.label_ar : opt.label_en}
                  </Button>
                );
              })}
            </div>
          ))}
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xs h-7 text-muted-foreground" onClick={onClearFilters}>
              <X className="h-3 w-3 me-1" />
              {isAr ? "مسح الكل" : "Clear all"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
