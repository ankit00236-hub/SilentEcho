# SilentEcho

A private complaint-reporting platform with separate personal and organisation workspaces, generated private sign-in IDs, response-team invitations, encrypted evidence and case-progress tracking.

The default runtime is **Next.js on Vercel**, with a shared **Turso (libSQL)** database and **private Vercel Blob** evidence storage. No name or email is required for a personal account.

## Run locally

Use Node.js 22.13 or later in the Node 22 release line.

```sh
npm ci
npm run setup:local
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Local setup creates an ignored `.env.local` with a random encryption key and a local database under `.local/`. It preserves an existing settings file and key. Files stay encrypted in `.local/evidence/`. Local development data is separate from any earlier Cloudflare preview data.

For a production preview:

```sh
npm run build
npm start -- --hostname 127.0.0.1 --port 3000
```

## Deploy to Vercel

Follow [docs/VERCEL.md](docs/VERCEL.md) for the exact dashboard settings. The repository contains `vercel.json`; use the Next.js framework preset and repository root.

Before redeploying, configure these **server-only** variables in Vercel:

| Variable | Purpose |
| --- | --- |
| `TURSO_DATABASE_URL` | Shared database URL, such as `libsql://your-database.turso.io` |
| `TURSO_AUTH_TOKEN` | Database access token |
| `BLOB_READ_WRITE_TOKEN` | Token for a connected **private** Vercel Blob store |
| `DATA_KEY` | Stable base64-encoded random 32-byte encryption/HMAC key |

`npm run build:vercel` validates these settings, applies pending non-destructive schema migrations, and builds Next.js. Missing settings fail the deployment with a clear message. `npm run build` remains available to compile without connecting to hosted services.

Every device must use the same hosted URL and backend. Sign in with the same saved private ID to return to an account; teammates use their own IDs and join with a team invitation.

## Privacy and storage

Sign-in IDs and session tokens are stored as keyed digests. Case text, messages, filenames and evidence are encrypted before storage. File downloads require case access and pass through the server; Blob URLs and tokens are never returned to visitors. Vercel does not trust caller-supplied ChatGPT identity headers. Local file/database fallbacks are disabled on Vercel.

Keep `DATA_KEY` backed up and unchanged: replacing it prevents existing sign-in and decryption. This provides pseudonymous accounts, not end-to-end encryption or anonymity from the operator. See [PROJECT.md](PROJECT.md) for the full privacy boundaries and workflow.

## Checks

```sh
node --test scripts/crypto.test.mjs scripts/private-identity.test.mjs scripts/case-progress.test.mjs scripts/team-invites.test.mjs scripts/server-config.test.mjs scripts/request-security.test.mjs
npm run build
npm run test:vercel
```

The workflow tests start production Next.js against disposable local libSQL databases and encrypted local evidence. They check native registration, private-ID sign-in, session revocation, case isolation, CSRF, team invitation/rotation, cross-session updates and evidence upload/download. They never mutate hosted data. Real Turso/Blob connectivity still requires configured hosted credentials.

## Optional Sites runtime

The original Cloudflare/Sites runtime is retained behind `dev:sites`, `build:sites` and `start:sites`, with a separate D1/R2 adapter. See [docs/SITES.md](docs/SITES.md). Its build output is not the Vercel deployment output.
