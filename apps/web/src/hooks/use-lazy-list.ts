"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

// Loads a list from the BFF the first time a picker opens, so a page doesn't
// fetch every catalog / location / creature up front. `load` fires at most once
// per mount, so re-opening the section doesn't refetch.
export function useLazyList<T>(
  url: string,
  errorMessage = "Could not load data",
) {
  const [rows, setRows] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(false);
  const startedRef = useRef(false);

  const load = useCallback(async () => {
    if (startedRef.current) return;
    startedRef.current = true;
    setLoading(true);
    try {
      const res = await fetch(url);
      if (res.ok) {
        setRows((await res.json()) as T[]);
      } else {
        toast.error(errorMessage);
        setRows([]);
      }
    } catch {
      toast.error("Could not reach the server");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [url, errorMessage]);

  return { rows, loading, load };
}
