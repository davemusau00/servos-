import { expect, test } from '@playwright/test';

test('browser preview is explicit and all retained module routes render', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Open UI preview' })).toBeVisible();
  await page.getByRole('button', { name: 'Open UI preview' }).click();
  await expect(page.getByText('UI preview — sample data;', { exact: false })).toBeVisible();
  for (const route of ['pos', 'catalog', 'kds', 'inventory', 'accounting', 'hotel', 'crm', 'events', 'host', 'procurement', 'batch', 'staff', 'reports', 'tender', 'control', 'settings']) {
    await page.evaluate(route => { window.location.hash = `/${route}`; }, route);
    await page.waitForTimeout(100);
    await expect(page.locator('main')).not.toBeEmpty();
  }
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
