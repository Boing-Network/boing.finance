import React, { useEffect, useState } from 'react';

const PARTNER_GUIDE_URL =
  'https://github.com/Boing-Network/boing.network/blob/main/docs/E2-PARTNER-APP-NATIVE-BOING.md';
const CANONICAL_ARTIFACTS_DOC =
  'https://github.com/Boing-Network/boing.network/blob/main/docs/BOING-CANONICAL-DEPLOY-ARTIFACTS.md';
const BOING_EXPRESS_URL = 'https://boing.express';
const RPC_SPEC_URL =
  'https://github.com/Boing-Network/boing.network/blob/main/docs/RPC-API-SPEC.md';

/**
 * Richer native Boing L1 deploy guidance for token creators (Express + boing_sendTransaction).
 * ERC-20 deploy on this page remains EVM-only; this panel explains the parallel native path.
 */
export default function NativeBoingDeployPanel({ tokenName = '', tokenSymbol = '' }) {
  const [expressInjected, setExpressInjected] = useState(false);

  useEffect(() => {
    try {
      const w = typeof window !== 'undefined' ? window : undefined;
      const boing = w?.boing;
      setExpressInjected(typeof boing?.request === 'function' && (boing.isBoing === true || boing.isBoingExpress === true));
    } catch {
      setExpressInjected(false);
    }
  }, []);

  const nameHint = tokenName.trim() || 'My Token';
  const symHint = tokenSymbol.trim().toUpperCase() || 'MTK';

  const exampleSnippet = `// After compiling Boing VM bytecode to hex, from a connected dApp:
await window.boing.request({
  method: 'boing_sendTransaction',
  params: [{
    type: 'contract_deploy_meta',
    purpose_category: 'token',
    bytecode: '0x…',           // your contract init/runtime blob
    description_hash: null,    // or 0x + 64 hex when required by your flow
    asset_name: '${nameHint.replace(/'/g, "\\'")}',
    asset_symbol: '${symHint.replace(/'/g, "\\'")}',
    create2_salt: null,         // or 0x + 64 hex for CREATE2-style address
  }],
});`;

  return (
    <section
      className="mt-6 rounded-xl border p-5 text-left"
      style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: 'rgba(59, 130, 246, 0.35)',
      }}
      aria-labelledby="native-boing-deploy-heading"
    >
      <h2 id="native-boing-deploy-heading" className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
        Deploy on native Boing L1 (VM + QA)
      </h2>
      <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
        This page deploys <strong>ERC-20</strong> contracts on <strong>EVM</strong> networks. Boing also has a{' '}
        <strong>native VM</strong> with protocol QA on deploys. Use{' '}
        <a href={BOING_EXPRESS_URL} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline hover:text-blue-300">
          Boing Express
        </a>{' '}
        and <code className="text-xs">boing_sendTransaction</code> with a purpose-bearing deploy (
        <code className="text-xs">contract_deploy_meta</code> or <code className="text-xs">contract_deploy_purpose</code>
        ).
      </p>

      {expressInjected && (
        <p
          className="text-xs font-medium rounded-md px-2 py-1.5 mb-3 inline-block"
          style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)', color: 'rgb(134, 239, 172)' }}
        >
          Boing Express provider detected — you can call <code className="text-xs">window.boing.request</code> from the console or your
          own script on this origin.
        </p>
      )}

      <ol className="list-decimal list-inside text-sm space-y-2 mb-4" style={{ color: 'var(--text-secondary)' }}>
        <li>
          Install / open{' '}
          <a href={BOING_EXPRESS_URL} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">
            Boing Express
          </a>{' '}
          and connect <strong>this site</strong> (<code className="text-xs">boing_requestAccounts</code>).
        </li>
        <li>
          Pin fungible template bytecode via <code className="text-xs">REACT_APP_BOING_REFERENCE_FUNGIBLE_TEMPLATE_BYTECODE_HEX</code>{' '}
          (or call <code className="text-xs">resolveReferenceFungibleTemplateBytecodeHex</code> /{' '}
          <code className="text-xs">buildContractDeployMetaTx</code> from <code className="text-xs">boing-sdk</code>). Run{' '}
          <code className="text-xs">boing_qaCheck</code> for a pre-flight when not using the in-app Deploy Token panel.
        </li>
        <li>
          Submit with <code className="text-xs">purpose_category: &apos;token&apos;</code> and metadata fields that match your asset (
          e.g. <strong>{nameHint}</strong> / <strong>{symHint}</strong>).
        </li>
        <li>
          Handle errors with the node&apos;s JSON-RPC <code className="text-xs">code</code> and <code className="text-xs">data</code> (e.g.{' '}
          <code className="text-xs">-32050</code> QA reject) — Express forwards them on{' '}
          <code className="text-xs">window.boing.request</code> failures.
        </li>
      </ol>

      <div className="flex flex-wrap gap-2 mb-4">
        <a
          href={PARTNER_GUIDE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm px-3 py-1.5 rounded-lg font-medium"
          style={{ backgroundColor: 'var(--accent-primary)', color: 'white' }}
        >
          Partner integration guide
        </a>
        <a
          href={RPC_SPEC_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm px-3 py-1.5 rounded-lg border"
          style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
        >
          RPC API spec
        </a>
        <a
          href={CANONICAL_ARTIFACTS_DOC}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm px-3 py-1.5 rounded-lg border"
          style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
        >
          Canonical deploy artifacts
        </a>
      </div>

      <pre
        className="text-xs p-3 rounded-lg overflow-x-auto"
        style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
      >
        {exampleSnippet}
      </pre>
    </section>
  );
}
