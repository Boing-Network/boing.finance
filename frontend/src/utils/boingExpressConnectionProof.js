/**
 * Boing Express: require an explicit cryptographic signature after account access so
 * "connect" on boing.finance proves key control, not only address disclosure.
 * Aligns with BOING-EXPRESS-WALLET.md (`boing_signMessage` / `personal_sign`).
 *
 * On-chain deploys and txs still use `boing_signTransaction` / `boing_sendTransaction` separately.
 */

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
 * @param {{ request: Function }} provider
 * @param {string} account — 32-byte Boing AccountId or EVM address from wallet
 * @returns {Promise<{ ok: true, method: string } | { ok: false, reason: 'user_rejected' | 'unsupported' | 'invalid_params' }>}
 */
export async function requestBoingExpressConnectionProof(provider, account) {
  if (!provider || typeof provider.request !== 'function' || !account || typeof account !== 'string') {
    return { ok: false, reason: 'invalid_params' };
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
    return { ok: true, method: 'personal_sign' };
  } catch (e2) {
    if (isUserRejection(e2)) {
      return { ok: false, reason: 'user_rejected' };
    }
  }

  return { ok: false, reason: 'unsupported' };
}
