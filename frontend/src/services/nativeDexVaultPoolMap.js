/**
 * Operator-defined vault ↔ pool ↔ share-token wiring for multi-pool vaults (no on-chain discovery yet).
 * Set `REACT_APP_BOING_NATIVE_DEX_VAULT_POOL_MAP_JSON`.
 */

/**
 * @param {string} raw
 * @returns {string | null}
 */
function normHex32(raw) {
  const t = (raw || '').trim();
  const body = t.startsWith('0x') || t.startsWith('0X') ? t.slice(2) : t;
  if (!/^[0-9a-fA-F]{64}$/.test(body)) return null;
  return `0x${body.toLowerCase()}`;
}

/**
 * @typedef {{ vaultHex: string, poolHex: string, shareTokenHex: string | null, label: string }} VaultPoolMapping
 */

/**
 * @param {unknown} row
 * @returns {VaultPoolMapping | null}
 */
function rowFromObject(row) {
  if (!row || typeof row !== 'object') return null;
  const vaultHex = normHex32(String(/** @type {{ vaultHex?: unknown, vault?: unknown }} */ (row).vaultHex ?? /** @type {{ vault?: unknown }} */ (row).vault ?? ''));
  const poolHex = normHex32(String(/** @type {{ poolHex?: unknown, pool?: unknown }} */ (row).poolHex ?? /** @type {{ pool?: unknown }} */ (row).pool ?? ''));
  if (!vaultHex || !poolHex) return null;
  const stRaw = /** @type {{ shareTokenHex?: unknown, shareToken?: unknown }} */ (row).shareTokenHex ?? /** @type {{ shareToken?: unknown }} */ (row).shareToken;
  const shareTokenHex = stRaw != null && String(stRaw).trim() ? normHex32(String(stRaw)) : null;
  const label = typeof /** @type {{ label?: unknown }} */ (row).label === 'string' ? String(row.label).slice(0, 120) : '';
  return { vaultHex, poolHex, shareTokenHex, label };
}

/**
 * @returns {VaultPoolMapping[]}
 */
export function loadVaultPoolMappings() {
  const raw = (process.env.REACT_APP_BOING_NATIVE_DEX_VAULT_POOL_MAP_JSON || '').trim();
  if (!raw) return [];
  try {
    const j = JSON.parse(raw);
    /** @type {VaultPoolMapping[]} */
    const out = [];
    if (Array.isArray(j)) {
      for (const row of j) {
        const m = rowFromObject(row);
        if (m) out.push(m);
      }
      return out;
    }
    if (j && typeof j === 'object' && j.vaults && typeof j.vaults === 'object') {
      for (const [vaultKey, poolsVal] of Object.entries(/** @type {Record<string, unknown>} */ (j).vaults)) {
        const vaultHex = normHex32(vaultKey);
        if (!vaultHex) continue;
        const list = Array.isArray(poolsVal) ? poolsVal : [poolsVal];
        for (const p of list) {
          if (typeof p === 'string') {
            const poolHex = normHex32(p);
            if (poolHex) out.push({ vaultHex, poolHex, shareTokenHex: null, label: '' });
          } else if (p && typeof p === 'object') {
            const poolHex = normHex32(String(/** @type {{ poolHex?: unknown, pool?: unknown }} */ (p).poolHex ?? /** @type {{ pool?: unknown }} */ (p).pool ?? ''));
            if (!poolHex) continue;
            const stRaw = /** @type {{ shareTokenHex?: unknown, shareToken?: unknown }} */ (p).shareTokenHex ?? /** @type {{ shareToken?: unknown }} */ (p).shareToken;
            const shareTokenHex = stRaw != null && String(stRaw).trim() ? normHex32(String(stRaw)) : null;
            const label = typeof /** @type {{ label?: unknown }} */ (p).label === 'string' ? String(p.label).slice(0, 120) : '';
            out.push({ vaultHex, poolHex, shareTokenHex, label });
          }
        }
      }
      return out;
    }
    return [];
  } catch {
    return [];
  }
}
