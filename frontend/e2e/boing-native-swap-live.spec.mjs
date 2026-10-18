/**
 * LIVE testnet native BOING swap through the Boing swap card: 1 BOING -> USDC, then the USDC back -> BOING.
 * Each direction is ONE batch (wrap + approve + swap, or approve + swap + unwrap) through the v10 BOING/USDC pool.
 *
 * Skipped unless BOTH are set (CI never sets them):
 *   BOING_E2E_NATIVE_SWAP_LIVE=1
 *   BOING_SECRET_HEX=<32-byte key>   (env only; never logged, never sent to the page)
 *
 * Optional: BOING_EXPECT_SENDER_HEX, BOING_E2E_SHOTS_DIR, BOING_E2E_RPC_URL, E2E_BASE_URL,
 *   BOING_E2E_NATIVE_SWAP_DRY_RUN=1 (sign + simulate only; submit blocked; balances must not change).
 *
 * The page only sees a window.boing provider whose boing_signTransaction calls back into Node, where the
 * Express request (contract_call / batch, with `value`) is rebuilt with boing-sdk and signed (v2, node chain id).
 */
import { test, expect } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';
import {
  BoingClient,
  CANONICAL_BOING_TESTNET_USDC_TOKEN_HEX,
  buildBatchTransaction,
  buildContractCallTransaction,
  buildContractCallWithValueTransaction,
  getBoingTokenBalance,
  hexToBytes,
  senderHexFromSecretKey,
  signTransactionInputForClient,
  transactionIdFromSignedTransactionHex,
} from 'boing-sdk';

const LIVE = process.env.BOING_E2E_NATIVE_SWAP_LIVE === '1' && Boolean(process.env.BOING_SECRET_HEX?.trim());
const DRY = process.env.BOING_E2E_NATIVE_SWAP_DRY_RUN === '1';
const RPC = process.env.BOING_E2E_RPC_URL || 'https://testnet-rpc.boing.network/';
const SHOTS = process.env.BOING_E2E_SHOTS_DIR || path.join('test-results', 'boing-native-swap-live');
const USDC = CANONICAL_BOING_TESTNET_USDC_TOKEN_HEX.toLowerCase();
const E18 = 10n ** 18n;

/** Express request object -> boing-sdk TransactionInput (same encoding Boing Express signs). */
function txFromExpress(o, nonce, sender) {
  const accessList = { read: o.access_list?.read ?? [], write: o.access_list?.write ?? [] };
  if (o.type === 'contract_call') {
    const base = { nonce, senderHex: sender, contractHex: o.contract, calldata: hexToBytes(o.calldata), accessList };
    return o.value && BigInt(o.value) > 0n
      ? buildContractCallWithValueTransaction({ ...base, value: BigInt(o.value) })
      : buildContractCallTransaction(base);
  }
  if (o.type === 'batch') {
    return buildBatchTransaction({
      nonce,
      senderHex: sender,
      accessList,
      calls: o.calls.map((c) =>
        c.type === 'transfer'
          ? { kind: 'transfer', toHex: c.to, amount: BigInt(c.amount) }
          : c.value && BigInt(c.value) > 0n
            ? { kind: 'contractCallWithValue', contractHex: c.contract, calldata: hexToBytes(c.calldata), value: BigInt(c.value) }
            : { kind: 'contractCall', contractHex: c.contract, calldata: hexToBytes(c.calldata) }
      ),
    });
  }
  throw new Error(`e2e signer: unsupported tx type ${o?.type}`);
}

