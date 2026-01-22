import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should have working header navigation', async ({ page }) => {
    await page.goto('/');
    
    // Check header links
    const createAccountLink = page.getByRole('link', { name: /Skapa konto/i }).first();
    await expect(createAccountLink).toBeVisible();
  });

  test('should navigate to About page from footer', async ({ page }) => {
    await page.goto('/');
    
    const aboutLink = page.getByRole('link', { name: /Om Partnerguiden/i });
    await expect(aboutLink).toBeVisible();
    await aboutLink.click();
    
    await expect(page).toHaveURL('/om');
  });

  test('should navigate to Privacy Policy from footer', async ({ page }) => {
    await page.goto('/');
    
    const privacyLink = page.getByRole('link', { name: /Integritetspolicy/i });
    await expect(privacyLink).toBeVisible();
    await privacyLink.click();
    
    await expect(page).toHaveURL('/integritetspolicy');
  });

  test('should show 404 page for unknown routes', async ({ page }) => {
    await page.goto('/this-page-does-not-exist');
    
    // Should show some kind of not found message
    await expect(page.getByText(/404|hittades inte/i)).toBeVisible();
  });
});

test.describe('Footer', () => {
  test('should display copyright and links on all pages', async ({ page }) => {
    await page.goto('/');
    
    const footer = page.locator('footer');
    await expect(footer.getByText(/Partnerguiden/)).toBeVisible();
    await expect(footer.getByRole('link', { name: /Integritetspolicy/i })).toBeVisible();
    await expect(footer.getByRole('link', { name: /Om Partnerguiden/i })).toBeVisible();
  });
});
