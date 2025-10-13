import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { screen } from '@testing-library/dom';
import { MetricsOverview } from '@/components/analytics/MetricsOverview';

// Mock the dashboard metrics hook
vi.mock('@/hooks/useDashboardMetrics', () => ({
  useDashboardMetrics: () => ({
    metrics: {
      totalVisitors: 150,
      activeRequests: 12,
      averageResponseTime: 2.3
    },
    isLoading: false,
    refreshMetrics: vi.fn()
  })
}));

describe('MetricsOverview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders metrics cards correctly', () => {
    render(<MetricsOverview />);
    
    expect(screen.getByText('Total Users')).toBeInTheDocument();
    expect(screen.getByText('Active Requests')).toBeInTheDocument();
    expect(screen.getByText('Completion Rate')).toBeInTheDocument();
    expect(screen.getByText('SLA Compliance')).toBeInTheDocument();
  });

  it('displays loading skeleton when loading', () => {
    vi.mocked(require('@/hooks/useDashboardMetrics').useDashboardMetrics).mockReturnValue({
      metrics: null,
      isLoading: true,
      refreshMetrics: vi.fn()
    });

    render(<MetricsOverview />);
    
    // Should show loading skeletons
    const skeletons = screen.getAllByRole('generic');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows correct metric values', () => {
    render(<MetricsOverview />);
    
    expect(screen.getByText('150')).toBeInTheDocument(); // totalVisitors
    expect(screen.getByText('12')).toBeInTheDocument();  // activeRequests
    expect(screen.getByText('0.0%')).toBeInTheDocument(); // completion rate (0 when no requests)
    expect(screen.getByText('94.2%')).toBeInTheDocument(); // SLA compliance
  });

  it('displays progress bars correctly', () => {
    render(<MetricsOverview />);
    
    // Check for progress elements
    const progressBars = screen.getAllByRole('progressbar');
    expect(progressBars.length).toBeGreaterThan(0);
  });
});