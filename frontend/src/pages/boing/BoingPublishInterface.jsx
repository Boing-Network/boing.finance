import React, { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useSearchParams } from 'react-router-dom';
import { PageHeader, PageCard } from '../../components/PageLayout';
import { useWallet } from '../../contexts/WalletContext';
import { BOING_OBSERVER_BASE_URL } from '../../config/boingExplorerUrls';
import { formatBoingExpressRpcError } from '../../utils/boingExpressRpcError';
import {
  INTERFACE_REGISTRY_ID,
  canonicalInterfaceText,
  checkUri,
  draftFromObserver,
  hex0x,
  interfaceHashOfText,
  isAccountHex,
  observerContractUrl,
  planPublish,
  validateInterfaceDoc,
} from '../../utils/publishInterface';
import {
  fetchHostedText,
  fetchObserverInterface,
  inspectContractForWallet,
  submitPublishPlan,
  waitForRecord,
} from '../../services/interfaceRegistryPublish';

const short = (h) => {
  const s = hex0x(h);
  return `${s.slice(0, 10)}…${s.slice(-6)}`;
};
const inputCls =
  'w-full rounded-lg border px-3 py-2 font-mono text-sm bg-transparent';
const btnCls =
  'rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50';
const btnStyle = { background: 'var(--finance-primary)', color: 'var(--finance-on-primary, #fff)' };
const ghostStyle = { border: '1px solid var(--border-color, rgba(255,255,255,0.2))' };

function StepTitle({ n, children }) {
  return (
    <h2 className="mb-3 text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
      <span className="mr-2 opacity-60">{n}.</span>
      {children}
    </h2>
  );
}

