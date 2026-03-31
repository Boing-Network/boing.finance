/**
 * Boing Express / Boing-compatible EIP-1193 discovery.
 * Aligns with boing.network BOING-EXPRESS-WALLET.md (window.boing, EIP-6963, boing_* methods).
 */

const BOING_TESTNET_CHAIN_HEX = '0x1b01';

/**
 * Boing Network native AccountId: 32 bytes = 64 hex chars (optional 0x).
 * Ethers / EVM tooling expect 20-byte (40 hex) addresses—native Boing ids are incompatible.
 * @param {string | null | undefined} address
 * @returns {boolean}
 */
export function isBoingNativeAccountIdHex(address) {
  if (!address || typeof address !== 'string') return false;
  const hex = address.startsWith('0x') || address.startsWith('0X') ? address.slice(2) : address;
  return /^[0-9a-fA-F]{64}$/.test(hex);
}

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
export function discoverBoingEip6963Providers(timeoutMs = 400) {
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
    window.dispatchEvent(new Event('eip6963:requestProvider'));

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
