import { expect, test } from '@playwright/test';

test('browser preview is explicit and all retained module routes render', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Open UI preview' })).toBeVisible();
  await page.getByRole('button', { name: 'Open UI preview' }).click();
  await expect(page.getByText(/UI preview.*sample data only/)).toBeVisible();
  for (const route of ['pos', 'catalog', 'kds', 'inventory', 'accounting', 'hotel', 'crm', 'events', 'host', 'procurement', 'batch', 'staff', 'reports', 'tender', 'control', 'settings']) {
    await page.evaluate(route => { window.location.hash = `/${route}`; }, route);
    await page.waitForTimeout(100);
    await expect(page).toHaveURL(new RegExp(`#/${route}$`));
    await expect(page.locator('main')).not.toBeEmpty();
  }
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('native shell mounts its fresh-install intake without runtime provider errors', async ({ page }) => {
  await page.addInitScript(() => {
    (window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__ = {
      invoke: async (command: string) => {
        if (command === 'runtime_status') return { enrolled: false, installationStage: 'NEW', staff: [] };
        throw new Error(`Unexpected native command: ${command}`);
      },
    };
  });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'What kind of business are we configuring?' })).toBeVisible();
  expect(errors).toEqual([]);
});
test('floorplan drafts are editable and preview cannot claim a saved layout', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Open UI preview' }).click();
  await page.getByRole('button', { name: 'Floor Studio' }).click();
  const dialog = page.getByRole('dialog', { name: 'Floorplan designer' });
  await dialog.getByRole('button', { name: 'Round 2-Seat' }).click();
  await dialog.getByLabel('Horizontal position (%)').fill('25');
  await dialog.getByLabel('Vertical position (%)').fill('35');
  await dialog.getByRole('button', { name: 'Save layout' }).click();
  await expect(dialog.getByRole('alert')).toContainText('Saving requires the installed application');
  expect(await dialog.evaluate(element => element.scrollWidth <= window.innerWidth)).toBe(true);
  await dialog.getByRole('button', { name: 'Cancel' }).click();
  await expect(dialog).not.toBeVisible();
});
