"use client";

import { useEffect, useRef, useState } from "react";
import {
  ApiError,
  getCafes,
  type CafePage,
  type CafeQuery,
  type CafeResult,
} from "@/lib/api";

type PageResult = { data: CafePage } | { error: ApiError };

export type CafeSearchStatus = "loading" | "error" | "ready";

export interface CafeSearch {
  items: CafeResult[];
  total: number | null;
  status: CafeSearchStatus;
  error: ApiError | null;
  hasMore: boolean;
  loadMore: () => void;
  retry: () => void;
}

/**
 * Fetches `GET /api/cafes` page by page for a query (without `page`).
 * Changing the query starts again from page 1; `loadMore` appends the next page.
 */
export function useCafeSearch(query: Omit<CafeQuery, "page">): CafeSearch {
  const queryKey = JSON.stringify(query);
  const [pages, setPages] = useState({ queryKey, count: 1 });
  const pageCount = pages.queryKey === queryKey ? pages.count : 1;
  const [attempt, setAttempt] = useState(0);
  const [results, setResults] = useState<Record<string, PageResult>>({});
  // Keys already fetched or in flight, so re-renders don't refetch.
  const requested = useRef(new Set<string>());

  const pageKey = (page: number) => `${attempt}|${queryKey}|${page}`;

  useEffect(() => {
    const controller = new AbortController();
    const requestedKeys = requested.current;
    const inFlight = new Set<string>();
    const params = JSON.parse(queryKey) as CafeQuery;

    for (let page = 1; page <= pageCount; page++) {
      const key = `${attempt}|${queryKey}|${page}`;
      if (requestedKeys.has(key)) continue;
      requestedKeys.add(key);
      inFlight.add(key);

      getCafes({ ...params, page }, { signal: controller.signal })
        .then((data) => setResults((prev) => ({ ...prev, [key]: { data } })))
        .catch((error: unknown) => {
          if (controller.signal.aborted) return;
          const apiError =
            error instanceof ApiError ? error : new ApiError(0, "Something went wrong");
          setResults((prev) => ({ ...prev, [key]: { error: apiError } }));
        })
        .finally(() => inFlight.delete(key));
    }

    return () => {
      controller.abort();
      // Aborted requests never stored a result - allow them to be requested again.
      inFlight.forEach((key) => requestedKeys.delete(key));
    };
  }, [queryKey, pageCount, attempt]);

  const items: CafeResult[] = [];
  let total: number | null = null;
  let status: CafeSearchStatus = "ready";
  let error: ApiError | null = null;

  for (let page = 1; page <= pageCount; page++) {
    const result = results[pageKey(page)];
    if (!result) {
      status = "loading";
      break;
    }
    if ("error" in result) {
      status = "error";
      error = result.error;
      break;
    }
    items.push(...result.data.items);
    total = result.data.total;
  }

  return {
    items,
    total,
    status,
    error,
    hasMore: status === "ready" && total !== null && items.length < total,
    loadMore: () => setPages({ queryKey, count: pageCount + 1 }),
    retry: () => setAttempt((n) => n + 1),
  };
}
