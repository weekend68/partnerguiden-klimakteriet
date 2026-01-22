import { test, expect } from '@playwright/test';

test.describe('Authentication page', () => {
  test('should display signup tab by default', async ({ page }) => {
    await page.goto('/auth');
    
    // Check that signup tab is active
    const signupTab = page.getByRole('tab', { name: 'Skapa konto' });
    await expect(signupTab).toHaveAttribute('data-state', 'active');
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

  test('should switch between login and signup tabs', async ({ page }) => {
    await page.goto('/auth');
    
    // Click login tab
    const loginTab = page.getByRole('tab', { name: 'Logga in' });
    await loginTab.click();
    
    await expect(loginTab).toHaveAttribute('data-state', 'active');
    
    // Should see login form
    await expect(page.getByLabel('E-post')).toBeVisible();
    await expect(page.getByLabel('Lösenord')).toBeVisible();
    await expect(page.getByText('Glömt lösenord?')).toBeVisible();
  });

  test('should have signup form fields', async ({ page }) => {
    await page.goto('/auth');
    
    await expect(page.getByLabel('Namn (valfritt)')).toBeVisible();
    await expect(page.getByLabel('E-post')).toBeVisible();
    await expect(page.getByLabel('Lösenord')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Starta min resa' })).toBeVisible();
  });

  test('should have back link to homepage', async ({ page }) => {
    await page.goto('/auth');
    
    const backLink = page.getByRole('link', { name: /Tillbaka till startsidan/i });
    await expect(backLink).toBeVisible();
    await backLink.click();
    
    await expect(page).toHaveURL('/');
  });

  test('should validate password length on signup', async ({ page }) => {
    await page.goto('/auth');
    
    await page.getByLabel('E-post').fill('test@example.com');
    await page.getByLabel('Lösenord').fill('12345'); // Too short
    await page.getByRole('button', { name: 'Starta min resa' }).click();
    
    // Should show error toast
    await expect(page.getByText(/för kort/i)).toBeVisible();
  });
});
