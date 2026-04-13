import React, { useCallback, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  getCuratedNativeVmTokens,
  loadCustomNativeVmTokens,
  loadRecentNativeVmTokens,
  normalizeNativeVmTokenId32,
  pushRecentNativeVmToken,
  saveCustomNativeVmToken,
  venueTokensToPickerEntries,
} from '../services/nativeVmTokenRegistry';

function shortHex(h) {
  if (!h || typeof h !== 'string') return '';
  const t = h.trim();
  if (t.length < 22) return t;
  return `${t.slice(0, 10)}…${t.slice(-6)}`;
}

/**
 * Token account picker: curated + directory venues + user-added + recent; still accepts pasted 32-byte hex.
 *
 * @param {{
 *   label: string,
 *   value: string,
 *   onChange: (next: string) => void,
 *   excludeHex?: string | null,
 *   venueTokens?: import('boing-sdk').CpPoolVenue[],
 *   indexerTokens?: Array<{ id: string, symbol: string, name: string, decimals?: number }>,
 *   inputTestId?: string,
 * }} props
 */
export default function NativeVmTokenPickerField({
  label,
  value,
  onChange,
  excludeHex = null,
  venueTokens = [],
  indexerTokens = [],
  inputTestId,
}) {
  const [customVersion, setCustomVersion] = useState(0);
  const [recentVersion, setRecentVersion] = useState(0);

  const excludeNorm = useMemo(() => normalizeNativeVmTokenId32(excludeHex || ''), [excludeHex]);

  const curated = useMemo(() => getCuratedNativeVmTokens(), []);
  const fromVenues = useMemo(() => venueTokensToPickerEntries(venueTokens), [venueTokens]);
  const fromIndexer = useMemo(() => (Array.isArray(indexerTokens) ? indexerTokens : []), [indexerTokens]);

  const listRefreshNonce = customVersion + recentVersion;
  const allPickable = useMemo(() => {
    void listRefreshNonce;
    const custom = loadCustomNativeVmTokens();
    const recent = loadRecentNativeVmTokens();
    const byId = new Map();
    // Baseline defaults + env list only; on-chain venues + indexer + user custom win on conflicts.
    for (const e of curated) {
      if (excludeNorm && e.id === excludeNorm) continue;
      byId.set(e.id, e);
    }
    for (const e of fromIndexer) {
      if (!e?.id || (excludeNorm && e.id === excludeNorm)) continue;
      const id = normalizeNativeVmTokenId32(e.id);
      if (!id) continue;
      byId.set(id, {
        id,
        symbol: e.symbol || shortHex(id),
        name: e.name || 'From indexer',
      });
    }
    // Pool-hydrated venues win over indexer rows for the same token id (on-chain truth).
    for (const e of fromVenues) {
      if (excludeNorm && e.id === excludeNorm) continue;
      byId.set(e.id, e);
    }
    for (const e of custom) {
      if (excludeNorm && e.id === excludeNorm) continue;
      byId.set(e.id, e);
    }
    for (const id of recent) {
      if (excludeNorm && id === excludeNorm) continue;
      if (!byId.has(id)) {
        byId.set(id, { id, symbol: shortHex(id), name: 'Recently used' });
      }
    }
    return [...byId.values()].sort((a, b) => a.symbol.localeCompare(b.symbol));
  }, [curated, fromVenues, fromIndexer, excludeNorm, listRefreshNonce]);

  const onSelectPreset = useCallback(
    (e) => {
      const v = e.target.value;
      e.target.value = '';
      if (!v) return;
      const id = normalizeNativeVmTokenId32(v);
      if (!id) return;
      onChange(id);
      pushRecentNativeVmToken(id);
      setRecentVersion((n) => n + 1);
    },
    [onChange]
  );

  const onBlurRecordRecent = useCallback(() => {
    const id = normalizeNativeVmTokenId32(value);
    if (id) {
      pushRecentNativeVmToken(id);
      setRecentVersion((n) => n + 1);
    }
  }, [value]);

  const onSaveCustom = useCallback(() => {
    const id = normalizeNativeVmTokenId32(value);
    if (!id) {
      toast.error('Enter a valid 32-byte token id first.');
      return;
    }
    const ok = saveCustomNativeVmToken({
      id,
      symbol: shortHex(id),
      name: 'Saved token',
    });
    if (ok) {
      toast.success('Saved to your token list');
      setCustomVersion((n) => n + 1);
      pushRecentNativeVmToken(id);
      setRecentVersion((n) => n + 1);
    } else {
      toast.error('Could not save (storage full or blocked).');
    }
  }, [value]);

  return (
    <div>
      <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>
        {label}
      </label>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
        <select
          aria-label={`${label} — choose from list`}
          defaultValue=""
          onChange={onSelectPreset}
          className="w-full sm:max-w-[200px] text-xs p-2 rounded-lg border shrink-0"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border-color)',
            color: 'var(--text-primary)',
          }}
        >
          <option value="">Pick from list…</option>
          {allPickable.map((t) => (
            <option key={t.id} value={t.id}>
              {t.symbol}
              {'coingeckoId' in t && t.coingeckoId ? ` [${t.coingeckoId}]` : ''} — {t.name.slice(0, 42)}
              {t.name.length > 42 ? '…' : ''}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value.trim())}
          onBlur={onBlurRecordRecent}
          placeholder="0x + 64 hex (or use list)"
          data-testid={inputTestId}
          className="w-full flex-1 text-xs p-2 rounded-lg border font-mono"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border-color)',
            color: 'var(--text-primary)',
          }}
          spellCheck={false}
        />
      </div>
      <div className="flex flex-wrap gap-2 mt-1.5">
        <button
          type="button"
          onClick={onSaveCustom}
          className="text-[10px] px-2 py-0.5 rounded border hover:opacity-90"
          style={{ borderColor: 'var(--border-color)', color: 'var(--text-tertiary)' }}
        >
          Save current id to my tokens
        </button>
      </div>
    </div>
  );
}
