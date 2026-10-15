/**
 * Boing Express / Boing-compatible EIP-1193 discovery.
 * Aligns with BOING-EXPRESS-WALLET.md (window.boing, EIP-6963, boing_* methods); ecosystem backlog: https://github.com/Boing-Network/boing.network/blob/main/docs/HANDOFF-DEPENDENT-PROJECTS.md
 */

const BOING_TESTNET_CHAIN_HEX = '0x1b01';

/** Native 32-byte AccountId check — single source of truth in boing-sdk (`hex.ts`). */
export { isBoingNativeAccountIdHex } from 'boing-sdk';

/**
 * @param {{ request?: Function } | null | undefined} provider
 * @returns {boolean}
 */
export function isBoingNamedProvider(provider) {
  if (!provider || typeof provider.request !== 'function') return false;
  if (provider.isBoingExpress === true || provider.isBoingWallet === true) return true;
  return false;
}

/**
 * @returns {{ request: Function } | null}
 */
export function getWindowBoingProvider() {
  if (typeof window === 'undefined') return null;
  const b = window.boing;
  if (b && typeof b.request === 'function') return b;
  return null;
}

/**
 * Collect wallets that announce via EIP-6963 with Boing in name or rdns.
 * @returns {Promise<{ provider: { request: Function }, info: { uuid?: string, name?: string, rdns?: string, icon?: string } }[]>}
 */
export function discoverBoingEip6963Providers(timeoutMs = 800) {
  if (typeof window === 'undefined') return Promise.resolve([]);

  return new Promise((resolve) => {
    const out = [];
    const seen = new Set();

    const onAnnounce = (event) => {
      const detail = event.detail;
      const info = detail?.info;
      const p = detail?.provider;
      if (!p || typeof p.request !== 'function') return;
      const name = (info?.name || '').toLowerCase();
      const rdns = (info?.rdns || '').toLowerCase();
      if (!name.includes('boing') && !rdns.includes('boing')) return;
      const key = info?.uuid || `${name}:${rdns}`;
      if (seen.has(key)) return;
      seen.add(key);
      out.push({ provider: p, info: info || {} });
    };

    window.addEventListener('eip6963:announceProvider', onAnnounce);
    // Intentionally do not dispatch `eip6963:requestProvider` — it prompts wallets (e.g. Phantom) even when the user only connects Boing Express.

    setTimeout(() => {
      window.removeEventListener('eip6963:announceProvider', onAnnounce);
      resolve(out);
    }, timeoutMs);
  });
}

/**
 * Preferred injected provider for Boing dApps: window.boing, then first EIP-6963 Boing, else null.
 * @returns {Promise<{ request: Function } | null>}
 */
export async function resolveDefaultBoingInjectedProvider() {
  const direct = getWindowBoingProvider();
  if (direct) return direct;
  const announced = await discoverBoingEip6963Providers();
  return announced[0]?.provider ?? null;
}

/**
 * @param {{ request: Function }} provider
 * @returns {Promise<string[]>}
 */
export async function requestAccountsFromBoingCompatibleProvider(provider) {
  try {
    const acc = await provider.request({ method: 'boing_requestAccounts', params: [] });
    if (Array.isArray(acc) && acc.length > 0) return acc;
  } catch {
    // fall through
  }
  return provider.request({ method: 'eth_requestAccounts' });
}

/**
 * @param {{ request: Function }} provider
 * @returns {Promise<number>}
 */
export async function getChainIdFromBoingCompatibleProvider(provider) {
  try {
    const cid = await provider.request({ method: 'boing_chainId', params: [] });
    if (typeof cid === 'string' && cid.startsWith('0x')) return parseInt(cid, 16);
    if (typeof cid === 'number' && !Number.isNaN(cid)) return cid;
  } catch {
    // fall through
  }
  const hex = await provider.request({ method: 'eth_chainId' });
  return parseInt(hex, 16);
}

/**
 * Switch wallet to Boing testnet when supported (wallet RPC, not public node).
 * @param {{ request: Function }} provider
 * @returns {Promise<boolean>} true if a Boing switch was attempted (success or throw handled by caller)
 */
export async function switchToBoingTestnetInWallet(provider) {
  if (!provider?.request) return false;
  try {
    await provider.request({
      method: 'boing_switchChain',
      params: [BOING_TESTNET_CHAIN_HEX]
    });
    return true;
  } catch {
    try {
      await provider.request({
        method: 'boing_switchChain',
        params: [{ chainId: BOING_TESTNET_CHAIN_HEX }]
      });
      return true;
    } catch {
      return false;
    }
  }
}

export { BOING_TESTNET_CHAIN_HEX };

/** Chrome Web Store listing for the Boing Express extension. */
export const BOING_EXPRESS_CHROME_STORE_URL =
  'https://chromewebstore.google.com/detail/hhknjdhknnghccmfnfafbkapjljicbfh';

/**
 * User-facing message when no Boing Express provider is injected. Explains mobile / non-Chromium
 * browsers (the extension cannot run there) vs desktop Chrome without the extension.
 * @param {string} [userAgent]
 */
export function boingWalletMissingMessage(userAgent) {
  const ua = userAgent ?? (typeof navigator !== 'undefined' ? navigator.userAgent : '') ?? '';
  if (/Android|iPhone|iPad|iPod|Mobile/i.test(ua)) {
    return 'Boing Express is a desktop Chrome extension and cannot connect on this mobile browser. Open boing.finance in Chrome on a computer, or use boing.express to view balances and send BOING.';
  }
  const chromium = /Chrome\/|Chromium\/|Edg\//.test(ua) && !/Firefox\//.test(ua);
  if (!chromium) {
    return 'Boing Express is a Chrome extension. Open boing.finance in Chrome, Edge, or Brave with the extension installed (or use boing.express).';
  }
  return `Boing Express isn't installed in this browser. Install it from the Chrome Web Store (${BOING_EXPRESS_CHROME_STORE_URL}), then reload.`;
}