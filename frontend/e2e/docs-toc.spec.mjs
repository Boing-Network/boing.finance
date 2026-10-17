import { test, expect } from '@playwright/test';

/** Docs page: one section at a time, sticky table of contents, URL-driven selection, prev/next, mobile list. */

const box = (loc) => loc.boundingBox();
const headerBottom = (page) =>
  page.evaluate(() => Math.round(document.querySelector('header.site-header').getBoundingClientRect().bottom));
const contentTop = (page) =>
  page.evaluate(() => Math.round(document.querySelector('section[id^="doc-"]').parentElement.getBoundingClientRect().top));
const sections = (page) => page.locator('section[id^="doc-"]');

/** Exactly one section is rendered, it is `id`, and its TOC entry is the only highlighted one. */
async function expectOnly(page, id, prefix = 'docs-toc') {
  await expect(sections(page)).toHaveCount(1);
  await expect(page.getByTestId(`docs-section-${id}`)).toBeVisible();
  if (prefix === 'docs-toc') {
    await expect(page.getByTestId(`docs-toc-${id}`)).toHaveAttribute('aria-current', 'location');
    await expect(page.locator('[data-testid^="docs-toc-"][aria-current="location"]')).toHaveCount(1);
  }
}

/** Top of the content card sits just below the sticky header. */
async function expectContentAtTop(page) {
  const hb = await headerBottom(page);
  await expect
    .poll(async () => {
      const t = await contentTop(page);
      return t >= hb && t <= hb + 40;
    }, { timeout: 5_000 })
    .toBe(true);
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('boing_onboarding_completed', 'true'));
});

