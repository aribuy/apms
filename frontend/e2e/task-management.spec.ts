// E2E Tests for Task Management
import { test, expect } from '@playwright/test';

test.describe('Task Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as SITE_MANAGER
    await page.goto('/');
    await page.fill('input[type="email"]', 'sitemanager@apms.com');
    await page.fill('input[type="password"]', 'Test123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should display task list', async ({ page }) => {
    await page.click('text=Tasks');

    // Should show task table
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('[data-testid="task-row"]')).toHaveCountGreaterThan(0);
  });

  test('should filter tasks by status', async ({ page }) => {
    await page.click('text=Tasks');

    // Filter by Pending
    await page.selectOption('select[name="status_filter"]', 'Pending');
    await page.click('button:has-text("Filter")');

    // Should show only pending tasks
    const rows = await page.locator('[data-testid="task-row"]').count();
    for (let i = 0; i < rows; i++) {
      await expect(page.locator('[data-testid="task-row"]').nth(i).locator('text=Pending')).toBeVisible();
    }
  });

  test('should update task status', async ({ page }) => {
    await page.click('text=Tasks');

    // Click first task edit button
    await page.click('[data-testid="task-row"]:first-child [data-testid="edit-button"]');

    // Update status
    await page.selectOption('select[name="status"]', 'In Progress');
    await page.fill('textarea[name="notes"]', 'Task started');

    await page.click('button:has-text("Save")');

    // Should show success
    await expect(page.locator('text=Task updated successfully')).toBeVisible();
  });

  test('should complete task', async ({ page }) => {
    await page.click('text=Tasks');

    await page.click('[data-testid="task-row"]:first-child [data-testid="edit-button"]');

    await page.selectOption('select[name="status"]', 'Completed');
    await page.fill('textarea[name="notes"]', 'Task completed');

    await page.click('button:has-text("Save")');

    await expect(page.locator('text=Task completed successfully')).toBeVisible();
  });

  test('should assign task to user', async ({ page }) => {
    await page.click('text=Tasks');

    await page.click('[data-testid="task-row"]:first-child [data-testid="edit-button"]');

    await page.selectOption('select[name="assigned_to"]', 'vendor@apms.com');

    await page.click('button:has-text("Save")');

    await expect(page.locator('text=Task assigned successfully')).toBeVisible();
  });

  test('should bulk update tasks', async ({ page }) => {
    await page.click('text=Tasks');

    // Select multiple tasks
    await page.check('[data-testid="task-row"]:nth-child(1) input[type="checkbox"]');
    await page.check('[data-testid="task-row"]:nth-child(2) input[type="checkbox"]');

    // Bulk action
    await page.click('button:has-text("Bulk Actions")');
    await page.click('text=Assign to Vendor');

    // Should show confirmation
    await expect(page.locator('text=2 tasks will be assigned')).toBeVisible();
    await page.click('button:has-text("Confirm")');

    await expect(page.locator('text=Tasks assigned successfully')).toBeVisible();
  });

  test('should export tasks', async ({ page }) => {
    await page.click('text=Tasks');

    // Filter and export
    await page.selectOption('select[name="status_filter"]', 'Pending');
    await page.click('button:has-text("Filter")');

    await page.click('button:has-text("Export")');

    // Should start download
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Confirm")');
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/\.(xlsx|csv)$/);
  });

  test('should display task statistics', async ({ page }) => {
    await page.click('text=Tasks');

    // Should show statistics cards
    await expect(page.locator('text=Total Tasks')).toBeVisible();
    await expect(page.locator('text=Pending')).toBeVisible();
    await expect(page.locator('text=In Progress')).toBeVisible();
    await expect(page.locator('text=Completed')).toBeVisible();
    await expect(page.locator('text=Overdue')).toBeVisible();
  });

  test('should view task details', async ({ page }) => {
    await page.click('text=Tasks');

    await page.click('[data-testid="task-row"]:first-child');

    // Should show task details
    await expect(page.locator('text=Task Details')).toBeVisible();
    await expect(page.locator('[data-testid="task-info"]')).toBeVisible();
    await expect(page.locator('[data-testid="task-history"]')).toBeVisible();
  });

  test('should create new task manually', async ({ page }) => {
    await page.click('text=Tasks');
    await page.click('button:has-text("Add Task")');

    // Fill form
    const timestamp = Date.now();
    await page.fill('input[name="title"]', `Test Task ${timestamp}`);
    await page.selectOption('select[name="site_id"]', '1');
    await page.selectOption('select[name="assigned_to"]', 'vendor@apms.com');
    await page.fill('input[name="due_date"]', '2025-12-31');
    await page.selectOption('select[name="priority"]', 'HIGH');
    await page.fill('textarea[name="description"]', 'Test task description');

    await page.click('button:has-text("Save")');

    await expect(page.locator('text=Task created successfully')).toBeVisible();
  });
});
