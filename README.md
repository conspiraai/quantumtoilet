# Quantum Toilet — FLUSH∞

Quantum Toilet is a realtime Solana meme-coin experience. Every buy splits the timeline, morphs the chrome throne, and drops an NFT-ready timeline card.

## Features

- **Simulate-first**: run the entire stack locally with no RPC or mint configuration.
- **Realtime websocket feed** with deterministic trait derivation per transaction signature.
- **3D React experience** with Three.js morph targets, wormhole shaders, and accessibility-first controls.
- **NFT-ready assets** rendered on the backend with automatic R2 uploads (optional).
- **Deploy-ready** infrastructure (Fly.io backend, Vercel frontend, CI pipeline).

## Getting Started

### Prerequisites

- Node.js 20+
- npm 9+

### Install dependencies

```bash
npm install
```

### Environment

Copy `.env.example` and adjust as needed:

```bash
cp .env.example .env
```

Key toggles:

- Leave RPC, R2, and mint settings blank for simulate mode.
- Set `VITE_ENABLE_SIMULATE=true` to show the simulate button on the frontend.

### Running locally

Start the backend:

```bash
npm run dev --workspace app/backend
```

In a separate terminal start the frontend:

```bash
npm run dev --workspace app/frontend
```

Visit http://localhost:5173 and pull the lever. Use the **Simulate Flush** button or run the dev script:

```bash
npx tsx scripts/dev-simulate-flush.ts
```

### Tests

```bash
npm run test --workspaces
```

### Linting

```bash
npm run lint --workspace app/backend
npm run lint --workspace app/frontend
```

## Switching to Live Mode

Prepare the following environment variables:

- `VITE_TOKEN_MINT` — Mint address for the FLUSH∞ token.
- `VITE_RPC_URL` and `RPC_URL` — Helius or preferred RPC.
- `HELIUS_WEBHOOK_SECRET` — Shared secret for webhook verification.
- `MINT_COLLECTION_ADDRESS` — Collection mint for timeline NFTs.
- `PUBLIC_ASSET_BASE` — Public URL base for rendered previews.
- `R2_*` — Optional Cloudflare R2 credentials for asset uploads.

When these are provided the app automatically:

1. Listens to the Helius webhook at `/webhook/helius`.
2. Streams live flush events via WebSocket.
3. Stores previews and metadata in R2 when credentials exist.
4. Generates mint-ready transactions through `/mint/:id`.

No code changes are required—just update the environment variables and redeploy.

## Deployment

- **Backend**: deploy `app/backend/Dockerfile` on Fly.io using `app/infra/fly.toml`.
- **Frontend**: deploy `app/frontend` on Vercel using `app/infra/vercel.json`.
- **CI**: `.github/workflows/ci.yml` runs lint, test, and build for both workspaces.

## Scripts

- `scripts/dev-simulate-flush.ts` — Trigger a fake flush in simulate mode.
- `scripts/mint-cli.ts` — Request a mint transaction for a flush.

## Post-setup Checklist

1. Populate `.env` with production RPC, webhook secret, and optional R2 details.
2. Configure Helius webhook to point at `/webhook/helius` with the shared secret.
3. Deploy backend to Fly.io and ensure port 3000 is exposed.
4. Deploy frontend to Vercel and set `VITE_PUBLIC_BACKEND_URL` to the Fly.io hostname.
5. Flip `VITE_ENABLE_SIMULATE` to `false` in production environments.
6. Announce your multiverse toilet to the world.
