# Boing token transfer hook

Anchor 0.30 program that Token-2022 can call on every SPL transfer. It enforces the launch features that standard SPL mint/freeze authorities cannot:

- pause
- max transaction amount
- max wallet amount
- per-wallet cooldown
- anti-bot cap until a slot

Mint / freeze / metadata lock stay on the mint itself (already wired in the webapp).

Program id: `EoytrX6g2iN8t2ujH1oJE7cfQiDHJeaiKSBoVVVvzmKu`

## Mock deploy cost (no chain send)

Measured from the compiled `boing_token_hook.so` (**257.2 KB**) using the rent-exempt formula `(128 + bytes) * 6960` lamports, at **$82/SOL**:

| | SOL | USD |
|---|---:|---:|
| Peak wallet debit (includes temp buffer) | **3.67** | ~$301 |
| Locked after buffer closes | **1.84** | ~$150 |
| Buffer (returned after deploy) | 1.83 | ~$150 |

Host needs Docker (this Windows machine does not have `solana` / `cargo-build-sbf` on PATH):

```bash
cd solana-programs/boing-token-hook
bash scripts/docker-build.sh
```

That compiles `target/deploy/boing_token_hook.so` and reprints the table. Peak debit includes the temporary BPF upgrade buffer; after deploy that buffer closes and its rent returns. Program + ProgramData stay rent-exempt until you close them.

If Solana CLI is installed:

```bash
solana-test-validator
solana program deploy target/deploy/boing_token_hook.so --url localhost
```

Devnet/mainnet deploys should wait until the hook is tested against a Token-2022 mint.
