import { useEffect, useState } from "react";

/** UI preferences must remain usable when browser storage is unavailable. */
export function useStoredBoolean(key: string, fallback: boolean) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored === "true" ? true : stored === "false" ? false : fallback;
    } catch {
      return fallback;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, String(value));
    } catch {
      // Private browsing, blocked storage or a full quota must not block the UI.
    }
  }, [key, value]);
  return [value, setValue] as const;
}
