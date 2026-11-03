/**
 * Chain type for trading pages. boing.finance trades only on Boing Network (Boing Express);
 * EVM and Solana wallets are used only by the LI.FI bridge page.
 */
export const CHAIN_TYPE_EVM = 'evm';
export const CHAIN_TYPE_SOLANA = 'solana';
export const CHAIN_TYPE_BOING = 'boing';

const BOING_CHAIN_TYPE = Object.freeze({
  chainType: CHAIN_TYPE_BOING,
  setChainType: () => {},
  isSolana: false,
  isEVM: false,
  isBoing: true,
});

export const useChainType = () => BOING_CHAIN_TYPE;
