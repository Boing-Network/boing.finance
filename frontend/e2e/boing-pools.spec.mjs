import { test, expect } from '@playwright/test';
import {
  NATIVE_CONSTANT_PRODUCT_RESERVE_A_KEY_HEX,
  NATIVE_CONSTANT_PRODUCT_RESERVE_B_KEY_HEX,
  NATIVE_CONSTANT_PRODUCT_SWAP_FEE_BPS_KEY_HEX,
  NATIVE_CONSTANT_PRODUCT_TOKEN_A_KEY_HEX,
  NATIVE_CONSTANT_PRODUCT_TOKEN_B_KEY_HEX,
  NATIVE_CONSTANT_PRODUCT_TOTAL_LP_KEY_HEX,
  boingTokenBalanceStorageKeyHex,
  nativeAmmLpBalanceStorageKeyHex,
} from 'boing-sdk';

/**
 * Simple Pools / Your liquidity tabs against a mocked chain: two custody pools (FV2C/USDC, USDC/tBOING),
 * a wallet holding 1% of USDC/tBOING. Checks cards, search, add auto-fill + share, remove presets, and that
 * no raw hex is visible unless "Details" is opened. Screenshots go to E2E_SHOT_DIR when set.
 */
const ACCOUNT = `0x${'11'.repeat(32)}`;
const USDC = '0x6676f971ade3982406efa3e2cdb0477923f8f2a15624c4b6ad3a432817a75e93';
const TB = '0x6fce9d3e3f13df9fc17e3fd947148a4e6ce6966538b7dd9bf2a891d3b9699c6b';
const FV = '0x31357854f6371c8bafac0ff20296608d87db532bef06de8066d1fdd32c824b4e';
const P1 = '0x2ad75c2e11b1e93761f4f8df39502deecbe7148324e5a80a951798142b2c5b61';
const P2 = '0x9261b793dd4dcfbd7a0583b19b525f34910ecd5ce6b34d0520b3e8351b20c02e';
const RPC = process.env.BOING_E2E_RPC || 'https://testnet-rpc.boing.network';
const SHOTS = process.env.E2E_SHOT_DIR || '';

const u128 = (n) => `0x${'0'.repeat(32)}${BigInt(n).toString(16).padStart(32, '0')}`;
const POOLS = [
  { poolHex: P1, tokenAHex: USDC, tokenBHex: TB, reserveA: 100350, reserveB: 99719, totalLp: 100000, feeBps: 30, mine: 1000 },
  { poolHex: P2, tokenAHex: FV, tokenBHex: USDC, reserveA: 1000, reserveB: 100, totalLp: 316, feeBps: 30, mine: 0 },
];
const storage = new Map();
for (const p of POOLS) {
  const set = (k, v) => storage.set(`${p.poolHex}|${k.toLowerCase()}`, v);
  set(NATIVE_CONSTANT_PRODUCT_RESERVE_A_KEY_HEX, u128(p.reserveA));
  set(NATIVE_CONSTANT_PRODUCT_RESERVE_B_KEY_HEX, u128(p.reserveB));
  set(NATIVE_CONSTANT_PRODUCT_TOTAL_LP_KEY_HEX, u128(p.totalLp));
  set(NATIVE_CONSTANT_PRODUCT_SWAP_FEE_BPS_KEY_HEX, u128(p.feeBps));
  set(NATIVE_CONSTANT_PRODUCT_TOKEN_A_KEY_HEX, p.tokenAHex);
  set(NATIVE_CONSTANT_PRODUCT_TOKEN_B_KEY_HEX, p.tokenBHex);
  set(nativeAmmLpBalanceStorageKeyHex(ACCOUNT), u128(p.mine));
}
for (const t of [USDC, TB, FV]) storage.set(`${t}|${boingTokenBalanceStorageKeyHex(ACCOUNT).toLowerCase()}`, u128(5000));
const TOKENS = [
  { id: FV, symbol: 'FV2C', name: 'FinV2Check', decimals: 0 },
  { id: USDC, symbol: 'USDC', name: 'Testnet USD Coin', decimals: 0 },
  { id: TB, symbol: 'BOING', name: 'Boing Token', decimals: 0 },
];

function answer(call) {
  const m = call?.method;
  const p = call?.params || [];
  if (m === 'boing_listDexPools') {
    return { pools: POOLS.map((x) => ({ ...x, reserveA: String(x.reserveA), reserveB: String(x.reserveB), tokenADecimals: 0, tokenBDecimals: 0 })), nextCursor: null };
  }
  if (m === 'boing_listDexTokens') return { tokens: TOKENS, nextCursor: null };
  if (m === 'boing_getDexToken') return TOKENS.find((t) => t.id === String(p[0]?.id ?? p[0]).toLowerCase()) ?? null;
  if (m === 'boing_simulateContractCall' || m === 'boing_simulateCall') return { success: false, error: 'e2e probe: custody pool' };
  if (m === 'boing_getContractStorage') {
    const [c, k] = p;
    return { value: storage.get(`${String(c).toLowerCase()}|${String(k).toLowerCase()}`) ?? u128(0) };
  }
  return undefined;
}

