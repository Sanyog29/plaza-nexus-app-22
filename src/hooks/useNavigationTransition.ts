import { useTransition, useCallback } from 'react';
import { useNavigate, NavigateOptions, To } from 'react-router-dom';

/**
 * Custom hook that wraps React Router's useNavigate with React 18's startTransition.
 * This prevents "suspended while responding to synchronous input" warnings
 * by marking navigation as a non-urgent transition.
 * 
 * @returns Object containing:
 *   - navigate: Transition-wrapped navigate function
 *   - isPending: Boolean indicating if navigation is in progress
 * 
 * @example
 * const { navigate, isPending } = useNavigationTransition();
 * 
 * // Use like regular navigate
 * navigate('/dashboard');
 * navigate('/profile', { replace: true });
 * 
 * // Show loading state during transition
 * <Button disabled={isPending}>
 *   {isPending ? 'Loading...' : 'Go to Dashboard'}
 * </Button>
 */
export function useNavigationTransition() {
  const navigateOriginal = useNavigate();
  const [isPending, startTransition] = useTransition();

  const navigate = useCallback(
    (to: To | number, options?: NavigateOptions) => {
      startTransition(() => {
        if (typeof to === 'number') {
          navigateOriginal(to);
        } else {
          navigateOriginal(to, options);
        }
      });
    },
    [navigateOriginal]
  );

  return { navigate, isPending };
}
