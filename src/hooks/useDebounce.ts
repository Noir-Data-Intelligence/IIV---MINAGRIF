import { useEffect, useState } from "react";

export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/** Escapa wildcards do PostgREST `ilike` (%, _, ,) para uso seguro em interpolação. */
export function escapeIlike(input: string): string {
  return input.replace(/[\\%_,]/g, (m) => `\\${m}`);
}
