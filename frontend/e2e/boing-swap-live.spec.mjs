/**
 * LIVE testnet swap through the Boing swap card (USDC -> tBOING), signed by an injected test signer.
 *
 * Skipped unless BOTH are set (CI never sets them):
 *   BOING_E2E_SWAP_LIVE=1
 *   BOING_SECRET_HEX=<32-byte key>   (env only; never logged, never sent to the page)
 *
 * Optional:
 *   BOING_E2E_SWAP_DRY_RUN=1   sign + simulate only; boing_submitTransaction is blocked, balances must NOT change
 *   BOING_E2E_SWAP_AMOUNT=5    whole USDC units to swap (default 5)
 *   BOING_EXPECT_SENDER_HEX    abort unless the key derives this account
 *   BOING_E2E_SHOTS_DIR        screenshot folder
 *   BOING_E2E_RPC_URL          JSON-RPC used by Node and relayed for the page (default testnet-rpc.boing.network)
 *   E2E_BASE_URL               run against a deployed site instead of the local preview
 *
 * The page only sees a window.boing provider whose boing_signTransaction calls back into Node, where the
 * tx is built with boing-sdk and signed (v2, node chain id) — the same shape Boing Express returns.
 *
 * Example (Windows, key from the deployer env file):
 *   node scripts/run-with-env-file.mjs <path-to>.env -- "set BOING_E2E_SWAP_LIVE=1&& npx playwright test e2e/boing-swap-live.spec.mjs"
 */
import { test, expect } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';
import {
  BoingClient,
  CANONICAL_BOING_TESTNET_BOING_TOKEN_HEX,
  CANONICAL_BOING_TESTNET_USDC_TOKEN_HEX,
  buildContractCallTransaction,
  getBoingTokenBalance,
  hexToBytes,
  senderHexFromSecretKey,
  signTransactionInputForClient,
  transactionIdFromSignedTransactionHex,
} from 'boing-sdk';

const LIVE = process.env.BOING_E2E_SWAP_LIVE === '1' && Boolean(process.env.BOING_SECRET_HEX?.trim());
const DRY = process.env.BOING_E2E_SWAP_DRY_RUN === '1';
const AMOUNT = BigInt(process.env.BOING_E2E_SWAP_AMOUNT || '5');
const RPC = process.env.BOING_E2E_RPC_URL || 'https://testnet-rpc.boing.network/';
const SHOTS = process.env.BOING_E2E_SHOTS_DIR || path.join('test-results', 'boing-swap-live');
const USDC = CANONICAL_BOING_TESTNET_USDC_TOKEN_HEX.toLowerCase();
const TBOING = CANONICAL_BOING_TESTNET_BOING_TOKEN_HEX.toLowerCase();

test.describe('Boing swap card — live testnet USDC -> tBOING', () => {
  test.skip(!LIVE, 'set BOING_E2E_SWAP_LIVE=1 and BOING_SECRET_HEX to run the live swap');

  test(DRY ? 'dry run: signs + simulates, nothing submitted' : 'swaps and balances change', async ({ page }) => {
    test.setTimeout(300_000);
    fs.mkdirSync(SHOTS, { recursive: true });
    const shot = (name) => page.screenshot({ path: path.join(SHOTS, `${DRY ? 'dry-' : ''}${name}.png`), fullPage: false });

    const secret = hexToBytes(process.env.BOING_SECRET_HEX.trim());
    const client = new BoingClient(RPC);
    const sender = (await senderHexFromSecretKey(secret)).toLowerCase();
    const expect_ = process.env.BOING_EXPECT_SENDER_HEX?.trim().toLowerCase();
    if (expect_) expect(sender, 'key does not derive BOING_EXPECT_SENDER_HEX').toBe(expect_);
    const short = `${sender.slice(0, 8)}…${sender.slice(-4)}`;

    const balances = async () => ({
      usdc: await getBoingTokenBalance(client, USDC, sender),
      tboing: await getBoingTokenBalance(client, TBOING, sender),
    });
    const before = await balances();
    console.log(`[live-swap] signer ${short} before: USDC ${before.usdc}, tBOING ${before.tboing}`);
    expect(before.usdc >= AMOUNT, 'signer needs enough USDC').toBe(true);

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
        console.log(`[live-swap] dry-run signed ${txId.slice(0, 18)}… simulate success=${simulated}`);
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

    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/swap?noIntro=1');
    const card = page.getByTestId('boing-swap-card');
    await expect(card).toBeVisible({ timeout: 90_000 });
    await expect(page.getByTestId('swap-token-in')).toContainText('USDC', { timeout: 60_000 });
    await expect(page.getByTestId('swap-token-out')).toContainText('tBOING');
    await expect(page.getByTestId('swap-balance-in')).toContainText(/\d/, { timeout: 60_000 });

    await page.getByTestId('swap-amount-in').fill(String(AMOUNT));
    const primary = page.getByTestId('swap-primary');
    await expect(primary).toHaveAttribute('data-kind', /^(swap|approve_swap)$/, { timeout: 30_000 });
    await expect(page.getByTestId('swap-amount-out')).not.toHaveText(/^(0|—|)$/);
    expect(await card.innerText()).not.toMatch(/0x[0-9a-f]{16,}/i); // no raw hex outside the closed details expander
    const quotedMin = await page.getByTestId('swap-min-out').innerText();
    await shot('swap-live-quoted');

    await primary.click();
    if (DRY) {
      await expect.poll(() => signed.length, { timeout: 120_000 }).toBeGreaterThan(0);
      await expect(primary).not.toHaveAttribute('data-kind', 'busy', { timeout: 60_000 });
      await shot('swap-live-dryrun-blocked');
      expect(signed.every((s) => s.simulated), 'every signed tx simulates OK').toBe(true);
      const after = await balances();
      console.log(`[live-swap] dry-run after: USDC ${after.usdc}, tBOING ${after.tboing} (unchanged expected)`);
      expect(after).toEqual(before);
      await page.context().unrouteAll({ behavior: 'ignoreErrors' });
      return;
    }

    await expect(page.getByTestId('swap-success')).toBeVisible({ timeout: 240_000 });
    await shot('swap-live-success');
    const after = await balances();
    const minOut = BigInt(quotedMin.replace(/[^\d]/g, '') || '0');
    console.log(
      `[live-swap] after: USDC ${after.usdc} (Δ ${after.usdc - before.usdc}), tBOING ${after.tboing} (Δ +${after.tboing - before.tboing}); min shown ${minOut}; txs ${signed.map((s) => s.txId).join(', ')}`
    );
    expect(before.usdc - after.usdc).toBe(AMOUNT);
    expect(after.tboing - before.tboing >= (minOut > 0n ? minOut : 1n)).toBe(true);
    await expect(page.getByTestId('swap-balance-in')).toContainText(after.usdc.toLocaleString('en-US'), { timeout: 30_000 });
    await page.context().unrouteAll({ behavior: 'ignoreErrors' });
  });
});
