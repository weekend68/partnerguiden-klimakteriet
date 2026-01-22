import { test, expect } from '@playwright/test';

test.describe('Unsubscribe page', () => {
  test('should show default message when visiting directly', async ({ page }) => {
    await page.goto('/avregistrera');
    
    await expect(page.getByText('Avregistrering')).toBeVisible();
    await expect(page.getByText(/Använd länken i mejlet/i)).toBeVisible();
  });

  test('should show success message with status=success', async ({ page }) => {
    await page.goto('/avregistrera?status=success');
    
    await expect(page.getByText('Du är avregistrerad')).toBeVisible();
    await expect(page.getByText(/inte längre få mejl/i)).toBeVisible();
  });

  test('should show error message with status=error', async ({ page }) => {
    await page.goto('/avregistrera?status=error');
    
    await expect(page.getByText('Något gick fel')).toBeVisible();
  });

  test('should show expired link message', async ({ page }) => {
    await page.goto('/avregistrera?status=error&reason=expired');
    
    await expect(page.getByText(/Länken har gått ut/i)).toBeVisible();
  });

  test('should have link back to homepage', async ({ page }) => {
    await page.goto('/avregistrera?status=success');
    
    const homeLink = page.getByRole('link', { name: /Till startsidan/i });
    await expect(homeLink).toBeVisible();
    await homeLink.click();
    
    await expect(page).toHaveURL('/');
  });
});
