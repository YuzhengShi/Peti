import { useState, useEffect } from 'react';

/**
 * Debounce a value by `delay` ms (default 300).
 * Returns the debounced value — updates only after the caller
 * stops changing `value` for `delay` ms.
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
