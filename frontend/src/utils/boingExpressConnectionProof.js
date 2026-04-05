/**
 * Boing Express: require an explicit cryptographic signature after account access so
 * "connect" on boing.finance proves key control, not only address disclosure.
 * Aligns with BOING-EXPRESS-WALLET.md (`boing_signMessage` / `personal_sign`).
 *
 * On-chain deploys and txs still use `boing_signTransaction` / `boing_sendTransaction` separately.
 *
 * After a successful proof, we remember (per origin) that this account verified for this browser
 * until the user disconnects in the app or switches accounts in the wallet—so refreshes do not
 * prompt for another connection signature.
 */

const BOING_FINANCE_EXPRESS_VERIFIED_KEY = 'boingFinance_boingExpressVerified_v1';

/**
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
function sameLinkedAccount(a, b) {
  if (!a || !b || typeof a !== 'string' || typeof b !== 'string') return false;
  if (a === b) return true;
  const na = normalizeHexIdentity(a);
  const nb = normalizeHexIdentity(b);
  return Boolean(na && nb && na === nb);
}

/**
 * @param {string} s
 * @returns {string | null}
 */
function normalizeHexIdentity(s) {
  const t = s.trim();
  const body = t.startsWith('0x') || t.startsWith('0X') ? t.slice(2) : t;
  if (!/^[0-9a-fA-F]+$/.test(body)) return null;
  return body.toLowerCase();
}

/**
 * Clear stored Boing Express connection verification (call on in-app disconnect).
 */
export function forgetBoingExpressConnectionProof() {
  try {
    localStorage.removeItem(BOING_FINANCE_EXPRESS_VERIFIED_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * If the wallet account changed, drop verification unless it still matches the cached account.
 * @param {string} newAccount
 */
export function notifyBoingExpressWalletAccountChanged(newAccount) {
  if (!newAccount || typeof newAccount !== 'string') return;
  try {
    const raw = localStorage.getItem(BOING_FINANCE_EXPRESS_VERIFIED_KEY);
    if (!raw) return;
    const o = JSON.parse(raw);
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    if (o?.origin !== origin || !o?.account) {
      localStorage.removeItem(BOING_FINANCE_EXPRESS_VERIFIED_KEY);
      return;
    }
    if (!sameLinkedAccount(o.account, newAccount)) {
      localStorage.removeItem(BOING_FINANCE_EXPRESS_VERIFIED_KEY);
    }
  } catch {
    try {
      localStorage.removeItem(BOING_FINANCE_EXPRESS_VERIFIED_KEY);
    } catch {
      /* ignore */
    }
  }
}

/**
 * @param {string} messageUtf8
 * @returns {string} 0x-prefixed hex of UTF-8 bytes
 */
function utf8MessageToHex(messageUtf8) {
  const bytes = new TextEncoder().encode(messageUtf8);
  let hex = '';
  for (let i = 0; i < bytes.length; i += 1) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return `0x${hex}`;
}

/**
 * @param {string} account
 * @returns {boolean}
 */
function isBoingExpressConnectionProofCachedForAccount(account) {
  if (!account || typeof account !== 'string') return false;
  try {
    const raw = localStorage.getItem(BOING_FINANCE_EXPRESS_VERIFIED_KEY);
    if (!raw) return false;
    const o = JSON.parse(raw);
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    if (o?.origin !== origin || !o?.account) return false;
    return sameLinkedAccount(o.account, account);
  } catch {
    return false;
  }
}

/**
 * @param {string} account
 */
function rememberBoingExpressConnectionProof(account) {
  if (!account || typeof account !== 'string' || typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      BOING_FINANCE_EXPRESS_VERIFIED_KEY,
      JSON.stringify({ account, origin: window.location.origin })
    );
  } catch {
    /* ignore */
  }
}

/**
 * @param {{ request: Function }} provider
 * @param {string} account — 32-byte Boing AccountId or EVM address from wallet
 * @returns {Promise<{ ok: true, method: string } | { ok: false, reason: 'user_rejected' | 'unsupported' | 'invalid_params' }>}
 */
export async function requestBoingExpressConnectionProof(provider, account) {
  if (!provider || typeof provider.request !== 'function' || !account || typeof account !== 'string') {
    return { ok: false, reason: 'invalid_params' };
  }

  if (isBoingExpressConnectionProofCachedForAccount(account)) {
    return { ok: true, method: 'persisted_session' };
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://boing.finance';
  const nonce =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const message = [
    'Boing Finance',
    '',
    'Sign this message to verify you control this wallet on this site.',
    'Deploying tokens, swaps, and other on-chain actions require separate approvals in Boing Express.',
    '',
    `Account: ${account}`,
    `Origin: ${origin}`,
    `Nonce: ${nonce}`,
  ].join('\n');

  const isUserRejection = (err) =>
    err?.code === 4001 ||
    err?.code === 'ACTION_REJECTED' ||
    /reject|denied|cancel/i.test(String(err?.message || ''));

  try {
    await provider.request({
      method: 'boing_signMessage',
      params: [message, account],
    });
    rememberBoingExpressConnectionProof(account);
    return { ok: true, method: 'boing_signMessage' };
  } catch (e1) {
    if (isUserRejection(e1)) {
      return { ok: false, reason: 'user_rejected' };
    }
  }

  try {
    const msgHex = utf8MessageToHex(message);
    await provider.request({
      method: 'personal_sign',
      params: [msgHex, account],
    });
    rememberBoingExpressConnectionProof(account);
    return { ok: true, method: 'personal_sign' };
  } catch (e2) {
    if (isUserRejection(e2)) {
      return { ok: false, reason: 'user_rejected' };
    }
  }

  return { ok: false, reason: 'unsupported' };
}
