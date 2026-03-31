import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useWallet } from '../contexts/WalletContext';
import { BOING_NATIVE_L1_CHAIN_ID } from '../config/networks';
import { qaCheckBoingDeploy } from '../services/boingNativeVm';
import { boingExpressSendTransaction } from '../services/boingExpressNativeTx';
import {
  BOING_QA_EMPTY_DESCRIPTION_HASH,
  BOING_QA_PURPOSE_OPTIONS,
  isValidBoingQaPurpose,
} from '../config/boingQa';
import { getWindowBoingProvider } from '../utils/boingWalletDiscovery';

function pickExpressProvider(getWalletProvider) {
  try {
    const p = typeof getWalletProvider === 'function' ? getWalletProvider('boingExpress') : null;
    if (p && typeof p.request === 'function') return p;
  } catch {
    /* ignore */
  }
  return getWindowBoingProvider();
}

function formatExpressError(e) {
  if (e && typeof e === 'object' && 'message' in e) {
    const err = e;
    const rpcData = err.data?.rpc?.data ?? err.data;
    if (rpcData && typeof rpcData === 'object') {
      const bits = [];
      if (rpcData.rule_id) bits.push(`rule_id: ${rpcData.rule_id}`);
      if (rpcData.doc_url) bits.push(String(rpcData.doc_url));
      if (bits.length) return `${err.message} — ${bits.join(' | ')}`;
    }
    if (typeof err.code === 'number') return `${err.message} (code ${err.code})`;
  }
  return e?.message || String(e);
}

/**
 * End-to-end native Boing token deploy on Deploy Token page (Boing VM bytecode + QA + Express).
 */
