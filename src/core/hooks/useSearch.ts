/**
 * useSearch — Generic search/filter/paginate state hook for any list view.
 * Does not perform queries itself — returns params and setters for use with React Query.
 */
import { useState, useCallback, useMemo, useRef } from "react";
import type { SearchParams } from "@/core/types";

export function useSearch(defaults: Partial<SearchParams> = {}) {
  // Store defaults in a ref to avoid re-render loops
  const defaultsRef = useRef(defaults);

  const [params, setParams] = useState<SearchParams>({
    query: "",
    page: 1,
    pageSize: 12,
    sortBy: "created_at",
    sortOrder: "desc",
    filters: {},
    ...defaults,
  });

  const setQuery = useCallback((query: string) => {
    setParams((p) => ({ ...p, query, page: 1 }));
  }, []);

  const setPage = useCallback((page: number) => {
    setParams((p) => ({ ...p, page }));
  }, []);

  const setPageSize = useCallback((pageSize: number) => {
    setParams((p) => ({ ...p, pageSize, page: 1 }));
  }, []);

  const setSort = useCallback((sortBy: string, sortOrder?: "asc" | "desc") => {
    setParams((p) => ({ ...p, sortBy, sortOrder: sortOrder ?? "desc" }));
  }, []);

  const setFilter = useCallback((key: string, value: string | string[] | boolean | number | null) => {
    setParams((p) => ({
      ...p,
      page: 1,
      filters: { ...p.filters, [key]: value },
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setParams((p) => ({ ...p, filters: {}, page: 1 }));
  }, []);

  const resetAll = useCallback(() => {
    const d = defaultsRef.current;
    setParams({
      query: "",
      page: 1,
      pageSize: d.pageSize ?? 12,
      sortBy: d.sortBy ?? "created_at",
      sortOrder: d.sortOrder ?? "desc",
      filters: {},
    });
  }, []);

  const activeFilterCount = useMemo(() => {
    return Object.values(params.filters ?? {}).filter((v) => v !== null && v !== "" && v !== undefined).length;
  }, [params.filters]);

  const rangeFrom = ((params.page ?? 1) - 1) * (params.pageSize ?? 12);
  const rangeTo = rangeFrom + (params.pageSize ?? 12) - 1;

  return {
    params,
    setQuery,
    setPage,
    setPageSize,
    setSort,
    setFilter,
    clearFilters,
    resetAll,
    activeFilterCount,
    rangeFrom,
    rangeTo,
  };
}
