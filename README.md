# NEARena

NEARena is a cyber-tactical arena game built with Next.js, React, Socket.IO, Zustand, `near-wallet-selector`, and `near-api-js`. It combines solo progression, multiplayer duels, and BTQ token staking into one NEAR-wallet-authenticated experience.

The codebase is split into three layers:

- the web app in Next.js
- the standalone socket game server
- the BTQ NEP-141 token contract (`contracts-near/`, near-sdk-js)

## Overview

NEARena centers on tactical decision-making, NEAR wallet identity, and token-based progression.

- Solo mode is the main single-player loop.
- Duel mode uses sockets for real-time multiplayer play.
- NEAR wallet connection is required for gameplay access.
- BTQ is the staking and reward currency.
- Tutorial and onboarding state are scoped per wallet (NEAR accountId).

## Core Features

### Solo Mode

- Practice rounds 1 to 3 are beginner missions.
- Practice rounds are one-time per wallet.
- Elite arena is the repeatable main solo gameplay.
- Solo missions require BTQ stake confirmation before play.
- Elite stake is editable but capped at 1000 BTQ.
- Minimum withdraw amount is 150 BTQ.

### Multiplayer Duel Mode

- Socket-driven real-time gameplay.
- Room-based match entry.
- Shared game state with turn-based interactions.
- Separate server process for low-latency updates.

### Wallet and BTQ Flow

- NEAR accountId is used as the player identity.
- BTQ balance is synced from the deployed NEP-141 contract.
- Players can buy BTQ through the wallet panel (NEAR -> BTQ).
- Players can sell BTQ only when the balance meets the minimum withdraw threshold.

### Onboarding

- Tutorial completion is stored per wallet.
- Solo onboarding and arena tour do not repeat for the same wallet.
- Practice completion also persists per wallet.

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Framer Motion
- Zustand
- Socket.IO
- Express
- near-api-js
- @near-wallet-selector/core + modal-ui + meteor-wallet/here-wallet
- near-sdk-js (contract)

## Project Structure

```text
NEARena/
├── contracts-near/        # NEP-141 BTQ contract (near-sdk-js)
├── scripts/                # Startup scripts
├── src/
│   ├── app/                # App Router pages and API routes
│   ├── components/        # UI, wallet, solo, duel, and shared components
│   ├── hooks/              # Sync hooks
│   ├── lib/near/           # NEAR wallet-selector config, contract calls, hooks
│   ├── server/              # Socket.IO game server
│   └── store/               # Zustand game state
├── public/                 # Static assets
├── next.config.ts          # Next.js configuration
└── package.json            # Scripts and dependencies
```

## Getting Started

### Prerequisites

- Node.js 18 or newer
- npm
- A NEAR wallet: Meteor Wallet (browser extension) or HERE Wallet. MyNearWallet is retired and no longer connects to apps.
- `near-cli-rs` for contract deployment: https://github.com/near/near-cli-rs

### Install Dependencies

```bash
npm install
```

### Environment Variables

Create a `.env.local` file in the project root.

```bash
# Frontend
NEXT_PUBLIC_SOCKET_URL=http://127.0.0.1:3001
NEXT_PUBLIC_NEAR_NETWORK_ID=testnet
NEXT_PUBLIC_NEAR_NODE_URL=https://test.rpc.fastnear.com
NEXT_PUBLIC_NEAR_CONTRACT_NAME=btq-token.testnet
NEXT_PUBLIC_BTQ_RATE_NEAR_PER_BTQ=0.001
```

If `NEXT_PUBLIC_NEAR_CONTRACT_NAME` is missing or not deployed yet, the wallet UI can still render, but buying, selling, and staking flows will not work correctly.

## Running Locally

### Start the full app

```bash
npm run dev
```

This starts:

- Next.js on `http://localhost:3000`
- the socket server on `http://localhost:3001`

### Start only the web app

```bash
npm run dev:next
```

### Start only the socket server

```bash
npm run dev:server
```

## Build and Production Start

### Build

```bash
npm run build
```

This runs the web build and the server TypeScript build.

### Start production

```bash
npm run start
```

