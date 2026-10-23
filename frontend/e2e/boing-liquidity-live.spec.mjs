/**
 * LIVE testnet add + remove liquidity through the simple Pools / Your liquidity tabs, signed by an injected
 * test signer (same pattern as boing-swap-live.spec.mjs). Uses the FV2C / USDC custody pool so the round trip
 * is exact: add 10 FV2C (+1 USDC auto-filled) -> +1 LP, then remove 1% (= that 1 LP) -> 10 FV2C + 1 USDC back.
 *
 * Skipped unless BOTH are set (CI never sets them):
 *   BOING_E2E_LP_LIVE=1
 *   BOING_SECRET_HEX=<32-byte key>   (env only; never logged, never sent to the page)
 * Optional: BOING_E2E_LP_DRY_RUN=1 (sign + simulate the first step only, nothing submitted),
 *   BOING_EXPECT_SENDER_HEX, BOING_E2E_SHOTS_DIR, BOING_E2E_RPC_URL, E2E_BASE_URL.
 *
 *   node scripts/run-with-env-file.mjs <path-to>.env -- "set BOING_E2E_LP_LIVE=1&& npx playwright test e2e/boing-liquidity-live.spec.mjs"
 */
import { test, expect } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';
import {
  BoingClient,
  CANONICAL_BOING_TESTNET_USDC_TOKEN_HEX,
  buildContractCallTransaction,
  getBoingPoolLpBalance,
  getBoingTokenBalance,
  hexToBytes,
  senderHexFromSecretKey,
  signTransactionInputForClient,
  transactionIdFromSignedTransactionHex,
} from '@boing-network/boing-sdk';

const LIVE = process.env.BOING_E2E_LP_LIVE === '1' && Boolean(process.env.BOING_SECRET_HEX?.trim());
const DRY = process.env.BOING_E2E_LP_DRY_RUN === '1';
const RPC = process.env.BOING_E2E_RPC_URL || 'https://testnet-rpc.boing.network/';
const SHOTS = process.env.BOING_E2E_SHOTS_DIR || path.join('test-results', 'boing-liquidity-live');
const USDC = CANONICAL_BOING_TESTNET_USDC_TOKEN_HEX.toLowerCase();
const FV2C = '0x31357854f6371c8bafac0ff20296608d87db532bef06de8066d1fdd32c824b4e';
const POOL = '0x9261b793dd4dcfbd7a0583b19b525f34910ecd5ce6b34d0520b3e8351b20c02e';

