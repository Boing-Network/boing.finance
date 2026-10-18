/**
 * LIVE testnet: a freshly deployed Boing token v2 becomes swappable.
 *   1. Node deploys a v2 token (SWPx, 1,000,000 supply) with the key (same as the Deploy token page would).
 *   2. UI: /create-pool?token=<new>&pair=usdc (what the deploy page's "Create a pool" links to) -> custody pool v8
 *      with 1,000 SWPx + 100 USDC (deploy, set_tokens, approve x2, add_liquidity, factory register_pair).
 *   3. UI: "Swap it now" -> the token is in the swap picker (search by symbol), swap 10 USDC -> SWPx.
 *   4. UI: Pools lists "SWPx / USDC".
 * Signed by an injected test signer (window.boing -> Node), same as boing-swap-live.spec.mjs.
 *
 * Skipped unless BOING_E2E_NEWTOKEN_LIVE=1 and BOING_SECRET_HEX are set (CI never sets them).
 * BOING_E2E_NEWTOKEN_DRY_RUN=1: token deploy is signed offline only; the pool form is driven for FV2C / tBOING
 * (no pool yet) and every signed tx is simulated, submit blocked; nothing changes on chain.
 */
import { test, expect } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';
import {
  BoingClient,
  CANONICAL_BOING_TESTNET_BOING_TOKEN_HEX,
  CANONICAL_BOING_TESTNET_USDC_TOKEN_HEX,
  buildContractCallTransaction,
  deployBoingToken,
  getBoingTokenBalance,
  hexToAccountId,
  hexToBytes,
  senderHexFromSecretKey,
  signTransactionInputForClient,
  transactionIdFromSignedTransactionHex,
} from 'boing-sdk';

