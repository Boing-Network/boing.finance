import {
  encodeReferenceSetMetadataHashCalldata,
  referenceNftTokenIdWordFromU64,
} from 'boing-sdk';
import { boingExpressContractCallSignSimulateSubmit } from './boingExpressNativeTx';
import { pickExpressProviderForDeploy } from './boingNativeLaunchWizardDeploy';

function bytesToHex(bytes) {
  let s = '0x';
  for (let i = 0; i < bytes.length; i++) {
    s += bytes[i].toString(16).padStart(2, '0');
  }
  return s;
}

export function encodeReferenceSetMetadataHashCalldataHex(tokenIdHex32, metadataHashHex32) {
  return bytesToHex(encodeReferenceSetMetadataHashCalldata(tokenIdHex32, metadataHashHex32));
}

/**
 * Bind uploaded collection metadata to token id 1 via reference `set_metadata_hash`.
 * Best-effort: collection `description_hash` is already committed at deploy.
 */
export async function commitReferenceNftMetadataHash({
  getWalletProvider,
  collectionAccountId,
  metadataHashHex32,
  tokenId = 1n,
}) {
  const contract = String(collectionAccountId || '').trim();
  const hash = String(metadataHashHex32 || '').trim();
  if (!/^0x[0-9a-fA-F]{64}$/.test(contract)) {
    throw new Error('Collection AccountId is not a 32-byte hex id.');
  }
  if (!/^0x[0-9a-fA-F]{64}$/.test(hash)) {
    throw new Error('Metadata hash must be 32-byte hex.');
  }
  const p = pickExpressProviderForDeploy(getWalletProvider);
  if (!p) {
    throw new Error('Boing Express provider not found.');
  }
  const tokenIdHex32 = referenceNftTokenIdWordFromU64(tokenId);
  const calldata = encodeReferenceSetMetadataHashCalldataHex(tokenIdHex32, hash);
  return boingExpressContractCallSignSimulateSubmit(p, {
    type: 'contract_call',
    contract,
    calldata,
  });
}
