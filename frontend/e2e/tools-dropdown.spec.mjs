import { test, expect } from '@playwright/test';

/**
 * Header gear (Tools) popover: every item must be clickable. It used to close on any click inside because
 * the hidden second ToolsDropdown instance treated those clicks as outside clicks.
 */
const APPS = [
  ['Boing Network', 'boing.network'],
  ['Boing Express', 'boing.express'],
  ['Boing Observer', 'boing.observer'],
  ['Boing Finance', 'boing.finance'],
];

for (const [label, width] of [['desktop', 1440], ['md tier', 900]]) {
  test.describe(`tools popover (${label})`, () => {
    test.use({ viewport: { width, height: 900 } });

    test.beforeEach(async ({ page, context }) => {
      // External app links: answer locally so the test checks navigation without hitting the network.
      await context.route(/https:\/\/(boing\.network|boing\.express|boing\.observer|boing\.finance)\/.*/, (route) =>
        route.fulfill({ status: 200, contentType: 'text/html', body: '<title>stub</title>stub' })
      );
      await page.addInitScript(() => localStorage.setItem('boing_onboarding_completed', 'true'));
      await page.goto('/?noIntro=1');
    });

    const open = async (page) => {
      const btn = page.locator('[data-testid="tools-dropdown-button"]:visible');
      await btn.click();
      const panel = page.getByTestId('tools-dropdown-panel');
      await expect(panel).toBeVisible();
      return panel;
    };

    test('theme toggle and language picker work and keep the panel open', async ({ page }) => {
      const panel = await open(page);
      const wasDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
      await panel.getByRole('button', { name: /Switch to (light|dark) mode/ }).click();
      await expect(panel).toBeVisible();
      await expect
        .poll(() => page.evaluate(() => document.documentElement.classList.contains('dark')))
        .toBe(!wasDark);

      await panel.getByRole('button', { name: 'Select language' }).click();
      await expect(panel).toBeVisible();
      await panel.getByRole('button', { name: /Español/ }).click();
      await expect.poll(() => page.evaluate(() => localStorage.getItem('language'))).toBe('es');
      await expect(panel).toBeVisible();
      // restore
      await panel.getByRole('button', { name: 'Select language' }).click();
      await panel.getByRole('button', { name: /English/ }).click();
      await expect.poll(() => page.evaluate(() => localStorage.getItem('language'))).toBe('en');
    });

    test('Transaction History and DeFi 101 open their dialogs', async ({ page }) => {
      let panel = await open(page);
      await panel.getByTestId('tools-history').click();
      await expect(page.locator('#transaction-history-title')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.locator('#transaction-history-title')).toHaveCount(0);
      panel = await open(page);
      await panel.getByTestId('tools-defi101').click();
      await expect(page.getByRole('dialog', { name: 'DeFi 101' })).toBeVisible();
    });

    for (const [name, host] of APPS) {
      test(`Boing apps link navigates: ${name}`, async ({ page }) => {
        const panel = await open(page);
        await panel.getByRole('link', { name: new RegExp(`^${name.replace('.', '\\.')}`) }).click();
        await expect(page).toHaveURL(new RegExp(`https://${host.replace('.', '\\.')}/`));
      });
    }

    test('closes on outside click and on Escape', async ({ page }) => {
      let panel = await open(page);
      await page.mouse.click(20, 600);
      await expect(panel).toHaveCount(0);
      panel = await open(page);
      await page.keyboard.press('Escape');
      await expect(panel).toHaveCount(0);
    });
  });
}
