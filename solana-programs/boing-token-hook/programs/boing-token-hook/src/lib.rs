//! Token-2022 transfer hook that enforces optional launch / security policy.
//!
//! Extra accounts resolved on every transfer:
//! - policy PDA `["policy", mint]`
//! - cooldown PDA `["cooldown", mint, owner]` (writable)

use anchor_lang::{
    prelude::*,
    system_program::{create_account, CreateAccount},
};
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};
use spl_tlv_account_resolution::{account::ExtraAccountMeta, seeds::Seed, state::ExtraAccountMetaList};
use spl_transfer_hook_interface::instruction::{ExecuteInstruction, TransferHookInstruction};

declare_id!("EoytrX6g2iN8t2ujH1oJE7cfQiDHJeaiKSBoVVVvzmKu");

pub const POLICY_SEED: &[u8] = b"policy";
pub const EXTRA_ACCOUNT_METAS_SEED: &[u8] = b"extra-account-metas";
pub const COOLDOWN_SEED: &[u8] = b"cooldown";

#[program]
pub mod boing_token_hook {
    use super::*;

    pub fn initialize_policy(ctx: Context<InitializePolicy>, params: PolicyParams) -> Result<()> {
        let policy = &mut ctx.accounts.policy;
        policy.authority = ctx.accounts.authority.key();
        policy.mint = ctx.accounts.mint.key();
        policy.apply(params);
        policy.bump = ctx.bumps.policy;
        Ok(())
    }

    pub fn update_policy(ctx: Context<UpdatePolicy>, params: PolicyParams) -> Result<()> {
        ctx.accounts.policy.apply(params);
        Ok(())
    }

    pub fn set_paused(ctx: Context<UpdatePolicy>, paused: bool) -> Result<()> {
        ctx.accounts.policy.paused = paused;
        Ok(())
    }

    pub fn initialize_wallet_cooldown(ctx: Context<InitializeWalletCooldown>) -> Result<()> {
        let cooldown = &mut ctx.accounts.cooldown;
        cooldown.last_transfer_ts = 0;
        cooldown.bump = ctx.bumps.cooldown;
        Ok(())
    }

    pub fn initialize_extra_account_meta_list(
        ctx: Context<InitializeExtraAccountMetaList>,
    ) -> Result<()> {
        let extra_metas = extra_account_metas()?;
        let account_size = ExtraAccountMetaList::size_of(extra_metas.len())?;
        let lamports = Rent::get()?.minimum_balance(account_size);

        let mint_key = ctx.accounts.mint.key();
        let bump = ctx.bumps.extra_account_meta_list;
        let seeds: &[&[u8]] = &[EXTRA_ACCOUNT_METAS_SEED, mint_key.as_ref(), &[bump]];
        create_account(
            CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                CreateAccount {
                    from: ctx.accounts.payer.to_account_info(),
                    to: ctx.accounts.extra_account_meta_list.to_account_info(),
                },
                &[seeds],
            ),
            lamports,
            account_size as u64,
            ctx.program_id,
        )?;

        ExtraAccountMetaList::init::<ExecuteInstruction>(
            &mut ctx.accounts.extra_account_meta_list.try_borrow_mut_data()?,
            &extra_metas,
        )?;
        Ok(())
    }

    pub fn transfer_hook(ctx: Context<TransferHook>, amount: u64) -> Result<()> {
        enforce(&ctx.accounts.policy, &ctx.accounts.destination_token, &mut ctx.accounts.cooldown, amount)
    }

    pub fn fallback<'info>(
        program_id: &Pubkey,
        accounts: &'info [AccountInfo<'info>],
        data: &[u8],
    ) -> Result<()> {
        let instruction = TransferHookInstruction::unpack(data)?;
        match instruction {
            TransferHookInstruction::Execute { amount } => {
                let amount_bytes = amount.to_le_bytes();
                __private::__global::transfer_hook(program_id, accounts, &amount_bytes)
            }
            _ => Err(ProgramError::InvalidInstructionData.into()),
        }
    }
}

fn extra_account_metas() -> Result<Vec<ExtraAccountMeta>> {
    Ok(vec![
        ExtraAccountMeta::new_with_seeds(
            &[
                Seed::Literal {
                    bytes: POLICY_SEED.to_vec(),
                },
                Seed::AccountKey { index: 1 },
            ],
            false,
            false,
        )?,
        ExtraAccountMeta::new_with_seeds(
            &[
                Seed::Literal {
                    bytes: COOLDOWN_SEED.to_vec(),
                },
                Seed::AccountKey { index: 1 },
                Seed::AccountKey { index: 3 },
            ],
            false,
            true,
        )?,
    ])
}

