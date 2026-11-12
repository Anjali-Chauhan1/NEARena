# NEARena Web3 Integration Guide

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env.local
```

Key variables:
- `NEXT_PUBLIC_NEAR_CONTRACT_NAME` — Deployed BTQ contract account (e.g. `btq-token.testnet`)
- `NEXT_PUBLIC_NEAR_NETWORK_ID` — `testnet` (default) or `mainnet`
- `NEXT_PUBLIC_BTQ_RATE_NEAR_PER_BTQ` — Exchange rate shown in the UI; must match the contract's on-chain `rate`

### 3. Create a contract account & deploy BTQ

Install `near-cli-rs` if you don't have it: https://github.com/near/near-cli-rs

> **Windows:** `near-sdk-js`'s build step refuses to run under native Windows. Run `npm run contract:build` (and `near-cli-rs` commands) inside WSL or another Linux/macOS shell. The Next.js app itself builds fine natively on Windows.

```bash
# Create a funded testnet account (auto-faucet)
near account create-account sponsor-by-faucet-service btq-token.testnet autogenerate-new-keypair save-to-keychain network-config testnet create

# Build the contract
npm run contract:build

# Deploy + initialize
NEXT_PUBLIC_NEAR_CONTRACT_NAME=btq-token.testnet npm run contract:deploy
```

Add the deployed account to `.env.local`:
```
NEXT_PUBLIC_NEAR_CONTRACT_NAME=btq-token.testnet
```

### 4. Run Application
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000), connect a NEAR wallet, and buy BTQ!

---

## Architecture

### Frontend (Next.js + React)

**Provider:**
- `NearWalletProvider` (`src/components/providers/NearWalletProvider.tsx`) — wraps the app with `@near-wallet-selector/core`, configured with Meteor Wallet and HERE Wallet modules (MyNearWallet is retired and no longer accepts app connections).

**Lib (`src/lib/near/`):**
- `config.ts` — network + contract id from env
- `contract.ts` — `viewMethod`/`callMethod` wrappers around `near-api-js`, plus `ftBalanceOf`, `storageBalanceOf`, `ensureStorageDeposit`
- `format.ts` — yoctoNEAR/yoctoBTQ string <-> number helpers
- `hooks.ts` — `useAccount`, `useWriteContract`, `useFtBalance`, `useNearBalance`, `useDisconnect`, `useWalletModal` (drop-in replacements for the wagmi hooks the EVM version used)

**Components:**
- `ConnectWallet` — opens the wallet-selector modal; stores the connected `accountId` in `localStorage` as the player id
- `WalletPanel` — shows NEAR + BTQ balance, Buy/Sell BTQ

**Pages:**
- `Lobby` — Connect Wallet button + `WalletPanel` in header
- `Profile` — Wallet status, BTQ balance, Buy/Sell BTQ form

### Smart Contract (`contracts-near/`, near-sdk-js)

A hand-rolled NEP-141-style fungible token (`contracts-near/src/contract.ts`):
- `ft_balance_of`, `ft_total_supply`, `ft_metadata`, `ft_transfer`, `ft_transfer_call` — standard FT surface
- `storage_deposit` / `storage_balance_of` — NEP-145 account registration (required once per account before it can hold BTQ)
- `buy()` — payable; converts attached NEAR deposit into BTQ at `rate`
- `sell({ amount })` — burns BTQ and returns NEAR at `rate`
- `burn({ amount })` — burns the caller's own BTQ (used by the game client to lock a stake / pay a penalty)
- `record_game_win({ reward_amount })` — mints a reward to the caller. **Not signature-gated** — fine for a hackathon demo, but a production build must verify the win server-side (e.g. via a backend oracle call) before minting.
- `set_rate` / `withdraw` — owner-only

---

## Player Differentiation

When a user connects a wallet:
1. `ConnectWallet` opens the wallet-selector modal and captures the chosen NEAR `accountId` (e.g. `yourname.testnet`)
2. Stored in `localStorage` as `nearena_user` (shortened) and `nearena_wallet_id` (full accountId)
3. Replaces guest ID; used throughout the game as the player identifier
4. The contract tracks BTQ balances per NEAR account

---

## Rate & Economics

**Default:** 1 BTQ = 0.001 NEAR (set in the contract's `rate`, expressed as yoctoNEAR per whole BTQ)

To adjust the rate after deployment (owner account only):
```bash
near contract call-function as-transaction $NEXT_PUBLIC_NEAR_CONTRACT_NAME set_rate json-args '{"new_rate": "2000000000000000000000"}' prepaid-gas '30 Tgas' attached-deposit '0 NEAR' sign-as <owner>.testnet network-config testnet sign-with-keychain send
```

---

## Testing Locally

1. Create/fund a testnet account via `near account create-account sponsor-by-faucet-service`, or create one directly in Meteor Wallet (switched to testnet)
2. Deploy BTQ via `npm run contract:build && npm run contract:deploy`
3. Set `NEXT_PUBLIC_NEAR_CONTRACT_NAME` in `.env.local`
4. Run `npm run dev`, connect a wallet, and buy/sell BTQ to test

---

## Troubleshooting

### "Wallet not connected"
Click **Connect NEAR Wallet** in the Lobby header and approve the connection in the modal.

### Transaction fails with a storage/registration error
`useWriteContract` calls `storage_deposit` automatically before any other contract call if the connected account isn't registered yet, but it needs ~0.00125 NEAR available to cover it.

### "Insufficient funds"
Get testnet NEAR from the [NEAR testnet faucet](https://near-faucet.io/) or via `near account create-account sponsor-by-faucet-service`.

---

## Environment Variables Reference

```bash
# Frontend
NEXT_PUBLIC_SOCKET_URL=http://127.0.0.1:3001
NEXT_PUBLIC_NEAR_NETWORK_ID=testnet
NEXT_PUBLIC_NEAR_NODE_URL=https://test.rpc.fastnear.com
NEXT_PUBLIC_NEAR_CONTRACT_NAME=btq-token.testnet
NEXT_PUBLIC_BTQ_RATE_NEAR_PER_BTQ=0.001
```

---

## Next Steps

- **Testnet Testing** — exercise buy/sell/burn/record_game_win end-to-end with a real wallet
- **Signature-gated rewards** — move `record_game_win` behind a backend oracle call before mainnet
- **NEAR Chain Signatures / Intents** — stretch goal for a cross-chain stake angle
- **Shade Agent AI opponent** — stretch goal, strong fit given NEARena's tactical theme
