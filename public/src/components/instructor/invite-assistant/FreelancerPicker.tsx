import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";

interface FreelancerPickerProps {
  search: string;
  onSearchChange: (v: string) => void;
  freelancers: any[];
  onSelect: (f: any) => void;
  isAr: boolean;
}

export default function FreelancerPicker({
  search, onSearchChange, freelancers, onSelect, isAr,
}: FreelancerPickerProps) {
  return (
    <div className="space-y-3">
      <Label className="text-xs font-medium">
        {isAr ? "اختر مستقلاً" : "Select Freelancer"}
      </Label>
      <div className="relative">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder={isAr ? "بحث بالاسم أو المهارة..." : "Search by name or skill..."}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="ps-9 h-9 text-sm rounded-lg"
        />
      </div>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {freelancers.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            {isAr ? "لا مستقلون في هذا التخصص" : "No freelancers found in this specialization"}
          </p>
        ) : (
          freelancers.map((f: any) => (
            <button
              key={f.id}
              onClick={() => onSelect(f)}
              className="w-full flex items-start gap-3 p-3 rounded-lg border border-border/60 bg-card hover:border-primary/30 hover:bg-muted/30 text-start transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                {f.full_name?.[0] ?? "?"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{f.full_name}</p>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5">
                  {f.location && <span>{f.location}</span>}
                  {f.rating > 0 && (
                    <>
                      <span>·</span>
                      <span>★ {f.rating}</span>
                    </>
                  )}
                </div>
                {f.skills && (
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {(f.skills as string[]).slice(0, 3).map((sk: string) => (
                      <Badge key={sk} variant="secondary" className="text-[9px] px-1.5 py-0">
                        {sk}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
