import React from 'react';
import { Link } from 'react-router-dom';
import {
  BOING_NETWORK_BOING_CANONICAL_DEPLOY_ARTIFACTS_URL,
  BOING_NETWORK_BOING_L1_DEX_ENGINEERING_URL,
  BOING_NETWORK_E2_PARTNER_APP_NATIVE_BOING_URL,
  BOING_NETWORK_HANDOFF_DEPENDENT_PROJECTS_URL,
  BOING_NETWORK_RPC_API_SPEC_URL,
} from '../../config/boingNetworkDocsUrls';

const BOING_EXPRESS_URL = 'https://boing.express';

const linkCls = 'text-cyan-400 underline hover:text-cyan-300';

export default function BoingNativeL1Section() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          Boing L1 testnet &amp; Boing Express
        </h2>
        <p className="text-lg leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
          Boing testnet (chain id <strong>6913</strong> in this app) uses the <strong>Boing VM</strong> for native contracts and DEX
          flows. Signing uses <strong>Boing Express</strong> (<code className="text-xs">window.boing</code>,{' '}
          <code className="text-xs">boing_sendTransaction</code>), not MetaMask, for those paths. The header network toggle still
          offers <strong>EVM</strong> and <strong>Solana</strong> for Uniswap-style and SPL flows.
        </p>
        <ul className="list-disc pl-5 space-y-2" style={{ color: 'var(--text-secondary)' }}>
          <li>
            <strong>32-byte native AccountId</strong> (Boing Express) cannot sign Solidity deploys on the EVM token factory—use
            an Ethereum wallet on EVM for ERC-20 here, or complete a <strong>native launch</strong> in the Deploy Token wizard
            when you are on Boing testnet with Boing Express connected.
          </li>
          <li>
            <strong>DEX / liquidity</strong>: when a native constant-product pool is configured, add liquidity and swap from{' '}
            <Link to="/swap" className={linkCls}>
              Swap
            </Link>
            ; there is no separate EVM-style factory deploy on that chain in this app.
          </li>
        </ul>
      </div>

      <div>
        <h3 className="text-2xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
          Native token deploy (Deploy Token)
        </h3>
        <p className="mb-3" style={{ color: 'var(--text-secondary)' }}>
          With Boing testnet + Boing Express, the <strong>Launch wizard</strong> ends in a <strong>native VM</strong> deploy
          (pinned fungible bytecode, <code className="text-xs">contract_deploy_meta</code>, <code className="text-xs">boing_qaCheck</code>
          ). For a classic <strong>ERC-20</strong> on Sepolia, switch the header to <strong>EVM</strong> and use MetaMask.
        </p>
        <p className="mb-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
          Example <code className="text-xs">boing_sendTransaction</code> payload shape (from any connected dApp):
        </p>
        <pre
          className="text-xs p-3 rounded-lg overflow-x-auto border"
          style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
        >
{`await window.boing.request({
  method: 'boing_sendTransaction',
  params: [{
    type: 'contract_deploy_meta',
    purpose_category: 'token',
    bytecode: '0x…',
    asset_name: 'My Token',
    asset_symbol: 'MTK',
    description_hash: null,
    create2_salt: null,
  }],
});`}
        </pre>
        <ul className="mt-3 list-disc pl-5 space-y-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
          <li>
            Bytecode: <code className="text-xs">REACT_APP_BOING_REFERENCE_FUNGIBLE_TEMPLATE_BYTECODE_HEX</code> (or secured
            template env) at build time, or overrides in the wizard <strong>Advanced</strong> section.
          </li>
          <li>QA rejections surface as JSON-RPC errors (e.g. <code className="text-xs">-32050</code>) on Express failures.</li>
        </ul>
      </div>

      <div>
        <h3 className="text-2xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
          Native NFT collection (Create NFT)
        </h3>
        <p className="mb-3" style={{ color: 'var(--text-secondary)' }}>
          On Boing testnet with Boing Express, the <strong>Review</strong> step can <strong>Deploy native collection</strong> using
          the same QA + Express flow as tokens. The wizard still builds ERC-721-style metadata for exports; on-chain collection
          bytecode follows{' '}
          <a href={BOING_NETWORK_BOING_CANONICAL_DEPLOY_ARTIFACTS_URL} target="_blank" rel="noopener noreferrer" className={linkCls}>
            BOING-CANONICAL-DEPLOY-ARTIFACTS.md
          </a>{' '}
          (NFT template + <code className="text-xs">purpose_category: nft</code>).
        </p>
        <p className="mb-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
          Set <code className="text-xs">REACT_APP_BOING_REFERENCE_NFT_COLLECTION_TEMPLATE_BYTECODE_HEX</code> for CI/production
          builds, or paste template hex under <strong>Advanced</strong> in the wizard. Low-level RPC helpers live on{' '}
          <Link to="/boing/native-vm" className={linkCls}>
            Native VM tools
          </Link>
          .
        </p>
      </div>

      <div>
        <h3 className="text-2xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
          boing.finance engineering notes
        </h3>
        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
          In-repo overview of native vs EVM DEX paths in this app:{' '}
          <a
            href="https://github.com/Boing-Network/boing.finance/blob/main/docs/boing-l1-vs-evm-dex.md"
            target="_blank"
            rel="noopener noreferrer"
            className={linkCls}
          >
            docs/boing-l1-vs-evm-dex.md
          </a>
          .
        </p>
      </div>

      <div>
        <h3 className="text-2xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
          Official protocol docs (GitHub)
        </h3>
        <ul className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
          <li>
            <a href={BOING_NETWORK_E2_PARTNER_APP_NATIVE_BOING_URL} target="_blank" rel="noopener noreferrer" className={linkCls}>
              E2-PARTNER-APP-NATIVE-BOING.md
            </a>{' '}
            — partner integration (Express + <code className="text-xs">boing_sendTransaction</code>).
          </li>
          <li>
            <a href={BOING_NETWORK_BOING_CANONICAL_DEPLOY_ARTIFACTS_URL} target="_blank" rel="noopener noreferrer" className={linkCls}>
              BOING-CANONICAL-DEPLOY-ARTIFACTS.md
            </a>{' '}
            — pinned bytecode + versioning.
          </li>
          <li>
            <a href={BOING_NETWORK_RPC_API_SPEC_URL} target="_blank" rel="noopener noreferrer" className={linkCls}>
              RPC-API-SPEC.md
            </a>{' '}
            — JSON-RPC methods (<code className="text-xs">boing_qaCheck</code>, receipts, etc.).
          </li>
          <li>
            <a href={BOING_NETWORK_BOING_L1_DEX_ENGINEERING_URL} target="_blank" rel="noopener noreferrer" className={linkCls}>
              BOING-L1-DEX-ENGINEERING.md
            </a>{' '}
            — native AMM / router engineering notes.
          </li>
          <li>
            <a href={BOING_NETWORK_HANDOFF_DEPENDENT_PROJECTS_URL} target="_blank" rel="noopener noreferrer" className={linkCls}>
              HANDOFF-DEPENDENT-PROJECTS.md
            </a>{' '}
            — cross-repo backlog (Express, Observer, partner dApps).
          </li>
          <li>
            <a href={BOING_EXPRESS_URL} target="_blank" rel="noopener noreferrer" className={linkCls}>
              Boing Express
            </a>{' '}
            — wallet install / connect.
          </li>
        </ul>
      </div>
    </div>
  );
}