export default function NativeBoingTokenDeploySection({ tokenName, tokenSymbol }) {
  const { chainId, walletType, isConnected, getWalletProvider } = useWallet();
  const [bytecode, setBytecode] = useState('');
  const [purpose, setPurpose] = useState('token');
  const [descriptionHash, setDescriptionHash] = useState('');
  const [qaBusy, setQaBusy] = useState(false);
  const [deployBusy, setDeployBusy] = useState(false);
  const [qaResult, setQaResult] = useState(null);
  const [lastTx, setLastTx] = useState(null);

  if (chainId !== BOING_NATIVE_L1_CHAIN_ID || walletType !== 'boingExpress' || !isConnected) {
    return null;
  }

  const runQa = async () => {
    const bc = bytecode.trim();
    if (!bc) {
      toast.error('Paste Boing VM bytecode (hex).');
      return;
    }
    if (!isValidBoingQaPurpose(purpose)) {
      toast.error('Choose a valid QA purpose category.');
      return;
    }
    setQaBusy(true);
    setQaResult(null);
    try {
      const name = tokenName?.trim() || '';
      const sym = tokenSymbol?.trim() || '';
      const r = await qaCheckBoingDeploy(bc, {
        purposeCategory: purpose,
        descriptionHash: descriptionHash.trim() || undefined,
        assetName: name || undefined,
        assetSymbol: sym || undefined,
        emptyDescriptionHash: BOING_QA_EMPTY_DESCRIPTION_HASH,
      });
      setQaResult(r);
      if (r.result === 'allow') toast.success('QA: allow');
      else if (r.result === 'reject') toast.error(r.message || 'QA: reject');
      else toast('QA: unsure — may go to community pool', { icon: '⚠️' });
    } catch (e) {
      toast.error(e?.message || 'boing_qaCheck failed');
    } finally {
      setQaBusy(false);
    }
  };

  const deploy = async () => {
    const bc = bytecode.trim();
    if (!bc) {
      toast.error('Bytecode required.');
      return;
    }
    if (!isValidBoingQaPurpose(purpose)) {
      toast.error('Invalid purpose category.');
      return;
    }
    const p = pickExpressProvider(getWalletProvider);
    if (!p) {
      toast.error('Boing Express provider not found.');
      return;
    }

    const name = tokenName?.trim() || '';
    const sym = tokenSymbol?.trim().toUpperCase() || '';
    if (!name || !sym) {
      toast.error('Set token name and symbol above (used for contract_deploy_meta).');
      return;
    }

    setDeployBusy(true);
    setLastTx(null);
    try {
      const pre = await qaCheckBoingDeploy(bc, {
        purposeCategory: purpose,
        descriptionHash: descriptionHash.trim() || undefined,
        assetName: name,
        assetSymbol: sym,
        emptyDescriptionHash: BOING_QA_EMPTY_DESCRIPTION_HASH,
      });
      if (pre.result === 'reject') {
        toast.error(pre.message || 'QA rejected — fix bytecode or metadata.');
        setQaResult(pre);
        return;
      }
      if (pre.result === 'unsure') {
        const ok = window.confirm(
          'Protocol QA: unsure — deploy may be routed to the community pool. Sign and submit anyway?'
        );
        if (!ok) return;
      }

      const desc = descriptionHash.trim();
      const bytecodeNorm = bc.startsWith('0x') || bc.startsWith('0X') ? bc : `0x${bc}`;
      const tx = {
        type: 'contract_deploy_meta',
        bytecode: bytecodeNorm,
        purpose_category: purpose,
        asset_name: name,
        asset_symbol: sym,
        ...(desc ? { description_hash: desc } : {}),
      };

      if (!window.confirm('Sign and submit this deploy via Boing Express?')) return;

      const hash = await boingExpressSendTransaction(p, tx);
      const out = typeof hash === 'string' ? hash : JSON.stringify(hash);
      setLastTx(out);
      toast.success('Submitted — check explorer or Native VM page for receipt.');
    } catch (e) {
      toast.error(formatExpressError(e));
    } finally {
      setDeployBusy(false);
    }
  };

  return (
    <section
      className="mb-6 rounded-xl border p-5 text-left"
      style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: 'rgba(34, 197, 94, 0.4)',
      }}
    >
      <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
        Deploy on Boing L1 (native VM)
      </h2>
      <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
        You are on <strong>Boing testnet</strong> with <strong>Boing Express</strong>. This section submits a{' '}
        <code className="text-xs">contract_deploy_meta</code> tx (not ERC-20). Name/symbol come from the form above.{' '}
        <Link to="/boing/native-vm" className="text-green-400 underline text-sm">
          Advanced tools
        </Link>
      </p>

      <div className="grid gap-3 sm:grid-cols-2 mb-3">
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>
            Boing VM bytecode (hex)
          </label>
          <textarea
            value={bytecode}
            onChange={(e) => setBytecode(e.target.value)}
            rows={4}
            placeholder="0x…"
            className="w-full text-sm p-2 rounded-lg border font-mono"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>
            purpose_category
          </label>
          <select
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            className="w-full text-sm p-2 rounded-lg border"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
          >
            {BOING_QA_PURPOSE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>
            description_hash (optional, 32-byte hex)
          </label>
          <input
            type="text"
            value={descriptionHash}
            onChange={(e) => setDescriptionHash(e.target.value)}
            placeholder="0x… or leave empty with metadata"
            className="w-full text-sm p-2 rounded-lg border font-mono"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <button
          type="button"
          onClick={runQa}
          disabled={qaBusy}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
          style={{ backgroundColor: '#2563eb' }}
        >
          {qaBusy ? 'Running QA…' : 'Run boing_qaCheck'}
        </button>
        <button
          type="button"
          onClick={deploy}
          disabled={deployBusy}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
          style={{ backgroundColor: '#059669' }}
        >
          {deployBusy ? 'Signing…' : 'Deploy via Express'}
        </button>
      </div>

      {qaResult && (
        <pre
          className="text-xs p-2 rounded-lg mb-2 overflow-x-auto"
          style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
        >
          {JSON.stringify(qaResult, null, 2)}
        </pre>
      )}
      {lastTx && (
        <p className="text-xs font-mono break-all" style={{ color: 'var(--text-secondary)' }}>
          Result: {lastTx}
        </p>
      )}
    </section>
  );
}