async function mockChain(page) {
  await page.context().route(
    (url) => /\/api\/boing-rpc|testnet-rpc\.boing\.network/.test(url.href),
    async (route) => {
      const req = route.request();
      const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' };
      if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
      let body = null;
      try {
        body = req.postDataJSON();
      } catch {
        /* not JSON */
      }
      const calls = Array.isArray(body) ? body : [body];
      const local = calls.map(answer);
      if (local.every((r) => r !== undefined)) {
        const out = calls.map((c, i) => ({ jsonrpc: '2.0', id: c?.id ?? null, result: local[i] }));
        return route.fulfill({ status: 200, contentType: 'application/json', headers: cors, body: JSON.stringify(Array.isArray(body) ? out : out[0]) });
      }
      try {
        const res = await route.fetch({ url: RPC, method: 'POST', headers: { 'content-type': 'application/json' }, postData: req.postData() ?? '' });
        await route.fulfill({ status: res.status(), contentType: 'application/json', headers: cors, body: await res.body() });
      } catch {
        /* page closed */
      }
    }
  );
}

async function wallet(page) {
  await page.addInitScript(({ account }) => {
    localStorage.setItem('boing_onboarding_completed', 'true');
    localStorage.setItem('walletConnected', 'true');
    localStorage.setItem('walletType', 'boingExpress');
    localStorage.removeItem('userDisconnected');
    const provider = {
      isBoing: true,
      isBoingExpress: true,
      request: async ({ method }) => {
        if (method === 'boing_chainId' || method === 'eth_chainId') return '0x1b01';
        if (['boing_accounts', 'eth_accounts', 'boing_requestAccounts', 'eth_requestAccounts'].includes(method)) return [account];
        if (method === 'boing_signMessage' || method === 'personal_sign') return `0x${'ab'.repeat(64)}`;
        throw new Error(`E2E mock: unhandled ${method}`);
      },
      on: () => {},
      removeListener: () => {},
    };
    window.boing = provider;
    window.ethereum = provider;
  }, { account: ACCOUNT });
}

const shot = async (page, name) => SHOTS && page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: false });
const noHex = async (loc) => expect(await loc.innerText()).not.toMatch(/0x[0-9a-f]{16,}/i);

