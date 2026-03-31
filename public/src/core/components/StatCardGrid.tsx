/**
 * StatCardGrid — Reusable dashboard stat cards for any portal.
 * Uses design-system tokens for consistent appearance.
 */
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  TrendingUp, TrendingDown, Minus,
  BarChart3, Users, DollarSign, FolderKanban,
  Calendar, BookOpen, FileText, Star,
} from "lucide-react";
import type { StatCard } from "@/core/types";

const iconMap: Record<string, React.ElementType> = {
  chart: BarChart3,
  users: Users,
  revenue: DollarSign,
  projects: FolderKanban,
  calendar: Calendar,
  courses: BookOpen,
  posts: FileText,
  rating: Star,
};

const colorMap: Record<string, { bg: string; text: string }> = {
  primary: { bg: "bg-primary/8", text: "text-primary" },
  success: { bg: "bg-success/8", text: "text-success" },
  warning: { bg: "bg-warning/8", text: "text-warning" },
  destructive: { bg: "bg-destructive/8", text: "text-destructive" },
  muted: { bg: "bg-muted", text: "text-muted-foreground" },
};

interface Props {
  stats: StatCard[];
  loading?: boolean;
  columns?: 2 | 3 | 4;
}

export default function StatCardGrid({ stats, loading, columns = 4 }: Props) {
  const { lang } = useLanguage();
  const gridCols = columns === 2
    ? "grid-cols-1 sm:grid-cols-2"
    : columns === 3
    ? "grid-cols-1 sm:grid-cols-3"
    : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";

  if (loading) {
    return (
      <div className={`grid ${gridCols} gap-4`}>
        {Array.from({ length: columns }).map((_, i) => (
          <Card key={i} className="rounded-2xl">
            <CardContent className="p-5">
              <div className="h-4 w-24 bg-muted rounded animate-pulse mb-3" />
              <div className="h-7 w-16 bg-muted rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid ${gridCols} gap-4`}>
      {stats.map((stat, i) => {
        const Icon = stat.icon ? iconMap[stat.icon] ?? BarChart3 : BarChart3;
        const colors = colorMap[stat.color ?? "primary"] ?? colorMap.primary;

        return (
          <Card key={i} className="rounded-2xl border-border/60 card-hover">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1.5">
                  <p className="label-sm">
                    {lang === "ar" ? stat.label_ar : stat.label_en}
                  </p>
                  <p className="text-2xl font-bold text-foreground tracking-tight">{stat.value}</p>
                </div>
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${colors.bg}`}>
                  <Icon className={`h-5 w-5 ${colors.text}`} />
                </div>
              </div>
              {stat.change !== undefined && (
                <div className="mt-3 flex items-center gap-1.5 text-xs">
                  {stat.change > 0 ? (
                    <TrendingUp className="h-3.5 w-3.5 text-success" />
                  ) : stat.change < 0 ? (
                    <TrendingDown className="h-3.5 w-3.5 text-destructive" />
                  ) : (
                    <Minus className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                  <span className={
                    stat.change > 0 ? "text-success" :
                    stat.change < 0 ? "text-destructive" :
                    "text-muted-foreground"
                  }>
                    {stat.change > 0 ? "+" : ""}{stat.change}%
                  </span>
                  {stat.changeLabel && (
                    <span className="text-muted-foreground">{stat.changeLabel}</span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
