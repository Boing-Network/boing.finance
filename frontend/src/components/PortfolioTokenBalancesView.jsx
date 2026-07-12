import React from 'react';
import { NETWORKS } from '../config/networks';
import { useBreakpoint } from '../hooks/useMediaQuery';

function TokenAvatar({ symbol }) {
  return (
    <div className="w-8 h-8 bg-gradient-to-br from-finance-purple to-cyan-600 rounded-full flex items-center justify-center shrink-0">
      <span className="text-white font-bold text-sm">{symbol?.charAt(0) || 'T'}</span>
    </div>
  );
}

function formatChange24h(priceChange24h) {
  if (priceChange24h === undefined) return 'N/A';
  return `${priceChange24h >= 0 ? '+' : ''}${priceChange24h.toFixed(2)}%`;
}

function changeClass(priceChange24h) {
  if (priceChange24h === undefined) return 'text-gray-400';
  return priceChange24h >= 0 ? 'text-green-400' : 'text-red-400';
}

function networkLabel(token) {
  return NETWORKS[token.chainId]?.name || `Chain ${token.chainId}`;
}

function TokenBalanceCard({ token, showNetwork = true }) {
  return (
    <div className="rounded-xl border border-gray-600 bg-gray-800/80 p-4">
      <div className="flex items-start gap-3 min-w-0">
        <TokenAvatar symbol={token.symbol} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-white font-medium truncate">{token.symbol}</p>
              <p className="text-sm text-gray-400 truncate">{token.name}</p>
            </div>
            <p className="text-white font-semibold shrink-0">
              ${token.value ? token.value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '0.00'}
            </p>
          </div>
          {showNetwork && (
            <p className="text-xs text-gray-400 mt-1">{networkLabel(token)}</p>
          )}
        </div>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div>
          <dt className="text-xs text-gray-500">Balance</dt>
          <dd className="text-white truncate">
            {parseFloat(token.balance).toLocaleString(undefined, { maximumFractionDigits: 6 })} {token.symbol}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-gray-500">Price</dt>
          <dd className="text-white">
            ${token.price ? token.price.toLocaleString(undefined, { maximumFractionDigits: 4 }) : '0.00'}
          </dd>
        </div>
        <div className="col-span-2">
          <dt className="text-xs text-gray-500">24h Change</dt>
          <dd className={changeClass(token.priceChange24h)}>{formatChange24h(token.priceChange24h)}</dd>
        </div>
      </dl>
    </div>
  );
}

function TokenBalanceTableRow({ token }) {
  return (
    <tr className="hover:bg-gray-700 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <TokenAvatar symbol={token.symbol} />
          <div className="ml-3">
            <div className="text-white font-medium">{token.symbol}</div>
            <div className="text-sm text-gray-400">{token.name}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-gray-300">{networkLabel(token)}</td>
      <td className="px-6 py-4 whitespace-nowrap text-white">
        {parseFloat(token.balance).toLocaleString(undefined, { maximumFractionDigits: 6 })} {token.symbol}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-white">
        ${token.price ? token.price.toLocaleString(undefined, { maximumFractionDigits: 4 }) : '0.00'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-white font-semibold">
        ${token.value ? token.value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '0.00'}
      </td>
      <td className={`px-6 py-4 whitespace-nowrap ${changeClass(token.priceChange24h)}`}>
        {formatChange24h(token.priceChange24h)}
      </td>
    </tr>
  );
}

function TotalValueFooter({ totalValue, variant }) {
  const formatted = `$${totalValue ? totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '0.00'}`;

  if (variant === 'card') {
    return (
      <div
        className="rounded-xl border border-gray-600 bg-gray-700/80 px-4 py-3 flex items-center justify-between"
        aria-label="Total portfolio value"
      >
        <span className="text-sm font-semibold text-white">Total Portfolio Value</span>
        <span className="text-lg font-bold text-cyan-400">{formatted}</span>
      </div>
    );
  }

  return (
    <tfoot className="bg-gray-700">
      <tr>
        <td colSpan={4} className="px-6 py-4 text-right font-semibold text-white">
          Total Portfolio Value:
        </td>
        <td colSpan={2} className="px-6 py-4 text-left font-bold text-cyan-400">
          {formatted}
        </td>
      </tr>
    </tfoot>
  );
}

/**
 * Responsive token balances: card list on mobile/tablet, table on lg+.
 *
 * @param {{
 *   tokens: Array<object>,
 *   grouped: Record<string, Array<object>> | null,
 *   groupByNetwork: boolean,
 *   totalValue?: number,
 * }} props
 */
export default function PortfolioTokenBalancesView({ tokens, grouped, groupByNetwork, totalValue }) {
  const { isTableLayout } = useBreakpoint();
  const list = tokens ?? [];

  if (isTableLayout) {
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700" aria-label="Token balances">
          <caption className="sr-only">Portfolio token balances by network</caption>
          <thead className="bg-gray-700">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                Token
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                Network
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                Balance
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                Price
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                Value
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                24h Change
              </th>
            </tr>
          </thead>
          <tbody className="bg-gray-800 divide-y divide-gray-700">
            {groupByNetwork && grouped
              ? Object.entries(grouped).flatMap(([network, networkTokens]) => [
                  <tr key={`header-${network}`} className="bg-gray-700/50">
                    <td colSpan={6} className="px-6 py-2 text-sm font-semibold text-cyan-400">
                      {network}
                    </td>
                  </tr>,
                  ...networkTokens.map((token, index) => (
                    <TokenBalanceTableRow
                      key={`${network}-${token.symbol}-${token.chainId}-${index}`}
                      token={token}
                    />
                  )),
                ])
              : list.map((token, index) => (
                  <TokenBalanceTableRow
                    key={`${token.symbol}-${token.chainId}-${index}`}
                    token={token}
                  />
                ))}
          </tbody>
          <TotalValueFooter totalValue={totalValue} variant="table" />
        </table>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {groupByNetwork && grouped
        ? Object.entries(grouped).flatMap(([network, networkTokens]) => [
            <p key={`hdr-${network}`} className="text-sm font-semibold text-cyan-400 pt-2 first:pt-0">
              {network}
            </p>,
            ...networkTokens.map((token, index) => (
              <TokenBalanceCard
                key={`${network}-${token.symbol}-${token.chainId}-${index}`}
                token={token}
                showNetwork={false}
              />
            )),
          ])
        : list.map((token, index) => (
            <TokenBalanceCard key={`${token.symbol}-${token.chainId}-${index}`} token={token} />
          ))}

      <TotalValueFooter totalValue={totalValue} variant="card" />
    </div>
  );
}
