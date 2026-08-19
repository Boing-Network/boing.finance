import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { BoingTokenHook } from '../target/types/boing_token_hook';

describe('boing_token_hook', () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.BoingTokenHook as Program<BoingTokenHook>;

  it('loads the workspace program', async () => {
    if (!program?.programId) {
      throw new Error('Program IDL missing — run anchor build first');
    }
  });
});
