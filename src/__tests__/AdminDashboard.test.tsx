import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { screen, fireEvent, waitFor } from '@testing-library/dom';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import UnifiedAdminDashboard from '@/pages/UnifiedAdminDashboard';

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

describe('UnifiedAdminDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dashboard tabs correctly', () => {
    renderWithProviders(<UnifiedAdminDashboard />);
    
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Health')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('switches between tabs correctly', async () => {
    renderWithProviders(<UnifiedAdminDashboard />);
    
    const analyticsTab = screen.getByText('Analytics');
    fireEvent.click(analyticsTab);
    
    await waitFor(() => {
      expect(screen.getByRole('tabpanel')).toBeInTheDocument();
    });
  });

  it('displays health dashboard tab', async () => {
    renderWithProviders(<UnifiedAdminDashboard />);
    
    const healthTab = screen.getByText('Health');
    fireEvent.click(healthTab);
    
    await waitFor(() => {
      expect(screen.getByRole('tabpanel')).toBeInTheDocument();
    });
  });

  it('shows settings tab', async () => {
    renderWithProviders(<UnifiedAdminDashboard />);
    
    const settingsTab = screen.getByText('Settings');
    fireEvent.click(settingsTab);
    
    await waitFor(() => {
      expect(screen.getByRole('tabpanel')).toBeInTheDocument();
    });
  });
});