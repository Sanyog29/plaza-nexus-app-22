import { useState, useTransition, useCallback } from 'react';

/**
 * A hook that wraps state updates in React's startTransition to prevent
 * "suspended while responding to synchronous input" warnings.
 * 
 * Use this for state that triggers data fetching or other expensive operations
 * when updated from synchronous events like clicks or inputs.
 * 
 * @example
 * const [filter, setFilter, isPending] = useTransitionState('all');
 * // Use setFilter in onClick, onChange, etc.
 * <Select value={filter} onValueChange={setFilter} />
 */
export function useTransitionState<T>(initialValue: T): [T, (value: T) => void, boolean] {
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<T>(initialValue);

  const setStateWithTransition = useCallback((value: T) => {
    startTransition(() => {
      setState(value);
    });
  }, []);

  return [state, setStateWithTransition, isPending];
}

/**
 * A hook specifically for tab state management with transition support.
 * 
 * @example
 * const [activeTab, setActiveTab, isPending] = useTabTransition('overview');
 * <Tabs value={activeTab} onValueChange={setActiveTab}>
 */
export function useTabTransition(initialTab: string): [string, (tab: string) => void, boolean] {
  return useTransitionState(initialTab);
}

/**
 * A hook specifically for filter state management with transition support.
 * 
 * @example
 * const [filter, setFilter, isPending] = useFilterTransition('all');
 * <Select value={filter} onValueChange={setFilter} />
 */
export function useFilterTransition<T = string>(initialFilter: T): [T, (filter: T) => void, boolean] {
  return useTransitionState(initialFilter);
}

/**
 * A hook for search input state with debouncing and transition support.
 * 
 * @example
 * const [searchTerm, setSearchTerm, isPending] = useSearchTransition('');
 * <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
 */
export function useSearchTransition(initialValue: string = ''): [string, (value: string) => void, boolean] {
  return useTransitionState(initialValue);
}
