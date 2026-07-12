import React from 'react';
import { useBreakpoint } from '../../hooks/useMediaQuery';

function SmartFlowCard({ row }) {
  return (
    <article className="rounded-xl border border-gray-700 bg-gray-800/80 p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <p className="font-medium text-white truncate">{row.pair}</p>
          <p className="text-xs text-gray-400 truncate">{row.network}</p>
        </div>
        <span
          className={`text-xs px-2 py-0.5 rounded shrink-0 ${
            row.isTrending ? 'bg-green-500/20 text-green-300' : 'bg-blue-500/20 text-blue-300'
          }`}
        >
          {row.signal}
        </span>
      </div>
      <dl className="grid grid-cols-2 gap-x-4 text-sm">
        <div>
          <dt className="text-xs text-gray-500">Vol/Liq</dt>
          <dd className="text-gray-200">{(row.volToLiq * 100).toFixed(0)}%</dd>
        </div>
      </dl>
    </article>
  );
}

/**
 * Smart-flow table with mobile cards below lg.
 *
 * @param {{ rows: Array<object> }} props
 */
export default function SmartFlowsView({ rows = [] }) {
  const { isTableLayout } = useBreakpoint();

  if (!rows.length) return null;

  if (isTableLayout) {
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm" aria-label="Smart flow signals">
          <caption className="sr-only">Smart flow pair signals by volume-to-liquidity ratio</caption>
          <thead>
            <tr className="text-left text-gray-400 border-b border-gray-700">
              <th scope="col" className="py-2 pr-4">
                Pair
              </th>
              <th scope="col" className="py-2 pr-4">
                Network
              </th>
              <th scope="col" className="py-2 pr-4">
                Vol/Liq
              </th>
              <th scope="col" className="py-2 pr-4">
                Signal
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={`${row.pair}-${row.network}-${i}`} className="border-b border-gray-800 text-gray-200">
                <td className="py-2.5 pr-4 font-medium">{row.pair}</td>
                <td className="py-2.5 pr-4">{row.network}</td>
                <td className="py-2.5 pr-4">{(row.volToLiq * 100).toFixed(0)}%</td>
                <td className="py-2.5 pr-4">
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      row.isTrending ? 'bg-green-500/20 text-green-300' : 'bg-blue-500/20 text-blue-300'
                    }`}
                  >
                    {row.signal}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((row, i) => (
        <SmartFlowCard key={`${row.pair}-${row.network}-${i}`} row={row} />
      ))}
    </div>
  );
}
