/**
 * DataTable — Shared responsive table with loading skeletons and empty state.
 * Uses design-system patterns for consistent table styling across portals.
 */
import { ReactNode } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "./EmptyState";

export interface DataTableColumn {
  key: string;
  label_en: string;
  label_ar: string;
  className?: string;
}

interface Props<T> {
  title_en?: string;
  title_ar?: string;
  columns: DataTableColumn[];
  data: T[];
  loading?: boolean;
  renderRow: (item: T, index: number) => ReactNode;
  emptyTitle_en?: string;
  emptyTitle_ar?: string;
  emptyDescription_en?: string;
  emptyDescription_ar?: string;
  emptyIcon?: ReactNode;
  actions?: ReactNode;
}

export default function DataTable<T>({
  title_en,
  title_ar,
  columns,
  data,
  loading,
  renderRow,
  emptyTitle_en = "No data found",
  emptyTitle_ar = "لا توجد بيانات",
  emptyDescription_en,
  emptyDescription_ar,
  emptyIcon,
  actions,
}: Props<T>) {
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  return (
    <Card>
      {(title_en || actions) && (
        <CardHeader className="dashboard-section-header">
          {title_en && (
            <h3 className="dashboard-section-title">
              {isAr ? (title_ar ?? title_en) : title_en}
            </h3>
          )}
          {actions}
        </CardHeader>
      )}
      <CardContent className="px-0 pb-0">
        {!loading && data.length === 0 ? (
          <div className="pb-6">
            <EmptyState
              icon={emptyIcon}
              title_en={emptyTitle_en}
              title_ar={emptyTitle_ar}
              description_en={emptyDescription_en}
              description_ar={emptyDescription_ar}
              compact
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="admin-table-header">
                  {columns.map((col) => (
                    <TableHead key={col.key} className={col.className}>
                      {isAr ? col.label_ar : col.label_en}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              {loading ? (
                <TableBody>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <TableRow key={i}>
                      {columns.map((col) => (
                        <td key={col.key} className="p-3">
                          <Skeleton className="h-4 w-full" />
                        </td>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              ) : (
                <TableBody>{data.map((item, i) => renderRow(item, i))}</TableBody>
              )}
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
