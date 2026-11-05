/**
 * boing.finance documentation — one page, one entry per section (the Docs table of contents is built from this list).
 * Plain language for everyday users. Only describe what the app does today; when a feature changes, update its section here.
 */
import React from 'react';
import { Link } from 'react-router-dom';

const EXPRESS = 'https://boing.express';
const OBSERVER = 'https://boing.observer';
const NETWORK = 'https://boing.network';

const linkCls = 'text-cyan-400 underline hover:text-cyan-300';

function P({ children }) {
  return (
    <p className="mb-4 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
      {children}
    </p>
  );
}

function H3({ children }) {
  return (
    <h3 className="mt-6 mb-2 text-lg sm:text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
      {children}
    </h3>
  );
}

function UL({ children }) {
  return (
    <ul className="mb-4 list-disc space-y-1.5 pl-5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
      {children}
    </ul>
  );
}

function OL({ children }) {
  return (
    <ol className="mb-4 list-decimal space-y-1.5 pl-5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
      {children}
    </ol>
  );
}

function Note({ children }) {
  return (
    <div
      className="mb-4 rounded-lg border px-4 py-3 text-sm leading-relaxed"
      style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
    >
      {children}
    </div>
  );
}

function To({ to, children }) {
  return (
    <Link to={to} className={linkCls}>
      {children}
    </Link>
  );
}

