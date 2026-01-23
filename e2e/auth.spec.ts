import { test, expect } from '@playwright/test';

test.describe('Authentication page', () => {
  test('should display magic link form', async ({ page }) => {
    await page.goto('/auth');
    
    // Check that the form is visible with correct fields
    await expect(page.getByLabel('Namn (valfritt)')).toBeVisible();
    await expect(page.getByLabel('E-post')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Skicka inloggningslänk' })).toBeVisible();
  });

  test('should display benefits section', async ({ page }) => {
    await page.goto('/auth');
    
    await expect(page.getByText('Dagligt mail')).toBeVisible();
    await expect(page.getByText('Följ dina framsteg')).toBeVisible();
    await expect(page.getByText('Diplom')).toBeVisible();
  });

  test('should display GDPR trust signal', async ({ page }) => {
    await page.goto('/auth');
    
    await expect(page.getByText(/Vi säljer aldrig dina uppgifter/i)).toBeVisible();
  });

  test('should display headline about magic link', async ({ page }) => {
    await page.goto('/auth');
    
    await expect(page.getByText(/Inga lösenord att komma ihåg/i)).toBeVisible();
  });

  test('should have back link to homepage', async ({ page }) => {
    await page.goto('/auth');
    
    const backLink = page.getByRole('link', { name: /Tillbaka till startsidan/i });
    await expect(backLink).toBeVisible();
    await backLink.click();
    
    await expect(page).toHaveURL('/');
  });

  test('should have privacy policy link', async ({ page }) => {
    await page.goto('/auth');
    
    const privacyLink = page.getByRole('link', { name: /integritetspolicy/i });
    await expect(privacyLink).toBeVisible();
  });
});
