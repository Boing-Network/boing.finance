import React from 'react';
import { useBreakpoint } from '../hooks/useMediaQuery';

function PairAvatar({ token0Symbol, token1Symbol }) {
  return (
    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shrink-0">
      <span className="text-white font-bold text-sm">
        {token0Symbol?.charAt(0) || 'T'}
        {token1Symbol?.charAt(0) || 'T'}
      </span>
    </div>
  );
}

function TopPairCard({ pair }) {
  const pairLabel = `${pair.token0Symbol}/${pair.token1Symbol}`;
  return (
    <div className="rounded-xl border border-gray-600 bg-gray-800/80 p-4">
      <div className="flex items-center gap-3 min-w-0 mb-3">
        <PairAvatar token0Symbol={pair.token0Symbol} token1Symbol={pair.token1Symbol} />
        <div className="min-w-0 flex-1">
          <p className="text-white font-medium truncate">{pairLabel}</p>
          <p className="text-xs text-gray-400 truncate">{pair.network}</p>
        </div>
        <p className="text-green-400 font-semibold shrink-0">
          {pair.apy ? `${parseFloat(pair.apy).toFixed(2)}%` : '0%'}
        </p>
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div>
          <dt className="text-xs text-gray-500">Volume</dt>
          <dd className="text-white">${parseFloat(pair.volume || 0).toLocaleString()}</dd>
        </div>
        <div>
          <dt className="text-xs text-gray-500">Liquidity</dt>
          <dd className="text-white">${parseFloat(pair.liquidity || 0).toLocaleString()}</dd>
        </div>
      </dl>
    </div>
  );
}

function TopPairTableRow({ pair }) {
  return (
    <tr className="hover:bg-gray-700 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <PairAvatar token0Symbol={pair.token0Symbol} token1Symbol={pair.token1Symbol} />
          <span className="text-white font-medium ml-3">
            {pair.token0Symbol}/{pair.token1Symbol}
          </span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-gray-300">{pair.network}</td>
      <td className="px-6 py-4 whitespace-nowrap text-white">
        ${parseFloat(pair.volume || 0).toLocaleString()}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-white">
        ${parseFloat(pair.liquidity || 0).toLocaleString()}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-green-400">
        {pair.apy ? `${parseFloat(pair.apy).toFixed(2)}%` : '0%'}
      </td>
    </tr>
  );
}

/**
 * Responsive top trading pairs: cards below lg, table at lg+.
 *
 * @param {{ pairs: Array<object> }} props
 */
export default function AnalyticsTopPairsView({ pairs }) {
  const { isTableLayout } = useBreakpoint();
  const list = pairs ?? [];

  if (isTableLayout) {
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700" aria-label="Top trading pairs">
          <caption className="sr-only">Top trading pairs by volume</caption>
          <thead className="bg-gray-700">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Pair
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Network
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Volume
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Liquidity
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                APY
              </th>
            </tr>
          </thead>
          <tbody className="bg-gray-800 divide-y divide-gray-700">
            {list.map((pair, index) => (
              <TopPairTableRow
                key={`${pair.token0Symbol}-${pair.token1Symbol}-${pair.network}-${index}`}
                pair={pair}
              />
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {list.map((pair, index) => (
        <TopPairCard
          key={`${pair.token0Symbol}-${pair.token1Symbol}-${pair.network}-${index}`}
          pair={pair}
        />
      ))}
    </div>
  );
}
