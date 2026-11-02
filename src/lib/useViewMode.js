import { useEffect, useState } from "react";

const KEY = "pkos_display";

export function useViewMode() {
  const [mode, setMode] = useState(() => {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw).viewMode || "standard" : "standard";
    } catch {
      return "standard";
    }
  });

  useEffect(() => {
    const sync = () => {
      try {
        const raw = localStorage.getItem(KEY);
        setMode(raw ? JSON.parse(raw).viewMode || "standard" : "standard");
      } catch {
        setMode("standard");
      }
    };
    window.addEventListener("pkos:display-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("pkos:display-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return mode;
}