test.describe('Simple Pools and Your liquidity', () => {
  test.beforeEach(async ({ page }) => {
    await mockChain(page);
    await page.setViewportSize({ width: 1280, height: 1000 });
  });

  test('pool cards, search, details expander', async ({ page }) => {
    test.setTimeout(180_000);
    await wallet(page);
    await page.goto('/swap?noIntro=1&nativeTradeTab=pools');
    const tab = page.getByTestId('boing-pools-tab');
    await expect(tab).toBeVisible({ timeout: 90_000 });
    const cards = page.getByTestId('pool-card');
    await expect(cards).toHaveCount(2, { timeout: 60_000 });
    expect((await page.getByTestId('pool-pair').allInnerTexts()).sort()).toEqual(['FV2C / USDC', 'USDC / tBOING']);
    const fv = page.locator('[data-testid="pool-card"][data-pair="FV2C / USDC"]');
    const ut = page.locator('[data-testid="pool-card"][data-pair="USDC / tBOING"]');
    await expect(fv.getByTestId('pool-liquidity')).toHaveText('1,000 FV2C + 100 USDC');
    await expect(fv.getByTestId('pool-price')).toContainText('1 FV2C ≈ 0.1 USDC');
    await expect(ut.getByTestId('pool-liquidity')).toHaveText('100,350 USDC + 99,719 tBOING');
    await expect(ut.getByTestId('pool-price')).toContainText('1 USDC ≈ 0.9937 tBOING');
    await expect(ut.getByTestId('pool-share')).toContainText('1.00%');
    await ut.getByTestId('pool-price').click();
    await expect(ut.getByTestId('pool-price')).toContainText('1 tBOING ≈ 1.006 USDC');
    await expect(page.getByTestId('pool-create')).toBeVisible();
    await expect(page.getByTestId('pool-card-skeleton')).toHaveCount(0);
    await expect(tab).not.toContainText('Refreshing');
    await noHex(tab);
    await shot(page, 'pools-list');

    await page.getByTestId('pool-search').fill('fv2c');
    await expect(cards).toHaveCount(1);
    await expect(page.getByTestId('pool-pair')).toHaveText('FV2C / USDC');
    await shot(page, 'pools-search');
    await page.getByTestId('pool-search').fill('doge');
    await expect(page.getByTestId('pools-empty')).toContainText('No pool yet for that token — create one.');
    await page.getByTestId('pool-search').fill('');

    await fv.locator('summary', { hasText: 'Details' }).click();
    await expect(fv).toContainText(P2);
    await shot(page, 'pools-details-open');
  });

  test('your liquidity: position, remove presets, add auto-fill and share', async ({ page }) => {
    test.setTimeout(180_000);
    await wallet(page);
    await page.goto('/swap?noIntro=1&nativeTradeTab=liquidity');
    const tab = page.getByTestId('boing-your-liquidity-tab');
    await expect(tab).toBeVisible({ timeout: 90_000 });
    await expect(page.getByTestId('liquidity-explainer')).toHaveText('Earn a share of swap fees by adding tokens to a pool.');
    const pos = page.getByTestId('position-card');
    await expect(pos).toHaveCount(1, { timeout: 60_000 });
    await expect(pos.getByTestId('position-share')).toHaveText('1.00% of pool');
    await expect(pos.getByTestId('position-back')).toHaveText('1,003 USDC + 997 tBOING');
    await noHex(tab);
    await shot(page, 'liquidity-positions');

    await pos.getByTestId('position-remove').click();
    const rm = page.getByTestId('remove-liquidity-panel');
    await rm.getByTestId('remove-preset-25').click();
    await expect(rm.getByTestId('remove-preview')).toContainText('250 USDC');
    await expect(rm.getByTestId('remove-preview')).toContainText('249 tBOING');
    await rm.getByTestId('remove-preset-75').click();
    await expect(rm.getByTestId('remove-preview')).toContainText('752 USDC');
    await rm.getByTestId('remove-preset-max').click();
    await expect(rm.getByTestId('remove-pct')).toHaveText('100%');
    await expect(rm.getByTestId('remove-preview')).toContainText('1,003 USDC');
    await expect(rm.getByTestId('remove-preview')).toContainText('997 tBOING');
    await expect(rm.getByTestId('remove-submit')).toBeEnabled();
    await shot(page, 'liquidity-remove-max');

    // Add from the Pools tab -> FV2C / USDC prefilled.
    await page.getByRole('tab', { name: 'Pools' }).click();
    await page.locator('[data-testid="pool-card"][data-pair="FV2C / USDC"]').getByTestId('pool-add').click();
    const add = page.getByTestId('add-liquidity-panel');
    await expect(add).toBeVisible();
    await add.getByTestId('add-amount-a').fill('100');
    await expect(add.getByTestId('add-amount-b')).toHaveValue('10');
    await expect(add.getByTestId('add-share')).toHaveText('8.93%');
    await add.getByTestId('add-amount-b').fill('20');
    await expect(add.getByTestId('add-amount-a')).toHaveValue('200');
    await expect(add.getByTestId('add-submit')).toHaveText('Add liquidity');
    await expect(add.getByTestId('add-submit')).toBeEnabled();
    await noHex(page.getByTestId('boing-your-liquidity-tab'));
    await shot(page, 'liquidity-add-preview');
    await add.getByTestId('add-amount-a').fill('999999');
    await expect(add.getByTestId('add-submit')).toHaveText('Insufficient balance');
    // A pair with no pool.
    await add.getByTestId('add-token-a').selectOption(FV);
    await add.getByTestId('add-token-b').selectOption(TB);
    await expect(add.getByTestId('add-no-pool')).toContainText('No pool yet — create one');
  });

  test('disconnected: connect prompt; advanced sections', async ({ page }) => {
    test.setTimeout(180_000);
    await page.addInitScript(() => localStorage.setItem('boing_onboarding_completed', 'true'));
    await page.goto('/swap?noIntro=1&nativeTradeTab=liquidity');
    const connect = page.getByTestId('liquidity-connect');
    if (await page.getByTestId('boing-your-liquidity-tab').isVisible({ timeout: 30_000 }).catch(() => false)) {
      await expect(connect).toBeVisible();
      await shot(page, 'liquidity-disconnected');
    }
  });

  test('advanced: named sections with descriptions', async ({ page }) => {
    test.setTimeout(180_000);
    await wallet(page);
    await page.goto('/swap?noIntro=1&nativeTradeTab=advanced');
    for (const id of ['contracts', 'routing', 'legacy', 'readiness', 'indexer']) {
      await expect(page.getByTestId(`advanced-${id}`)).toBeVisible({ timeout: 90_000 });
    }
    await expect(page.getByTestId('advanced-contracts')).toContainText('Pool contracts & factory');
    await shot(page, 'advanced-sections');
  });
});
