// E2E Tests for Site Management
import { test, expect } from '@playwright/test';

test.describe('Site Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as DOC_CONTROL
    await page.goto('/');
    await page.fill('input[type="email"]', 'doccontrol@apms.com');
    await page.fill('input[type="password"]', 'Test123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should display site list', async ({ page }) => {
    await page.click('text=Sites');

    // Should show site table
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('[data-testid="site-row"]')).toHaveCountGreaterThan(0);
  });

  test('should create new site', async ({ page }) => {
    await page.click('text=Sites');
    await page.click('button:has-text("Add Site")');

    // Fill form
    const timestamp = Date.now();
    await page.fill('input[name="site_code"]', `TEST-${timestamp}`);
    await page.fill('input[name="site_name"]', `Test Site ${timestamp}`);
    await page.selectOption('select[name="region"]', 'Jakarta');
    await page.fill('input[name="address"]', 'Test Address 123');
    await page.fill('input[name="latitude"]', '-6.2088');
    await page.fill('input[name="longitude"]', '106.8456');
    await page.selectOption('select[name="site_type"]', 'Tower');

    // Submit
    await page.click('button:has-text("Save")');

    // Should show success
    await expect(page.locator('text=Site created successfully')).toBeVisible();
  });

  test('should validate duplicate site code', async ({ page }) => {
    await page.click('text=Sites');
    await page.click('button:has-text("Add Site")');

    // Use existing site code
    await page.fill('input[name="site_code"]', 'SITE-001');
    await page.fill('input[name="site_name"]', 'Duplicate Site');

    await page.click('button:has-text("Save")');

    // Should show error
    await expect(page.locator('text=Site code already exists')).toBeVisible();
  });

  test('should edit existing site', async ({ page }) => {
    await page.click('text=Sites');

    // Click first site edit button
    await page.click('[data-testid="site-row"]:first-child [data-testid="edit-button"]');

    // Update fields
    await page.fill('input[name="site_name"]', 'Updated Site Name');
    await page.selectOption('select[name="status"]', 'Under Construction');

    await page.click('button:has-text("Save")');

    // Should show success
    await expect(page.locator('text=Site updated successfully')).toBeVisible();
  });

  test('should filter sites by status', async ({ page }) => {
    await page.click('text=Sites');

    // Filter by Active status
    await page.selectOption('select[name="status_filter"]', 'Active');
    await page.click('button:has-text("Filter")');

    // Should show only active sites
    const rows = await page.locator('[data-testid="site-row"]').count();
    for (let i = 0; i < rows; i++) {
      await expect(page.locator('[data-testid="site-row"]').nth(i).locator('text=Active')).toBeVisible();
    }
  });

  test('should search sites', async ({ page }) => {
    await page.click('text=Sites');

    // Search
    await page.fill('input[name="search"]', 'Jakarta');
    await page.click('button:has-text("Search")');

    // Should show filtered results
    const rows = await page.locator('[data-testid="site-row"]').count();
    for (let i = 0; i < rows; i++) {
      const row = page.locator('[data-testid="site-row"]').nth(i);
      await expect(row.locator('text=Jakarta')).toBeVisible();
    }
  });

  test('should delete site with confirmation', async ({ page }) => {
    await page.click('text=Sites');

    // Create test site first
    await page.click('button:has-text("Add Site")');
    const timestamp = Date.now();
    await page.fill('input[name="site_code"]', `DELETE-${timestamp}`);
    await page.fill('input[name="site_name"]', 'Delete Test Site');
    await page.click('button:has-text("Save")');

    // Delete it
    await page.click(`[data-testid="delete-DELETE-${timestamp}"]`);

    // Should show confirmation dialog
    await expect(page.locator('text=Are you sure')).toBeVisible();
    await page.click('button:has-text("Confirm")');

    // Should show success
    await expect(page.locator('text=Site deleted successfully')).toBeVisible();
  });

  test('should import sites in bulk', async ({ page }) => {
    await page.click('text=Sites');
    await page.click('button:has-text("Import Sites")');

    // Upload file
    await page.setInputFiles('input[type="file"]', 'test-files/sites-import.xlsx');

    await page.click('button:has-text("Upload")');

    // Should show progress
    await expect(page.locator('text=Importing')).toBeVisible();

    // Should show success
    await expect(page.locator('text=Import completed')).toBeVisible({ timeout: 30000 });
  });

  test('should view site details', async ({ page }) => {
    await page.click('text=Sites');

    // Click first site
    await page.click('[data-testid="site-row"]:first-child');

    // Should show details
    await expect(page.locator('text=Site Details')).toBeVisible();
    await expect(page.locator('[data-testid="site-info"]')).toBeVisible();
    await expect(page.locator('[data-testid="atp-documents"]')).toBeVisible();
    await expect(page.locator('[data-testid="tasks"]')).toBeVisible();
  });
});
