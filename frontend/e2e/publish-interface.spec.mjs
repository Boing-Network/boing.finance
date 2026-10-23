import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const DEX = `0x${'8079f30559c02c5fe087c9ad1bc3b751a29de35992f3f8431734243e825f696e'}`;
const POOL = `0x${'2ad75c2e11b1e93761f4f8df39502deecbe7148324e5a80a951798142b2c5b61'}`;
const ZERO = `0x${'0'.repeat(64)}`;
const SHOTS = process.env.BOING_E2E_SHOTS_DIR || '';

function shot(page, name) {
  if (!SHOTS) return Promise.resolve();
  mkdirSync(SHOTS, { recursive: true });
  return page.screenshot({ path: path.join(SHOTS, name), fullPage: true });
}

/** Injected Boing Express; signing is delegated to `window.__e2eSign` when the live test exposes it. */
function injectWallet(page, account) {
  return page.addInitScript(({ account: acct }) => {
    localStorage.setItem('walletConnected', 'true');
    localStorage.setItem('walletType', 'boingExpress');
    localStorage.removeItem('userDisconnected');
    const provider = {
      isBoing: true,
      isBoingExpress: true,
      request: async ({ method, params }) => {
        if (method === 'boing_chainId' || method === 'eth_chainId') return '0x1b01';
        if (method === 'boing_accounts' || method === 'eth_accounts' || method === 'boing_requestAccounts') return [acct];
        if (method === 'boing_signMessage' || method === 'personal_sign') return `0x${'ab'.repeat(64)}`;
        if (method === 'boing_signTransaction' && typeof window.__e2eSign === 'function') return window.__e2eSign(params?.[0]);
        throw new Error(`E2E mock: unhandled ${method}`);
      },
      on: () => {},
      removeListener: () => {},
    };
    window.boing = provider;
    window.ethereum = provider;
  }, { account });
}