const LIVE = process.env.BOING_E2E_NEWTOKEN_LIVE === '1' && Boolean(process.env.BOING_SECRET_HEX?.trim());
const DRY = process.env.BOING_E2E_NEWTOKEN_DRY_RUN === '1';
const RPC = process.env.BOING_E2E_RPC_URL || 'https://testnet-rpc.boing.network/';
const SHOTS = process.env.BOING_E2E_SHOTS_DIR || path.join('test-results', 'boing-new-token-live');
const USDC = CANONICAL_BOING_TESTNET_USDC_TOKEN_HEX.toLowerCase();
const TBOING = CANONICAL_BOING_TESTNET_BOING_TOKEN_HEX.toLowerCase();
const FV2C = '0x31357854f6371c8bafac0ff20296608d87db532bef06de8066d1fdd32c824b4e';
const SYMBOL = process.env.BOING_E2E_NEWTOKEN_SYMBOL || `SWP${String.fromCharCode(65 + (Math.floor(Date.now() / 1000) % 26))}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

test.describe('New Boing token becomes swappable — live testnet', () => {
  test.skip(!LIVE, 'set BOING_E2E_NEWTOKEN_LIVE=1 and BOING_SECRET_HEX to run');

  test(DRY ? 'dry run: deploy + pool txs sign and simulate, nothing submitted' : 'deploy token, create pool, swap, listed', async ({ page }) => {
    test.setTimeout(900_000);
    fs.mkdirSync(SHOTS, { recursive: true });
    const shot = (name) => page.screenshot({ path: path.join(SHOTS, `${DRY ? 'dry-' : ''}${name}.png`), fullPage: false });
    const secret = hexToBytes(process.env.BOING_SECRET_HEX.trim());
    const client = new BoingClient(RPC);
    const sender = (await senderHexFromSecretKey(secret)).toLowerCase();
    const expect_ = process.env.BOING_EXPECT_SENDER_HEX?.trim().toLowerCase();
    if (expect_) expect(sender, 'key does not derive BOING_EXPECT_SENDER_HEX').toBe(expect_);

    // 1. Deploy the token (Node, key-signed).
    // BOING_E2E_NEWTOKEN_TOKEN reuses a token this spec deployed earlier (needs the matching BOING_E2E_NEWTOKEN_SYMBOL).
    const reuse = process.env.BOING_E2E_NEWTOKEN_TOKEN?.trim().toLowerCase();
    const dep = reuse
      ? { tokenHex: reuse }
      : await deployBoingToken(client, secret, { name: `Swap Check ${SYMBOL}`, symbol: SYMBOL, version: 2, initialSupply: 1_000_000n, dryRun: DRY });
    const token = dep.tokenHex.toLowerCase();
    console.log(`[live-newtoken] ${DRY ? 'dry-run ' : ''}token ${SYMBOL} at ${token}`);
    if (!DRY) {
      for (let i = 0; i < 60; i++) {
        const b = await getBoingTokenBalance(client, token, sender).catch(() => 0n);
        if (b >= 1000n) break;
        await sleep(2000);
      }
      expect(await getBoingTokenBalance(client, token, sender) >= 1000n).toBe(true);
    }
    const [tokA, tokB] = DRY ? [FV2C, TBOING] : [token, USDC];

    /** @type {{ txId: string, kind: string, simulated: boolean }[]} */
    const signed = [];
    await page.exposeFunction('__e2eBoingSignTransaction', async (txObj) => {
      const nonce =
        txObj?.nonce != null && String(txObj.nonce).trim() !== '' ? BigInt(txObj.nonce) : BigInt((await client.getAccount(sender))?.nonce ?? 0);
      const me = hexToAccountId(sender);
      let tx;
      if (txObj?.type === 'contract_call') {
        tx = buildContractCallTransaction({
          nonce,
          senderHex: sender,
          contractHex: txObj.contract,
          calldata: hexToBytes(txObj.calldata),
          accessList: { read: txObj.access_list?.read ?? [], write: txObj.access_list?.write ?? [] },
        });
      } else if (txObj?.type === 'contract_deploy_meta') {
        const al = (xs) => (Array.isArray(xs) && xs.length ? xs.map((h) => hexToAccountId(h)) : [me]);
        tx = {
          nonce,
          sender: me,
          payload: {
            kind: 'contractDeployWithPurposeAndMetadata',
            bytecode: hexToBytes(txObj.bytecode),
            purposeCategory: txObj.purpose_category,
            descriptionHash: txObj.description_hash ? hexToBytes(txObj.description_hash) : null,
            assetName: txObj.asset_name ?? null,
            assetSymbol: txObj.asset_symbol ?? null,
            create2Salt: txObj.create2_salt ? hexToBytes(txObj.create2_salt) : null,
          },
          accessList: { read: al(txObj.access_list?.read), write: al(txObj.access_list?.write) },
        };
      } else {
        throw new Error(`e2e signer: unsupported tx type ${txObj?.type}`);
      }
      const signedHex = await signTransactionInputForClient(client, tx, secret);
      const txId = transactionIdFromSignedTransactionHex(signedHex);
      let simulated = false;
      if (DRY) {
        const sim = await client.simulateTransaction(signedHex);
        simulated = Boolean(sim?.success);
        console.log(`[live-newtoken] dry-run signed ${txObj.type} ${txId.slice(0, 18)}… simulate success=${simulated}${sim?.error ? ` (${String(sim.error).slice(0, 120)})` : ''}`);
      }
      signed.push({ txId, kind: txObj.type, simulated });
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

    // BOING_E2E_NEWTOKEN_SKIP_CREATE=1: the pool already exists (a previous run created it); go straight to the swap.
    const skipCreate = process.env.BOING_E2E_NEWTOKEN_SKIP_CREATE === '1' && !DRY;
    if (skipCreate) {
      await page.setViewportSize({ width: 1280, height: 1000 });
      await page.goto(`/swap?noIntro=1&nativeTokenIn=${USDC}&nativeTokenOut=${token}`);
    } else {
      // 2. Create the pool from the deploy page's link.
      await page.setViewportSize({ width: 1280, height: 1000 });
      await page.goto(`/create-pool?noIntro=1&token=${tokA}&pair=${DRY ? TBOING : 'usdc'}`);
      await expect(page.getByTestId('create-pool-amount-a')).toBeVisible({ timeout: 120_000 });
      await expect(page.getByTestId('native-create-pool-token-a')).toHaveValue(new RegExp(tokA.slice(2, 12), 'i'), { timeout: 30_000 }).catch(() => {});
      await page.getByTestId('create-pool-amount-a').fill('1000');
      await page.getByTestId('create-pool-amount-b').fill('100');
      await shot('newtoken-create-pool-form');
      await page.getByTestId('create-pool-submit').click();

      if (DRY) {
        await expect.poll(() => signed.length, { timeout: 180_000 }).toBeGreaterThan(0);
        await expect(page.getByTestId('create-pool-submit')).not.toHaveText(/Creating/, { timeout: 180_000 });
        await shot('newtoken-create-pool-dryrun');
        console.log(`[live-newtoken] dry run: ${signed.map((s) => `${s.kind}:${s.simulated}`).join(', ')}`);
        expect(signed[0].kind).toBe('contract_deploy_meta');
        expect(signed[0].simulated, 'pool deploy simulates OK').toBe(true);
        await page.context().unrouteAll({ behavior: 'ignoreErrors' });
        return;
      }

      await expect(page.getByTestId('create-pool-success')).toBeVisible({ timeout: 600_000 });
      await shot('newtoken-create-pool-success');
      console.log(`[live-newtoken] pool txs: ${signed.map((s) => `${s.kind} ${s.txId}`).join(', ')}`);
      await page.getByTestId('create-pool-swap-now').click();
    }

    // 3. Swap it.
    const card = page.getByTestId('boing-swap-card');
    await expect(card).toBeVisible({ timeout: 90_000 });
    await expect.poll(async () => {
      await page.reload();
      await expect(card).toBeVisible({ timeout: 90_000 });
      await page.getByTestId('swap-token-out').click();
      await page.getByTestId('swap-token-search-out').fill(SYMBOL.toLowerCase());
      const n = await page.getByTestId(`swap-token-option-${SYMBOL}`).count();
      await page.keyboard.press('Escape');
      return n;
    }, { timeout: 180_000, intervals: [5000] }).toBeGreaterThan(0);
    await page.getByTestId('swap-token-out').click();
    await page.getByTestId('swap-token-search-out').fill(SYMBOL.toLowerCase());
    await shot('newtoken-picker-search');
    await page.getByTestId(`swap-token-option-${SYMBOL}`).click();
    await page.getByTestId('swap-token-in').click();
    await page.getByTestId('swap-token-search-in').fill('usdc');
    await page.getByTestId('swap-token-option-USDC').click();
    const before = await getBoingTokenBalance(client, token, sender);
    await page.getByTestId('swap-amount-in').fill('10');
    await expect(page.getByTestId('swap-primary')).toHaveAttribute('data-kind', /^(swap|approve_swap)$/, { timeout: 60_000 });
    await shot('newtoken-swap-quoted');
    await page.getByTestId('swap-primary').click();
    await expect(page.getByTestId('swap-success')).toBeVisible({ timeout: 300_000 });
    const after = await getBoingTokenBalance(client, token, sender);
    console.log(`[live-newtoken] swap 10 USDC -> ${SYMBOL}: +${after - before}`);
    expect(after > before).toBe(true);
    await shot('newtoken-swap-success');

    // 4. Listed on Pools.
    await page.goto('/pools?noIntro=1');
    await expect(page.locator(`[data-testid="pool-card"][data-pair="${SYMBOL} / USDC"], [data-testid="pool-card"][data-pair="USDC / ${SYMBOL}"]`)).toBeVisible({ timeout: 120_000 });
    await shot('newtoken-pools-listed');
    await page.context().unrouteAll({ behavior: 'ignoreErrors' });
  });
});