test.describe('Pools / Your liquidity — live testnet add + remove', () => {
  test.skip(!LIVE, 'set BOING_E2E_LP_LIVE=1 and BOING_SECRET_HEX to run');

  test(DRY ? 'dry run: add signs + simulates, nothing submitted' : 'adds then removes a small amount', async ({ page }) => {
    test.setTimeout(480_000);
    fs.mkdirSync(SHOTS, { recursive: true });
    const shot = (name) => page.screenshot({ path: path.join(SHOTS, `${DRY ? 'dry-' : ''}${name}.png`), fullPage: false });
    const secret = hexToBytes(process.env.BOING_SECRET_HEX.trim());
    const client = new BoingClient(RPC);
    const sender = (await senderHexFromSecretKey(secret)).toLowerCase();
    const expect_ = process.env.BOING_EXPECT_SENDER_HEX?.trim().toLowerCase();
    if (expect_) expect(sender, 'key does not derive BOING_EXPECT_SENDER_HEX').toBe(expect_);
    const state = async () => ({
      fv: await getBoingTokenBalance(client, FV2C, sender),
      usdc: await getBoingTokenBalance(client, USDC, sender),
      lp: await getBoingPoolLpBalance(client, POOL, sender),
    });
    const before = await state();
    console.log(`[live-lp] signer ${sender.slice(0, 8)}… before: FV2C ${before.fv}, USDC ${before.usdc}, LP ${before.lp}`);

    /** @type {{ txId: string, contract: string, simulated: boolean }[]} */
    const signed = [];
    await page.exposeFunction('__e2eBoingSignTransaction', async (txObj) => {
      if (!txObj || txObj.type !== 'contract_call') throw new Error(`e2e signer: unsupported tx type ${txObj?.type}`);
      const nonce =
        txObj.nonce != null && String(txObj.nonce).trim() !== ''
          ? BigInt(txObj.nonce)
          : BigInt((await client.getAccount(sender))?.nonce ?? 0);
      const tx = buildContractCallTransaction({
        nonce,
        senderHex: sender,
        contractHex: txObj.contract,
        calldata: hexToBytes(txObj.calldata),
        accessList: { read: txObj.access_list?.read ?? [], write: txObj.access_list?.write ?? [] },
      });
      const signedHex = await signTransactionInputForClient(client, tx, secret);
      const txId = transactionIdFromSignedTransactionHex(signedHex);
      let simulated = false;
      if (DRY) {
        const sim = await client.simulateTransaction(signedHex);
        simulated = Boolean(sim?.success);
        console.log(`[live-lp] dry-run signed ${txId.slice(0, 18)}… simulate success=${simulated}`);
      }
      signed.push({ txId, contract: txObj.contract, simulated });
      return signedHex;
    });

    // The page's JSON-RPC (`/api/boing-rpc` proxy or the public RPC host) is relayed from Node to RPC, so the run
    // works where the browser / preview proxy cannot reach the default host. Dry run blocks the submit call.
    await page.context().route(
      (url) => /\/api\/boing-rpc|testnet-rpc\.boing\.network/.test(url.href),
      async (route) => {
        const req = route.request();
        const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' };
        if (req.method() === 'OPTIONS') {
          await route.fulfill({ status: 204, headers: cors });
          return;
        }
        let body = null;
        try {
          body = req.postDataJSON();
        } catch {
          /* not JSON */
        }
        const calls = Array.isArray(body) ? body : [body];
        if (DRY && calls.some((c) => c?.method === 'boing_submitTransaction')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            headers: cors,
            body: JSON.stringify({ jsonrpc: '2.0', id: body?.id ?? null, error: { code: -32000, message: 'e2e dry run: submit blocked' } }),
          });
          return;
        }
        try {
          const res = await route.fetch({ url: RPC, method: 'POST', headers: { 'content-type': 'application/json' }, postData: req.postData() ?? '' });
          await route.fulfill({ status: res.status(), contentType: 'application/json', headers: cors, body: await res.body() });
        } catch {
          /* page closed while a poll was in flight */
        }
      }
    );

    await page.addInitScript(({ account }) => {
      localStorage.setItem('boing_onboarding_completed', 'true');
      localStorage.setItem('walletConnected', 'true');
      localStorage.setItem('walletType', 'boingExpress');
      localStorage.removeItem('userDisconnected');
      const provider = {
        isBoing: true,
        isBoingExpress: true,
        request: async ({ method, params }) => {
          if (method === 'boing_chainId' || method === 'eth_chainId') return '0x1b01';
          if (['boing_accounts', 'eth_accounts', 'boing_requestAccounts', 'eth_requestAccounts'].includes(method)) return [account];
          // Connection proof only (not verified on-chain); same stub as the other wallet e2e specs.
          if (method === 'boing_signMessage' || method === 'personal_sign') return `0x${'ab'.repeat(64)}`;
          if (method === 'boing_signTransaction') return window.__e2eBoingSignTransaction(params?.[0]);
          throw new Error(`E2E signer: unhandled ${method}`);
        },
        on: () => {},
        removeListener: () => {},
      };
      window.boing = provider;
      window.ethereum = provider;
    }, { account: sender });

    await page.setViewportSize({ width: 1280, height: 1000 });
    await page.goto('/pools?noIntro=1');
    const card = page.locator('[data-testid="pool-card"][data-pair="FV2C / USDC"]');
    await expect(card).toBeVisible({ timeout: 120_000 });
    await shot('lp-live-pools');
    await card.getByTestId('pool-add').click();
    const add = page.getByTestId('add-liquidity-panel');
    await add.getByTestId('add-amount-a').fill('10');
    await expect(add.getByTestId('add-amount-b')).toHaveValue('1');
    await expect(add.getByTestId('add-submit')).toHaveText('Add liquidity', { timeout: 60_000 });
    await shot('lp-live-add-preview');
    await add.getByTestId('add-submit').click();

    if (DRY) {
      await expect.poll(() => signed.length, { timeout: 120_000 }).toBeGreaterThan(0);
      await expect(add.getByTestId('add-submit')).not.toHaveText(/Approve|Confirm|Preparing/, { timeout: 90_000 });
      expect(signed[0].simulated, 'first signed tx simulates OK').toBe(true);
      expect(await state()).toEqual(before);
      console.log(`[live-lp] dry run: ${signed.length} tx signed, first simulated OK, nothing submitted`);
      await page.context().unrouteAll({ behavior: 'ignoreErrors' });
      return;
    }

    await expect(add).toBeHidden({ timeout: 300_000 });
    await expect.poll(async () => (await state()).lp, { timeout: 60_000 }).toBeGreaterThan(before.lp);
    const mid = await state();
    console.log(`[live-lp] after add: FV2C ${mid.fv} (Δ ${mid.fv - before.fv}), USDC ${mid.usdc} (Δ ${mid.usdc - before.usdc}), LP ${mid.lp} (Δ +${mid.lp - before.lp})`);
    expect(before.fv - mid.fv).toBe(10n);
    expect(before.usdc - mid.usdc).toBe(1n);

    const pos = page.locator('[data-testid="position-card"][data-pair="FV2C / USDC"]');
    await expect(pos).toBeVisible({ timeout: 60_000 });
    await shot('lp-live-after-add');
    await pos.getByTestId('position-remove').click();
    const rm = page.getByTestId('remove-liquidity-panel');
    await rm.locator('input[type="range"]').fill('1');
    await expect(rm.getByTestId('remove-pct')).toHaveText('1%');
    await expect(rm.getByTestId('remove-preview')).toContainText('10 FV2C');
    await expect(rm.getByTestId('remove-preview')).toContainText('1 USDC');
    await shot('lp-live-remove-preview');
    await rm.getByTestId('remove-submit').click();
    await expect(rm).toBeHidden({ timeout: 300_000 });
    await expect.poll(async () => (await state()).lp, { timeout: 60_000 }).toBeLessThan(mid.lp);
    const after = await state();
    console.log(`[live-lp] after remove: FV2C ${after.fv}, USDC ${after.usdc}, LP ${after.lp}; txs ${signed.map((s) => s.txId).join(', ')}`);
    expect(after).toEqual(before);
    await shot('lp-live-after-remove');
    await page.context().unrouteAll({ behavior: 'ignoreErrors' });
  });
});
