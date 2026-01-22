import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should display the hero section with correct heading', async ({ page }) => {
    await page.goto('/');
    
    const heading = page.locator('h1');
    await expect(heading).toContainText('Bli en bättre partner under klimakteriet');
  });

  test('should have a working CTA button to first article', async ({ page }) => {
    await page.goto('/');
    
    const ctaButton = page.getByRole('link', { name: /Börja här|Fortsätt läsa/i });
    await expect(ctaButton).toBeVisible();
    await ctaButton.click();
    
    await expect(page).toHaveURL(/\/artikel\//);
  });

  test('should display the three feature cards', async ({ page }) => {
    await page.goto('/');
    
    await expect(page.getByText('13 artiklar')).toBeVisible();
    await expect(page.getByText('Quiz efter varje artikel')).toBeVisible();
    await expect(page.getByText('Stödjande ton')).toBeVisible();
  });

  test('should have navigation to all articles', async ({ page }) => {
    await page.goto('/');
    
    const allArticlesLink = page.getByRole('link', { name: 'Se alla 13 artiklar' });
    await expect(allArticlesLink).toBeVisible();
    await allArticlesLink.click();
    
    await expect(page).toHaveURL('/artiklar');
  });

  test('should show CTA link for non-logged-in users', async ({ page }) => {
    await page.goto('/');
    
    const ctaLink = page.getByRole('link', { name: /Få kursen i din inbox/i });
    await expect(ctaLink).toBeVisible();
  });
});
