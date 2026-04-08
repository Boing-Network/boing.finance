import { BOING_QA_PURPOSE_TOKEN } from '../config/boingQa';
import { preflightBoingLaunchWizardByKind, executeBoingLaunchWizardDeploy } from './boingNativeLaunchWizardDeploy';

export {
  pickExpressProviderForDeploy,
  getBundledNativeFungibleBytecodeHex,
  computeEffectiveNativeDeployBytecode,
  LEGACY_FUNGIBLE_BYTECODE_ENV,
} from './boingNativeLaunchWizardDeploy';

/**
 * Build the reference fungible `contract_deploy_meta` tx and run `boing_qaCheck` via BoingClient
 * (unified launch path — see `boingNativeLaunchWizardDeploy.js`).
 *
 * @param {object} input
 * @param {string} input.tokenName
 * @param {string} input.tokenSymbol
 * @param {string} [input.customBytecode]
 * @param {string} [input.descriptionHash]
 * @param {Record<string, unknown>} [input.nativeTokenSecurity]
 * @param {string} [input.initialSupply] — human amount for `mintFirstTotalSupplyWei` when max-wallet % is on
 * @param {number} [input.tokenDecimals]
 * @param {string} [input.purpose]
 * @returns {Promise<{ result: string, message?: string, rule_id?: string }>}
 */
export async function preflightReferenceFungibleDeployQa({
  tokenName,
  tokenSymbol,
  customBytecode = '',
  descriptionHash = '',
  nativeTokenSecurity,
  initialSupply,
  tokenDecimals,
  purpose = BOING_QA_PURPOSE_TOKEN,
}) {
  const { qa } = await preflightBoingLaunchWizardByKind('token', {
    tokenName,
    tokenSymbol,
    customBytecode,
    descriptionHash,
    nativeTokenSecurity,
    initialSupply,
    tokenDecimals,
    purpose,
  });
  return qa;
}

/**
 * Run QA + Boing Express `contract_deploy_meta` for reference fungible template flow.
 * @param {object} input
 * @param {() => import('ethers').Eip1193Provider | null} input.getWalletProvider
 * @param {string} input.tokenName
 * @param {string} input.tokenSymbol
 * @param {string} [input.customBytecode]
 * @param {string} [input.descriptionHash]
 * @param {Record<string, unknown>} [input.nativeTokenSecurity]
 * @param {string} [input.initialSupply]
 * @param {number} [input.tokenDecimals]
 * @param {boolean} [input.qaPoolAcknowledged]
 * @returns {Promise<
 *   | { ok: true, txHash: string, boingTxIdHex: string | null, qaResult: object }
 *   | { ok: false, code: string, message: string, qaResult?: object }
 * >}
 */
export async function executeBoingNativeTokenDeploy({
  getWalletProvider,
  tokenName,
  tokenSymbol,
  customBytecode = '',
  descriptionHash = '',
  nativeTokenSecurity,
  initialSupply,
  tokenDecimals,
  qaPoolAcknowledged = false,
}) {
  return executeBoingLaunchWizardDeploy({
    kind: 'token',
    getWalletProvider,
    qaPoolAcknowledged,
    tokenName,
    tokenSymbol,
    customBytecode,
    descriptionHash,
    nativeTokenSecurity,
    initialSupply,
    tokenDecimals,
    purpose: BOING_QA_PURPOSE_TOKEN,
  });
}
