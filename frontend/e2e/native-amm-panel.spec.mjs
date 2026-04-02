import { test, expect } from '@playwright/test';

const MOCK_ACCOUNT = `0x${'11'.repeat(32)}`;
const SIG128 = `0x${'ab'.repeat(64)}`;

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
        // Swap page effects use `window.ethereum` for ethers helpers even when connected via Boing.
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
});
