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
        boing.finance is one app for trading and launching on three kinds of networks: <B>EVM</B> chains (Ethereum, Base,
        Arbitrum and others), <B>Solana</B>, and the <B>Boing L1</B> testnet. Pick the family with the EVM / Boing / Solana
        switch in the header; the pages adapt to the network you are on.
      </P>
      <UL>
        <li>
          <B>Trade:</B> <To to="/swap">Swap</To>, <To to="/bridge">Bridge</To>, <To to="/pools">Pools</To> and{' '}
          <To to="/tokens">Tokens</To>.
        </li>
        <li>
          <B>Launch:</B> <To to="/deploy-token">Deploy a token</To>, <To to="/create-nft">create an NFT collection</To>,
          launch both together with <To to="/project-pack">Project pack</To>, link them in{' '}
          <To to="/linked-project">Manage links</To>, or start a pool with <To to="/create-pool">Create pool</To>.
        </li>
        <li>
          <B>Track:</B> <To to="/analytics">Analytics</To>, <To to="/portfolio">Portfolio</To>,{' '}
          <To to="/activity">Activity</To> and <To to="/watchlist">Watchlist</To>.
        </li>
        <li>
          <B>Community:</B> governance signaling, Boing Points and the roadmap under the Governance and BOING menus.
        </li>
      </UL>
      <P>
        boing.finance never holds your funds. Every trade, deposit or deploy is signed in your own wallet, and you can
        reject any request.
      </P>
    </>
  );
}

function GettingStarted() {
  return (
    <>
      <OL>
        <li>
          Choose a network family with the <B>EVM / Boing / Solana</B> switch in the header.
        </li>
        <li>
          Press <B>Connect Wallet</B>. Use an Ethereum wallet such as MetaMask on EVM, a Solana wallet such as Phantom on
          Solana, and <B>Boing Express</B> on Boing.
        </li>
        <li>
          On EVM, pick the chain in your wallet or the app's network picker. If the wallet is on the wrong chain, the
          app asks you to switch.
        </li>
        <li>Open the page you need from the header menus (Trade &amp; Deploy, Analytics, Governance, BOING).</li>
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
        The chat button in the corner opens the <B>AI DeFi Assistant</B>. You can also visit the{' '}
        <To to="/help-center">Help Center</To>, check <To to="/status">Status</To>, <To to="/bug-report">report a bug</To>{' '}
        or <To to="/contact-us">contact us</To>.
      </P>
    </>
  );
}

function Networks() {
  return (
    <>
      <H3>EVM chains</H3>
      <P>
        Ethereum, Base, Arbitrum One, Optimism, Polygon, BNB Smart Chain, opBNB, Avalanche C-Chain, Linea, Scroll,
        zkSync Era, Polygon zkEVM, Blast, Mantle, Mode, Gnosis Chain, Fantom, Moonbeam, Moonriver and PulseChain, plus the
        Sepolia, BSC Testnet and Mumbai testnets. Which features are available (swap, liquidity, deploys) depends on the
        chain; pages tell you when something isn&apos;t supported on the network you picked.
      </P>
      <H3>Solana</H3>
      <P>Solana mainnet and devnet, with a Solana wallet such as Phantom.</P>
      <H3>Boing L1 testnet</H3>
      <P>
        Boing&apos;s own chain (testnet, chain id 6913). The native coin <B>BOING</B> has 18 decimals; the test tokens
        (USDC, tBOING and most deployed tokens) use <B>whole units</B> (no decimals). You sign with Boing Express. Test tokens come from the faucet on <Ext href={NETWORK}>boing.network</Ext>.
      </P>
    </>
  );
}

function Swap() {
  return (
    <>
      <H3>On Boing: one swap card</H3>
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
      <H3>On EVM chains</H3>
      <P>
        Pick the two tokens and an amount. The app finds a route through the LI.FI aggregator, with Uniswap / PancakeSwap
        V2-style pools as a fallback where they exist. The Swap page also shows a market list, a price chart and 24-hour
        stats for the selected pair. The Settings button sets slippage and other trade options.
      </P>
      <H3>On Solana</H3>
      <P>
        The Solana swap page lists trending tokens and swaps on-chain through the Jupiter aggregator, signed in your
        Solana wallet.
      </P>
    </>
  );
}

