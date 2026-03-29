import React, { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import { PageHeader, PageCard } from '../../components/PageLayout';
import { useWallet } from '../../contexts/WalletContext';
import { BOING_NATIVE_L1_CHAIN_ID } from '../../config/networks';
import { normalizeBoingFaucetAccountHex } from '../../services/boingTestnetRpc';
import {
  fetchBoingNativeAccount,
  qaCheckBoingDeploy,
  simulateBoingSignedTransaction,
  submitBoingSignedTransaction
} from '../../services/boingNativeVm';
import {
  BOING_QA_EMPTY_DESCRIPTION_HASH,
  BOING_QA_PURPOSE_OPTIONS,
  isValidBoingQaPurpose
} from '../../config/boingQa';
import {
  boingExpressSignTransaction,
  boingExpressSendTransaction
} from '../../services/boingExpressNativeTx';
import { getWindowBoingProvider } from '../../utils/boingWalletDiscovery';

const RPC_SPEC = 'https://github.com/boing-network/boing.network/blob/main/docs/RPC-API-SPEC.md';

function JsonBlock({ data, empty }) {
  if (data == null) {
    return (
      <p className="text-sm py-2" style={{ color: 'var(--text-tertiary)' }}>
        {empty || 'No result yet.'}
      </p>
    );
  }
  return (
    <pre
      className="text-xs sm:text-sm p-3 rounded-lg overflow-x-auto max-h-80 overflow-y-auto"
      style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
    >
      {typeof data === 'string' ? data : JSON.stringify(data, null, 2)}
    </pre>
  );
}

export default function BoingNativeVm() {
  const { account, chainId, isConnected, walletType, getWalletProvider } = useWallet();
  const onBoing = chainId === BOING_NATIVE_L1_CHAIN_ID;
  const accountHex = useMemo(() => (account ? normalizeBoingFaucetAccountHex(account) : null), [account]);

  const pickExpressProvider = () => {
    try {
      const p = typeof getWalletProvider === 'function' ? getWalletProvider('boingExpress') : null;
      if (p && typeof p.request === 'function') return p;
    } catch {
      /* ignore */
    }
    return getWindowBoingProvider();
  };

  const [accountState, setAccountState] = useState(null);
  const [accountBusy, setAccountBusy] = useState(false);

  const [bytecode, setBytecode] = useState('');
  const [qaPurpose, setQaPurpose] = useState('dapp');
  const [qaDescHash, setQaDescHash] = useState('');
  const [qaAssetName, setQaAssetName] = useState('');
  const [qaAssetSymbol, setQaAssetSymbol] = useState('');
  const [qaResult, setQaResult] = useState(null);
  const [qaBusy, setQaBusy] = useState(false);

  const [signedTxHex, setSignedTxHex] = useState('');
  const [simResult, setSimResult] = useState(null);
  const [submitHash, setSubmitHash] = useState(null);
  const [simBusy, setSimBusy] = useState(false);
  const [submitBusy, setSubmitBusy] = useState(false);

  const canUseExpressTx = Boolean(
    isConnected && walletType === 'boingExpress' && onBoing && pickExpressProvider()
  );

  const [expressBusy, setExpressBusy] = useState(false);
  const [expressKind, setExpressKind] = useState('transfer');
  const [exTransferTo, setExTransferTo] = useState('');
  const [exTransferAmount, setExTransferAmount] = useState('');
  const [exDeployBytecode, setExDeployBytecode] = useState('');
  const [exDeployPurpose, setExDeployPurpose] = useState('dapp');
  const [exDeployDescHash, setExDeployDescHash] = useState('');
  const [exAssetName, setExAssetName] = useState('');
  const [exAssetSymbol, setExAssetSymbol] = useState('');
  const [exCallContract, setExCallContract] = useState('');
  const [exCallCalldata, setExCallCalldata] = useState('');
  const [exStakeAmount, setExStakeAmount] = useState('');

  const loadAccount = async () => {
    if (!accountHex) {
      toast.error('Connect with Boing Express so your account is a 32-byte Boing id.');
      return;
    }
    setAccountBusy(true);
    setAccountState(null);
    try {
      const st = await fetchBoingNativeAccount(account);
      setAccountState(st);
    } catch (e) {
      toast.error(e?.message || 'boing_getAccount failed');
    } finally {
      setAccountBusy(false);
    }
  };

  const runQa = async () => {
    if (!bytecode.trim()) {
      toast.error('Paste contract bytecode (hex).');
      return;
    }
    if (qaPurpose && !isValidBoingQaPurpose(qaPurpose)) {
      toast.error('Choose a valid purpose category (protocol QA list).');
      return;
    }
    if ((qaAssetName.trim() || qaAssetSymbol.trim()) && !qaPurpose) {
      toast.error('Select a purpose category when using asset name or symbol (protocol QA).');
      return;
    }
    setQaBusy(true);
    setQaResult(null);
    try {
      const r = await qaCheckBoingDeploy(bytecode.trim(), {
        purposeCategory: qaPurpose || undefined,
        descriptionHash: qaDescHash.trim() || undefined,
        assetName: qaAssetName.trim() || undefined,
        assetSymbol: qaAssetSymbol.trim() || undefined,
        emptyDescriptionHash: BOING_QA_EMPTY_DESCRIPTION_HASH
      });
      setQaResult(r);
      toast.success(`QA: ${r?.result ?? 'ok'}`);
    } catch (e) {
      const msg = e?.message || String(e);
      setQaResult({ error: msg });
      toast.error(msg);
    } finally {
      setQaBusy(false);
    }
  };

  const runSimulate = async () => {
    if (!signedTxHex.trim()) {
      toast.error('Paste hex-encoded signed transaction.');
      return;
    }
    setSimBusy(true);
    setSimResult(null);
    try {
      const r = await simulateBoingSignedTransaction(signedTxHex);
      setSimResult(r);
      if (r?.success) toast.success('Simulation succeeded');
      else toast.error(r?.error || 'Simulation reported failure');
    } catch (e) {
      toast.error(e?.message || 'boing_simulateTransaction failed');
    } finally {
      setSimBusy(false);
    }
  };

  const runSubmit = async () => {
    if (!signedTxHex.trim()) {
      toast.error('Paste hex-encoded signed transaction.');
      return;
    }
    if (!window.confirm('Submit this signed transaction to the Boing mempool?')) return;
    setSubmitBusy(true);
    setSubmitHash(null);
    try {
      const r = await submitBoingSignedTransaction(signedTxHex);
      setSubmitHash(r?.tx_hash ?? r);
      toast.success('Submitted');
    } catch (e) {
      toast.error(e?.message || 'boing_submitTransaction failed');
    } finally {
      setSubmitBusy(false);
    }
  };

  const runProtocolPreflightForDeploy = async (bytecodeHex) => {
    const purpose = exDeployPurpose.trim().toLowerCase();
    if (!isValidBoingQaPurpose(purpose)) {
      toast.error('Choose a valid purpose category (required for protocol QA).');
      return false;
    }
    try {
      const r = await qaCheckBoingDeploy(bytecodeHex, {
        purposeCategory: purpose,
        descriptionHash: exDeployDescHash.trim() || undefined,
        assetName: exAssetName.trim() || undefined,
        assetSymbol: exAssetSymbol.trim() || undefined,
        emptyDescriptionHash: BOING_QA_EMPTY_DESCRIPTION_HASH
      });
      if (r.result === 'reject') {
        toast.error(r.message || `QA rejected${r.rule_id ? ` (${r.rule_id})` : ''}`);
        return false;
      }
      if (r.result === 'unsure') {
        const ok = window.confirm(
          'Protocol QA: unsure — deployment may be routed to the community QA pool. Continue to sign?'
        );
        if (!ok) return false;
      }
      return true;
    } catch (e) {
      toast.error(e?.message || 'boing_qaCheck failed — fix bytecode or try again.');
      return false;
    }
  };

  const buildExpressTxObject = () => {
    switch (expressKind) {
      case 'transfer':
        return {
          type: 'transfer',
          to: exTransferTo.trim(),
          amount: exTransferAmount.trim()
        };
      case 'contract_deploy': {
        const bc = exDeployBytecode.trim();
        if (!bc) throw new Error('Bytecode is required');
        const purpose = exDeployPurpose.trim().toLowerCase();
        if (!isValidBoingQaPurpose(purpose)) {
          throw new Error('Invalid purpose category for protocol QA.');
        }
        const hasMeta = exAssetName.trim() !== '' || exAssetSymbol.trim() !== '';
        if (hasMeta) {
          return {
            type: 'contract_deploy_meta',
            bytecode: bc,
            purpose_category: purpose,
            ...(exDeployDescHash.trim() ? { description_hash: exDeployDescHash.trim() } : {}),
            ...(exAssetName.trim() ? { asset_name: exAssetName.trim() } : {}),
            ...(exAssetSymbol.trim() ? { asset_symbol: exAssetSymbol.trim() } : {})
          };
        }
        return {
          type: 'contract_deploy_purpose',
          bytecode: bc,
          purpose_category: purpose,
          ...(exDeployDescHash.trim() ? { description_hash: exDeployDescHash.trim() } : {})
        };
      }
      case 'contract_call':
        return {
          type: 'contract_call',
          contract: exCallContract.trim(),
          calldata: exCallCalldata.trim() || '0x'
        };
      case 'bond':
        return { type: 'bond', amount: exStakeAmount.trim() };
      case 'unbond':
        return { type: 'unbond', amount: exStakeAmount.trim() };
      default:
        throw new Error('Unknown transaction kind');
    }
  };

  const onExpressSign = async () => {
    const p = pickExpressProvider();
    if (!isConnected || walletType !== 'boingExpress' || !onBoing || !p) {
      toast.error('Connect with Boing Express on Boing testnet (chain 6913).');
      return;
    }
    setExpressBusy(true);
    try {
      if (expressKind === 'contract_deploy') {
        const bc = exDeployBytecode.trim();
        if (!bc) {
          toast.error('Bytecode is required');
          return;
        }
        const ok = await runProtocolPreflightForDeploy(bc);
        if (!ok) return;
      }
      const tx = buildExpressTxObject();
      const hex = await boingExpressSignTransaction(p, tx);
      setSignedTxHex(typeof hex === 'string' ? hex : String(hex));
      toast.success('Signed — you can simulate or submit below.');
    } catch (e) {
      toast.error(e?.message || 'boing_signTransaction failed');
    } finally {
      setExpressBusy(false);
    }
  };

  const onExpressSend = async () => {
    const p = pickExpressProvider();
    if (!isConnected || walletType !== 'boingExpress' || !onBoing || !p) {
      toast.error('Connect with Boing Express on Boing testnet (chain 6913).');
      return;
    }
    if (!window.confirm('Sign and submit this transaction via Boing Express?')) return;
    setExpressBusy(true);
    setSubmitHash(null);
    try {
      if (expressKind === 'contract_deploy') {
        const bc = exDeployBytecode.trim();
        if (!bc) {
          toast.error('Bytecode is required');
          return;
        }
        const ok = await runProtocolPreflightForDeploy(bc);
        if (!ok) return;
      }
      const tx = buildExpressTxObject();
      const hash = await boingExpressSendTransaction(p, tx);
      setSubmitHash(hash);
      toast.success('Transaction submitted');
    } catch (e) {
      toast.error(e?.message || 'boing_sendTransaction failed');
    } finally {
      setExpressBusy(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Boing Native VM &amp; RPC | boing.finance</title>
        <meta
          name="description"
          content="Developer tools for Boing L1 JSON-RPC: account state, bytecode QA, simulate and submit signed native transactions."
        />
      </Helmet>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <PageHeader
          title="Boing Native VM & RPC"
          subtitle="Call the public Boing JSON-RPC through this site (same-origin proxy). Boing is not EVM: contracts use the native VM; txs are bincode + Ed25519, not MetaMask EIP-155."
        />

        <PageCard className="mb-6">
          <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
            RPC methods match{' '}
            <a href={RPC_SPEC} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">
              RPC-API-SPEC.md
            </a>
            . With{' '}
            <strong className="text-[var(--text-primary)]">Boing Express</strong>, this site can call{' '}
            <code className="text-xs">boing_signTransaction</code> and{' '}
            <code className="text-xs">boing_sendTransaction</code> (approval popup in the extension). Amounts are whole
            BOING / native units (u128 strings), not 10⁻¹⁸. The Boing VM is not EVM or Solana: full “DeFi parity”
            (tokens, AMMs, program standards) is a multi-milestone roadmap on top of this RPC + execution model.
          </p>
          <ul className="text-xs space-y-1 list-disc pl-5" style={{ color: 'var(--text-tertiary)' }}>
            <li>Use chain {BOING_NATIVE_L1_CHAIN_ID} (0x1b01) for native balance and mempool behavior.</li>
            <li>
              Contract deployments are checked by <strong className="text-[var(--text-primary)]">protocol QA</strong> in
              the mempool; this UI runs the same <code className="text-[10px]">boing_qaCheck</code> before Express
              signing so you fail fast.
            </li>
            <li>Paste a signed tx hex from the CLI here, or build and sign with Express using the section below.</li>
          </ul>
        </PageCard>

        <PageCard className="mb-6">
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            Boing Express — sign &amp; submit
          </h3>
          <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
            {canUseExpressTx
              ? 'Choose a transaction type, approve in the extension, then sign only or sign and submit. Contract deploy always uses a QA-approved purpose category; sign/submit is preceded by boing_qaCheck here, then the node runs mempool QA again.'
              : 'Connect with Boing Express and switch to Boing testnet to enable in-browser signing.'}
          </p>
          <div className="mb-3">
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>
              Transaction type
            </label>
            <select
              value={expressKind}
              onChange={(e) => setExpressKind(e.target.value)}
              className="w-full sm:w-auto text-sm p-2 rounded-lg border"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="transfer">transfer</option>
              <option value="contract_deploy">contract deploy</option>
              <option value="contract_call">contract call</option>
              <option value="bond">bond (stake)</option>
              <option value="unbond">unbond</option>
            </select>
          </div>

          {expressKind === 'transfer' && (
            <div className="grid gap-3 sm:grid-cols-2 mb-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>
                  To (0x + 64 hex)
                </label>
                <input
                  type="text"
                  value={exTransferTo}
                  onChange={(e) => setExTransferTo(e.target.value)}
                  className="w-full text-sm font-mono p-2 rounded-lg border"
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)'
                  }}
                  placeholder="0x…"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>
                  Amount (u128 decimal)
                </label>
                <input
                  type="text"
                  value={exTransferAmount}
                  onChange={(e) => setExTransferAmount(e.target.value)}
                  className="w-full text-sm p-2 rounded-lg border"
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)'
                  }}
                  placeholder="e.g. 1000"
                />
              </div>
            </div>
          )}

          {expressKind === 'contract_deploy' && (
            <div className="space-y-3 mb-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>
                  Bytecode (hex)
                </label>
                <textarea
                  value={exDeployBytecode}
                  onChange={(e) => setExDeployBytecode(e.target.value)}
                  rows={3}
                  className="w-full text-sm font-mono p-2 rounded-lg border"
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)'
                  }}
                  placeholder="0x…"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>
                    Purpose category (protocol QA)
                  </label>
                  <select
                    value={exDeployPurpose}
                    onChange={(e) => setExDeployPurpose(e.target.value)}
                    className="w-full text-sm p-2 rounded-lg border"
                    style={{
                      backgroundColor: 'var(--bg-tertiary)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-primary)'
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
                    Description hash (optional, 32-byte hex)
                  </label>
                  <input
                    type="text"
                    value={exDeployDescHash}
                    onChange={(e) => setExDeployDescHash(e.target.value)}
                    className="w-full text-sm font-mono text-xs p-2 rounded-lg border"
                    style={{
                      backgroundColor: 'var(--bg-tertiary)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-primary)'
                    }}
                    placeholder="0x…"
                  />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>
                    Asset name (optional — content policy; uses contract_deploy_meta)
                  </label>
                  <input
                    type="text"
                    value={exAssetName}
                    onChange={(e) => setExAssetName(e.target.value)}
                    className="w-full text-sm p-2 rounded-lg border"
                    style={{
                      backgroundColor: 'var(--bg-tertiary)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-primary)'
                    }}
                    placeholder="e.g. My Token"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>
                    Asset symbol (optional)
                  </label>
                  <input
                    type="text"
                    value={exAssetSymbol}
                    onChange={(e) => setExAssetSymbol(e.target.value)}
                    className="w-full text-sm p-2 rounded-lg border"
                    style={{
                      backgroundColor: 'var(--bg-tertiary)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-primary)'
                    }}
                    placeholder="e.g. MTK"
                  />
                </div>
              </div>
            </div>
          )}

          {expressKind === 'contract_call' && (
            <div className="grid gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>
                  Contract (0x + 64 hex)
                </label>
                <input
                  type="text"
                  value={exCallContract}
                  onChange={(e) => setExCallContract(e.target.value)}
                  className="w-full text-sm font-mono p-2 rounded-lg border"
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)'
                  }}
                  placeholder="0x…"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>
                  Calldata (hex)
                </label>
                <input
                  type="text"
                  value={exCallCalldata}
                  onChange={(e) => setExCallCalldata(e.target.value)}
                  className="w-full text-sm font-mono p-2 rounded-lg border"
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)'
                  }}
                  placeholder="0x…"
                />
              </div>
            </div>
          )}

          {(expressKind === 'bond' || expressKind === 'unbond') && (
            <div className="mb-3">
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>
                Amount (u128 decimal)
              </label>
              <input
                type="text"
                value={exStakeAmount}
                onChange={(e) => setExStakeAmount(e.target.value)}
                className="w-full text-sm p-2 rounded-lg border max-w-xs"
                style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)'
                }}
                placeholder="e.g. 1"
              />
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={expressBusy || !canUseExpressTx}
              onClick={onExpressSign}
              className="text-sm font-semibold px-4 py-2 rounded-lg border disabled:opacity-40"
              style={{ borderColor: 'var(--border-hover)', color: 'var(--text-primary)' }}
            >
              {expressBusy ? 'Working…' : 'Sign only'}
            </button>
            <button
              type="button"
              disabled={expressBusy || !canUseExpressTx}
              onClick={onExpressSend}
              className="text-sm font-semibold px-4 py-2 rounded-lg border disabled:opacity-40"
              style={{
                borderColor: 'var(--accent-teal)',
                color: 'var(--boing-black, var(--text-primary))',
                background:
                  'linear-gradient(135deg, color-mix(in srgb, var(--accent-teal) 45%, var(--bg-primary)), color-mix(in srgb, var(--accent-cyan) 40%, var(--bg-primary)))'
              }}
            >
              {expressBusy ? 'Working…' : 'Sign & submit'}
            </button>
          </div>
        </PageCard>

        <PageCard className="mb-6">
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            Account (boing_getAccount)
          </h3>
          <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
            {!isConnected
              ? 'Connect a wallet.'
              : !accountHex
                ? 'Your connected account is not a 32-byte Boing id (use Boing Express on testnet).'
                : onBoing
                  ? `Loaded id: ${accountHex.slice(0, 10)}…${accountHex.slice(-8)}`
                  : `Switch to Boing testnet (${BOING_NATIVE_L1_CHAIN_ID}) to align with this RPC.`}
            {walletType === 'boingExpress' && (
              <span className="block mt-1 text-cyan-400/90">Boing Express connected</span>
            )}
          </p>
          <button
            type="button"
            disabled={accountBusy || !accountHex}
            onClick={loadAccount}
            className="text-sm font-semibold px-4 py-2 rounded-lg border disabled:opacity-40"
            style={{ borderColor: 'var(--accent-teal)', color: 'var(--accent-teal)' }}
          >
            {accountBusy ? 'Loading…' : 'Fetch account'}
          </button>
          <div className="mt-3">
            <JsonBlock data={accountState} empty="Click Fetch account after connecting with a valid Boing id." />
          </div>
        </PageCard>

        <PageCard className="mb-6">
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            Bytecode QA (boing_qaCheck)
          </h3>
          <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
            Same checks the node uses in the mempool for deployments (plus optional purpose / asset metadata). Use this
            before signing; unsure means the deployment may be referred to the community QA pool.
          </p>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>
            Bytecode (hex)
          </label>
          <textarea
            value={bytecode}
            onChange={(e) => setBytecode(e.target.value)}
            rows={4}
            className="w-full text-sm font-mono p-2 rounded-lg border mb-3"
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)'
            }}
            placeholder="0x…"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>
                Purpose category (optional)
              </label>
              <select
                value={qaPurpose}
                onChange={(e) => setQaPurpose(e.target.value)}
                className="w-full text-sm p-2 rounded-lg border"
                style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)'
                }}
              >
                <option value="">— bytecode only —</option>
                {BOING_QA_PURPOSE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>
                Description hash (optional hex)
              </label>
              <input
                type="text"
                value={qaDescHash}
                onChange={(e) => setQaDescHash(e.target.value)}
                className="w-full text-sm p-2 rounded-lg border font-mono text-xs"
                style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)'
                }}
                placeholder="0x…"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>
                Asset name (optional)
              </label>
              <input
                type="text"
                value={qaAssetName}
                onChange={(e) => setQaAssetName(e.target.value)}
                className="w-full text-sm p-2 rounded-lg border"
                style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>
                Asset symbol (optional)
              </label>
              <input
                type="text"
                value={qaAssetSymbol}
                onChange={(e) => setQaAssetSymbol(e.target.value)}
                className="w-full text-sm p-2 rounded-lg border"
                style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
          </div>
          <button
            type="button"
            disabled={qaBusy}
            onClick={runQa}
            className="text-sm font-semibold px-4 py-2 rounded-lg border"
            style={{ borderColor: 'var(--accent-teal)', color: 'var(--accent-teal)' }}
          >
            {qaBusy ? 'Checking…' : 'Run QA check'}
          </button>
          <div className="mt-3">
            <JsonBlock data={qaResult} />
          </div>
        </PageCard>

        <PageCard className="mb-6">
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            Signed transaction (simulate / submit)
          </h3>
          <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
            Hex-encoded signed Boing transaction for <code className="text-xs">boing_simulateTransaction</code> and{' '}
            <code className="text-xs">boing_submitTransaction</code>.
          </p>
          <textarea
            value={signedTxHex}
            onChange={(e) => setSignedTxHex(e.target.value)}
            rows={5}
            className="w-full text-sm font-mono p-2 rounded-lg border mb-3"
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)'
            }}
            placeholder="0x…"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={simBusy}
              onClick={runSimulate}
              className="text-sm font-semibold px-4 py-2 rounded-lg border"
              style={{ borderColor: 'var(--border-hover)', color: 'var(--text-primary)' }}
            >
              {simBusy ? 'Simulating…' : 'Simulate'}
            </button>
            <button
              type="button"
              disabled={submitBusy}
              onClick={runSubmit}
              className="text-sm font-semibold px-4 py-2 rounded-lg border"
              style={{
                borderColor: 'var(--accent-teal)',
                color: 'var(--boing-black, var(--text-primary))',
                background:
                  'linear-gradient(135deg, color-mix(in srgb, var(--accent-teal) 45%, var(--bg-primary)), color-mix(in srgb, var(--accent-cyan) 40%, var(--bg-primary)))'
              }}
            >
              {submitBusy ? 'Submitting…' : 'Submit to mempool'}
            </button>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div>
              <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>
                Simulation
              </p>
              <JsonBlock data={simResult} />
            </div>
            <div>
              <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>
                Last submit tx_hash
              </p>
              <JsonBlock data={submitHash} empty="None" />
            </div>
          </div>
        </PageCard>
      </div>
    </>
  );
}
