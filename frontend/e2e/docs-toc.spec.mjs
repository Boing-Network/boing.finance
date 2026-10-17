import { test, expect } from '@playwright/test';

/** Docs page: sticky table of contents, scrollspy, click-to-scroll with the header offset, mobile layout. */

const box = (loc) => loc.boundingBox();
const headerBottom = (page) =>
  page.evaluate(() => Math.round(document.querySelector('header.site-header').getBoundingClientRect().bottom));
const sectionTop = (page, id) =>
  page.evaluate((i) => Math.round(document.getElementById(`doc-${i}`).getBoundingClientRect().top), id);

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('boing_onboarding_completed', 'true'));
});

test.describe('Docs table of contents (desktop)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('stays in view at the left while scrolling to the bottom, and highlights the last section', async ({ page }) => {
    await page.goto('/docs?noIntro=1');
    const toc = page.getByTestId('docs-toc');
    await expect(toc).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId('docs-section-faq')).toBeAttached();
    expect(await toc.evaluate((el) => getComputedStyle(el).position)).toBe('sticky');

    const start = await box(toc);
    const hb = await headerBottom(page);

    // End of the docs content (last section on screen): the whole list is stuck below the header.
    await page.evaluate(() => {
      const el = document.getElementById('doc-faq');
      window.scrollTo(0, el.getBoundingClientRect().bottom + window.scrollY - window.innerHeight + 40);
    });
    await page.waitForTimeout(400);
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(2000);
    const mid = await box(toc);
    expect(await headerBottom(page)).toBe(hb); // sticky header still on screen
    expect(mid.x).toBeLessThan(100);
    expect(Math.abs(mid.x - start.x)).toBeLessThan(2);
    expect(mid.y).toBeGreaterThanOrEqual(hb); // below the header, not hidden under it
    expect(mid.y + mid.height).toBeLessThanOrEqual(900);

    // Very bottom of the page (footer showing): still on screen at the left.
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(400);
    await expect(toc).toBeInViewport({ ratio: 0.3 });
    expect((await box(toc)).x).toBeLessThan(100);
    await expect(page.getByTestId('docs-toc-faq')).toHaveAttribute('aria-current', 'location');
  });

  test('clicking an entry scrolls its section to just below the header and marks it active', async ({ page }) => {
    await page.goto('/docs?noIntro=1');
    await expect(page.getByTestId('docs-toc')).toBeVisible({ timeout: 60_000 });
    for (const id of ['liquidity', 'names', 'swap']) {
      await page.getByTestId(`docs-toc-${id}`).click();
      await expect(page.getByTestId(`docs-toc-${id}`)).toHaveAttribute('aria-current', 'location');
      const hb = await headerBottom(page);
      await expect
        .poll(async () => {
          const top = await sectionTop(page, id);
          return top >= hb && top <= hb + 40;
        }, { timeout: 5_000 })
        .toBe(true);
      await expect(page).toHaveURL(new RegExp(`section=${id}`));
    }
  });

  test('scrollspy follows manual scrolling', async ({ page }) => {
    await page.goto('/docs?noIntro=1');
    await expect(page.getByTestId('docs-toc')).toBeVisible({ timeout: 60_000 });
    const hb = await headerBottom(page);
    await page.evaluate(
      ({ hb: h }) => {
        const el = document.getElementById('doc-bridge');
        window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - h - 30);
      },
      { hb }
    );
    await expect(page.getByTestId('docs-toc-bridge')).toHaveAttribute('aria-current', 'location');
    await expect(page.locator('[data-testid^="docs-toc-"][aria-current="location"]')).toHaveCount(1);
  });

  test('a long list scrolls inside the table of contents on short windows', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 560 });
    await page.goto('/docs?noIntro=1');
    const toc = page.getByTestId('docs-toc');
    await expect(toc).toBeVisible({ timeout: 60_000 });
    await page.evaluate(() => window.scrollTo(0, 1500));
    await page.waitForTimeout(300);
    const t = await box(toc);
    const hb = await headerBottom(page);
    expect(t.y).toBeGreaterThanOrEqual(hb);
    expect(t.y + t.height).toBeLessThanOrEqual(560);
    const list = toc.getByRole('navigation', { name: 'Documentation sections' });
    expect(await list.evaluate((el) => getComputedStyle(el).overflowY)).toBe('auto');
    expect(await list.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
    // Jumping to the last section keeps its entry visible inside the list.
    await page.getByTestId('docs-toc-faq').click();
    await expect(page.getByTestId('docs-toc-faq')).toBeInViewport();
    expect(hb).toBeGreaterThan(0);
  });

  test('deep links (current and old section ids) open the right section', async ({ page }) => {
    await page.goto('/docs?noIntro=1&section=bridge');
    await expect(page.getByTestId('docs-toc-bridge')).toHaveAttribute('aria-current', 'location', { timeout: 60_000 });
    const hb = await headerBottom(page);
    await expect.poll(() => sectionTop(page, 'bridge')).toBeLessThanOrEqual(hb + 40);
    await page.goto('/docs?noIntro=1&section=trading');
    await expect(page.getByTestId('docs-toc-swap')).toHaveAttribute('aria-current', 'location', { timeout: 60_000 });
  });

  test('every table-of-contents entry has a matching section', async ({ page }) => {
    await page.goto('/docs?noIntro=1');
    await expect(page.getByTestId('docs-toc')).toBeVisible({ timeout: 60_000 });
    const tocIds = await page.locator('[data-testid="docs-toc"] [data-toc-id]').evaluateAll((els) => els.map((e) => e.dataset.tocId));
    const sectionIds = await page.locator('section[id^="doc-"]').evaluateAll((els) => els.map((e) => e.id.slice(4)));
    expect(tocIds).toEqual(sectionIds);
    expect(tocIds.length).toBeGreaterThan(10);
  });
});

test.describe('Docs table of contents (mobile)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('collapsible, non-sticky contents that jump to a section', async ({ page }) => {
    await page.goto('/docs?noIntro=1');
    const toggle = page.getByTestId('docs-toc-mobile-toggle');
    await expect(toggle).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId('docs-toc')).toBeHidden();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await toggle.click();
    await page.getByTestId('docs-toc-mobile-faq').click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    const hb = await headerBottom(page);
    await expect.poll(() => sectionTop(page, 'faq')).toBeLessThanOrEqual(hb + 40);
    // The collapsed contents box scrolled away with the page (not sticky).
    expect((await box(toggle)).y).toBeLessThan(0);
  });
});
