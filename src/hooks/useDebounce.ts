// =========================================================================================
// HOOK: useDebounce
// FIXES: REMOVED UNUSED 'useCallback' IMPORT.
// =========================================================================================

import { useEffect, useState } from "react";

// Custom hook to debounce a value and return it.
// value: The dynamic value (e.g., search query)
// delay: The time in milliseconds to wait before updating the debounced value
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Set a timer to update the debounced value after the delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup function: If the value changes (or the component unmounts)
    // before the timeout, clear the previous timer.
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
