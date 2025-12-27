// E2E Tests for Dashboard
import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login as Administrator
    await page.goto('/');
    await page.fill('input[type="email"]', 'admin@apms.com');
    await page.fill('input[type="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should display dashboard statistics', async ({ page }) => {
    // ATP Statistics
    await expect(page.locator('text=Total ATP Documents')).toBeVisible();
    await expect(page.locator('text=Pending Review')).toBeVisible();
    await expect(page.locator('text=Approved')).toBeVisible();
    await expect(page.locator('text=Rejected')).toBeVisible();

    // Site Statistics
    await expect(page.locator('text=Total Sites')).toBeVisible();
    await expect(page.locator('text=Active Sites')).toBeVisible();

    // Task Statistics
    await expect(page.locator('text=Total Tasks')).toBeVisible();
    await expect(page.locator('text=Pending Tasks')).toBeVisible();
    await expect(page.locator('text=Overdue Tasks')).toBeVisible();
  });

  test('should display recent activities', async ({ page }) => {
    await expect(page.locator('text=Recent Activities')).toBeVisible();
    await expect(page.locator('[data-testid="activity-feed"]')).toBeVisible();
  });

  test('should navigate to sections from dashboard', async ({ page }) => {
    // Click on ATP Documents card
    await page.click('[data-testid="atp-stat-card"]');
    await expect(page).toHaveURL(/.*atp-documents/);

    // Go back to dashboard
    await page.click('text=Dashboard');

    // Click on Sites card
    await page.click('[data-testid="sites-stat-card"]');
    await expect(page).toHaveURL(/.*sites/);
  });

  test('should display charts and graphs', async ({ page }) => {
    // ATP by Type chart
    await expect(page.locator('[data-testid="atp-type-chart"]')).toBeVisible();

    // Site Status chart
    await expect(page.locator('[data-testid="site-status-chart"]')).toBeVisible();

    // Task Progress chart
    await expect(page.locator('[data-testid="task-progress-chart"]')).toBeVisible();
  });

  test('should filter dashboard data', async ({ page }) => {
    // Date range filter
    await page.click('button:has-text("Last 30 Days")');
    await page.click('text=Last 7 Days');

    // Should reload data
    await expect(page.locator('[data-testid="dashboard-content"]')).toBeVisible();
  });

  test('should show pending review alerts', async ({ page }) => {
    // If there are pending reviews, should show alerts
    const alerts = await page.locator('[data-testid="alert-item"]').count();
    if (alerts > 0) {
      await expect(page.locator('[data-testid="alert-item"]')).first().toBeVisible();
    }
  });

  test('should display quick actions', async ({ page }) => {
    await expect(page.locator('button:has-text("Submit ATP")')).toBeVisible();
    await expect(page.locator('button:has-text("Add Site")')).toBeVisible();
    await expect(page.locator('button:has-text("Create Task")')).toBeVisible();
  });

  test('should show role-based dashboard content', async ({ page }) => {
    // Admin should see all sections
    await expect(page.locator('text=User Management')).toBeVisible();
    await expect(page.locator('text=System Settings')).toBeVisible();
  });

  test('should refresh dashboard data', async ({ page }) => {
    const initialATPCount = await page.locator('[data-testid="atp-total-count"]').textContent();

    await page.click('button:has-text("Refresh")');

    // Should reload data
    await expect(page.locator('[data-testid="dashboard-content"]')).toBeVisible();
  });
});
