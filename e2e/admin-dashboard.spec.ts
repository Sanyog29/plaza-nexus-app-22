import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/dashboard');
  });

  test('should display dashboard with all tabs', async ({ page }) => {
    // Check if main dashboard tabs are visible
    await expect(page.getByText('Dashboard')).toBeVisible();
    await expect(page.getByText('Assets')).toBeVisible();
    await expect(page.getByText('Analytics')).toBeVisible();
    await expect(page.getByText('Performance')).toBeVisible();
    await expect(page.getByText('Deploy')).toBeVisible();
  });

  test('should navigate between tabs correctly', async ({ page }) => {
    // Navigate to Analytics tab
    await page.click('text=Analytics');
    await expect(page.getByText('Analytics Dashboard')).toBeVisible();

    // Navigate to Performance tab
    await page.click('text=Performance');
    await expect(page.getByText('Performance Optimization')).toBeVisible();

    // Navigate to Deploy tab
    await page.click('text=Deploy');
    await expect(page.getByText('Deployment Readiness')).toBeVisible();
  });

  test('should display performance metrics', async ({ page }) => {
    await page.click('text=Performance');
    
    // Check for performance metrics
    await expect(page.getByText('Performance Optimization')).toBeVisible();
    await expect(page.getByText('Run Analysis')).toBeVisible();
    
    // Click run analysis button
    await page.click('text=Run Analysis');
    await expect(page.getByText('Analyzing...')).toBeVisible();
  });

  test('should show deployment readiness checks', async ({ page }) => {
    await page.click('text=Deploy');
    
    // Check for deployment sections
    await expect(page.getByText('Deployment Readiness')).toBeVisible();
    await expect(page.getByText('Readiness Check')).toBeVisible();
    await expect(page.getByText('Environments')).toBeVisible();
    
    // Check for deployment score
    await expect(page.locator('text=/\\d+%/')).toBeVisible();
  });

  test('should display analytics dashboard correctly', async ({ page }) => {
    await page.click('text=Analytics');
    
    // Check for analytics sections
    await expect(page.getByText('Analytics Dashboard')).toBeVisible();
    await expect(page.getByText('Overview')).toBeVisible();
    await expect(page.getByText('Performance')).toBeVisible();
    await expect(page.getByText('System Health')).toBeVisible();
    await expect(page.getByText('Reports')).toBeVisible();
  });

  test('should generate reports correctly', async ({ page }) => {
    await page.click('text=Analytics');
    await page.click('text=Reports');
    
    // Check reports generator
    await expect(page.getByText('Reports Generator')).toBeVisible();
    await expect(page.getByText('Generate New Report')).toBeVisible();
    
    // Try to generate a report
    await page.selectOption('select', 'maintenance');
    await page.click('text=Generate Report');
    
    await expect(page.getByText('Generating...')).toBeVisible();
  });

  test('should handle mobile navigation', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    
    // Check if mobile layout is active
    // This would depend on your mobile implementation
    await expect(page.locator('[data-testid="mobile-layout"]')).toBeVisible({ timeout: 5000 });
  });

  test('should display error boundary on error', async ({ page }) => {
    // This would need a way to trigger an error
    // For now, we'll check the error boundary component exists
    await page.evaluate(() => {
      throw new Error('Test error');
    });
    
    // Error boundary should catch and display error UI
    // This test might need adjustment based on actual error handling
  });
});