This launches the built Next.js app and the compiled socket server together.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start the web app and socket server together |
| `npm run dev:next` | Start Next.js dev server only |
| `npm run dev:server` | Start the Socket.IO game server only |
| `npm run build:web` | Build the Next.js app |
| `npm run build:server` | Type-check and compile the server code |
| `npm run build` | Run both build steps |
| `npm run start` | Start the production web app and server |
| `npm run contract:build` | Install contract deps and build the BTQ NEP-141 contract to `.wasm` |
| `npm run contract:deploy` | Deploy + initialize the built contract via `near-cli-rs` |

Note: `npm run lint` currently uses `next lint`, which is not the most reliable validation path for this setup. Prefer `npm run build` for a full project check.

## Gameplay Flow

### Solo Flow

1. Connect a NEAR wallet.
2. Open the lobby.
3. Buy BTQ if needed.
4. Enter Solo mode.
5. Select a practice round or elite arena.
6. Confirm the stake.
7. Play the mission.
8. Claim the win or pay the penalty.

### Duel Flow

1. Connect a NEAR wallet.
2. Enter Duel mode from the arena.
3. Join or create a room.
4. Wait for match synchronization.
5. Play against another wallet in real time.

## BTQ Token System

BTQ is the in-game currency used for staking and reward flows, implemented as a NEP-141-style fungible token.

- Default rate: `1 BTQ = 0.001 NEAR`
- Buying BTQ attaches a NEAR deposit to the contract's `buy()` method.
- Selling BTQ burns BTQ and returns NEAR to the wallet via `sell()`.
- Minimum withdraw amount: `150 BTQ`
- Elite solo stake cap: `1000 BTQ`

## Smart Contract and Deployment

The BTQ token contract lives in `contracts-near/src/contract.ts` (near-sdk-js).

It supports:

- NEP-141/145 basics: `ft_balance_of`, `ft_total_supply`, `ft_metadata`, `ft_transfer`, `ft_transfer_call`, `storage_deposit`, `storage_balance_of`
- `buy()` for swapping attached NEAR into BTQ
- `sell({ amount })` for withdrawing BTQ value back to NEAR
- `burn({ amount })` for the game client to lock a stake / pay a penalty
- `record_game_win({ reward_amount })` to mint a reward (not signature-gated — fine for a hackathon demo, must be gated before mainnet)
- owner-controlled `set_rate` and `withdraw`

### Deploying BTQ

See [WEB3_INTEGRATION.md](./WEB3_INTEGRATION.md) for the full `near-cli-rs` account-creation and deploy walkthrough. In short:

```bash
npm run contract:build
NEXT_PUBLIC_NEAR_CONTRACT_NAME=btq-token.testnet npm run contract:deploy
```

After deployment, set the contract name in `.env.local`:

```bash
NEXT_PUBLIC_NEAR_CONTRACT_NAME=btq-token.testnet
```

## Wallet and Identity

- Wallet connection is handled by `@near-wallet-selector/core` + `modal-ui`.
- The connected NEAR accountId is used as the player id.
- The app stores a short display id in localStorage for UI purposes.
- Practice completion and tutorial completion are stored per wallet.

## Troubleshooting

### Wallet does not connect

- Make sure you have Meteor Wallet or HERE Wallet set up and switched to testnet (MyNearWallet no longer accepts app connections).
- Click **Connect NEAR Wallet** and complete the modal flow.
- Refresh the page and reconnect.

### BTQ balance is not showing

- Verify `NEXT_PUBLIC_NEAR_CONTRACT_NAME` is configured and deployed.
- Confirm the RPC endpoint (`NEXT_PUBLIC_NEAR_NODE_URL`) is reachable.

### Buy or sell transactions fail

- Make sure the wallet has enough NEAR for the deposit plus storage/gas.
- Check the on-chain `rate` (`get_rate` view call) matches `NEXT_PUBLIC_BTQ_RATE_NEAR_PER_BTQ`.
- Confirm the contract is deployed and initialized.

### Withdraw is disabled

- The balance must be at least 150 BTQ.
- The sell button remains disabled below that threshold.

### Elite arena is missing

- Elite arena opens after the practice rounds are cleared.
- Practice progression is stored per wallet.

## Validation

- Use `npm run build` for the most reliable full-project validation.
- The server build is compiled separately with `npm run build:server`.

## License

No explicit license is defined in this repository yet. Add one before publishing the project externally.