test.describe('Publish interface page', () => {
  // The app's service worker would answer fetches outside page.route().
  test.use({ serviceWorkers: 'block' });

  test('mocked: deployer check, auto-fill, hash, one-batch review', async ({ page }) => {
    test.setTimeout(120_000);
    await injectWallet(page, DEX);
    await page.route('**/api/boing-rpc', async (route) => {
      const body = route.request().postDataJSON();
      const results = {
        boing_getContractCode: { bytecode: '0x6000', code_hash: `0x${'ee'.repeat(32)}`, size: 2 },
        boing_getAccount: { nonce: 21, balance: '0' },
        boing_getContractStorage: { value: ZERO },
        boing_getAccountTransactions: { transactions: [], next_cursor: null },
      };
      if (!(body?.method in results)) return route.continue();
      return route.fulfill({ json: { jsonrpc: '2.0', id: body.id, result: results[body.method] } });
    });
    await page.route(/\/api\/observer-interface/, (route) => route.fulfill({
      json: {
        label: 'Native CP pool', summary: 'Constant-product pool',
        functions: [{ selector: 16, name: 'swap', params: [{ name: 'direction', type: 'u128' }], kind: 'write' }],
        decodedSelectors: [16, 17],
      },
    }));
    await page.goto(`/boing/publish-interface?contract=${POOL}`);
    await expect(page.getByTestId('publish-interface-page')).toBeVisible({ timeout: 90_000 });
    await expect(page.getByTestId('publish-wallet')).toContainText(/0x8079/i, { timeout: 60_000 });
    await page.getByTestId('publish-check').click();
    await expect(page.getByTestId('publish-deployer-status')).toContainText(/deployed this contract/i);
    await expect(page.getByTestId('publish-registry-status')).toBeVisible();
    await page.getByTestId('publish-autofill').click();
    await expect(page.getByTestId('publish-json-ok')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('publish-json')).toHaveValue(/fn_0x11/);
    await expect(page.getByTestId('publish-hash')).toHaveText(/^0x[0-9a-f]{64}$/);
    await page.getByTestId('publish-json').fill('{"functions":[{"selector":999,"name":""}]}');
    await expect(page.getByTestId('publish-json-errors')).toBeVisible();
    await page.getByTestId('publish-autofill').click();
    // default is Host on Boing: the boing:// URI and blob writes are planned automatically
    await expect(page.getByTestId('publish-boing-uri')).toHaveText(/^boing:\/\/iface-blob\/0x8079f305/);
    await page.getByTestId('publish-review').click();
    await expect(page.getByTestId('publish-review-panel')).toContainText(/Store the JSON on Boing/);
    await expect(page.getByTestId('publish-review-panel')).toContainText(/ONE native batch/);
    await page.getByRole('button', { name: 'Back' }).click();
    await page.getByTestId('publish-host-url').click();
    await page.getByTestId('publish-uri').fill('https://example.com/pool.json');
    await page.getByTestId('publish-review').click();
    await expect(page.getByTestId('publish-review-panel')).toContainText(/ONE native batch/);
  });

  const LIVE_ENV = process.env.BOING_E2E_LIVE_ENV_FILE;
  const LIVE_CONTRACT = process.env.BOING_E2E_LIVE_CONTRACT;
  test('live testnet: publish through the page with an injected signer', async ({ page }) => {
    test.skip(!LIVE_ENV || !LIVE_CONTRACT, 'set BOING_E2E_LIVE_ENV_FILE and BOING_E2E_LIVE_CONTRACT');
    test.setTimeout(300_000);
    const sdk = await import('@boing-network/boing-sdk');
    const line = readFileSync(LIVE_ENV, 'utf8').split(/\r?\n/).find((l) => /^\s*BOING_SECRET_HEX\s*=/.test(l)) || '';
    const secret = sdk.hexToBytes(line.split('=')[1].trim().replace(/^["']|["']$/g, ''));
    const RPC = process.env.BOING_E2E_RPC_URL || 'https://boing-testnet-1.fly.dev';
    const call = async (method, params) => {
      const r = await fetch(RPC, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) });
      const j = await r.json();
      if (j.error) throw new Error(j.error.message);
      return j.result;
    };
    const signed = [];
    await page.exposeFunction('__e2eSign', async (tx) => {
      const acct = await call('boing_getAccount', [DEX]);
      const nonce = BigInt(tx?.nonce ?? acct.nonce);
      const toCall = (c) => ({ kind: 'contractCall', contractHex: c.contract, calldata: sdk.hexToBytes(c.calldata) });
      const input = tx.type === 'batch'
        ? sdk.buildBatchTransaction({ nonce, senderHex: DEX, calls: tx.calls.map(toCall), accessList: tx.access_list })
        : sdk.buildContractCallTransaction({ nonce, senderHex: DEX, contractHex: tx.contract, calldata: sdk.hexToBytes(tx.calldata), accessList: tx.access_list });
      signed.push(tx.type);
      return sdk.signTransactionInput(input, secret);
    });
    await injectWallet(page, DEX);
    // Box/CI-independent: route the app's same-origin RPC to a reachable public node.
    await page.route('**/api/boing-rpc', async (route) => {
      const res = await route.fetch({ url: RPC });
      await route.fulfill({ response: res });
    });
    await page.goto(`/boing/publish-interface?contract=${LIVE_CONTRACT}`);
    await expect(page.getByTestId('publish-wallet')).toContainText(/0x8079/i, { timeout: 60_000 });
    await page.getByTestId('publish-check').click();
    await expect(page.getByTestId('publish-deployer-status')).toContainText(/deployed this contract/i, { timeout: 60_000 });
    await page.getByTestId('publish-autofill').click();
    await expect(page.getByTestId('publish-json-ok')).toBeVisible({ timeout: 30_000 });
    const saveTo = process.env.BOING_E2E_SAVE_JSON;
    if (saveTo) {
      const dl = page.waitForEvent('download');
      await page.getByTestId('publish-download').click();
      await (await dl).saveAs(saveTo);
    }
    await shot(page, `${process.env.BOING_E2E_SHOT_PREFIX || 'after-18-'}1-contract-and-json.png`);
    const hostOnBoing = process.env.BOING_E2E_LIVE_HOST === 'boing';
    if (hostOnBoing) {
      await expect(page.getByTestId('publish-boing-uri')).toHaveText(/^boing:\/\/iface-blob\//, { timeout: 30_000 });
    } else {
      await page.getByTestId('publish-host-url').click();
      await page.getByTestId('publish-uri').fill(process.env.BOING_E2E_LIVE_URI || `https://boing.network/interfaces/testnet/${LIVE_CONTRACT}.json`);
    }
    const shotPrefix = process.env.BOING_E2E_SHOT_PREFIX || 'after-18-';
    await page.getByTestId('publish-review').click();
    await expect(page.getByTestId('publish-review-panel')).toBeVisible();
    await shot(page, `${shotPrefix}2-review.png`);
    await page.getByTestId('publish-submit').click();
    await expect(page.getByTestId('publish-result')).toBeVisible({ timeout: 180_000 });
    await expect(page.getByTestId('publish-observer-link')).toBeVisible();
    if (hostOnBoing) await expect(page.getByTestId('publish-hosted-status')).toContainText(/Stored on Boing/, { timeout: 60_000 });
    await shot(page, `${shotPrefix}3-published.png`);
    await page.unrouteAll({ behavior: 'ignoreErrors' });
    writeFileSync(path.join(SHOTS || '.', 'live-result.txt'), `${signed.join(',')}\n${await page.getByTestId('publish-result').innerText()}\n`);
  });
});