## Learned User Preferences

- Prefers visual or brand refreshes to be applied consistently across the whole app, not only on isolated pages.
- Expects deployment success flows to include clear feedback (for example celebration or emphasis) and keeps bottom actions in success modals readable against their backgrounds.
- Wants Boing token and pool discovery to follow on-chain DEX state where practical; when the chain or RPC surface cannot support full auto-discovery, expects concise handoff language for Boing Network operators rather than only app-only workarounds.

## Learned Workspace Facts

- Native Boing DEX discovery in the frontend is layered: L1 RPC hints and lists (`boing_getNetworkInfo`, `boing_listDexPools`, `boing_listDexTokens`), optional indexer and register-log configuration, and metadata from hydrated pool venues, merged for pickers and labels.
- The primary native Swap tab targets the network default constant-product pool; surfacing and swapping additional factory pairs (including multihop) is oriented around the Pools directory and Smart route flow.
- Native DEX integration expectations, env flags, and operator handoffs are documented under `docs/` (including L1 discovery integration and Boing Network global/seamless token discovery handoffs).
