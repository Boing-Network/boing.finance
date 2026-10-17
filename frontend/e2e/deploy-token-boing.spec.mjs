import { test, expect } from '@playwright/test';
import { boingTokenBytecodeHex, predictNonceDerivedContractAddress } from 'boing-sdk';

/**
 * Boing token deploy creates Boing token v2: the form shows whole units and the built-in protections,
 * Express is asked to sign the v2 deploy (nonce n) and then mint_first of the supply (nonce n+1).
 * Wallet and RPC are mocked; nothing reaches the chain.
 */
const ME = `0x${'11'.repeat(32)}`;
const NONCE = 5;
const FAKE_SIGNED = `0x${'cd'.repeat(40)}`;

async function setup(page, rpcLog) {
  await page.addInitScript(({ account, signed }) => {
    localStorage.setItem('boing_onboarding_completed', 'true');
    localStorage.setItem('walletConnected', 'true');
    localStorage.setItem('walletType', 'boingExpress');
    localStorage.removeItem('userDisconnected');
    window.__signRequests = [];
    const provider = {
      isBoing: true,
      isBoingExpress: true,
      request: async ({ method, params }) => {
        if (method === 'boing_chainId' || method === 'eth_chainId') return '0x1b01';
        if (/^(boing|eth)_(request)?[aA]ccounts$/.test(method)) return [account];
        if (method === 'boing_signMessage' || method === 'personal_sign') return `0x${'ab'.repeat(64)}`;
        if (method === 'boing_signTransaction') {
          window.__signRequests.push(JSON.parse(JSON.stringify(params[0])));
          return signed;
        }
        throw new Error(`E2E mock: unhandled ${method}`);
      },
      on: () => {},
      removeListener: () => {},
    };
    window.boing = provider;
    window.ethereum = provider;
  }, { account: ME, signed: FAKE_SIGNED });

  await page.route('**/api/boing-rpc', async (route) => {
    let body;
    try {
      body = route.request().postDataJSON();
    } catch {
      return route.continue();
    }
    const method = body?.method;
    const ok = (result) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ jsonrpc: '2.0', id: body.id, result }) });
    rpcLog?.push(method);
    if (method === 'boing_qaCheck') return ok({ result: 'allow' });
    if (method === 'boing_getAccount') return ok({ nonce: NONCE, balance: '1000', stake: '0' });
    if (method === 'boing_submitTransaction') return ok({ tx_hash: `0x${'ef'.repeat(32)}` });
    if (method === 'boing_getTransactionReceipt') return ok({ success: true, logs: [] });
    return route.continue();
  });
  // Token metadata upload (R2 worker).
  await page.route(/\/r2\/upload/, (route) => {
    return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ success: true, data: { url: 'https://example.com/metadata/test.json' } }) });
  });
}

async function fillBasics(page) {
  await page.goto('/deploy-token', { waitUntil: 'domcontentloaded' });
  await expect(page.getByTestId('deploy-boing-decimals')).toBeVisible({ timeout: 60_000 });
  await page.locator('#deploy-evm-name').fill('E2E Token');
  await page.locator('#deploy-evm-symbol').fill('e2et');
  await page.locator('#deploy-evm-supply').fill('1000000');
}

test.describe('Deploy token on Boing (token v2)', () => {
  // The app service worker would fetch the metadata upload itself, past the route mock.
  test.use({ serviceWorkers: 'block' });

  test('form shows whole units and the v2 protections; unsupported options are hidden', async ({ page }) => {
    test.setTimeout(120_000);
    await setup(page);
    await fillBasics(page);
    await expect(page.getByTestId('deploy-boing-decimals')).toHaveValue('0 (whole units)');
    await page.getByRole('button', { name: /Next: Network & Plan/ }).click();
    await page.getByRole('button', { name: /Next: Security & Info/ }).click();
    const note = page.getByTestId('boing-token-v2-security');
    await expect(note).toBeVisible();
    await expect(note).toContainText('Fixed supply');
    await expect(page.getByTestId('boing-token-v2-unsupported')).toContainText('Anti-Bot Protection');
    await expect(page.getByTestId('boing-token-v2-unsupported')).toContainText('Max Wallet Limit');
    // The EVM toggles are not rendered on Boing.
    await expect(page.locator('#deploy-security-antiBot')).toHaveCount(0);
    await expect(page.locator('#deploy-security-maxWallet')).toHaveCount(0);
    await page.getByRole('button', { name: /Next: Review & Deploy/ }).click();
    await expect(page.getByText('Boing token v2.', { exact: false }).first()).toBeVisible();
  });

  test('deploy asks Express to sign the v2 deploy, then mint_first of the supply at the next nonce', async ({ page }) => {
    test.setTimeout(150_000);
    const rpc = [];
    await setup(page, rpc);
    await fillBasics(page);
    await page.getByRole('button', { name: /Next: Network & Plan/ }).click();
    await page.getByRole('button', { name: /Next: Security & Info/ }).click();
    await page.getByRole('button', { name: /Next: Review & Deploy/ }).click();
    const deployBtn = page.locator('button[type="submit"]').filter({ hasText: /Deploy/ }).first();
    await expect(deployBtn).toBeEnabled({ timeout: 30_000 });
    await deployBtn.click();

    const token = predictNonceDerivedContractAddress(ME, BigInt(NONCE)).toLowerCase();
    await expect.poll(() => rpc.filter((m) => m === 'boing_submitTransaction').length, { timeout: 60_000 }).toBe(2);
    // The success summary names the v2 token, its whole-unit decimals, supply and address.
    const done = page.getByText(token).first();
    await expect(done).toBeVisible({ timeout: 30_000 });

    const signed = await page.evaluate(() => window.__signRequests);
    expect(signed).toHaveLength(2);
    const [deploy, mint] = signed;
    expect(deploy.type).toBe('contract_deploy_meta');
    expect(deploy.bytecode.toLowerCase()).toBe(boingTokenBytecodeHex(2));
    expect(deploy.purpose_category).toBe('token');
    expect(deploy.asset_name).toBe('E2E Token');
    expect(deploy.asset_symbol).toBe('E2ET');
    expect(deploy.nonce).toBe(String(NONCE));
    expect(deploy.description_hash).toMatch(/^0x[0-9a-f]{64}$/);

    expect(mint.type).toBe('contract_call');
    expect(mint.contract).toBe(token);
    expect(mint.nonce).toBe(String(NONCE + 1));
    const word = (n) => BigInt(n).toString(16).padStart(64, '0');
    expect(mint.calldata).toBe(`0x${word(2)}${ME.slice(2)}${word(1_000_000)}`);
    expect(mint.access_list).toEqual({ read: [ME, token], write: [ME, token] });

    // Both were signed before anything was submitted; two submits, deploy first.
    expect(rpc.filter((m) => m === 'boing_submitTransaction')).toHaveLength(2);
    expect(rpc.indexOf('boing_qaCheck')).toBeLessThan(rpc.indexOf('boing_submitTransaction'));
  });
});
