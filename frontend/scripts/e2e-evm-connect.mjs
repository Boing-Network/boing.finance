// Headless check: EVM connect still works with the lazy EVM stack (mock injected MetaMask).
// Usage: (vite preview running) node scripts/e2e-evm-connect.mjs [baseUrl] [route]
import { chromium } from 'playwright';
const base = process.argv[2] || 'http://localhost:4173';
const route = process.argv[3] || '/swap';
const ACCOUNT = '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed';
const browser = await chromium.launch().catch(() => chromium.launch({ channel: 'msedge' }));
const page = await (await browser.newContext()).newPage();
const errors = [];
const js = [];
page.on('pageerror', (e) => errors.push(String(e.message || e)));
page.on('response', (r) => { if (r.url().endsWith('.js')) js.push(r.url().split('/').pop()); });
await page.addInitScript((acct) => {
  const listeners = {};
  const p = {
    isMetaMask: true,
    request: async ({ method }) => {
      switch (method) {
        case 'eth_requestAccounts': case 'eth_accounts': return [acct];
        case 'eth_chainId': return '0xaa36a7';
        case 'net_version': return '11155111';
        case 'eth_getBalance': return '0xde0b6b3a7640000';
        case 'eth_blockNumber': return '0x10';
        case 'wallet_switchEthereumChain': case 'wallet_addEthereumChain': return null;
        case 'eth_call': return '0x';
        default: return null;
      }
    },
    on: (e, f) => { (listeners[e] ||= []).push(f); },
    removeListener: () => {},
  };
  window.ethereum = p;
}, ACCOUNT);
await page.goto(base + route, { waitUntil: 'networkidle' });
// Dismiss first-visit modals (onboarding tour) if present.
for (let i = 0; i < 3; i++) { await page.keyboard.press('Escape'); await page.waitForTimeout(200); }
const skip = page.getByRole('button', { name: /^(Skip|Close|Got it|Maybe later)/i }).first();
if (await skip.isVisible().catch(() => false)) await skip.click().catch(() => {});
const before = js.length;
const ethersBefore = js.filter((f) => /provider-jsonrpc|contract-|ethers/.test(f)).length;
await page.getByRole('button', { name: 'EVM' }).first().click().catch(() => {});
await page.waitForTimeout(500);
await page.getByRole('button', { name: /Connect Wallet/ }).first().click();
await page.getByRole('button', { name: /MetaMask/ }).first().click();
await page.getByRole('button', { name: /Connect with MetaMask/ }).click();
await page.waitForTimeout(3000);
const body = await page.locator('body').innerText();
const short = ACCOUNT.slice(0, 6);
const connected = body.includes(short) || body.toLowerCase().includes(ACCOUNT.slice(0, 6).toLowerCase());
const ethersAfter = js.filter((f) => /provider-jsonrpc|contract-|ethers/.test(f)).length;
console.log(JSON.stringify({ route, connected, ethersChunksBeforeConnect: ethersBefore, ethersChunksAfterConnect: ethersAfter, newJsAfterConnect: js.slice(before), errors }, null, 2));
await browser.close();
process.exitCode = connected && !errors.length ? 0 : 1;