import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  canSignOnChainType,
  encodeAllowance,
  encodeApprove,
  explainLifiError,
  explainStatus,
  formatDuration,
  formatUsd,
  fromBaseUnits,
  isNativeTokenAddress,
  isValidAddressForChain,
  looksLikeTokenAddress,
  matchTokenOnChain,
  normalizeChain,
  normalizeToken,
  packTokens,
  previewAddressForChain,
  sanitizeAmount,
  searchChains,
  searchTokens,
  sortChains,
  sortTokensPopular,
  summarizeQuote,
  toBaseUnits,
  unpackTokens,
} from '../src/utils/lifiCore.js';
import { buildLifiPassthroughParams } from '../../backend/src/services/aggregatorProxy.js';

const tok = (symbol, address, extra = {}) => normalizeToken({ chainId: 42161, symbol, name: extra.name || symbol, address, decimals: 18, verificationStatus: 'verified', ...extra });
const ARB_LIST = [
  tok('ETH', '0x0000000000000000000000000000000000000000', { coinKey: 'ETH' }),
  tok('ARBY', '0x1111111111111111111111111111111111111111', { name: 'Arby', verificationStatus: 'unverified' }),
  tok('ARB', '0x912CE59144191C1204E64559FE8253a0e49E6548', { name: 'Arbitrum', coinKey: 'ARB' }),
  tok('USDC', '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', { coinKey: 'USDC', decimals: 6 }),
  tok('MAGIC', '0x539bdE0d7Dbd336b79148AA742883198BBF60342', { name: 'Treasure arb game' }),
];

test('chains: normalise, popular-first sort, search, who can sign', () => {
  const chains = sortChains(
    [
      { id: 728126428, key: 'trn', name: 'Tron', chainType: 'TVM' },
      { id: 1151111081099710, key: 'sol', name: 'Solana', chainType: 'SVM' },
      { id: 8453, key: 'bas', name: 'Base', chainType: 'EVM' },
      { id: 1, key: 'eth', name: 'Ethereum', chainType: 'EVM' },
      { id: 20000000000001, key: 'btc', name: 'Bitcoin', chainType: 'UTXO' },
      { id: 100, key: 'dai', name: 'Gnosis', chainType: 'EVM' },
    ].map(normalizeChain)
  );
  assert.deepEqual(chains.map((c) => c.name), ['Ethereum', 'Base', 'Solana', 'Bitcoin', 'Gnosis', 'Tron']);
  assert.deepEqual(searchChains(chains, 'sol').map((c) => c.name), ['Solana']);
  assert.deepEqual(searchChains(chains, 'btc').map((c) => c.name), ['Bitcoin']);
  assert.deepEqual(searchChains(chains, '8453').map((c) => c.name), ['Base']);
  assert.equal(canSignOnChainType('EVM'), true);
  assert.equal(canSignOnChainType('SVM'), true);
  assert.equal(canSignOnChainType('UTXO'), false);
});

test('tokens: search by symbol, name and address; popular order; pack round-trip', () => {
  assert.deepEqual(searchTokens(ARB_LIST, 'arb').map((t) => t.symbol), ['ARB', 'ARBY', 'MAGIC']);
  assert.deepEqual(searchTokens(ARB_LIST, 'Arbitrum').map((t) => t.symbol), ['ARB']);
  assert.deepEqual(searchTokens(ARB_LIST, '0x912ce59144191c1204e64559fe8253a0e49e6548').map((t) => t.symbol), ['ARB']);
  assert.deepEqual(searchTokens(ARB_LIST, '').length, 5);
  assert.deepEqual(sortTokensPopular(ARB_LIST).map((t) => t.symbol).slice(0, 3), ['ETH', 'USDC', 'ARB']);
  const packed = unpackTokens(42161, packTokens(ARB_LIST));
  assert.deepEqual(packed.map((t) => [t.symbol, t.address, t.decimals, t.verified]), ARB_LIST.map((t) => [t.symbol, t.address, t.decimals, t.verified]));
});

