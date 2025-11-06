import { useEffect, useState } from 'react';

/**
 * Debounces a value by delaying its update until after a specified delay.
 * Useful for search inputs to reduce the number of filtering operations.
 * 
 * @param value - The value to debounce
 * @param delay - The debounce delay in milliseconds (default: 300ms)
 * @returns The debounced value
 * 
 * @example
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearchTerm = useDebounce(searchTerm, 300);
 * 
 * // Use debouncedSearchTerm for filtering, not searchTerm
 * const filtered = items.filter(item => 
 *   item.name.includes(debouncedSearchTerm)
 * );
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set up the timeout
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up the timeout if value changes before delay expires
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Debounced search hook that combines search state and debouncing.
 * Returns both the immediate value (for input) and debounced value (for filtering).
 * 
 * @param initialValue - Initial search value
 * @param delay - Debounce delay in milliseconds (default: 300ms)
 * @returns Tuple of [immediateValue, debouncedValue, setValue]
 * 
 * @example
 * const [searchTerm, debouncedSearchTerm, setSearchTerm] = useDebouncedSearch('', 300);
 * 
 * <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
 * 
 * // Use debouncedSearchTerm for filtering
 * const filtered = items.filter(item => item.name.includes(debouncedSearchTerm));
 */
export function useDebouncedSearch(
  initialValue: string = '',
  delay: number = 300
): [string, string, (value: string) => void] {
  const [value, setValue] = useState(initialValue);
  const debouncedValue = useDebounce(value, delay);

  return [value, debouncedValue, setValue];
}
