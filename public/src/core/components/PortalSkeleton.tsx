/**
 * PortalSkeleton — Shimmer loading state for portal pages.
 * Three variants match typical portal layouts: dashboard, list, detail.
 */
import { Skeleton } from "@/components/ui/skeleton";

interface PortalSkeletonProps {
  variant?: "dashboard" | "list" | "detail";
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 stagger-children">
      {/* Focus block */}
      <Skeleton className="h-20 rounded-2xl" />
      {/* Stat cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Skeleton className="h-48 rounded-2xl" />
        </div>
        <div>
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-4 stagger-children">
      <Skeleton className="h-10 rounded-xl" />
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-[72px] rounded-xl" />
      ))}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6 stagger-children">
      <Skeleton className="h-10 w-2/3 rounded-xl" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Skeleton className="h-64 rounded-2xl" />
        </div>
        <div>
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

export default function PortalSkeleton({ variant = "dashboard" }: PortalSkeletonProps) {
  if (variant === "list") return <ListSkeleton />;
  if (variant === "detail") return <DetailSkeleton />;
  return <DashboardSkeleton />;
}
