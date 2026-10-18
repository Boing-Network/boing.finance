/**
 * Runs a LI.FI quote step in the user's wallet. EVM: switch network → approve (exact amount, only if needed)
 * → send the LI.FI transaction. Solana: sign the LI.FI versioned transaction and send it.
 * Everything goes through the raw wallet provider, so any LI.FI chain works even if the app has no config for it.
 */
import { encodeAllowance, encodeApprove, isNativeTokenAddress } from '../utils/lifiCore';
import { getSolanaMainnetConnection } from './solanaBalances';

const toHex = (n) => `0x${BigInt(n).toString(16)}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
/** USDT on Ethereum refuses approve(x) while the allowance is non-zero. */
const RESET_APPROVAL_FIRST = new Set(['1:0xdac17f958d2ee523a2206206994597c13d831ec7']);

async function waitForReceipt(raw, hash, { timeoutMs = 10 * 60 * 1000 } = {}) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const r = await raw.request({ method: 'eth_getTransactionReceipt', params: [hash] }).catch(() => null);
    if (r && r.blockNumber) {
      if (r.status === '0x0' || r.status === 0) throw new Error('The transaction failed on-chain (reverted). Nothing was bridged; only gas was spent.');
      return r;
    }
    await sleep(2500);
  }
  throw new Error('Still waiting for the network to confirm. Check your wallet activity.');
}

export async function ensureEvmChain(raw, chain) {
  const current = Number(await raw.request({ method: 'eth_chainId' }));
  if (current === Number(chain.id)) return;
  const chainIdHex = toHex(chain.id);
  try {
    await raw.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: chainIdHex }] });
  } catch (e) {
    const code = e?.code ?? e?.data?.originalError?.code;
    if (code !== 4902 && !/unrecognized|not added|unknown chain/i.test(String(e?.message))) throw e;
    const mm = chain.metamask || {};
    await raw.request({
      method: 'wallet_addEthereumChain',
      params: [
        {
          chainId: chainIdHex,
          chainName: mm.chainName || chain.name,
          nativeCurrency: mm.nativeCurrency || { name: chain.coin, symbol: chain.coin, decimals: 18 },
          rpcUrls: mm.rpcUrls || [],
          blockExplorerUrls: mm.blockExplorerUrls || [],
        },
      ],
    });
  }
  for (let i = 0; i < 10; i += 1) {
    if (Number(await raw.request({ method: 'eth_chainId' })) === Number(chain.id)) return;
    await sleep(500);
  }
  throw new Error(`Switch your wallet to ${chain.name} and try again.`);
}

/**
 * @param {{ raw: any, account: string, chain: any, step: any, onProgress: (phase: string, info?: any) => void }} p
 * @returns {Promise<string>} source transaction hash
 */
export async function executeEvmStep({ raw, account, chain, step, onProgress }) {
  onProgress('switch');
  await ensureEvmChain(raw, chain);
  const tx = step.transactionRequest;
  const fromToken = step.action?.fromToken?.address;
  const spender = step.estimate?.approvalAddress;
  const amount = BigInt(step.action?.fromAmount || step.estimate?.fromAmount || 0);
  if (!isNativeTokenAddress(fromToken) && spender && amount > 0n) {
    const res = await raw.request({ method: 'eth_call', params: [{ to: fromToken, data: encodeAllowance(account, spender) }, 'latest'] });
    const allowance = BigInt(res && res !== '0x' ? res : 0);
    if (allowance < amount) {
      if (allowance > 0n && RESET_APPROVAL_FIRST.has(`${chain.id}:${String(fromToken).toLowerCase()}`)) {
        onProgress('approve-reset');
        const h0 = await raw.request({ method: 'eth_sendTransaction', params: [{ from: account, to: fromToken, data: encodeApprove(spender, 0) }] });
        await waitForReceipt(raw, h0);
      }
      onProgress('approve');
      const h = await raw.request({ method: 'eth_sendTransaction', params: [{ from: account, to: fromToken, data: encodeApprove(spender, amount) }] });
      onProgress('approve-wait', { txHash: h });
      await waitForReceipt(raw, h);
    }
  }
  onProgress('send');
  const params = { from: account, to: tx.to, data: tx.data, value: tx.value ? toHex(tx.value) : '0x0' };
  if (tx.gasLimit) params.gas = toHex(tx.gasLimit);
  const hash = await raw.request({ method: 'eth_sendTransaction', params: [params] });
  onProgress('sent', { txHash: hash });
  await waitForReceipt(raw, hash);
  onProgress('confirmed', { txHash: hash });
  return hash;
}

function b64ToBytes(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
}

/** @returns {Promise<string>} Solana signature */
export async function executeSolanaStep({ wallet, step, onProgress }) {
  if (!wallet?.signTransaction && !wallet?.signAndSendTransaction) throw new Error('Connect a Solana wallet (Phantom, Solflare…) to send from Solana.');
  const { VersionedTransaction } = await import('@solana/web3.js');
  const tx = VersionedTransaction.deserialize(b64ToBytes(step.transactionRequest.data));
  const conn = await getSolanaMainnetConnection();
  onProgress('send');
  let signature;
  if (typeof wallet.signAndSendTransaction === 'function') {
    const res = await wallet.signAndSendTransaction(tx);
    signature = res?.signature || res;
  } else {
    const signed = await wallet.signTransaction(tx);
    signature = await conn.sendRawTransaction(signed.serialize(), { skipPreflight: false, maxRetries: 3 });
  }
  onProgress('sent', { txHash: signature });
  for (let i = 0; i < 60; i += 1) {
    const { value } = await conn.getSignatureStatuses([signature]).catch(() => ({ value: [] }));
    const st = value?.[0];
    if (st?.err) throw new Error('The Solana transaction failed. Nothing was bridged; only the network fee was spent.');
    if (st?.confirmationStatus === 'confirmed' || st?.confirmationStatus === 'finalized') break;
    await sleep(2000);
  }
  onProgress('confirmed', { txHash: signature });
  return signature;
}