function BoingAdvanced() {
  return (
    <>
      <P>
        On Boing, the Swap page has three tabs: <B>Swap</B> (the card above), <B>Your liquidity</B> and <B>Advanced</B>.
        Pool cards are on the <To to="/pools">Pools</To> page.
      </P>
      <H3>Pools page</H3>
      <P>
        One card per pool, for example <B>FV2C / USDC</B>: the total liquidity in plain numbers, the current price (tap it
        to flip, e.g. &quot;1 USDC ≈ 0.99 tBOING&quot;), the swap fee, and your share if you have one. <B>Swap</B> opens the
        Swap page with that pair selected; <B>Add liquidity</B> opens Swap → Your liquidity with the pool filled in. Search
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
      <H3>On Boing</H3>
      <P>Earn a share of swap fees by adding tokens to a pool. <B>Swap → Your liquidity</B>:</P>
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
          the starting price. The pool is registered on the DEX factory, so it shows on Pools and its tokens show in the
          swap list right away.
        </li>
      </UL>
      <H3>On EVM chains</H3>
      <P>
        <To to="/liquidity">Liquidity</To> adds or removes liquidity on V2-style pools, <To to="/pools">Pools</To> shows
        pools and your positions once your wallet is connected, and <To to="/create-pool">Create pool</To> opens a new
        pair.
      </P>
      <H3>On Solana</H3>
      <P>
        Add or remove liquidity on an existing <B>Raydium CPMM</B> pool by entering its pool id. New pairs are created on
        Raydium.
      </P>
    </>
  );
}

function Bridge() {
  return (
    <>
      <P>
        <To to="/bridge">Bridge</To> moves tokens between EVM networks (for example Ethereum → Base) using routes from
        LI.FI. Pick the source and destination networks, the token and the amount, review the route, then confirm in your
        wallet.
      </P>
      <UL>
        <li>A 0.5% platform fee applies, shown before you confirm.</li>
        <li>Arrival on the destination network is handled by the bridge route and can take a few minutes.</li>
        <li>Your recent bridges are listed on the page, and in Activity.</li>
        <li>Bridging to or from Solana and Boing L1 isn&apos;t available in the app.</li>
      </UL>
    </>
  );
}

function DeployToken() {
  return (
    <>
      <P>
        <To to="/deploy-token">Deploy token</To> walks you through four steps: <B>Token basics</B> (name, symbol, supply,
        logo), <B>Network &amp; plan</B>, <B>Security &amp; info</B> and <B>Review &amp; deploy</B>. The service fee for
        the plan you choose is shown before you confirm; Boing deploys charge no service fee, only the network fee.
      </P>
      <UL>
        <li>
          <B>EVM:</B> creates an ERC-20 token from the app&apos;s token factory, with your connected Ethereum wallet.
        </li>
        <li>
          <B>Solana:</B> creates an SPL token with your Solana wallet.
        </li>
        <li>
          <B>Boing:</B> deploys <B>Boing token v2</B> with Boing Express, the same kind of token the Boing swap pools
          trade. Express asks you to approve two transactions: the deploy, then a one-time mint of the whole supply to
          your account. Amounts are whole tokens (decimals are 0). After that mint no one can mint more, and there are no
          owner controls such as freezing, a blacklist, transfer limits, anti-bot or a pause switch, so the security step
          lists those as not available on Boing. The name and
          symbol are stored with the deploy: boing.observer shows them right away. The network checks new contracts
          before it accepts them.
        </li>
        <li>
          <B>Make it swappable:</B> after a Boing deploy, the success panel offers <B>Create a pool</B> and{' '}
          <B>Add initial liquidity</B>. Both open Create pool with your token and USDC filled in; deposit both sides and
          confirm in Boing Express. As soon as the pool exists, your token appears in the swap token list (search by
          symbol or paste its address) and on the Pools page.
        </li>
      </UL>
      <P>
        Use <B>Preview</B> to see the token page before you deploy, and <B>History</B> to find tokens you deployed.
      </P>
    </>
  );
}

