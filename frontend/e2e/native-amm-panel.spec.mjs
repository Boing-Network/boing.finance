import { test, expect } from '@playwright/test';

const MOCK_ACCOUNT = `0x${'11'.repeat(32)}`;
const SIG128 = `0x${'ab'.repeat(64)}`;

/** 32-byte storage word: high 16 bytes zero, low 16 bytes big-endian u128 */
function reserveWordHex(n) {
  let v = BigInt(n);
  const bytes = new Uint8Array(16);
  for (let i = 15; i >= 0; i--) {
    bytes[i] = Number(v & 0xffn);
    v >>= 8n;
  }
  const lo = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `0x${'0'.repeat(32)}${lo}`;
}

test.describe('Native AMM panel (build with REACT_APP_BOING_NATIVE_AMM_POOL)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(
      ({ account, sig }) => {
        localStorage.setItem('walletConnected', 'true');
        localStorage.setItem('walletType', 'boingExpress');
        localStorage.removeItem('userDisconnected');
        const provider = {
          isBoing: true,
          isBoingExpress: true,
          request: async ({ method }) => {
            if (method === 'boing_chainId' || method === 'eth_chainId') return '0x1b01';
            if (method === 'boing_accounts' || method === 'eth_accounts') return [account];
            if (method === 'boing_signMessage' || method === 'personal_sign') return sig;
            throw new Error(`E2E mock: unhandled ${method}`);
          },
          on: () => {},
          removeListener: () => {},
        };
        window.boing = provider;
        window.ethereum = provider;
      },
      { account: MOCK_ACCOUNT, sig: SIG128 }
    );
  });

  test('swap page shows native CP pool section', async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto('/swap');
    await expect(page.getByTestId('native-amm-panel')).toBeVisible({ timeout: 90_000 });
    await expect(page.getByRole('heading', { name: /Native constant-product pool/i })).toBeVisible();
  });

  test('native panel loads mocked reserves via boing-rpc proxy', async ({ page }) => {
    test.setTimeout(120_000);

    await page.route('**/api/boing-rpc', async (route) => {
      let body;
      try {
        body = route.request().postDataJSON();
      } catch {
        await route.continue();
        return;
      }
      const method = body?.method;
      if (method === 'boing_getContractStorage') {
        const key = body.params?.[1];
        const reserveAKey = `0x${'0'.repeat(62)}01`;
        const reserveBKey = `0x${'0'.repeat(62)}02`;
        let value;
        if (key?.toLowerCase() === reserveAKey.toLowerCase()) {
          value = reserveWordHex(1000);
        } else if (key?.toLowerCase() === reserveBKey.toLowerCase()) {
          value = reserveWordHex(2000);
        } else {
          value = `0x${'0'.repeat(64)}`;
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: body.id ?? 1,
            result: { value },
          }),
        });
        return;
      }
      await route.continue();
    });

    await page.goto('/swap');
    const panel = page.getByTestId('native-amm-panel');
    await expect(panel).toBeVisible({ timeout: 90_000 });
    await expect(panel).toContainText('1000', { timeout: 30_000 });
    await expect(panel).toContainText('2000');

    await page.getByTestId('native-amm-refresh-reserves').click();
    await expect(panel).toContainText('1000');
  });

  test('swap submit stays disabled without amount', async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto('/swap');
    await expect(page.getByTestId('native-amm-panel')).toBeVisible({ timeout: 90_000 });
    await expect(page.getByTestId('native-amm-swap-submit')).toBeDisabled();
  });
});
