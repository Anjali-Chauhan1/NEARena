# BTQ Token Contract (near-sdk-js)

A NEP-141-style fungible token contract for NEARena's BTQ in-game currency.

## Build

```bash
npm install
npm run build
```

Produces `build/btq_token.wasm`.

**Windows note:** `near-sdk-js`'s install step refuses to run under native Windows (`Platform win32 is not supported`). Run `npm install`/`npm run build` inside WSL (or any Linux/macOS shell) instead — the rest of the repo (Next.js app) builds fine natively on Windows.

## Deploy (testnet)

Requires [`near-cli-rs`](https://github.com/near/near-cli-rs).

```bash
# One-time: create the contract account (auto-funded via faucet)
near account create-account sponsor-by-faucet-service btq-token.testnet autogenerate-new-keypair save-to-keychain network-config testnet create

# Deploy + init
near contract deploy btq-token.testnet use-file build/btq_token.wasm \
  with-init-call init json-args '{}' prepaid-gas '100 Tgas' attached-deposit '0 NEAR' \
  network-config testnet sign-with-keychain send
```

Then set `NEXT_PUBLIC_NEAR_CONTRACT_NAME=btq-token.testnet` in the app's `.env.local`.

## Methods

- `ft_balance_of`, `ft_total_supply`, `ft_metadata`, `ft_transfer`, `ft_transfer_call` — NEP-141 surface
- `storage_deposit`, `storage_balance_of`, `storage_balance_bounds` — NEP-145 account registration
- `buy()` — payable; mints BTQ for attached NEAR at `rate`
- `sell({ amount })` — burns BTQ, returns NEAR at `rate`
- `burn({ amount })` — burns the caller's own BTQ
- `record_game_win({ reward_amount })` — mints a reward to the caller
- `set_rate({ new_rate })`, `get_rate()`, `withdraw()` — owner-only (except `get_rate`)