function CreateNft() {
  return (
    <>
      <P>
        <To to="/create-nft">Create NFT</To> takes you through <B>Collection</B>, <B>Images</B>, <B>Metadata</B> and{' '}
        <B>Review &amp; mint</B>. Choose <B>Standard</B> or <B>Large set (up to 10k)</B>. Images are uploaded to network
        storage, and a public link is written into the collection metadata.
      </P>
      <UL>
        <li>
          <B>Boing:</B> deploys an NFT collection on Boing L1 with Boing Express.
        </li>
        <li>
          <B>Solana:</B> mints SPL NFTs.
        </li>
        <li>
          <B>EVM:</B> the app prepares ERC-721 / OpenSea-style metadata you can export for another minter; it doesn&apos;t
          mint EVM NFTs itself.
        </li>
      </UL>
      <H3>Project pack and Manage links</H3>
      <P>
        <To to="/project-pack">Project pack</To> creates an NFT collection and a project token in one flow, then links
        them so wallets and explorers show them as one project. <To to="/linked-project">Manage links</To> connects an
        existing collection to its token, or disconnects them, on networks where linking is set up.
      </P>
    </>
  );
}

function PublishInterface() {
  return (
    <>
      <P>
        Deployed a contract on Boing? <To to="/boing/publish-interface">Publish interface</To> records your contract&apos;s
        function names on-chain, so <Ext href={OBSERVER}>boing.observer</Ext> shows readable calls with a{' '}
        <B>&ldquo;Published by deployer&rdquo;</B> badge instead of raw data.
      </P>
      <OL>
        <li>Enter the contract and press Check (you must be the account that deployed it).</li>
        <li>Fill in the interface JSON: auto-fill it from the contract code or upload your own file.</li>
        <li>
          Choose where the file lives: <B>Host on Boing</B> (stored on-chain, no website needed; the fee grows with file
          size) or your own https link.
        </li>
        <li>Review and publish, confirming in Boing Express.</li>
      </OL>
      <P>
        Boing Observer only shows the interface when the publisher is the contract&apos;s deployer and the file matches the
        fingerprint recorded on-chain.
      </P>
    </>
  );
}

