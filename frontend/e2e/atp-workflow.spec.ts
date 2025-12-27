// E2E Tests for ATP Workflow
import { test, expect } from '@playwright/test';

test.describe('ATP Document Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/');
    await page.fill('input[type="email"]', 'vendor@apms.com');
    await page.fill('input[type="password"]', 'Test123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should submit new ATP document', async ({ page }) => {
    // Navigate to ATP submission
    await page.click('text=ATP Management');
    await page.click('text=Submit ATP');

    // Fill form
    await page.selectOption('select[name="site_id"]', '1');
    await page.setInputFiles('input[type="file"]', 'test-files/atp-sample.pdf');

    // Submit
    await page.click('button:has-text("Submit ATP")');

    // Should show success message
    await expect(page.locator('text=ATP submitted successfully')).toBeVisible();
  });

  test('should auto-categorize ATP document', async ({ page }) => {
    await page.click('text=ATP Management');
    await page.click('text=Submit ATP');

    await page.selectOption('select[name="site_id"]', '1');
    await page.setInputFiles('input[type="file"]', 'test-files/software-atp.pdf');

    // Wait for analysis
    await page.waitForSelector('text=Category Detected');

    // Should show category
    await expect(page.locator('text=SOFTWARE')).toBeVisible();
    await expect(page.locator('text=Confidence')).toBeVisible();
  });

  test('should display pending reviews for BO', async ({ page }) => {
    // Login as BO
    await page.click('[data-testid="logout-button"]');
    await page.fill('input[type="email"]', 'bo@apms.com');
    await page.fill('input[type="password"]', 'Test123!');
    await page.click('button[type="submit"]');

    // Navigate to review dashboard
    await page.click('text=Review Dashboard');

    // Should show pending reviews
    await expect(page.locator('text=Pending Reviews')).toBeVisible();
    await expect(page.locator('[data-testid="review-item"]')).toHaveCountGreaterThan(0);
  });

  test('should approve ATP and move to next stage', async ({ page }) => {
    // Login as BO
    await page.goto('/');
    await page.fill('input[type="email"]', 'bo@apms.com');
    await page.fill('input[type="password"]', 'Test123!');
    await page.click('button[type="submit"]');

    // Open first pending review
    await page.click('text=Review Dashboard');
    await page.click('[data-testid="review-item"]:first-child');

    // Approve
    await page.click('button:has-text("Approve")');
    await page.fill('textarea[name="comments"]', 'Approved by BO');
    await page.click('button:has-text("Confirm")');

    // Should show success
    await expect(page.locator('text=ATP approved')).toBeVisible();
  });

  test('should reject ATP with reason', async ({ page }) => {
    await page.goto('/');
    await page.fill('input[type="email"]', 'bo@apms.com');
    await page.fill('input[type="password"]', 'Test123!');
    await page.click('button[type="submit"]');

    await page.click('text=Review Dashboard');
    await page.click('[data-testid="review-item"]:first-child');

    // Reject
    await page.click('button:has-text("Reject")');
    await page.fill('textarea[name="rejection_reason"]', 'Incomplete documentation');
    await page.click('button:has-text("Confirm")');

    // Should show rejection
    await expect(page.locator('text=ATP rejected')).toBeVisible();
  });

  test('should create punchlist item', async ({ page }) => {
    await page.goto('/');
    await page.fill('input[type="email"]', 'sme@apms.com');
    await page.fill('input[type="password"]', 'Test123!');
    await page.click('button[type="submit"]');

    await page.click('text=Review Dashboard');
    await page.click('[data-testid="review-item"]:first-child');

    // Approve with punchlist
    await page.click('button:has-text("Approve with Punchlist")');

    // Add punchlist item
    await page.click('button:has-text("Add Punchlist Item")');
    await page.fill('input[name="description"]', 'Update network diagram');
    await page.selectOption('select[name="severity"]', 'MAJOR');
    await page.click('button:has-text("Save")');

    await page.click('button:has-text("Confirm Approval")');

    // Should show punchlist created
    await expect(page.locator('text=Punchlist item created')).toBeVisible();
  });

  test('should display workflow progress', async ({ page }) => {
    await page.click('text=ATP Documents');
    await page.click('[data-testid="atp-item"]:first-child');

    // Should show workflow stages
    await expect(page.locator('[data-testid="workflow-progress"]')).toBeVisible();
    await expect(page.locator('text=Stage 1: BO')).toBeVisible();
    await expect(page.locator('text=Stage 2: SME')).toBeVisible();
    await expect(page.locator('text=Stage 3: HEAD_NOC')).toBeVisible();
  });

  test('should complete full Software ATP workflow', async ({ page }) => {
    // This test will go through complete workflow
    // Stage 1: BO
    await page.goto('/');
    await page.fill('input[type="email"]', 'bo@apms.com');
    await page.fill('input[type="password"]', 'Test123!');
    await page.click('button[type="submit"]');

    await page.click('text=Review Dashboard');
    await page.click('[data-testid="review-item"]:first-child');
    await page.click('button:has-text("Approve")');
    await page.fill('textarea[name="comments"]', 'BO approval');
    await page.click('button:has-text("Confirm")');

    // Stage 2: SME
    await page.click('[data-testid="logout-button"]');
    await page.fill('input[type="email"]', 'sme@apms.com');
    await page.fill('input[type="password"]', 'Test123!');
    await page.click('button[type="submit"]');

    await page.click('text=Review Dashboard');
    await page.click('[data-testid="review-item"]:first-child');
    await page.click('button:has-text("Approve")');
    await page.fill('textarea[name="comments"]', 'SME approval');
    await page.click('button:has-text("Confirm")');

    // Stage 3: HEAD_NOC
    await page.click('[data-testid="logout-button"]');
    await page.fill('input[type="email"]', 'headnoc@apms.com');
    await page.fill('input[type="password"]', 'Test123!');
    await page.click('button[type="submit"]');

    await page.click('text=Review Dashboard');
    await page.click('[data-testid="review-item"]:first-child');
    await page.click('button:has-text("Approve")');
    await page.fill('textarea[name="comments"]', 'Final approval');
    await page.click('button:has-text("Confirm")');

    // Should show approved
    await expect(page.locator('text=ATP Fully Approved')).toBeVisible();
  });
});
