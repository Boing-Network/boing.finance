import React, { useCallback, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  getCuratedNativeVmTokens,
  loadCustomNativeVmTokens,
  loadLocalDeployNativeVmTokens,
  loadRecentNativeVmTokens,
  normalizeNativeVmTokenId32,
  pushRecentNativeVmToken,
  saveCustomNativeVmToken,
  venueTokensToPickerEntries,
} from '../services/nativeVmTokenRegistry';
import { useTokenLabels } from '../hooks/useTokenLabels';
import TokenLabel from './TokenLabel';

function shortHex(h) {
  if (!h || typeof h !== 'string') return '';
  const t = h.trim();
  if (t.length < 22) return t;
  return `${t.slice(0, 10)}…${t.slice(-6)}`;
}

/**
 * Token account picker: curated + directory venues + user-added + recent deploys; still accepts pasted 32-byte hex.
 *
 * @param {{
 *   label: string,
 *   value: string,
 *   onChange: (next: string) => void,
 *   excludeHex?: string | null,
 *   venueTokens?: import('@boing-network/boing-sdk').CpPoolVenue[],
 *   indexerTokens?: Array<{ id: string, symbol: string, name: string, decimals?: number }>,
 *   inputTestId?: string,
 *   helpHint?: boolean,
 *   hideAddressField?: boolean,
 *   balanceLabel?: string | null,
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
  helpHint = true,
  hideAddressField = false,
  balanceLabel = null,
}) {
  const [customVersion, setCustomVersion] = useState(0);
  const [recentVersion, setRecentVersion] = useState(0);
  const [showPaste, setShowPaste] = useState(false);

  const excludeNorm = useMemo(() => normalizeNativeVmTokenId32(excludeHex || ''), [excludeHex]);

  const curated = useMemo(() => getCuratedNativeVmTokens(), []);
  const fromVenues = useMemo(() => venueTokensToPickerEntries(venueTokens), [venueTokens]);
  const fromIndexer = useMemo(() => (Array.isArray(indexerTokens) ? indexerTokens : []), [indexerTokens]);

  const listRefreshNonce = customVersion + recentVersion;
  const labelIds = useMemo(() => {
    void listRefreshNonce;
    return [value, ...loadRecentNativeVmTokens(), ...fromIndexer.map((e) => e?.id)];
  }, [value, fromIndexer, listRefreshNonce]);
  const labelOf = useTokenLabels(labelIds);
  const allPickable = useMemo(() => {
    void listRefreshNonce;
    const custom = loadCustomNativeVmTokens();
    const localDeploys = loadLocalDeployNativeVmTokens();
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
    for (const e of localDeploys) {
      if (excludeNorm && e.id === excludeNorm) continue;
      if (!byId.has(e.id)) byId.set(e.id, { ...e, name: e.name || 'Your deploy' });
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
    // Replace hex placeholders with on-chain / cached names where we have them.
    const rows = [...byId.values()].map((e) => {
      if (e.symbol && !e.symbol.startsWith('0x')) return e;
      const l = labelOf(e.id);
      return l.resolved ? { ...e, symbol: l.symbol, name: l.name || e.name } : e;
    });
    return rows.sort((a, b) => a.symbol.localeCompare(b.symbol));
  }, [curated, fromVenues, fromIndexer, excludeNorm, listRefreshNonce, labelOf]);

  const normalizedValue = useMemo(() => normalizeNativeVmTokenId32(value), [value]);
  const valueInList = useMemo(
    () => (normalizedValue ? allPickable.some((t) => t.id === normalizedValue) : false),
    [allPickable, normalizedValue]
  );

  const selectedMeta = useMemo(() => {
    if (!normalizedValue) return null;
    const fromList = allPickable.find((t) => t.id === normalizedValue);
    if (fromList) return fromList;
    const l = labelOf(normalizedValue);
    return {
      id: normalizedValue,
      symbol: l.resolved ? l.symbol : shortHex(normalizedValue),
      name: l.resolved ? l.name || 'Selected token' : 'Selected token',
    };
  }, [normalizedValue, allPickable, labelOf]);

  const onSelectPreset = useCallback(
    (e) => {
      const v = e.target.value;
      if (!v) {
        onChange('');
        return;
      }
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
      toast.error('Paste a valid 32-byte token id (0x + 64 hex) first.');
      return;
    }
    const existing = allPickable.find((t) => t.id === id);
    const ok = saveCustomNativeVmToken({
      id,
      symbol: existing?.symbol && !existing.symbol.startsWith('0x') ? existing.symbol : shortHex(id),
      name: existing?.name || 'Saved token',
    });
    if (ok) {
      toast.success('Saved to my tokens — it will stay in this list on this browser.');
      setCustomVersion((n) => n + 1);
      pushRecentNativeVmToken(id);
      setRecentVersion((n) => n + 1);
    } else {
      toast.error('Could not save (storage full or blocked).');
    }
  }, [value, allPickable]);

  const optionLabel = (t) =>
    `${t.symbol}${'coingeckoId' in t && t.coingeckoId ? ` [${t.coingeckoId}]` : ''} — ${t.name.slice(0, 42)}${
      t.name.length > 42 ? '…' : ''
    }`;

  const showPasteChrome = !hideAddressField || showPaste;

  const addressInput = (
    <input
      id={inputTestId || undefined}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value.trim())}
      onBlur={onBlurRecordRecent}
      placeholder="Paste token id (0x…)"
      data-testid={inputTestId}
      className={`td-field__input w-full text-xs font-mono ${hideAddressField ? '' : 'flex-1'}`}
      spellCheck={false}
      // Keep mounted when collapsed so URL prefills / e2e can still read the value.
      hidden={hideAddressField && !showPaste ? true : undefined}
      tabIndex={hideAddressField && !showPaste ? -1 : undefined}
      aria-hidden={hideAddressField && !showPaste ? true : undefined}
    />
  );

  const saveRow = showPasteChrome ? (
    <div className="flex flex-wrap items-center gap-2 mt-1.5">
      <button
        type="button"
        onClick={onSaveCustom}
        className="td-btn td-btn--ghost text-[10px] px-2 py-0.5"
        data-testid={inputTestId ? `${inputTestId}-save` : undefined}
      >
        Save current id to my tokens
      </button>
      {normalizedValue && !valueInList ? (
        <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
          Not in the list yet — save it so it stays here.
        </span>
      ) : null}
    </div>
  ) : null;

  return (
    <div className="td-field relative">
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <label className="td-field__label mb-0" htmlFor={inputTestId || undefined}>
          {label}
        </label>
        {balanceLabel != null ? (
          <span
            className="text-xs tabular-nums shrink-0"
            style={{ color: 'var(--text-tertiary)' }}
            data-testid={inputTestId ? `${inputTestId}-balance` : undefined}
          >
            {balanceLabel}
          </span>
        ) : null}
      </div>
      <div className={`flex flex-col gap-2 ${hideAddressField ? '' : 'sm:flex-row sm:items-stretch'}`}>
        <select
          aria-label={`${label} — choose from list`}
          value={normalizedValue || ''}
          onChange={onSelectPreset}
          className={`td-field__input w-full text-xs ${hideAddressField ? '' : 'sm:max-w-[200px] shrink-0'}`}
          data-testid={inputTestId ? `${inputTestId}-select` : undefined}
        >
          <option value="">{normalizedValue ? 'Clear selection…' : 'Pick from list…'}</option>
          {normalizedValue && !valueInList && selectedMeta ? (
            <option value={normalizedValue}>{optionLabel(selectedMeta)}</option>
          ) : null}
          {allPickable.map((t) => (
            <option key={t.id} value={t.id}>
              {optionLabel(t)}
            </option>
          ))}
        </select>
        {!hideAddressField ? addressInput : null}
      </div>
      {hideAddressField ? (
        <div className="mt-1.5">
          <button
            type="button"
            className="td-btn td-btn--link text-[10px] px-0"
            onClick={() => setShowPaste((v) => !v)}
            data-testid={inputTestId ? `${inputTestId}-paste-toggle` : undefined}
          >
            {showPaste ? 'Hide custom token id' : 'Paste custom token id…'}
          </button>
          {showPaste ? <div className="mt-1.5 space-y-1">{addressInput}{saveRow}</div> : addressInput}
        </div>
      ) : (
        saveRow
      )}
      {normalizedValue ? (
        <div className="mt-1.5 text-xs" style={{ color: 'var(--text-primary)' }} data-testid={inputTestId ? `${inputTestId}-label` : undefined}>
          <TokenLabel label={labelOf(normalizedValue)} showName />
        </div>
      ) : null}
      {!hideAddressField && helpHint ? (
        <p className="text-[10px] mt-1 leading-snug" style={{ color: 'var(--text-tertiary)' }}>
          New tokens appear after deploy (saved here), from recent deploys on this browser, or once they show up in the
          network token directory. Paste the AccountId if the name is missing.
        </p>
      ) : null}
      {hideAddressField && helpHint ? (
        <p className="text-[10px] mt-1 leading-snug" style={{ color: 'var(--text-tertiary)' }}>
          Don&apos;t see your token? Use Paste custom token id, then save it to my tokens.
        </p>
      ) : null}
    </div>
  );
}