function BoingL1() {
  return (
    <>
      <P>
        Boing L1 is Boing&apos;s own blockchain, currently a public testnet (chain id 6913). boing.finance uses it for the
        Boing swap card, custody pools, the LP vault, token and NFT deploys, Publish interface and the Boing developer
        tools. Your Boing account is a 64-character address and you sign with Boing Express, not MetaMask.
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

function MarketsTokens() {
  return (
    <>
      <UL>
        <li>
          <To to="/tokens">Tokens</To>: browse tokens on the selected network, including a live feed of new deployments
          and listings.
        </li>
        <li>
          <To to="/analytics">Analytics</To>: live market prices plus Overview, Market, Trending and Research views across
          24 hours to all time.
        </li>
        <li>
          <To to="/watchlist">Watchlist</To>: follow tokens you care about and see their prices and 24-hour change.
        </li>
      </UL>
    </>
  );
}

function PortfolioActivity() {
  return (
    <>
      <UL>
        <li>
          <To to="/portfolio">Portfolio</To>: connect a wallet to see balances, pools and NFTs on the current network. On
          Boing it shows your BOING balance read from the chain, with a link to your account on Boing Observer; token and
          LP positions are under Swap → Your liquidity.
        </li>
        <li>
          <To to="/activity">Activity</To>: your swaps, liquidity and bridge history, with Export CSV.
        </li>
        <li>
          <B>Transaction History</B> (settings menu): recent transactions tracked by the app.
        </li>
      </UL>
    </>
  );
}

function Governance() {
  return (
    <>
      <Note>
        Governance is <B>community signaling</B> today, not on-chain voting. Votes update the app&apos;s proposal
        registry and don&apos;t use BOING voting power.
      </Note>
      <UL>
        <li>
          <To to="/governance/proposals">Proposals</To>: browse proposals and signal For or Against.
        </li>
        <li>
          <To to="/governance/vote">Vote</To>: create a proposal with a title and description.
        </li>
        <li>
          <To to="/governance/treasury">Treasury</To>: treasury figures when the treasury service has data (not a live
          on-chain read yet).
        </li>
        <li>
          <To to="/governance/roadmap">Roadmap</To>, <To to="/governance/community">Community</To> and{' '}
          <To to="/governance/learn">How it works</To>, which explains what works today and what is planned.
        </li>
      </UL>
    </>
  );
}

function BoingProgram() {
  return (
    <>
      <UL>
        <li>
          <To to="/boing/points">Points</To>: earn Boing Points for confirmed swaps, pools and deploys when the points
          service is online. The rates shown are planned amounts, and redeeming points is coming soon.
        </li>
        <li>
          <To to="/boing/staking">NFT Staking</To>: coming soon; nothing can be staked yet.
        </li>
        <li>
          <To to="/boing/roadmap">Roadmap</To>: an illustrative community roadmap, not a delivery tracker.
        </li>
        <li>
          <To to="/boing/activities">Activities</To>: campaigns and community events when they are live.
        </li>
      </UL>
    </>
  );
}

function Developers() {
  return (
    <>
      <UL>
        <li>
          <To to="/boing/native-vm">Boing developer tools</To>: read chain state and send Boing contract calls with Boing
          Express, including LP vault and pool tools. Not needed for everyday swaps.
        </li>
        <li>
          <To to="/boing/publish-interface">Publish interface</To>: give your contract readable function names on Boing
          Observer.
        </li>
        <li>
          <To to="/developer-tools">Developer Tools</To>: the boing.finance API reference, rate limits and examples.
        </li>
        <li>
          The Boing SDK, RPC reference and tutorials are on <Ext href={NETWORK}>boing.network</Ext>.
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
    ['Which wallet do I need?', 'MetaMask or another Ethereum wallet on EVM, Phantom or another Solana wallet on Solana, and Boing Express on Boing L1.'],
    ['Why do I approve twice on my first Boing swap?', 'The first time you sell a token, the pool needs permission to take it (approve), then the swap runs. Later swaps of that token need one confirmation.'],
    ['Why did I get less than I expected on a tiny Boing trade?', 'Most Boing testnet tokens are whole units, so small trades lose more to rounding. Try a larger amount.'],
    ['Can I swap native BOING?', 'Yes. Pick BOING in the swap card. It is wrapped to wBOING and unwrapped back automatically inside one transaction, so you confirm once in Boing Express and only ever hold BOING.'],
    ['I am on a phone. Can I use Boing?', 'Yes. Without the extension, the app opens the boing.express web wallet for each approval. Allow pop-ups for boing.finance.'],
    ['Does a failed Boing transaction cost anything?', 'Yes, a small fee (1 BOING today). The app simulates transactions first to avoid failures.'],
    ['Where do I get .boing names?', 'In Boing Express. boing.finance shows addresses for now.'],
    ['Is governance voting on-chain?', 'Not yet. Proposals and votes are community signaling.'],
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
  { id: 'boing-advanced', title: 'Boing swap: Pools page & Advanced tab', Body: BoingAdvanced },
  { id: 'liquidity', title: 'Pools & liquidity', Body: Liquidity },
  { id: 'bridge', title: 'Bridge', Body: Bridge },
  { id: 'deploy-token', title: 'Deploy a token', Body: DeployToken },
  { id: 'create-nft', title: 'NFT collections & project packs', Body: CreateNft },
  { id: 'publish-interface', title: 'Publish a contract interface', Body: PublishInterface },
  { id: 'boing-l1', title: 'Boing L1 & Boing Express', Body: BoingL1 },
  { id: 'names', title: '.boing names', Body: BoingNames },
  { id: 'markets', title: 'Tokens, analytics & watchlist', Body: MarketsTokens },
  { id: 'portfolio', title: 'Portfolio & activity', Body: PortfolioActivity },
  { id: 'governance', title: 'Governance', Body: Governance },
  { id: 'boing', title: 'BOING: points, staking & roadmap', Body: BoingProgram },
  { id: 'developers', title: 'Developer tools', Body: Developers },
  { id: 'security', title: 'Staying safe', Body: Security },
  { id: 'faq', title: 'FAQ', Body: Faq },
]);

/** Section ids used by older links (`/docs?section=…`). */
export const LEGACY_SECTION_IDS = Object.freeze({
  features: 'overview',
  trading: 'swap',
  contracts: 'deploy-token',
  tokens: 'deploy-token',
  analytics: 'markets',
  technical: 'developers',
  api: 'developers',
});