export default function BoingPublishInterface() {
  const { account, getWalletProvider, walletType, isConnected } = useWallet();
  const [params] = useSearchParams();
  const wallet = isConnected && walletType === 'boingExpress' && isAccountHex(account) ? hex0x(account) : null;

  const [contract, setContract] = useState(params.get('contract') || '');
  const [inspect, setInspect] = useState(null);
  const [inspecting, setInspecting] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [draftNote, setDraftNote] = useState('');
  const [uri, setUri] = useState('');
  const [hostCheck, setHostCheck] = useState(null);
  const [reviewing, setReviewing] = useState(false);
  const [busy, setBusy] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const validation = useMemo(() => (jsonText.trim() ? validateInterfaceDoc(jsonText) : null), [jsonText]);
  const canonical = validation?.ok ? canonicalInterfaceText(validation.doc) : null;
  const interfaceHash = canonical ? interfaceHashOfText(canonical) : null;
  const uriCheck = checkUri(uri);
  const plan = useMemo(() => {
    if (!wallet || !inspect?.ok || !interfaceHash || !uriCheck.ok) return null;
    return planPublish({
      wallet,
      contract,
      interfaceHash,
      uri: uriCheck.uri,
      claimer: inspect.claimer,
      deployerOk: inspect.deployer?.ok,
    });
  }, [wallet, inspect, interfaceHash, uriCheck.ok, uriCheck.uri, contract]);

  const runInspect = async () => {
    setError('');
    setResult(null);
    setInspect(null);
    setReviewing(false);
    setInspecting(true);
    try {
      setInspect(await inspectContractForWallet(wallet, contract));
    } catch (e) {
      setError(e?.message || String(e));
    } finally {
      setInspecting(false);
    }
  };

  const autofill = async () => {
    setError('');
    setDraftNote('Reading the observer analysis…');
    try {
      const obs = await fetchObserverInterface(contract);
      setJsonText(canonicalInterfaceText(draftFromObserver(contract, obs)));
      const placeholders = (obs?.decodedSelectors ?? []).filter((s) => !(obs?.functions ?? []).some((f) => f.selector === s)).length;
      setDraftNote(
        `Draft from ${obs?.source === 'published' ? 'the current published interface' : obs?.source && obs.source !== 'none' ? `the observer (${obs.source} match)` : 'decoded selectors'}: ${obs?.functions?.length ?? 0} named function(s)${placeholders ? `, ${placeholders} placeholder(s) to name` : ''}. Edit before publishing.`
      );
    } catch (e) {
      setDraftNote('');
      setError(e?.message || String(e));
    }
  };

  const onUpload = async (file) => {
    if (!file) return;
    setJsonText(await file.text());
    setDraftNote(`Loaded ${file.name}.`);
  };

  const download = () => {
    const blob = new Blob([canonical], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${hex0x(contract)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const checkHosted = async () => {
    setHostCheck({ state: 'checking' });
    try {
      const bytes = await fetchHostedText(uriCheck.uri);
      const got = interfaceHashOfText(new TextDecoder().decode(bytes));
      setHostCheck(got === interfaceHash ? { state: 'match' } : { state: 'mismatch', got });
    } catch (e) {
      setHostCheck({ state: 'unreachable', message: e?.message || String(e) });
    }
  };

  const publish = async () => {
    if (!plan?.ok) return;
    setError('');
    setBusy('Waiting for your signature…');
    try {
      const provider = getWalletProvider?.();
      if (!provider?.request) throw new Error('Connect Boing Express.');
      const sent = await submitPublishPlan(provider, wallet, plan.txs, {
        onStep: (s) => setBusy(s === 'batch' ? 'Signing one batch (claim + publish)…' : `Signing step ${s + 1} of ${plan.txs.length}…`),
      });
      setBusy('Waiting for the registry to show the record…');
      const record = await waitForRecord(contract, { interfaceHash, uri: uriCheck.uri, wallet });
      setResult({ ...sent, record });
      setReviewing(false);
    } catch (e) {
      setError(formatBoingExpressRpcError ? formatBoingExpressRpcError(e) : e?.message || String(e));
    } finally {
      setBusy('');
    }
  };

  const observerUrl = observerContractUrl(BOING_OBSERVER_BASE_URL, contract || '0'.repeat(64));
  const errorText = typeof error === 'string' ? error : error?.message || String(error);

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8" data-testid="publish-interface-page">
      <Helmet>
        <title>Publish contract interface | boing.finance</title>
      </Helmet>
      <PageHeader
        title="Publish contract interface"
        subtitle="Record your contract's function names on-chain so explorers show them with a “Published by deployer” badge."
      />

      <PageCard>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          The interface registry (<span className="font-mono">{short(INTERFACE_REGISTRY_ID)}</span>, Boing testnet) stores the BLAKE3
          hash and URL of an interface JSON. boing.observer shows it only when the claimer is the contract&apos;s deployer and the
          file at the URL matches the hash. {!wallet ? <strong> Connect Boing Express to publish.</strong> : null}
        </p>
        {wallet ? (
          <p className="mt-2 text-xs opacity-70" data-testid="publish-wallet">Connected: <span className="font-mono">{short(wallet)}</span></p>
        ) : null}
      </PageCard>

      <PageCard>
        <StepTitle n={1}>Contract</StepTitle>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            className={inputCls}
            style={ghostStyle}
            placeholder="0x… contract id (64 hex)"
            value={contract}
            onChange={(e) => setContract(e.target.value.trim())}
            data-testid="publish-contract-input"
          />
          <button type="button" className={btnCls} style={btnStyle} disabled={!isAccountHex(contract) || inspecting} onClick={runInspect} data-testid="publish-check">
            {inspecting ? 'Checking…' : 'Check'}
          </button>
        </div>
        {inspect && !inspect.ok ? <p className="mt-3 text-sm text-amber-400" data-testid="publish-inspect-error">{inspect.message}</p> : null}
        {inspect?.ok ? (
          <ul className="mt-3 space-y-1 text-sm" data-testid="publish-inspect">
            <li>Code: {inspect.code.size.toLocaleString()} bytes · hash <span className="font-mono">{short(inspect.code.codeHash)}</span></li>
            <li data-testid="publish-deployer-status" className={inspect.deployer.ok ? 'text-emerald-400' : 'text-amber-400'}>
              {inspect.deployer.ok
                ? `✓ Your wallet deployed this contract (${inspect.deployer.method === 'nonce' ? `nonce ${inspect.deployer.nonce}` : `CREATE2, block ${inspect.deployer.height}`}).`
                : `✗ ${inspect.deployer.reason}`}
            </li>
            <li data-testid="publish-registry-status">
              Registry:{' '}
              {inspect.record
                ? <>published by <span className="font-mono">{short(inspect.record.publisher)}</span> · hash <span className="font-mono">{short(inspect.record.interfaceHash)}</span> · <a className="underline" href={inspect.record.uri} target="_blank" rel="noopener noreferrer">{inspect.record.uri}</a></>
                : inspect.claimer
                  ? <>claimed by <span className="font-mono">{short(inspect.claimer)}</span>, no interface yet</>
                  : 'not claimed, no interface yet'}
              {inspect.claimedByOther ? <span className="text-amber-400"> (claimed by another account: you cannot publish)</span> : null}
            </li>
          </ul>
        ) : null}
      </PageCard>

      <PageCard>
        <StepTitle n={2}>Interface JSON</StepTitle>
        <div className="mb-2 flex flex-wrap gap-2">
          <button type="button" className={btnCls} style={ghostStyle} disabled={!isAccountHex(contract)} onClick={autofill} data-testid="publish-autofill">
            Auto-fill from bytecode
          </button>
          <label className={`${btnCls} cursor-pointer`} style={ghostStyle}>
            Upload JSON
            <input type="file" accept="application/json,.json" className="hidden" onChange={(e) => onUpload(e.target.files?.[0])} data-testid="publish-upload" />
          </label>
        </div>
        {draftNote ? <p className="mb-2 text-xs opacity-80" data-testid="publish-draft-note">{draftNote}</p> : null}
        <textarea
          className={`${inputCls} h-72`}
          style={ghostStyle}
          spellCheck={false}
          placeholder='{"schema":"boing-interface/v1","functions":[{"selector":1,"name":"transfer","params":[{"name":"to","type":"account"}],"kind":"write"}]}'
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          data-testid="publish-json"
        />
        {validation && !validation.ok ? (
          <ul className="mt-2 list-disc pl-5 text-sm text-amber-400" data-testid="publish-json-errors">
            {validation.errors.map((e) => <li key={e}>{e}</li>)}
          </ul>
        ) : null}
        {validation?.ok ? (
          <div className="mt-2 space-y-1 text-sm" data-testid="publish-json-ok">
            <p className="text-emerald-400">✓ Valid: {validation.doc.functions.length} function(s). Params use {`account | u128 | u64 | bytes32 | bool | u8`}.</p>
            {validation.warnings.map((w) => <p key={w} className="text-amber-400">{w}</p>)}
            <p>BLAKE3 of the file: <span className="font-mono" data-testid="publish-hash">{hex0x(interfaceHash)}</span></p>
            <button type="button" className={btnCls} style={ghostStyle} onClick={download} data-testid="publish-download">
              Download {short(contract || '0'.repeat(64))}.json
            </button>
          </div>
        ) : null}
      </PageCard>

      <PageCard>
        <StepTitle n={3}>Host the file</StepTitle>
        <p className="mb-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
          Upload the downloaded file unchanged to any https location you control: your project site, a GitHub repo
          (<span className="font-mono">raw.githubusercontent.com/…</span>), or a pinned IPFS file through an https gateway. Any change to
          the bytes (even whitespace) breaks the hash. Max {192} bytes for the URL.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input className={inputCls} style={ghostStyle} placeholder="https://…/interface.json" value={uri} onChange={(e) => { setUri(e.target.value); setHostCheck(null); }} data-testid="publish-uri" />
          <button type="button" className={btnCls} style={ghostStyle} disabled={!uriCheck.ok || !interfaceHash} onClick={checkHosted} data-testid="publish-check-hosted">
            Check hosted file
          </button>
        </div>
        {uri && !uriCheck.ok ? <p className="mt-2 text-sm text-amber-400">{uriCheck.message}</p> : null}
        {hostCheck ? (
          <p className="mt-2 text-sm" data-testid="publish-host-status">
            {hostCheck.state === 'checking' && 'Fetching…'}
            {hostCheck.state === 'match' && <span className="text-emerald-400">✓ The hosted file matches the hash.</span>}
            {hostCheck.state === 'mismatch' && <span className="text-amber-400">✗ The hosted file differs (BLAKE3 {short(hostCheck.got)}). Upload the downloaded file unchanged.</span>}
            {hostCheck.state === 'unreachable' && <span className="text-amber-400">Could not read it from the browser ({hostCheck.message}); CORS may block this. You can still publish: the observer fetches it server-side.</span>}
          </p>
        ) : null}
      </PageCard>

      <PageCard>
        <StepTitle n={4}>Review and publish</StepTitle>
        {!wallet ? <p className="text-sm">Connect Boing Express first.</p> : null}
        {wallet && !plan ? <p className="text-sm opacity-80">Complete steps 1–3.</p> : null}
        {plan && !plan.ok ? <p className="text-sm text-amber-400" data-testid="publish-plan-error">{plan.message}</p> : null}
        {plan?.ok && !reviewing && !result ? (
          <button type="button" className={btnCls} style={btnStyle} onClick={() => setReviewing(true)} data-testid="publish-review">
            Review
          </button>
        ) : null}
        {plan?.ok && reviewing ? (
          <div className="space-y-2 text-sm" data-testid="publish-review-panel">
            <ol className="list-decimal pl-5">
              {plan.steps.map((s) => <li key={s}>{s}</li>)}
            </ol>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
              <dt className="opacity-70">Contract</dt><dd className="font-mono break-all">{hex0x(contract)}</dd>
              <dt className="opacity-70">Hash</dt><dd className="font-mono break-all">{hex0x(interfaceHash)}</dd>
              <dt className="opacity-70">URI</dt><dd className="break-all">{uriCheck.uri}</dd>
              <dt className="opacity-70">Registry</dt><dd className="font-mono break-all">{INTERFACE_REGISTRY_ID}</dd>
            </dl>
            <p className="opacity-80">
              {plan.txs.length > 1 ? 'Both steps go out as ONE native batch transaction (one signature, all-or-nothing) when supported.' : 'One transaction.'}
            </p>
            <div className="flex gap-2">
              <button type="button" className={btnCls} style={btnStyle} disabled={Boolean(busy)} onClick={publish} data-testid="publish-submit">
                {busy || 'Sign and publish'}
              </button>
              <button type="button" className={btnCls} style={ghostStyle} disabled={Boolean(busy)} onClick={() => setReviewing(false)}>Back</button>
            </div>
          </div>
        ) : null}
        {result ? (
          <div className="space-y-1 text-sm" data-testid="publish-result">
            <p className="text-emerald-400">
              ✓ Published {result.batched ? 'in one batch transaction' : `in ${result.txHashes.length} transaction(s)`}.
              {result.record ? ' The registry shows the new record.' : ' The registry has not shown it yet; check again shortly.'}
            </p>
            {result.txHashes.map((h) => <p key={String(h)} className="font-mono text-xs break-all">tx {String(h)}</p>)}
            <a className="underline" href={observerUrl} target="_blank" rel="noopener noreferrer" data-testid="publish-observer-link">
              View on boing.observer (shows “Published by deployer” once the file is reachable at the URI)
            </a>
          </div>
        ) : null}
        {errorText ? <p className="mt-2 text-sm text-red-400" role="alert" data-testid="publish-error">{errorText}</p> : null}
      </PageCard>

      <p className="text-xs opacity-70">
        CLI alternative: <span className="font-mono">boing iface publish 0xCONTRACT --file interface.json --uri https://…</span>. See{' '}
        <a className="underline" href="https://github.com/Boing-Network/boing.network/blob/main/docs/INTERFACE-REGISTRY.md" target="_blank" rel="noopener noreferrer">INTERFACE-REGISTRY.md</a>
        {' '}· <Link className="underline" to="/boing/native-vm">Developer tools</Link>
      </p>
    </div>
  );
}