import React, { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import {
  getNativeDexIndexerStatsUrlOverride,
  setNativeDexIndexerStatsUrlOverride,
} from '../services/nativeDexIndexerClient';
import { useBoingNativeDexIntegration } from '../contexts/BoingNativeDexIntegrationContext';

/**
 * Optional HTTPS URL for native DEX stats JSON (pools, tokenDirectory). Stored in localStorage; overrides CRA env.
 */
export default function NativeDexIndexerSettingsStrip() {
  const { refresh } = useBoingNativeDexIntegration();
  const [url, setUrl] = useState(() => getNativeDexIndexerStatsUrlOverride());

  const onSave = useCallback(() => {
    setNativeDexIndexerStatsUrlOverride(url);
    toast.success('Indexer URL saved');
    void refresh();
  }, [url, refresh]);

  const onClear = useCallback(() => {
    setUrl('');
    setNativeDexIndexerStatsUrlOverride('');
    toast.success('Using default indexer (build env if set)');
    void refresh();
  }, [refresh]);

  return (
    <details
      className="mt-4 rounded-lg border text-left"
      style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
    >
      <summary
        className="cursor-pointer select-none px-3 py-2 text-xs font-medium"
        style={{ color: 'var(--text-secondary)' }}
      >
        Discovery: custom indexer URL (optional)
      </summary>
      <div className="px-3 pb-3 pt-0 space-y-2">
        <p className="text-[11px] leading-snug" style={{ color: 'var(--text-tertiary)' }}>
          Paste a <span className="font-mono">GET</span> JSON URL (same shape as{' '}
          <span className="font-mono">REACT_APP_BOING_NATIVE_DEX_INDEXER_STATS_URL</span>). Saved only in this browser.
          Leave empty to use the app build default.
        </p>
        <label htmlFor="native-dex-indexer-url" className="sr-only">
          Indexer stats JSON URL
        </label>
        <input
          id="native-dex-indexer-url"
          name="nativeDexIndexerUrl"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://…/dex-stats.json"
          className="w-full text-xs p-2 rounded border font-mono"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-color)',
            color: 'var(--text-primary)',
          }}
          autoComplete="off"
          spellCheck={false}
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onSave}
            className="text-xs px-3 py-1.5 rounded-lg font-medium text-white"
            style={{ background: 'linear-gradient(135deg, var(--finance-primary), #2563eb)' }}
          >
            Save &amp; refresh
          </button>
          <button
            type="button"
            onClick={onClear}
            className="text-xs px-3 py-1.5 rounded-lg border font-medium"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
          >
            Clear override
          </button>
        </div>
      </div>
    </details>
  );
}