test('same asset on another chain, else the gas token', () => {
  const base = [tok('ETH', '0x0000000000000000000000000000000000000000', { chainId: 8453, coinKey: 'ETH' }), tok('USDC', '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', { chainId: 8453, coinKey: 'USDC' })];
  assert.equal(matchTokenOnChain(ARB_LIST[3], base).symbol, 'USDC');
  assert.equal(matchTokenOnChain(ARB_LIST[2], base).symbol, 'ETH');
  assert.equal(matchTokenOnChain(null, base).symbol, 'ETH');
});

test('addresses per chain type; preview addresses only for EVM, Solana and Bitcoin', () => {
  const evm = { chainType: 'EVM' };
  const sol = { chainType: 'SVM' };
  const btc = { chainType: 'UTXO', key: 'btc' };
  const tron = { chainType: 'TVM' };
  assert.equal(isValidAddressForChain('0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0', evm), true);
  assert.equal(isValidAddressForChain('0x1234', evm), false);
  assert.equal(isValidAddressForChain('4Nd1mBQtrMJVYVfKf2PJy9NZUZdTAsp7D4xWLs4gDB4T', sol), true);
  assert.equal(isValidAddressForChain('0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0', sol), false);
  assert.equal(isValidAddressForChain('bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', btc), true);
  assert.equal(isValidAddressForChain('TQrY8tryqsYVCYS3MFbtffiPp2ccyn4STm', tron), true);
  assert.equal(looksLikeTokenAddress('DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', 'SVM'), true);
  assert.equal(looksLikeTokenAddress('BONK', 'SVM'), false);
  assert.ok(previewAddressForChain(evm));
  assert.ok(previewAddressForChain(sol));
  assert.ok(previewAddressForChain(btc));
  assert.equal(previewAddressForChain(tron), null);
  assert.equal(isNativeTokenAddress('0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'), true);
  assert.equal(isNativeTokenAddress('11111111111111111111111111111111'), true);
});

test('amounts: exact base units, display, usd, duration', () => {
  assert.equal(toBaseUnits('1.5', 6), '1500000');
  assert.equal(toBaseUnits('0.000001', 6), '1');
  assert.equal(toBaseUnits('0.0000001', 6), null);
  assert.equal(toBaseUnits('5', 18), '5000000000000000000');
  assert.equal(toBaseUnits('abc', 18), null);
  assert.equal(fromBaseUnits('4957903', 6), '4.957903');
  assert.equal(fromBaseUnits('1234567000000', 6), '1,234,567');
  assert.equal(fromBaseUnits('2848', 18), '0.00000000000000284');
  assert.equal(sanitizeAmount('1,5x.2'), '1.52');
  assert.equal(formatUsd('4.9542'), '$4.95');
  assert.equal(formatUsd(0.001), '<$0.01');
  assert.equal(formatDuration(19), '~19 sec');
  assert.equal(formatDuration(1380), '~23 min');
});

