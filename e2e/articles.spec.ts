import { test, expect } from '@playwright/test';

test.describe('Articles listing page', () => {
  test('should display all articles in a grid', async ({ page }) => {
    await page.goto('/artiklar');
    
    const heading = page.locator('h1');
    await expect(heading).toContainText('artiklar');
    
    // Should have article cards
    const articleCards = page.locator('a[href^="/artikel/"]');
    await expect(articleCards.first()).toBeVisible();
  });

  test('should navigate to article detail from listing', async ({ page }) => {
    await page.goto('/artiklar');
    
    const firstArticle = page.locator('a[href^="/artikel/"]').first();
    await firstArticle.click();
    
    await expect(page).toHaveURL(/\/artikel\/.+/);
  });

  test('should have back link to homepage', async ({ page }) => {
    await page.goto('/artiklar');
    
    const backLink = page.getByRole('link', { name: /Tillbaka till start/i });
    await expect(backLink).toBeVisible();
    await backLink.click();
    
    await expect(page).toHaveURL('/');
  });
});

test.describe('Article detail page', () => {
  test('should display article content', async ({ page }) => {
    await page.goto('/artiklar');
    
    // Get first article and navigate
    const firstArticle = page.locator('a[href^="/artikel/"]').first();
    await firstArticle.click();
    
    // Should have article heading
    const articleHeading = page.locator('h1');
    await expect(articleHeading).toBeVisible();
    
    // Should have article content
    const articleContent = page.locator('article');
    await expect(articleContent).toBeVisible();
  });

  test('should display breadcrumbs', async ({ page }) => {
    await page.goto('/artiklar');
    const firstArticle = page.locator('a[href^="/artikel/"]').first();
    await firstArticle.click();
    
    const breadcrumbs = page.locator('nav[aria-label="Brödsmulor"]');
    await expect(breadcrumbs).toBeVisible();
    await expect(breadcrumbs.getByRole('link', { name: 'Hem' })).toBeVisible();
    await expect(breadcrumbs.getByRole('link', { name: 'Artiklar' })).toBeVisible();
  });

  test('should have quiz CTA', async ({ page }) => {
    await page.goto('/artiklar');
    const firstArticle = page.locator('a[href^="/artikel/"]').first();
    await firstArticle.click();
    
    const quizButton = page.getByRole('button', { name: /Ta quiz/i });
    await expect(quizButton).toBeVisible();
  });

  test('should show signup CTA for non-logged-in users', async ({ page }) => {
    await page.goto('/artiklar');
    const firstArticle = page.locator('a[href^="/artikel/"]').first();
    await firstArticle.click();
    
    const ctaBox = page.getByText(/Få kursen i din inbox varje dag/i);
    await expect(ctaBox).toBeVisible();
  });
});
