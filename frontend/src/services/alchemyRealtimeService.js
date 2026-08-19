/**
 * Alchemy WebSocket log subscriptions for TokenFactory / DEXFactory deploys.
 * Uses the existing REACT_APP_ALCHEMY_API_KEY (HTTP + WSS on *.g.alchemy.com).
 */

import { ethers } from 'ethers';
import { getContractAddresses, isZeroEvmAddress } from '../config/contracts';
import alchemyService from './alchemyService';

export const TOKEN_DEPLOYED_TOPIC = ethers.id(
  'TokenDeployed(address,address,string,string,uint8,uint256,uint256,uint256)'
);
export const PAIR_CREATED_TOPIC = ethers.id('PairCreated(address,address,address,uint256)');

const iface = new ethers.Interface([
  'event TokenDeployed(address indexed tokenAddress, address indexed owner, string name, string symbol, uint8 plan, uint256 serviceFee, uint256 chainId, uint256 timestamp)',
  'event PairCreated(address indexed token0, address indexed token1, address pair, uint256)',
]);

export function getAlchemyWsUrl(chainId) {
  const http = alchemyService.getRpcUrl(chainId);
  if (!http) return null;
  return http.replace(/^https:/, 'wss:');
}

function decodeLog(log, chainId) {
  const topic0 = (log?.topics?.[0] || '').toLowerCase();
  const txHash = log?.transactionHash || log?.transaction_hash || '';
  const base = {
    chainId: Number(chainId),
    txHash,
    logIndex: log?.index ?? log?.logIndex ?? 0,
    source: 'alchemy-ws',
    ts: Date.now(),
  };
  try {
    if (topic0 === TOKEN_DEPLOYED_TOPIC.toLowerCase()) {
      const parsed = iface.parseLog({ topics: log.topics, data: log.data });
      return {
        ...base,
        type: 'token_deployed',
        tokenAddress: parsed.args.tokenAddress,
        owner: parsed.args.owner,
        name: parsed.args.name,
        symbol: parsed.args.symbol,
      };
    }
    if (topic0 === PAIR_CREATED_TOPIC.toLowerCase()) {
      const parsed = iface.parseLog({ topics: log.topics, data: log.data });
      return {
        ...base,
        type: 'pair_created',
        tokenAddress: parsed.args.pair,
        token0: parsed.args.token0,
        token1: parsed.args.token1,
        pair: parsed.args.pair,
      };
    }
  } catch {
    /* fall through to topic-only decode */
  }
  if (topic0 === TOKEN_DEPLOYED_TOPIC.toLowerCase()) {
    return {
      ...base,
      type: 'token_deployed',
      tokenAddress: log.topics?.[1] ? ethers.getAddress(ethers.dataSlice(log.topics[1], 12)) : null,
    };
  }
  if (topic0 === PAIR_CREATED_TOPIC.toLowerCase()) {
    return {
      ...base,
      type: 'pair_created',
      token0: log.topics?.[1] ? ethers.getAddress(ethers.dataSlice(log.topics[1], 12)) : null,
      token1: log.topics?.[2] ? ethers.getAddress(ethers.dataSlice(log.topics[2], 12)) : null,
    };
  }
  return null;
}

function factoryAddresses(chainId) {
  const contracts = getContractAddresses(chainId);
  if (!contracts) return [];
  const out = [];
  for (const key of ['tokenFactory', 'dexFactory']) {
    const addr = contracts[key];
    if (typeof addr === 'string' && !isZeroEvmAddress(addr)) out.push(addr);
  }
  return out;
}

/**
 * Subscribe to TokenDeployed + PairCreated on the chain's configured factories.
 * @param {number} chainId
 * @param {(event: object) => void} onEvent
 * @returns {() => void}
 */
export function subscribeFactoryLogs(chainId, onEvent) {
  const wsUrl = getAlchemyWsUrl(chainId);
  const addresses = factoryAddresses(chainId);
  if (!wsUrl || !addresses.length || typeof WebSocket === 'undefined') return null;

  let provider = null;
  let closed = false;
  let delay = 1500;

  const attach = async () => {
    if (closed) return;
    try {
      provider = new ethers.WebSocketProvider(wsUrl, Number(chainId));
      const filter = {
        address: addresses,
        topics: [[TOKEN_DEPLOYED_TOPIC, PAIR_CREATED_TOPIC]],
      };
      provider.on(filter, (log) => {
        const event = decodeLog(log, chainId);
        if (event) onEvent(event);
      });
      delay = 1500;
    } catch (err) {
      console.warn('Alchemy websocket subscribe failed:', err?.message || err);
      try {
        await provider?.destroy?.();
      } catch {
        /* ignore */
      }
      provider = null;
      if (closed) return;
      const wait = delay;
      delay = Math.min(30_000, delay * 2);
      setTimeout(attach, wait);
    }
  };

  attach();

  return () => {
    closed = true;
    try {
      provider?.destroy?.();
    } catch {
      /* ignore */
    }
  };
}

export function eventKey(event) {
  if (!event) return '';
  return [
    event.source || '',
    event.type || '',
    event.chainId || event.chainSlug || '',
    event.txHash || '',
    event.tokenAddress || '',
    event.logIndex ?? '',
  ].join(':');
}

const alchemyRealtimeService = {
  getAlchemyWsUrl,
  subscribeFactoryLogs,
  eventKey,
  TOKEN_DEPLOYED_TOPIC,
  PAIR_CREATED_TOPIC,
};

export default alchemyRealtimeService;
