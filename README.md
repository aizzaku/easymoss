# MEGA Wallet

One-tap wallet creation on MegaETH. No code, no terminal — just open the app and tap "Create Wallet."

Built on the [MOSS Wallet SDK](https://docs.megaeth.com/moss-docs) by MegaETH.

## What This Does

- **Create a wallet** with one tap — uses your device's passkey (Face ID / fingerprint)
- **No seed phrase** — MOSS handles key management via WebAuthn
- **Send & receive ETH** on MegaETH testnet
- **Deposit funds** via the built-in MOSS deposit flow
- **Restore wallet** using your MOSS Recovery Code

## How It Works

This app wraps the `@megaeth-labs/wallet-sdk-react` package into a consumer-friendly UI. Users don't need to know about npm, JavaScript, or smart contracts — they just click a button and the MOSS SDK handles account creation via WebAuthn/passkeys.

## Tech Stack

- **React 19** + TypeScript
- **Vite** for bundling
- **@megaeth-labs/wallet-sdk-react** (MOSS React SDK)
- **viem** for ETH parsing
- **TanStack Query** for data fetching

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

⚠️ **Browser requirement:** MOSS uses WebAuthn/passkeys, which **require a secure context**. Works on:
- `http://localhost:*` (any browser)
- `https://yourdomain.com` (valid TLS cert)
- Does NOT work on: `https://localhost` (self-signed), `http://192.168.x.x` (LAN IPs)

## Deploy

Build static files:

```bash
npm run build
```

The `dist/` folder is a fully static site. Deploy anywhere that serves HTTPS:
- **Vercel:** `vercel --prod`
- **Netlify:** Drag `dist/` folder
- **Cloudflare Pages:** Connect repo, set build command `npm run build`, output `dist`
- **GitHub Pages:** Use `gh-pages` or Actions

Just make sure the domain has a valid TLS certificate — WebAuthn won't work without HTTPS.

## Project Structure

```
src/
  App.tsx              # MegaProvider + QueryClient setup
  components/
    WalletApp.tsx      # All wallet UI: landing, dashboard, send sheet
  index.css            # All styles (dark theme)
  main.tsx             # Entry point
```

## MegaETH Network

Currently set to **testnet**. To switch to mainnet, change the network in `src/App.tsx`:

```tsx
<MegaProvider config={{ network: 'mainnet', ... }}>
```

Mainnet is live at chain ID 4326: `https://mainnet.megaeth.com/rpc`.
