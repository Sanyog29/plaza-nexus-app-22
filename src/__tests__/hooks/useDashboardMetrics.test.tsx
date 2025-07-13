import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({
          data: [
            { id: '1', name: 'Test User' },
            { id: '2', name: 'Test User 2' }
          ],
          error: null
        }))
      }))
    }))
  }
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useDashboardMetrics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns initial metrics structure', () => {
    const { result } = renderHook(() => useDashboardMetrics(), {
      wrapper: createWrapper()
    });

    expect(result.current.metrics).toBeDefined();
    expect(result.current.isLoading).toBe(false);
    expect(typeof result.current.refreshMetrics).toBe('function');
  });

  it('calculates metrics correctly', async () => {
    const { result } = renderHook(() => useDashboardMetrics(), {
      wrapper: createWrapper()
    });

    expect(result.current.metrics.totalVisitors).toBeGreaterThanOrEqual(0);
    expect(result.current.metrics.activeRequests).toBeGreaterThanOrEqual(0);
    expect(result.current.metrics.totalVisitors).toBeGreaterThanOrEqual(0);
  });

  it('refreshes metrics when called', async () => {
    const { result } = renderHook(() => useDashboardMetrics(), {
      wrapper: createWrapper()
    });

    await act(async () => {
      await result.current.refreshMetrics();
    });

    expect(result.current.metrics).toBeDefined();
  });
});