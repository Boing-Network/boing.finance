import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useWallet } from '../contexts/WalletContext';
import { BOING_NATIVE_L1_CHAIN_ID } from '../config/networks';
import { qaCheckBoingDeploy } from '../services/boingNativeVm';
import { boingExpressSendTransaction } from '../services/boingExpressNativeTx';
import { BOING_QA_EMPTY_DESCRIPTION_HASH, BOING_QA_PURPOSE_TOKEN, isValidBoingQaPurpose } from '../config/boingQa';
import { getWindowBoingProvider } from '../utils/boingWalletDiscovery';
import { formatBoingExpressRpcError } from '../utils/boingExpressRpcError';

function pickExpressProvider(getWalletProvider) {
  try {
    const p = typeof getWalletProvider === 'function' ? getWalletProvider('boingExpress') : null;
    if (p && typeof p.request === 'function') return p;
  } catch {
    /* ignore */
  }
  return getWindowBoingProvider();
}

/**
 * End-to-end native Boing token deploy on Deploy Token page (Boing VM bytecode + QA + Express).
 */
export default function NativeBoingTokenDeploySection({ tokenName, tokenSymbol }) {
  const { chainId, walletType, isConnected, getWalletProvider } = useWallet();
  const [bytecode, setBytecode] = useState('');
  const purpose = BOING_QA_PURPOSE_TOKEN;
  const [descriptionHash, setDescriptionHash] = useState('');
  const [qaBusy, setQaBusy] = useState(false);
  const [deployBusy, setDeployBusy] = useState(false);
  const [qaResult, setQaResult] = useState(null);
  const [lastTx, setLastTx] = useState(null);
  /** Required when QA returns `unsure` (community pool) before submit */
  const [qaPoolAcknowledged, setQaPoolAcknowledged] = useState(false);

  useEffect(() => {
    setQaPoolAcknowledged(false);
  }, [bytecode, descriptionHash]);

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
    setQaPoolAcknowledged(false);
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
      if (pre.result === 'unsure' && !qaPoolAcknowledged) {
        toast.error('QA returned “unsure” — check the box below if you accept community QA pool routing, then deploy again.');
        setQaResult(pre);
        return;
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

      const hash = await boingExpressSendTransaction(p, tx);
      const out = typeof hash === 'string' ? hash : JSON.stringify(hash);
      setLastTx(out);
      toast.success('Submitted — check explorer or Native VM page for receipt.');
    } catch (e) {
      toast.error(formatBoingExpressRpcError(e));
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
        <div className="sm:col-span-2">
          <p className="text-xs rounded-lg px-2 py-2 border" style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
            <strong style={{ color: 'var(--text-primary)' }}>QA purpose:</strong>{' '}
            <code className="text-[11px]">{purpose}</code> — fixed for token deployment. For other categories, use{' '}
            <Link to="/boing/native-vm" className="text-green-400 underline">
              Native VM tools
            </Link>
            .
          </p>
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

      {qaResult?.result === 'unsure' && (
        <label
          className="flex items-start gap-2 text-xs mb-3 cursor-pointer rounded-lg border px-3 py-2"
          style={{ borderColor: 'rgba(251, 191, 36, 0.5)', color: 'var(--text-secondary)' }}
        >
          <input
            type="checkbox"
            className="mt-0.5 shrink-0"
            checked={qaPoolAcknowledged}
            onChange={(e) => setQaPoolAcknowledged(e.target.checked)}
          />
          <span>
            I understand this deploy may be <strong style={{ color: 'var(--text-primary)' }}>queued for the community QA pool</strong>{' '}
            (governance vote may be required before it lands on-chain).
          </span>
        </label>
      )}

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
          disabled={
            deployBusy ||
            (qaResult?.result === 'unsure' && !qaPoolAcknowledged)
          }
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
