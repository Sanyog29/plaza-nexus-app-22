import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { screen, fireEvent, waitFor } from '@testing-library/dom';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminDashboard from '@/pages/AdminDashboard';

// Mock hooks
vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => false
}));

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

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('AdminDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dashboard tabs correctly', () => {
    renderWithProviders(<AdminDashboard />);
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Assets')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByText('Performance')).toBeInTheDocument();
    expect(screen.getByText('Testing')).toBeInTheDocument();
  });

  it('switches between tabs correctly', async () => {
    renderWithProviders(<AdminDashboard />);
    
    const analyticsTab = screen.getByText('Analytics');
    fireEvent.click(analyticsTab);
    
    await waitFor(() => {
      expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
    });
  });

  it('displays performance optimization tab', async () => {
    renderWithProviders(<AdminDashboard />);
    
    const performanceTab = screen.getByText('Performance');
    fireEvent.click(performanceTab);
    
    await waitFor(() => {
      expect(screen.getByText('Performance Optimization')).toBeInTheDocument();
    });
  });

  it('shows testing dashboard tab', async () => {
    renderWithProviders(<AdminDashboard />);
    
    const testingTab = screen.getByText('Testing');
    fireEvent.click(testingTab);
    
    await waitFor(() => {
      expect(screen.getByText('Testing & Quality Assurance')).toBeInTheDocument();
    });
  });
});