test.describe('Docs (desktop)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('shows only the selected section; clicking swaps it, updates the URL and scrolls to the content top', async ({ page }) => {
    await page.goto('/docs?noIntro=1');
    await expect(page.getByTestId('docs-toc')).toBeVisible({ timeout: 60_000 });
    await expectOnly(page, 'overview');
    expect(await page.evaluate(() => window.scrollY)).toBe(0); // no jump on a plain visit

    for (const id of ['liquidity', 'names', 'faq', 'swap']) {
      await page.getByTestId(`docs-toc-${id}`).click();
      await expectOnly(page, id);
      await expect(page).toHaveURL(new RegExp(`[?&]section=${id}(&|$)`));
      await expectContentAtTop(page);
    }
  });

  test('the TOC stays in view and sticky while scrolling a long section', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 600 });
    await page.goto('/docs?noIntro=1&section=swap');
    const toc = page.getByTestId('docs-toc');
    await expect(toc).toBeVisible({ timeout: 60_000 });
    await expectOnly(page, 'swap');
    expect(await toc.evaluate((el) => getComputedStyle(el).position)).toBe('sticky');
    const start = await box(toc);

    // Scroll to the end of the section: bottom of the content card at the bottom of the window.
    const contentHeight = await page.evaluate(() => document.querySelector('section[id^="doc-"]').parentElement.offsetHeight);
    expect(contentHeight).toBeGreaterThan(900); // longer than 1.5 windows
    await page.evaluate(() => {
      const card = document.querySelector('section[id^="doc-"]').parentElement;
      window.scrollTo(0, card.getBoundingClientRect().bottom + window.scrollY - window.innerHeight);
    });
    await page.waitForTimeout(300);
    await expect(page.getByTestId('docs-next')).toBeInViewport();
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(300);
    const hb = await headerBottom(page);
    expect(hb).toBeGreaterThan(0); // sticky header still on screen
    const end = await box(toc);
    expect(end.x).toBeLessThan(100);
    expect(Math.abs(end.x - start.x)).toBeLessThan(2);
    expect(end.y).toBeGreaterThanOrEqual(hb);
    expect(end.y + end.height).toBeLessThanOrEqual(600);

    // The list scrolls inside the TOC on a short window, and the active entry is kept visible.
    const list = toc.getByRole('navigation', { name: 'Documentation sections' });
    expect(await list.evaluate((el) => getComputedStyle(el).overflowY)).toBe('auto');
    expect(await list.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
    await page.getByTestId('docs-toc-faq').click();
    await expectOnly(page, 'faq');
    await expect(page.getByTestId('docs-toc-faq')).toBeInViewport();
  });

  test('deep links and old section ids open the right section', async ({ page }) => {
    await page.goto('/docs?noIntro=1&section=bridge');
    await expect(page.getByTestId('docs-toc')).toBeVisible({ timeout: 60_000 });
    await expectOnly(page, 'bridge');
    await expectContentAtTop(page);

    for (const [legacy, id] of [['trading', 'swap'], ['contracts', 'deploy-token'], ['analytics', 'markets'], ['api', 'developers']]) {
      await page.goto('about:blank');
      await page.goto(`/docs?noIntro=1&section=${legacy}`);
      await expectOnly(page, id);
      await expect(page).toHaveURL(new RegExp(`[?&]section=${id}(&|$)`)); // alias rewritten in place
    }
    await page.goto('about:blank');
    await page.goto('/docs?noIntro=1&section=does-not-exist');
    await expectOnly(page, 'overview');
  });

  test('browser back and forward move between sections', async ({ page }) => {
    await page.goto('/docs?noIntro=1');
    await expect(page.getByTestId('docs-toc')).toBeVisible({ timeout: 60_000 });
    await page.getByTestId('docs-toc-bridge').click();
    await expectOnly(page, 'bridge');
    await page.getByTestId('docs-toc-names').click();
    await expectOnly(page, 'names');

    await page.goBack();
    await expectOnly(page, 'bridge');
    await expect(page).toHaveURL(/section=bridge/);
    await page.goBack();
    await expectOnly(page, 'overview');
    await page.goForward();
    await expectOnly(page, 'bridge');
    await page.goForward();
    await expectOnly(page, 'names');
    await expectContentAtTop(page);
  });

  test('previous / next buttons walk the sections in TOC order', async ({ page }) => {
    await page.goto('/docs?noIntro=1');
    await expect(page.getByTestId('docs-toc')).toBeVisible({ timeout: 60_000 });
    const order = await page.locator('[data-testid="docs-toc"] [data-toc-id]').evaluateAll((els) => els.map((e) => e.dataset.tocId));
    expect(order.length).toBeGreaterThan(10);

    await expect(page.getByTestId('docs-prev')).toHaveCount(0); // first section
    await expect(page.getByTestId('docs-next')).toContainText(await page.getByTestId(`docs-toc-${order[1]}`).innerText());
    await page.getByTestId('docs-next').click();
    await expectOnly(page, order[1]);
    await expectContentAtTop(page);
    await page.getByTestId('docs-next').click();
    await expectOnly(page, order[2]);
    await page.getByTestId('docs-prev').click();
    await expectOnly(page, order[1]);

    await page.goto(`/docs?noIntro=1&section=${order[order.length - 1]}`);
    await expectOnly(page, order[order.length - 1]);
    await expect(page.getByTestId('docs-next')).toHaveCount(0); // last section
    await page.getByTestId('docs-prev').click();
    await expectOnly(page, order[order.length - 2]);
  });
});

test.describe('Docs (mobile)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('collapsible contents that collapse after a pick and show only that section', async ({ page }) => {
    await page.goto('/docs?noIntro=1');
    const toggle = page.getByTestId('docs-toc-mobile-toggle');
    await expect(toggle).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId('docs-toc')).toBeHidden();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await page.getByTestId('docs-toc-mobile-names').click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByTestId('docs-toc-mobile-names')).toHaveCount(0);
    await expectOnly(page, 'names', 'mobile');
    await expect(page).toHaveURL(/section=names/);
    await expect(toggle).toContainText('.boing names');
    await expectContentAtTop(page);
    // Not sticky: the collapsed contents box scrolled up under the header, above the content.
    const tb = await box(toggle);
    expect(tb.y + tb.height).toBeLessThanOrEqual((await headerBottom(page)) + 1);

    await page.getByTestId('docs-next').click();
    await expect(sections(page)).toHaveCount(1);
    await expect(page).not.toHaveURL(/section=names/);
  });
});
