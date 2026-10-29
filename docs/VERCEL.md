# Deploy SilentEcho on Vercel

SilentEcho now builds with standard Next.js. The previous `npm run build` used Vinext and produced a Cloudflare Worker under `dist/server/`, which does not match Vercel's Next.js deployment output. Changing the output directory alone cannot supply the required database and file-storage bindings.

## 1. Connect the shared database

Create a Turso/libSQL database using the [Turso dashboard](https://turso.tech/) or its Vercel integration. Obtain the database URL and auth token. In **Vercel → silent_echo → Settings → Environment Variables**, add:

```text
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=<database token>
```

Enable them for **Production**. Preview deployments should use a separate database and Blob store so testing cannot modify production cases. If you enable Preview, supply all four settings for that environment too.

Do not use `file:`, `localhost`, `.wrangler` or a temporary SQLite file for the hosted database. Each serverless instance needs the same remote database. The Vercel adapter rejects local file databases even if local mode is accidentally enabled.

## 2. Connect private evidence storage

In **Vercel → Storage**, create a **Blob** store with **Private** access, then connect it to `silent_echo`. Ensure `BLOB_READ_WRITE_TOKEN` is available in the project's production environment. Choose private access when creating the store; a public store is not suitable for this app.

Only encrypted bytes are uploaded, under random file IDs. The server checks the signed-in account and case membership before fetching and decrypting a file. There is no public upload endpoint and no direct Blob URL in a case response. See [Vercel private storage](https://vercel.com/docs/vercel-blob/private-storage).

## 3. Set the stable encryption key

Add `DATA_KEY` as a sensitive environment variable. For a **new, empty deployment**, generate a 32-byte key on your own computer:

```sh
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Copy its output directly into Vercel, keep a secure backup, and do not commit it or paste it into chat. Never put these variables behind a `NEXT_PUBLIC_` prefix.

If migrating existing encrypted records, reuse their existing key and migrate the corresponding account/case data and encrypted files. A new Turso database starts empty; the app does not silently import or delete your earlier D1/R2 or local preview data. Never regenerate the key for an existing database.

## 4. Redeploy the updated repository

Use the GitHub repository `ankit00236-hub/SilentEcho`, branch `main`:

| Setting | Value |
| --- | --- |
| Framework Preset | Next.js |
| Root Directory | Repository root (`.`), where `package.json` is located |
| Node.js | 22.x |
| Install Command | `npm ci` |
| Build Command | `npm run build:vercel` |
| Output Directory | Leave the Next.js default; remove any `dist` override |

`vercel.json` supplies the framework, install and build commands. Redeploy the latest commit after saving the environment variables. Changing settings does not repair an already failed deployment. See [Vercel build settings](https://vercel.com/docs/builds/configure-a-build).

The build first checks the variables, then `npm run db:migrate` creates the schema or applies pending migrations without clearing records, then `next build` produces `.next`. Migrations are tracked in `__drizzle_migrations`; rebuilding does not replay them. A wrong database token or missing variable fails the build, rather than publishing a login page with an unusable backend.

If Vercel shows **Shared database is not configured** or **Private Blob storage is not configured**, complete the settings above and redeploy. The npm deprecation/engine warnings shown in the original screenshot are separate from this runtime mismatch.

## 5. Verify the hosted workflow

1. Open the production URL and create an organisation. Save its private sign-in ID and team invitation.
2. In a different browser or device, create a personal account and file a complaint to that organisation.
3. Confirm the complaint appears in the organisation's cases/folder and update its status.
4. Return to the reporter's account with its private ID and confirm the status/message appears.
5. Join `/organisation/join` from a third session using the invitation; verify evidence upload/download and **End session**.

For the requested public sign-in page, review **Vercel → Settings → Deployment Protection** so the production URL is accessible to people with the link. Application case access still requires a private sign-in ID and ownership or organisation membership.

## Local checks

`npm run test:vercel` verifies the production server using isolated local libSQL and file storage, including encrypted evidence and forged-header rejection. It cannot verify your remote database token, Blob store or Vercel audience until those services are connected. `npm run setup:local` is for development only; do not run it as a Vercel build command.