test('quote summary: fees, platform fee share, gas, steps', () => {
  const usdc = { address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', symbol: 'USDC', decimals: 6, chainId: 42161 };
  const s = summarizeQuote({
    id: 'q1',
    tool: 'across',
    toolDetails: { name: 'AcrossV4', logoURI: 'x' },
    action: { fromChainId: 42161, toChainId: 8453, fromToken: usdc, toToken: { ...usdc, chainId: 8453 }, slippage: 0.005, fromAmount: '5000000' },
    estimate: {
      fromAmount: '5000000',
      toAmount: '4957903',
      toAmountMin: '4950000',
      executionDuration: 19,
      fromAmountUSD: '4.99',
      toAmountUSD: '4.95',
      approvalAddress: '0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE',
      feeCosts: [
        { name: 'LIFI Fixed Fee', amount: '37500', amountUSD: '0.0375', included: true, token: usdc, feeSplit: { lifiFee: '12500', integratorFee: '25000' } },
        { name: 'Relayer fee', amount: '496', amountUSD: '0.0005', included: true, token: usdc },
      ],
      gasCosts: [{ amount: '100000000000000', amountUSD: '0.02', token: { symbol: 'ETH', decimals: 18, address: '0x0000000000000000000000000000000000000000' } }],
    },
    includedSteps: [
      { type: 'protocol', tool: 'feeCollection', action: { fromChainId: 42161, toChainId: 42161, fromToken: usdc, toToken: usdc } },
      { type: 'cross', toolDetails: { name: 'AcrossV4' }, action: { fromChainId: 42161, toChainId: 8453, fromToken: usdc, toToken: usdc } },
    ],
    transactionRequest: { to: '0x1', data: '0xabc' },
  });
  assert.equal(s.toolName, 'AcrossV4');
  assert.equal(s.toAmount, '4957903');
  assert.equal(s.platformFeeAmount, '25000');
  assert.ok(Math.abs(s.platformFeeUSD - 0.025) < 1e-9);
  assert.ok(Math.abs(s.feesUSD - 0.038) < 1e-9);
  assert.equal(s.gasUSD, 0.02);
  assert.equal(s.steps.length, 2);
  assert.equal(s.steps[1].type, 'cross');
  assert.equal(s.hasTransaction, true);
});

test('errors and status in plain language', () => {
  assert.match(explainLifiError({ code: 1002, message: 'No available quotes for the requested transfer' }), /No route found/);
  assert.match(explainLifiError({ code: 1001, message: 'None of the available routes could successfully generate a tx' }), /No route found/);
  assert.match(explainLifiError({ status: 429, message: 'Too Many Requests' }), /Too many/);
  assert.match(explainLifiError({ code: 1011, message: 'Token 8453-0xbad is invalid or in deny list.' }), /token address is not valid/);
  assert.match(explainLifiError({ code: 4001, message: 'User rejected the request.' }), /cancelled/);
  assert.match(explainLifiError({ message: 'insufficient funds for gas * price + value' }, { fromSymbol: 'ETH' }), /enough ETH/);
  assert.match(explainLifiError({ message: 'Failed to fetch' }), /Couldn't reach/);
  assert.equal(explainStatus({ status: 'DONE', substatus: 'COMPLETED' }).state, 'done');
  assert.equal(explainStatus({ status: 'DONE', substatus: 'REFUNDED' }).state, 'refunded');
  assert.equal(explainStatus({ status: 'PENDING', substatus: 'WAIT_DESTINATION_TRANSACTION' }).text, 'Sent. Waiting for the destination network…');
  assert.equal(explainStatus({ status: 'FAILED' }).state, 'failed');
  assert.equal(explainStatus({ status: 'NOT_FOUND' }).state, 'pending');
});

test('ERC-20 allowance / approve calldata', () => {
  const owner = '0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0';
  const spender = '0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE';
  assert.equal(encodeAllowance(owner, spender), `0xdd62ed3e${'0'.repeat(24)}552008c0f6870c2f77e5cc1d2eb9bdff03e30ea0${'0'.repeat(24)}1231deb6f5749ef6ce6943a275a1d3e7486f4eae`);
  assert.equal(encodeApprove(spender, 5000000n), `0x095ea7b3${'0'.repeat(24)}1231deb6f5749ef6ce6943a275a1d3e7486f4eae${(5000000).toString(16).padStart(64, '0')}`);
});

test('Worker LI.FI quote pass-through: any chain, fee only cross-chain, input checks', () => {
  const q = { fromChain: '1151111081099710', toChain: '42161', fromToken: '11111111111111111111111111111111', toToken: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', fromAmount: '100000000', fromAddress: '4Nd1mBQtrMJVYVfKf2PJy9NZUZdTAsp7D4xWLs4gDB4T', toAddress: '0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0', slippage: '0.01' };
  const { params } = buildLifiPassthroughParams(q, 0.005);
  assert.equal(params.get('fee'), '0.005');
  assert.equal(params.get('integrator'), 'boing.finance');
  assert.equal(params.get('toAddress'), q.toAddress);
  assert.equal(params.get('order'), 'CHEAPEST');
  assert.equal(buildLifiPassthroughParams({ ...q, toChain: q.fromChain }, 0.005).params.get('fee'), null);
  assert.match(buildLifiPassthroughParams({ ...q, fromAmount: '0' }, 0.005).error, /fromAmount/);
  assert.match(buildLifiPassthroughParams({ ...q, toAddress: 'bad addr&x=1' }, 0.005).error, /toAddress/);
  assert.match(buildLifiPassthroughParams({ ...q, slippage: '0.9' }, 0.005).error, /slippage/);
});