fn enforce(
    policy: &Account<TokenPolicy>,
    destination: &InterfaceAccount<TokenAccount>,
    cooldown: &mut Account<WalletCooldown>,
    amount: u64,
) -> Result<()> {
    require!(!policy.paused, HookError::Paused);

    if policy.max_tx_amount > 0 {
        require!(amount <= policy.max_tx_amount, HookError::ExceedsMaxTx);
    }

    if policy.max_wallet_amount > 0 {
        let next = destination
            .amount
            .checked_add(amount)
            .ok_or(HookError::Overflow)?;
        require!(next <= policy.max_wallet_amount, HookError::ExceedsMaxWallet);
    }

    let clock = Clock::get()?;
    if policy.antibot_until_slot > 0 && clock.slot < policy.antibot_until_slot && policy.antibot_max_tx > 0 {
        require!(amount <= policy.antibot_max_tx, HookError::AntiBot);
    }

    if policy.cooldown_seconds > 0 {
        if cooldown.last_transfer_ts > 0 {
            let elapsed = clock
                .unix_timestamp
                .saturating_sub(cooldown.last_transfer_ts);
            require!(
                elapsed >= i64::from(policy.cooldown_seconds),
                HookError::Cooldown
            );
        }
        cooldown.last_transfer_ts = clock.unix_timestamp;
    }

    Ok(())
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Default)]
pub struct PolicyParams {
    pub paused: bool,
    pub max_tx_amount: u64,
    pub max_wallet_amount: u64,
    pub cooldown_seconds: u32,
    pub antibot_until_slot: u64,
    pub antibot_max_tx: u64,
}

#[account]
#[derive(Default)]
pub struct TokenPolicy {
    pub authority: Pubkey,
    pub mint: Pubkey,
    pub paused: bool,
    pub max_tx_amount: u64,
    pub max_wallet_amount: u64,
    pub cooldown_seconds: u32,
    pub antibot_until_slot: u64,
    pub antibot_max_tx: u64,
    pub bump: u8,
}

impl TokenPolicy {
    pub const SIZE: usize = 8 + 32 + 32 + 1 + 8 + 8 + 4 + 8 + 8 + 1;

    fn apply(&mut self, params: PolicyParams) {
        self.paused = params.paused;
        self.max_tx_amount = params.max_tx_amount;
        self.max_wallet_amount = params.max_wallet_amount;
        self.cooldown_seconds = params.cooldown_seconds;
        self.antibot_until_slot = params.antibot_until_slot;
        self.antibot_max_tx = params.antibot_max_tx;
    }
}

#[account]
#[derive(Default)]
pub struct WalletCooldown {
    pub last_transfer_ts: i64,
    pub bump: u8,
}

impl WalletCooldown {
    pub const SIZE: usize = 8 + 8 + 1;
}

#[derive(Accounts)]
pub struct InitializePolicy<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(
        init,
        payer = authority,
        space = TokenPolicy::SIZE,
        seeds = [POLICY_SEED, mint.key().as_ref()],
        bump
    )]
    pub policy: Account<'info, TokenPolicy>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdatePolicy<'info> {
    pub authority: Signer<'info>,
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(
        mut,
        seeds = [POLICY_SEED, mint.key().as_ref()],
        bump = policy.bump,
        has_one = authority,
        has_one = mint
    )]
    pub policy: Account<'info, TokenPolicy>,
}

#[derive(Accounts)]
pub struct InitializeWalletCooldown<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    pub mint: InterfaceAccount<'info, Mint>,
    /// CHECK: owner whose transfers are rate-limited
    pub owner: UncheckedAccount<'info>,
    #[account(
        init,
        payer = payer,
        space = WalletCooldown::SIZE,
        seeds = [COOLDOWN_SEED, mint.key().as_ref(), owner.key().as_ref()],
        bump
    )]
    pub cooldown: Account<'info, WalletCooldown>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitializeExtraAccountMetaList<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    pub mint: InterfaceAccount<'info, Mint>,
    /// CHECK: PDA created in this instruction
    #[account(
        mut,
        seeds = [EXTRA_ACCOUNT_METAS_SEED, mint.key().as_ref()],
        bump
    )]
    pub extra_account_meta_list: UncheckedAccount<'info>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct TransferHook<'info> {
    #[account(token::mint = mint, token::authority = owner)]
    pub source_token: InterfaceAccount<'info, TokenAccount>,
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(token::mint = mint)]
    pub destination_token: InterfaceAccount<'info, TokenAccount>,
    /// CHECK: source owner; Token-2022 does not extend signer privileges into the hook
    pub owner: UncheckedAccount<'info>,
    /// CHECK: ExtraAccountMetaList PDA
    #[account(seeds = [EXTRA_ACCOUNT_METAS_SEED, mint.key().as_ref()], bump)]
    pub extra_account_meta_list: UncheckedAccount<'info>,
    #[account(seeds = [POLICY_SEED, mint.key().as_ref()], bump = policy.bump, has_one = mint)]
    pub policy: Account<'info, TokenPolicy>,
    #[account(
        mut,
        seeds = [COOLDOWN_SEED, mint.key().as_ref(), owner.key().as_ref()],
        bump = cooldown.bump
    )]
    pub cooldown: Account<'info, WalletCooldown>,
}

#[error_code]
pub enum HookError {
    #[msg("Transfers are paused")]
    Paused,
    #[msg("Transfer exceeds max transaction amount")]
    ExceedsMaxTx,
    #[msg("Destination would exceed max wallet amount")]
    ExceedsMaxWallet,
    #[msg("Cooldown has not elapsed")]
    Cooldown,
    #[msg("Anti-bot transfer limit")]
    AntiBot,
    #[msg("Arithmetic overflow")]
    Overflow,
}
