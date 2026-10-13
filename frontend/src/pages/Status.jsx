import React from 'react';
import { Helmet } from 'react-helmet-async';

/**
 * Status page — honest “not wired” surface.
 * Do not invent uptime %, response times, or incident history until a real monitor exists.
 */
const Status = () => {
  const checks = [
    {
      name: 'Public testnet RPC',
      detail: 'https://testnet-rpc.boing.network/ (Cloudflare Worker gateway → Fly nodes)',
      href: 'https://testnet-rpc.boing.network/',
    },
    {
      name: 'boing.finance API Worker',
      detail: 'Aggregator, analytics, and points routes on boing-api-prod',
      href: 'https://boing-api-prod.nico-chikuji.workers.dev/api/aggregator/bridge-config',
    },
    {
      name: 'Native DEX directory Worker',
      detail: 'D1 directory merge for Pools (when Pages bake sets DIRECTORY_BASE_URL)',
      href: 'https://boing-native-dex-indexer.nico-chikuji.workers.dev/v1/directory/pools',
    },
    {
      name: 'Explorer',
      detail: 'boing.observer for blocks, accounts, and DEX discovery',
      href: 'https://boing.observer',
    },
  ];

  return (
    <>
      <Helmet>
        <title>System Status | boing.finance</title>
        <meta
          name="description"
          content="boing.finance does not yet publish live uptime telemetry. Use RPC, Worker, and explorer links to check services."
        />
        <meta property="og:title" content="System Status | boing.finance" />
        <meta
          property="og:description"
          content="Status monitoring is not wired. No fake uptime metrics."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://boing.finance/status" />
      </Helmet>

      <div className="relative w-full min-w-0" style={{ color: 'var(--text-primary)' }}>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                System Status
              </h1>
              <p className="text-lg mb-6" style={{ color: 'var(--text-secondary)' }}>
                Live uptime monitoring is not wired yet.
              </p>
              <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4 text-left">
                <p className="text-amber-100 text-sm">
                  <strong>Not live:</strong> This page does not report real uptime, latency, or incidents.
                  Placeholder percentages and “all systems operational” chips were removed so they are not
                  mistaken for telemetry. When a monitor (Better Stack, Cloudflare Health Checks, or similar)
                  is connected, this page will read from that API.
                </p>
              </div>
            </div>

            <div
              className="rounded-lg p-6 border mb-8"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
            >
              <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                Check these endpoints manually
              </h2>
              <ul className="space-y-4">
                {checks.map((item) => (
                  <li key={item.name}>
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold hover:underline"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {item.name}
                    </a>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                      {item.detail}
                    </p>
                  </li>
                ))}
              </ul>
            </div>

            <div
              className="rounded-lg p-6 border mb-8"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
            >
              <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
                To wire real monitoring
              </h2>
              <ol className="list-decimal list-inside text-sm space-y-2" style={{ color: 'var(--text-secondary)' }}>
                <li>Pick a monitor (Better Stack, Checkly, Cloudflare Health Checks, etc.).</li>
                <li>Probe public RPC, Pages origin, and `boing-api-prod` on a fixed cadence.</li>
                <li>Expose a JSON status API the frontend can fetch (no hard-coded “99.9%”).</li>
                <li>Replace this page with that feed and keep an explicit degraded/outage path.</li>
              </ol>
            </div>

            <div
              className="rounded-lg p-6 border text-center"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
            >
              <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                Report an issue
              </h2>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="mailto:support@boing.finance"
                  className="hover:bg-gray-600 px-6 py-3 rounded-lg transition-colors border"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)',
                  }}
                >
                  Email Support
                </a>
                <a
                  href="/contact-us"
                  className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg transition-colors"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Contact Form
                </a>
                <a
                  href="/bug-report"
                  className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg transition-colors"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Report Issues
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Status;