function Ext({ href, children }) {
  return (
    <a href={href} className={linkCls} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

const B = ({ children }) => <strong style={{ color: 'var(--text-primary)' }}>{children}</strong>;

function Overview() {
  return (
    <>
      <P>
        boing.finance is the DEX for <B>Boing Network</B>. You trade and provide liquidity on native Boing pools and sign
        everything with <B>Boing Express</B>.
      </P>
      <UL>
        <li>
          <B>Trade:</B> <To to="/swap">Swap</To> any token that has a Boing pool.
        </li>
        <li>
          <B>Earn fees:</B> browse <To to="/pools">Pools</To>, add or remove liquidity on{' '}
          <To to="/pools?tab=liquidity">Your liquidity</To>, or start a new pair with <To to="/create-pool">Create pool</To>.
        </li>
        <li>
          <B>Launch:</B> <To to="/create-token">Create Token</To> publishes a Boing fungible (Standard one-token), then
          create a pool to make it swappable. A <B>0.5%</B> platform fee of initial mint applies.
        </li>
        <li>
          <B>Track:</B> <To to="/portfolio">Portfolio</To> shows your BOING, token balances and liquidity positions valued
          in BOING from the pools. <To to="/staking">Staking</To> shows network stake TVL and your bonded BOING.
        </li>
        <li>
          <B>Move funds:</B> <To to="/bridge">Bridge</To> moves tokens between other chains through LI.FI today. A native
          Boing ↔ Base bridge is planned.
        </li>
      </UL>
      <P>
        boing.finance never holds your funds. Every trade and deposit is signed in your own wallet, and you can reject any
        request.
      </P>
    </>
  );
}

function GettingStarted() {
  return (
    <>
      <OL>
        <li>
          Press <B>Connect Wallet</B> and choose <B>Boing Express</B>.
        </li>
        <li>Get test tokens from the faucet on <Ext href={NETWORK}>boing.network</Ext> if you need some.</li>
        <li>Open Swap, Pools, Create pool, Create Token, Portfolio, Staking or Bridge from the header.</li>
      </OL>
      <H3>Boing Express</H3>
      <P>
        On desktop Chrome, install the Boing Express extension from <Ext href={EXPRESS}>boing.express</Ext>. On phones,
        Safari or Firefox, where the extension isn&apos;t available, the app uses the boing.express <B>web wallet</B>{' '}
        instead: a boing.express window opens for each approval, so allow pop-ups for boing.finance. See{' '}
        <To to="/docs?section=boing-l1">Boing L1 &amp; Boing Express</To>{' '}
        for how signing works.
      </P>
    </>
  );
}

function SettingsMenu() {
  return (
    <>
      <P>
        The gear button in the header opens the settings menu. Everything in it can be clicked; it closes when you click
        outside it or press Escape.
      </P>
      <UL>
        <li>
          <B>Boing apps:</B> quick links to Boing Network (home, docs, faucet), Boing Express (wallet), Boing Observer
          (block explorer) and boing.finance.
        </li>
        <li>
          <B>Language:</B> switch the interface language.
        </li>
        <li>
          <B>Theme:</B> toggle dark and light mode.
        </li>
        <li>
          <B>Transaction History:</B> your recent transactions tracked by the app, with live updates.
        </li>
        <li>
          <B>DeFi 101:</B> short explanations of slippage, APY, impermanent loss, liquidity providers and DEXs, plus an
          impermanent-loss calculator.
        </li>
      </UL>
      <H3>More help</H3>
      <P>
        Visit the{' '}
        <To to="/help-center">Help Center</To>, check <To to="/status">Status</To>, <To to="/bug-report">report a bug</To>{' '}
        or <To to="/contact-us">contact us</To>.
      </P>
    </>
  );
}

function Networks() {
  return (
    <>
      <H3>Boing L1 testnet</H3>
      <P>
        Trading on boing.finance happens on Boing&apos;s own chain (testnet, chain id 6913). The native coin <B>BOING</B>{' '}
        has 18 decimals; the test tokens (USDC, tBOING and most deployed tokens) use <B>whole units</B> (no decimals). You
        sign with Boing Express. Test tokens come from the faucet on <Ext href={NETWORK}>boing.network</Ext>.
      </P>
      <H3>Other chains</H3>
      <P>
        The <To to="/bridge">Bridge</To> page reaches the networks LI.FI supports (Ethereum, Base, Arbitrum, Solana and
        more) with an EVM or Solana wallet. It is the only page that uses wallets other than Boing Express.
      </P>
    </>
  );
}

function Swap() {
  return (
    <>
      <H3>The swap card</H3>
      <OL>
        <li>
          <B>You pay:</B> pick a token (shown by symbol and name with your balance) and type an amount (BOING takes
          decimals such as 1.5; test tokens are whole numbers), or press <B>Max</B> (for BOING, Max keeps 1 BOING back
          for fees). The token list has a search box: type a symbol or name, or paste a token address. A token
          that has no pool yet shows <B>No pool yet — create one</B>, which opens Create pool with that token filled in.
        </li>
        <li>
          Use the <B>flip</B> button to swap the two sides.
        </li>
        <li>
          <B>You receive:</B> pick the token you want; the card shows the estimated amount.
        </li>
        <li>
          Check the details under the card: <B>rate</B>, <B>price impact</B>, <B>minimum received</B> and the <B>fee</B>.
          The gear on the card sets your slippage tolerance (0.1%, 0.5%, 1% or your own value), which decides the
          minimum received.
        </li>
        <li>
          Press the one button. It reads <B>Connect wallet</B>, <B>Enter amount</B>, <B>Insufficient balance</B>,{' '}
          <B>Approve &amp; swap</B> (the first time you sell a token, you approve it, then swap: two confirmations), or{' '}
          <B>Swap</B>. You confirm in Boing Express.
        </li>
      </OL>
      <P>
        Every token that has a pool appears in the list automatically, including tokens you deployed yourself. If both
        tokens are listed but no pool pairs them, the card says <B>No pool yet — create one</B>. The card routes your
        trade through the best pool for the pair automatically. Open <B>Route details</B> at the
        bottom if you want to see the pool and token addresses. After a swap, a link opens the transaction on Boing
        Observer.
      </P>
      <H3>Swapping native BOING</H3>
      <P>
        <B>BOING</B> (the coin you pay network fees with) is in the token list like any other token. Behind the scenes
        pools hold it as <B>wBOING</B> (wrapped BOING, always 1:1), but you never handle wBOING yourself: a BOING swap is
        one transaction with one confirmation that wraps your BOING, approves the pool and swaps, or, when you receive
        BOING, approves, swaps and unwraps it back to native BOING. Boing Express shows the BOING the transaction sends
        before you approve. BOING pairs trade in the newer <B>v10</B> pools, which handle 18-decimal amounts; other pairs
        keep using their v8 / v9 pools. The test token <B>tBOING</B> is a separate regular token.
      </P>
      <Note>
        Because most Boing testnet tokens are whole units, very small trades lose more to rounding. The card warns you when
        that happens; a larger amount gets closer to the quoted rate.
      </Note>
    </>
  );
}

function BoingAdvanced() {
  return (
    <>
      <P>
        The Swap page has two tabs: <B>Swap</B> (the card above) and <B>Advanced</B>. Pool cards and your
        liquidity are on the <To to="/pools">Pools</To> page, in the <B>All pools</B> and <B>Your liquidity</B> tabs.
      </P>
      <H3>Pools page: All pools</H3>
      <P>
        One card per pool, for example <B>FV2C / USDC</B>: the total liquidity in plain numbers, the current price (tap it
        to flip, e.g. &quot;1 USDC ≈ 0.99 tBOING&quot;), the swap fee, and your share if you have one. <B>Swap</B> opens the
        Swap page with that pair selected; <B>Add liquidity</B> opens the <B>Your liquidity</B> tab with the pool filled in. Search
        by token symbol or paste an address to filter, and use <B>Create a pool</B> for a pair that doesn&apos;t exist yet.
        Addresses stay hidden under <B>Details</B>. You can browse pools before connecting a wallet.
      </P>
      <H3>Advanced</H3>
      <P>Tools for power users and builders, in sections:</P>
      <UL>
        <li>
          <B>Pool contracts &amp; factory:</B> every pool registered on the DEX factory, pair count, reserves chart and
          developer stats, with copy buttons for the factory and swap router.
        </li>
        <li>
          <B>Smart routing:</B> multi-hop quotes through more than one pool, swapped in one step.
        </li>
        <li>
          <B>Legacy pool:</B> the original ledger pool (v1) and its LP vaults, kept for older positions.
        </li>
        <li>
          <B>Network readiness:</B> which Boing DEX contracts the network advertises and whether they respond.
        </li>
        <li>
          <B>Indexer:</B> point the pool and token lists at your own indexer.
        </li>
      </UL>
    </>
  );
}

function Liquidity() {
  return (
    <>
      <P>
        Liquidity providers deposit two tokens into a pool and earn a share of the trading fees. Read about{' '}
        <B>impermanent loss</B> in DeFi 101 (settings menu) before you add liquidity.
      </P>
      <P>
        Earn a share of swap fees by adding tokens to a pool, on{' '}
        <B>Pools → Your liquidity</B> (<To to="/pools?tab=liquidity">open it</To>):
      </P>
      <UL>
        <li>
          <B>Your positions:</B> each pool you&apos;re in, your share of it, and what you&apos;d get back per token if you
          withdrew everything. Connect Boing Express to see them.
        </li>
        <li>
          <B>Add:</B> pick the two tokens and type one amount; the other fills in at the pool&apos;s current ratio, and the
          preview shows the share you&apos;ll own. Boing Express asks you to approve each token (exactly that amount) and
          then to confirm the deposit. For a <B>BOING</B> pool it is one confirmation: your BOING is wrapped, both tokens
          approved and the deposit made in a single transaction.
        </li>
        <li>
          <B>Remove:</B> choose 25%, 50%, 75% or Max (or drag the slider); the preview shows the tokens you&apos;ll
          receive. One confirmation in Boing Express. From a BOING pool you get native BOING back (unwrapped in the same
          transaction).
        </li>
        <li>
          Pools are <B>custody pools</B>: the pool holds the tokens. Token pairs use v8 / v9 pools (whole units); BOING
          pairs use v10 pools, which hold BOING as wBOING with 18 decimals.
        </li>
        <li>
          <To to="/create-pool">Create pool</To> starts a new pool: pick two tokens and make the first deposit, which sets
          the starting price. Enter amounts the same way as Swap (human units — e.g. <B>200</B> BOING means 200 BOING,
          not 200 base units). Express confirms up to four steps (deploy, bind tokens, seed liquidity, register pair).
          The pool is registered on the DEX factory, so it shows on Pools and its tokens show in the swap list right
          away.
        </li>
        <li>
          <To to="/create-token">Create Token</To> deploys a Boing token v2 (whole units, fixed supply at create) —
          Standard one-token only. Platform fee is <B>0.5% of initial mint</B> (same target as the bridge fee). After
          create, open Create pool with the new token to seed liquidity.
        </li>
      </UL>
    </>
  );
}

function Bridge() {
  return (
    <>
      <P>
        <To to="/bridge">Bridge</To> moves tokens between every network LI.FI supports: Ethereum, Base, Arbitrum and the
        other EVM chains, plus Solana, Bitcoin, Sui and Tron (about 70 in total). Pick the networks, search any LI.FI token
        by name, symbol or address, enter the amount, review the route, then confirm in your wallet.
      </P>
      <UL>
        <li>
          You can send from EVM networks (MetaMask or another EVM wallet) and from Solana (Phantom, Solflare). Bitcoin, Sui
          and Tron can be the receiving side: paste your address there.
        </li>
        <li>
          The quote shows what you receive, the arrival time and the total cost. <B>Route details</B> lists every fee,
          the steps, the slippage setting and the minimum you receive.
        </li>
        <li>
          For tokens, your wallet first asks you to allow the exact amount, then to confirm the transfer. The page then
          follows the transfer with LI.FI until it arrives.
        </li>
        <li>A 0.5% platform fee applies, shown before you confirm.</li>
        <li>
          <B>Select Token</B>: <B>My Tokens</B> shows your balances, <B>Popular</B> the full LI.FI list, and <B>Import</B>{' '}
          checks a pasted address with LI.FI before adding it to <B>Custom</B>.
        </li>
        <li>Boing L1 isn&apos;t a LI.FI network; move BOING with Boing Express.</li>
      </UL>
      <H3>Coming: native Boing ↔ Base bridge</H3>
      <P>
        A native bridge between Boing and Base is planned. Boing validators will sign each transfer, and a transfer
        completes once two thirds of them agree. Until it launches, use Boing Express to move BOING on Boing.
      </P>
    </>
  );
}




function BoingL1() {
  return (
    <>
      <P>
        Boing L1 is Boing&apos;s own blockchain, currently a public testnet (chain id 6913). boing.finance uses it for the
        swap card, custody pools and the LP vault. Your Boing account is a 64-character address and you sign with Boing Express.
      </P>
      <H3>How signing works</H3>
      <UL>
        <li>
          <B>Extension:</B> on desktop Chrome, Boing Express pops up for each request; approve or reject it there.
        </li>
        <li>
          <B>Phones and other browsers:</B> the boing.express web wallet opens a window for each request. Nothing is
          signed without your click, and your key never leaves boing.express.
        </li>
        <li>
          <B>Checked before sending:</B> the app simulates each transaction first, so most mistakes are caught before
          anything is sent.
        </li>
        <li>
          <B>Signed for this network:</B> Boing signatures include the network&apos;s chain id, so a transaction signed for
          testnet can&apos;t be replayed on another Boing network. Use an up-to-date Boing Express.
        </li>
        <li>
          <B>BOING sent to a contract:</B> since block 1150 a contract call can carry native BOING (for example a BOING
          swap wraps it into wBOING). Boing Express shows <B>BOING sent to contract</B> with the amount in BOING on the
          approval, and Boing Observer shows it on the transaction. The BOING is returned if the transaction fails.
        </li>
      </UL>
      <H3>Fees, including failed transactions</H3>
      <P>
        Fees on Boing are paid in BOING and are low. A transaction that is accepted but then fails still uses network
        resources, so it is recorded as failed and pays a small fee (1 BOING today); everything else it tried to do is
        undone. Simulating first, as the app does, avoids most failures.
      </P>
      <H3>See it on Boing Observer</H3>
      <P>
        Every Boing transaction, account, token and name can be looked up on <Ext href={OBSERVER}>boing.observer</Ext>. The
        Portfolio page links your account there.
      </P>
    </>
  );
}

function BoingNames() {
  return (
    <>
      <P>
        A <B>.boing name</B> (like <code>nico.boing</code>) is a short, readable name for a Boing address. Names are 3–32
        characters of letters, numbers and hyphens.
      </P>
      <UL>
        <li>
          <B>Claim and manage</B> names in <Ext href={EXPRESS}>Boing Express</Ext>: pick one while setting up the wallet or
          later in its names panel, set your primary name, and send tokens to a name instead of an address.
        </li>
        <li>
          <B>Low fees:</B> yearly rent is 1 BOING for names of 6 or more characters, 2 BOING for 5, 5 BOING for 4 and 10
          BOING for 3, for 1 to 10 years at a time. Rent is burned. After a name expires there is a grace period when only
          the owner can renew it.
        </li>
        <li>
          <B>Safe claiming:</B> registration is commit-reveal. Your wallet first sends a sealed commitment, then reveals
          the name, so nobody can watch a pending claim and grab the name first. Boing Express handles both steps.
        </li>
        <li>
          Boing Observer shows names on accounts and has a page for each name.
        </li>
      </UL>
      <P>boing.finance shows addresses today; claiming and sending to names happens in Boing Express.</P>
    </>
  );
}


function PortfolioActivity() {
  return (
    <>
      <UL>
        <li>
          <To to="/portfolio">Portfolio</To>: connect Boing Express to see your BOING balance, your token balances and your
          liquidity positions. Each position is valued in BOING from the pools&apos; current reserves; a token with no
          BOING pool is listed without a value. A link opens your account on Boing Observer.
        </li>
        <li>
          <To to="/staking">Staking</To>: network stake TVL from <code>chain_native.total_stake</code>, plus your bonded
          stake and pending unbond when connected. Bond / Unbond / Claim are signed in Boing Express for now.
        </li>
        <li>
          <B>Transaction History</B> (settings menu): recent transactions tracked by the app.
        </li>
      </UL>
    </>
  );
}




function Security() {
  return (
    <>
      <UL>
        <li>boing.finance never asks for your seed phrase or private key. Anyone who does is a scammer.</li>
        <li>Read every wallet request before approving: the site, the action and the amounts.</li>
        <li>
          Check price impact and minimum received before a swap, and keep slippage low unless a trade keeps failing.
        </li>
        <li>Approvals let a contract move a token for you; only approve contracts you trust.</li>
        <li>Make sure you are on boing.finance (and boing.express for the web wallet) before you connect.</li>
        <li>Boing L1 is a testnet: its tokens are for testing and have no real value.</li>
      </UL>
    </>
  );
}

function Faq() {
  const qa = [
    ['Which wallet do I need?', 'Boing Express. The Bridge page also works with MetaMask or another EVM wallet, or a Solana wallet such as Phantom, for LI.FI routes between other chains.'],
    ['Why do I approve twice on my first Boing swap?', 'The first time you sell a token, the pool needs permission to take it (approve), then the swap runs. Later swaps of that token need one confirmation.'],
    ['Why did I get less than I expected on a tiny Boing trade?', 'Most Boing testnet tokens are whole units, so small trades lose more to rounding. Try a larger amount.'],
    ['Can I swap native BOING?', 'Yes. Pick BOING in the swap card. It is wrapped to wBOING and unwrapped back automatically inside one transaction, so you confirm once in Boing Express and only ever hold BOING.'],
    ['I am on a phone. Can I use Boing?', 'Yes. Without the extension, the app opens the boing.express web wallet for each approval. Allow pop-ups for boing.finance.'],
    ['Does a failed Boing transaction cost anything?', 'Yes, a small fee (1 BOING today). The app simulates transactions first to avoid failures.'],
    ['Where do I get .boing names?', 'In Boing Express. boing.finance shows addresses for now.'],
    ['Can I bridge BOING to Base?', 'Not yet. A native Boing ↔ Base bridge, signed by Boing validators with a two-thirds threshold, is planned.'],
    ['Where can I see my Boing transactions?', 'On boing.observer. After a swap, the card links straight to the transaction.'],
  ];
  return (
    <dl className="space-y-4">
      {qa.map(([q, a]) => (
        <div key={q}>
          <dt className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            {q}
          </dt>
          <dd className="mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {a}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** Order here is the order on the page and in the table of contents. */
export const DOC_SECTIONS = Object.freeze([
  { id: 'overview', title: 'Overview', Body: Overview },
  { id: 'getting-started', title: 'Getting started', Body: GettingStarted },
  { id: 'settings', title: 'Settings menu & help', Body: SettingsMenu },
  { id: 'networks', title: 'Supported networks', Body: Networks },
  { id: 'swap', title: 'Swap', Body: Swap },
  { id: 'boing-advanced', title: 'Pools page & Swap → Advanced', Body: BoingAdvanced },
  { id: 'liquidity', title: 'Pools & liquidity', Body: Liquidity },
  { id: 'bridge', title: 'Bridge', Body: Bridge },
  { id: 'boing-l1', title: 'Boing L1 & Boing Express', Body: BoingL1 },
  { id: 'names', title: '.boing names', Body: BoingNames },
  { id: 'portfolio', title: 'Portfolio', Body: PortfolioActivity },
  { id: 'security', title: 'Staying safe', Body: Security },
  { id: 'faq', title: 'FAQ', Body: Faq },
]);

/** Section ids used by older links (`/docs?section=…`). */
export const LEGACY_SECTION_IDS = Object.freeze({
  features: 'overview',
  trading: 'swap',
  contracts: 'overview',
  tokens: 'overview',
  analytics: 'portfolio',
  markets: 'portfolio',
  technical: 'boing-l1',
  api: 'boing-l1',
  developers: 'boing-l1',
  'deploy-token': 'liquidity',
  'create-token': 'liquidity',
  'create-nft': 'overview',
  'publish-interface': 'overview',
  governance: 'overview',
  boing: 'overview',
});
