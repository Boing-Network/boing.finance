import { test, expect } from '@playwright/test';
import {
  CANONICAL_BOING_TESTNET_LINKED_NFT_TOKEN_REGISTRY_HEX,
  boingTokenBytecodeHex,
  buildLinkedNftTokenClaimSelfInitSnippetHex,
} from '@boing-network/boing-sdk';

/**
 * Project pack token = Boing token v2 minted to the creator at deploy: the supply field (default
 * 1,000,000,000, whole units), the "You'll receive" copy on the details and review steps, and the
 * token step asks Express for ONE deploy signature whose bytecode is the 0xFD mint-at-deploy wrapper.
 * Wallet and RPC are mocked; nothing reaches the chain.
 */
const ME = `0x${'11'.repeat(32)}`;
const FAKE_SIGNED = `0x${'cd'.repeat(40)}`;

async function setup(page, draft) {
  await page.addInitScript(({ account, signed, draftJson }) => {
    localStorage.setItem('boing_onboarding_completed', 'true');
    localStorage.setItem('walletConnected', 'true');
    localStorage.setItem('walletType', 'boingExpress');
    localStorage.removeItem('userDisconnected');
    if (draftJson && !sessionStorage.getItem('e2e-draft-set')) {
      sessionStorage.setItem('boing.finance.projectPack.v3', draftJson);
      sessionStorage.setItem('e2e-draft-set', '1');
    }
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
  }, { account: ME, signed: FAKE_SIGNED, draftJson: draft ? JSON.stringify(draft) : null });
  await page.route('**/api/boing-rpc', async (route) => {
    let body;
    try {
      body = route.request().postDataJSON();
    } catch {
      return route.continue();
    }
    const ok = (result) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ jsonrpc: '2.0', id: body.id, result }) });
    if (body?.method === 'boing_qaCheck') return ok({ result: 'allow' });
    if (body?.method === 'boing_getAccount') return ok({ nonce: 7, balance: '1000', stake: '0' });
    if (body?.method === 'boing_submitTransaction') return ok({ tx_hash: `0x${'ef'.repeat(32)}` });
    if (body?.method === 'boing_getTransactionReceipt') return ok({ success: true, logs: [] });
    return route.continue();
  });
}

test.describe('Project pack token supply (Boing token v2, minted at deploy)', () => {
  test.use({ serviceWorkers: 'block' });

  test('supply field defaults to 1,000,000,000, validates whole units and shows what you receive', async ({ page }) => {
    test.setTimeout(120_000);
    await setup(page);
    await page.goto('/project-pack', { waitUntil: 'domcontentloaded' });
    const supply = page.getByTestId('project-pack-supply');
    await expect(supply).toBeVisible({ timeout: 60_000 });
    await expect(supply).toHaveValue('1000000000');
    await page.getByPlaceholder('Collection name').fill('Neon Garden');
    await page.getByPlaceholder('e.g. NG', { exact: true }).fill('ng');
    await page.getByPlaceholder('Token name').fill('Neon Garden Token');
    await page.getByPlaceholder('e.g. NGT').fill('ngt');
    const help = page.getByTestId('project-pack-supply-help');
    await expect(help).toContainText("You'll receive 1,000,000,000 NGT");
    const cont = page.getByRole('button', { name: 'Continue' });
    for (const [bad, msg] of [['0', 'greater than 0'], ['12.5', 'whole number'], ['', 'Enter an initial supply'], ['340282366920938463463374607431768211456', 'too large']]) {
      await supply.fill(bad);
      await expect(help).toContainText(msg);
      await expect(cont).toBeDisabled();
    }
    await supply.fill('4,206,900,000');
    await expect(help).toContainText("You'll receive 4,206,900,000 NGT");
    await expect(cont).toBeEnabled();
    await cont.click();
    await expect(page.getByRole('heading', { name: 'Create the collection' })).toBeVisible();
  });

  test('token step reviews the supply and signs one v2 mint-at-deploy deploy (no separate mint)', async ({ page }) => {
    test.setTimeout(120_000);
    await setup(page, {
      step: 'token',
      collectionName: 'Neon Garden',
      collectionSymbol: 'NG',
      tokenName: 'Neon Garden Token',
      tokenSymbol: 'NGT',
      tokenSupply: '4206900000',
      collectionSaltHex: `0x${'5a'.repeat(32)}`,
      collectionTx: `0x${'aa'.repeat(32)}`,
      predictedToken: `0x${'77'.repeat(32)}`,
    });
    await page.goto('/project-pack', { waitUntil: 'domcontentloaded' });
    const review = page.getByTestId('project-pack-supply-review');
    await expect(review).toBeVisible({ timeout: 60_000 });
    await expect(review).toContainText("You'll receive 4,206,900,000 NGT");
    await expect(review).toContainText('full supply goes to your account');
    await page.getByRole('button', { name: 'Create token' }).click();
    await expect.poll(() => page.evaluate(() => window.__signRequests.length), { timeout: 30_000 }).toBeGreaterThan(0);
    await page.waitForTimeout(1500);
    const reqs = await page.evaluate(() => window.__signRequests);
    expect(reqs).toHaveLength(1);
    const [deploy] = reqs;
    expect(deploy.type).toBe('contract_deploy_meta');
    expect(deploy.asset_symbol).toBe('NGT');
    expect(deploy.create2_salt).toMatch(/^0x[0-9a-f]{64}$/);
    expect(deploy.bytecode.startsWith('0xfd33')).toBe(true);
    // The v2 runtime is embedded (as 32-byte PUSH32 chunks) and the supply word is in the init.
    const v2 = boingTokenBytecodeHex(2).slice(2);
    expect(deploy.bytecode).toContain(v2.slice(0, 64));
    expect(deploy.bytecode).toContain((4206900000).toString(16).padStart(64, '0'));
    // ...and the token claims itself in the linked NFT↔token registry v2 inside the same deploy.
    expect(deploy.bytecode.toLowerCase()).toContain(
      buildLinkedNftTokenClaimSelfInitSnippetHex(CANONICAL_BOING_TESTNET_LINKED_NFT_TOKEN_REGISTRY_HEX).slice(2).toLowerCase()
    );
  });

  test('supply is locked once the collection exists (it already names this token address)', async ({ page }) => {
    test.setTimeout(120_000);
    await setup(page, {
      step: 'details',
      collectionName: 'Neon Garden',
      collectionSymbol: 'NG',
      tokenName: 'Neon Garden Token',
      tokenSymbol: 'NGT',
      tokenSupply: '4206900000',
      collectionSaltHex: `0x${'5a'.repeat(32)}`,
      collectionTx: `0x${'aa'.repeat(32)}`,
    });
    await page.goto('/project-pack', { waitUntil: 'domcontentloaded' });
    const supply = page.getByTestId('project-pack-supply');
    await expect(supply).toBeVisible({ timeout: 60_000 });
    await expect(supply).toBeDisabled();
    await expect(supply).toHaveValue('4206900000');
  });
});
