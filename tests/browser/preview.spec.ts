import { expect, test } from '@playwright/test';

test('browser preview is explicit and all retained module routes render', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Open UI preview' })).toBeVisible();
  await page.getByRole('button', { name: 'Open UI preview' }).click();
  await expect(page.getByText(/UI preview.*sample data only/)).toBeVisible();
  for (const route of ['pos', 'catalog', 'kds', 'inventory', 'accounting', 'hotel', 'crm', 'events', 'host', 'procurement', 'batch', 'staff', 'reports', 'tender', 'control', 'settings', 'help']) {
    await page.evaluate(route => { window.location.hash = `/${route}`; }, route);
    await page.waitForTimeout(100);
    await expect(page).toHaveURL(new RegExp(`#/${route}$`));
    await expect(page.locator('main').first()).not.toBeEmpty();
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

test('native checkout provides customer and business receipt copies', async ({ page }) => {
  await page.addInitScript(() => {
    const windowState = window as Window & { __SERVOS_CALLS?: string[] };
    windowState.__SERVOS_CALLS = [];
    window.print = () => undefined;
    const order = { id: 'order-1', outletId: 'outlet-1', state: 'OPEN', orderNumber: 'SO-1001', subtotal: 100, taxTotal: 0, cateringLevyTotal: 0, grandTotal: 100, amountPaid: 0, items: [{ id: 'item-1', productName: 'Test Lager', quantity: 1, lineTotal: 100, courseStatus: 'HELD' }] };
    const record = (collection: string, id: string, data: Record<string, unknown>) => ({ collection, id, version: 1, archived: false, data });
    const snapshot = {
      terminalId: 'terminal-test', installationStage: 'LIVE', pendingCount: 0, lastSync: null, lastBackup: null,
      actor: { id: 'staff-1', name: 'Test Owner', role: 'Admin', permissions: ['pos.sell','kds.view','inventory.view','catalog.view','mpesa.reconcile','payment.record','floorplan.view','till.close','reports.view','backup.create','help.view','sync.manual'] },
      records: [record('organization','business',{name:'Test Bar'}),record('outlets','outlet-1',{name:'Main Bar',propertyId:'property-1',active:true}),record('orders','order-1',order),record('paymentConfig','main',{methods:['CASH']})],
    };
    (window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__ = {
      invoke: async (command: string) => {
        windowState.__SERVOS_CALLS?.push(command);
        if (command === 'runtime_status') return { enrolled: true, installationStage: 'LIVE', staff: [{id:'staff-1',name:'Test Owner',role:'Admin'}] };
        if (command === 'runtime_login') return {token:'test-session',staffId:'staff-1',name:'Test Owner',role:'Admin'};
        if (command === 'runtime_snapshot') return snapshot;
        if (command === 'runtime_command') return {commandId:'cmd-test',recordIds:[],auditReference:'audit-test',sequence:1};
        if (command === 'runtime_printer_jobs') return [];
        if (command === 'runtime_print_receipt') return {jobId:'print-test-1',orderId:'order-1',state:'QUEUED',message:'Printer offline; job retained.'};
        if (command === 'runtime_printer_retry') return {jobId:'print-test-1',orderId:'order-1',state:'SENT',message:'Test spooler accepted receipt.'};
        throw new Error(`Unexpected native command: ${command}`);
      },
    };
  });
  await page.goto('/');
  await page.getByLabel('PIN').fill('123456');
  await page.getByRole('button', {name:'Unlock'}).click();
  await page.getByRole('button', {name:'Pay'}).click();
  await page.getByLabel('Cash tendered').fill('100');
  await page.getByRole('button', {name:'Record payment'}).click();
  const receipt = page.getByRole('dialog', {name:'Print receipts'});
  await expect(receipt).toBeVisible();
  await expect(receipt.locator('.native-receipt-copy')).toHaveCount(2);
  await expect(receipt.locator('.native-receipt-copy').nth(0).getByText('CUSTOMER COPY', {exact:true})).toBeVisible();
  await expect(receipt.locator('.native-receipt-copy').nth(1).getByText('BUSINESS RECORD COPY - RETAIN FOR RECONCILIATION', {exact:true})).toBeVisible();
  await receipt.getByRole('button', {name:'Print both copies'}).click();
  await expect(receipt.getByRole('status')).toContainText('QUEUED');
  await receipt.getByRole('button', {name:'Retry queued print'}).click();
  await expect(receipt.getByRole('status')).toContainText('SENT');
  expect(await page.evaluate(() => (window as Window & {__SERVOS_CALLS?:string[]}).__SERVOS_CALLS)).toContain('runtime_print_receipt');
  expect(await page.evaluate(() => (window as Window & {__SERVOS_CALLS?:string[]}).__SERVOS_CALLS)).toContain('runtime_printer_retry');
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