test.describe('Boing swap card — live native BOING <-> USDC (v10 pool, auto wrap / unwrap)', () => {
  test.skip(!LIVE, 'set BOING_E2E_NATIVE_SWAP_LIVE=1 and BOING_SECRET_HEX to run the live native swap');

  test(DRY ? 'dry run: signs + simulates, nothing submitted' : '1 BOING -> USDC and back', async ({ page }) => {
    test.setTimeout(420_000);
    fs.mkdirSync(SHOTS, { recursive: true });
    const shot = (name) => page.screenshot({ path: path.join(SHOTS, `${DRY ? 'dry-' : ''}${name}.png`), fullPage: false });
    const secret = hexToBytes(process.env.BOING_SECRET_HEX.trim());
    const client = new BoingClient(RPC);
    const sender = (await senderHexFromSecretKey(secret)).toLowerCase();
    const expect_ = process.env.BOING_EXPECT_SENDER_HEX?.trim().toLowerCase();
    if (expect_) expect(sender, 'key does not derive BOING_EXPECT_SENDER_HEX').toBe(expect_);
    const balances = async () => ({
      boing: BigInt((await client.getAccount(sender))?.balance ?? 0),
      usdc: await getBoingTokenBalance(client, USDC, sender),
    });

    const signed = [];
    await page.exposeFunction('__e2eBoingSignTransaction', async (o) => {
      const nonce = o.nonce != null && String(o.nonce).trim() !== '' ? BigInt(o.nonce) : BigInt((await client.getAccount(sender))?.nonce ?? 0);
      const signedHex = await signTransactionInputForClient(client, txFromExpress(o, nonce, sender), secret);
      const txId = transactionIdFromSignedTransactionHex(signedHex);
      const value = o.type === 'batch' ? o.calls.reduce((a, c) => a + BigInt(c.value || 0), 0n) : BigInt(o.value || 0);
      let simulated = false;
      if (DRY) simulated = Boolean((await client.simulateTransaction(signedHex))?.success);
      signed.push({ txId, type: o.type, steps: o.calls?.length ?? 1, value, simulated });
      console.log(`[native-swap] signed ${o.type} (${o.calls?.length ?? 1} steps, value ${value}) ${txId}`);
      return signedHex;
    });

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
        if (DRY && calls.some((c) => c?.method === 'boing_submitTransaction')) {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            headers: cors,
            body: JSON.stringify({ jsonrpc: '2.0', id: body?.id ?? null, error: { code: -32000, message: 'e2e dry run: submit blocked' } }),
          });
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

    const pick = async (side, symbol) => {
      await page.getByTestId(`swap-token-${side}`).click();
      await page.getByTestId(`swap-token-option-${symbol}`).click();
    };

    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/swap?noIntro=1');
    const card = page.getByTestId('boing-swap-card');
    await expect(card).toBeVisible({ timeout: 90_000 });
    await expect(page.getByTestId('swap-token-in')).toContainText(/\w/, { timeout: 60_000 });

    // --- 1 BOING -> USDC ---
    const b0 = await balances();
    console.log(`[native-swap] before: BOING ${b0.boing}, USDC ${b0.usdc}`);
    await pick('in', 'BOING');
    await pick('out', 'USDC');
    await page.getByTestId('swap-amount-in').fill('1');
    const primary = page.getByTestId('swap-primary');
    await expect(primary).toHaveAttribute('data-kind', 'swap', { timeout: 30_000 });
    await expect(page.getByTestId('swap-amount-out')).not.toHaveText(/^(0|—|)$/, { timeout: 30_000 });
    await expect(page.getByTestId('swap-native-note')).toContainText('wraps your BOING');
    await page.getByTestId('swap-route-details').locator('summary').click();
    await shot('native-swap-1-boing-to-usdc-quoted');
    await page.getByTestId('swap-route-details').locator('summary').click();
    const min1 = BigInt((await page.getByTestId('swap-min-out').innerText()).replace(/[^\d]/g, '') || '0');
    await primary.click();
    if (DRY) {
      await expect.poll(() => signed.length, { timeout: 120_000 }).toBeGreaterThan(0);
      await expect(primary).not.toHaveAttribute('data-kind', 'busy', { timeout: 60_000 });
      expect(signed[0]).toMatchObject({ type: 'batch', steps: 3, value: E18, simulated: true });
      expect(await balances()).toEqual(b0);
      return;
    }
    await expect(page.getByTestId('swap-success')).toBeVisible({ timeout: 240_000 });
    await shot('native-swap-1-boing-to-usdc-success');
    const b1 = await balances();
    const gotUsdc = b1.usdc - b0.usdc;
    console.log(`[native-swap] after 1: BOING ${b1.boing} (Δ ${b1.boing - b0.boing}), USDC ${b1.usdc} (Δ +${gotUsdc}); tx ${signed.at(-1).txId}`);
    expect(signed.at(-1)).toMatchObject({ type: 'batch', steps: 3, value: E18 });
    expect(gotUsdc >= min1 && gotUsdc > 0n).toBe(true);
    expect(b0.boing - b1.boing >= E18).toBe(true); // 1 BOING + network fee

    // --- the USDC back -> BOING ---
    await page.getByTestId('swap-flip').click();
    await expect(page.getByTestId('swap-token-in')).toContainText('USDC');
    await page.getByTestId('swap-amount-in').fill(String(gotUsdc));
    await expect(primary).toHaveAttribute('data-kind', /^(swap)$/, { timeout: 30_000 });
    await expect(page.getByTestId('swap-native-note')).toContainText('unwraps to BOING');
    await shot('native-swap-2-usdc-to-boing-quoted');
    await primary.click();
    await expect.poll(() => signed.length, { timeout: 240_000 }).toBe(2);
    await expect(page.getByTestId('swap-success')).toContainText('USDC for', { timeout: 240_000 });
    await shot('native-swap-2-usdc-to-boing-success');
    const b2 = await balances();
    console.log(`[native-swap] after 2: BOING ${b2.boing} (Δ +${b2.boing - b1.boing}), USDC ${b2.usdc} (Δ ${b2.usdc - b1.usdc}); tx ${signed.at(-1).txId}`);
    expect(signed.at(-1)).toMatchObject({ type: 'batch', steps: 3, value: 0n });
    expect(b2.usdc).toBe(b0.usdc);
    expect(b2.boing > b1.boing).toBe(true);
    // wBOING never stays with the user: withdraw_all unwrapped everything.
    await page.context().unrouteAll({ behavior: 'ignoreErrors' });
  });
});
