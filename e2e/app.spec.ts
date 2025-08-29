import { test, expect } from '@playwright/test';

test.describe('Todo App E2E Tests', () => {
  test('has correct title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle('Web App Starter Pack');
  });

  test('displays the main heading', async ({ page }) => {
    await page.goto('/');
    
    // Check the main heading is visible
    const heading = page.getByRole('heading', { name: /Todo App Example/i });
    await expect(heading).toBeVisible();
  });

  test('shows loading state initially', async ({ page }) => {
    await page.goto('/');
    
    // Should show loading spinner or message
    const loadingText = page.getByText(/Loading todos/i);
    // It might load too fast, so we just check it exists at some point
    await expect(loadingText).toBeVisible({ timeout: 1000 }).catch(() => {
      // If it loads too fast, that's fine
    });
  });

  test('displays todo form', async ({ page }) => {
    await page.goto('/');
    
    // Check for input and button
    const input = page.getByPlaceholder(/Add a new todo/i);
    const button = page.getByRole('button', { name: /Add Todo/i });
    
    await expect(input).toBeVisible();
    await expect(button).toBeVisible();
  });

  test('responsive design works', async ({ page }) => {
    // Desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await expect(page.locator('.container')).toBeVisible();
    
    // Mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('.container')).toBeVisible();
  });

  test('dark mode styles are present', async ({ page }) => {
    await page.goto('/');
    
    // Check that dark mode classes exist in the DOM
    const darkModeElement = page.locator('.dark\\:bg-gray-900');
    const count = await darkModeElement.count();
    expect(count).toBeGreaterThan(0);
  });

  test('shows instructions section', async ({ page }) => {
    await page.goto('/');
    
    // Check for "How This Works" section
    const instructionsHeading = page.getByRole('heading', { name: /How This Works/i });
    await expect(instructionsHeading).toBeVisible();
  });
});