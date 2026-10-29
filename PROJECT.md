# SilentEcho

Implementation based on the supplied SilentEcho research report. React frontend, standard Next.js server routes, a shared Turso/libSQL database, private Vercel Blob encrypted evidence, and private sign-in IDs. The optional Sites runtime retains D1/R2 through a separate adapter; platform identity headers are never trusted on Vercel.

## Run

Use Node 22.13+ in the Node 22 release line. Run `npm ci`, `npm run setup:local`, then `npm run dev`; open `http://localhost:5173`. Setup creates ignored local settings, an encryption key and a migrated libSQL database without replacing an existing `.env.local`. Local files live under `.local/`, separate from earlier Cloudflare previews. For the retained D1/R2 preview, see [docs/SITES.md](docs/SITES.md).

Build with `npm run build`, then preview with `npm start`. Deploy with [docs/VERCEL.md](docs/VERCEL.md): configure `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `BLOB_READ_WRITE_TOKEN` for a private store, and the stable 32-byte base64 `DATA_KEY`. `build:vercel` validates settings, applies tracked schema migrations and builds Next.js. No hosted account uses a local file fallback. Never rotate an existing data key or expose a local preview as a production service.

## Private accounts

The homepage `/` introduces SilentEcho’s objective, privacy approach, and the two account paths. Use `/personal/signup` for a private reporting account, or `/organisation/signup` to create an organisation and its administrator account together. Returning users use `/personal/signin` or `/organisation/signin`. No name, email, phone number, or password is collected. Save the 256-bit random `SE-…` ID using Copy ID or Download ID, then continue. Returning users sign in with that complete, case-sensitive ID. Treat it as a secret: possession grants account access. It is distinct from the public Case ID and cannot be recovered if lost. It is displayed once at registration and is not kept in browser storage.

Only an HMAC-SHA256 digest of the sign-in ID is stored in `private_accounts`, alongside a separate random account ID and keyed case-ownership reference. Sessions use independently generated random tokens; only their keyed digests are stored, with a seven-day absolute expiry. Cookies are HttpOnly, SameSite=Lax, and Secure on HTTPS. Sign-out revokes the current session. Authentication mutations enforce same-origin requests and a persisted limit of 30 attempts per network address per 15 minutes; the address is represented only by a keyed window digest. Existing case ownership and existing hosted accounts are not migrated or reassigned.

`npm run db:migrate` applies pending migrations in order and preserves existing records. Keep `DATA_KEY` stable: replacing it breaks both sign-in and decryption for existing records. The service operator still controls the application and key, can see a sign-in ID when it is presented, and can correlate a private account's cases through their ownership reference. This does not promise operator-proof anonymity.

## Workflows

- Personal workspace (`/personal`): choose New complaint, select an organisation, write the report, set category and urgency, and optionally attach evidence. Open cases with Track case to see the current stage, recorded stage dates, the latest organisation action, and the complete timeline. Use Check for updates to fetch new progress without closing the case. Return to My complaints using the same signed-in account; a Case ID alone never grants access. Exchange messages and upload more evidence from the same case view. Skipped stages are not marked complete, and reopened cases show the current stage while preserving their history.
- Organisation workspace (`/organisation`): register an organisation, save its one-time-displayed invitation code, or join with an existing code. Members can review only their organisations' cases, change status/category/priority, and document actions. The sidebar links to each workspace. Overview, case lists (`/personal/cases`, `/organisation/cases`), and organisation directories (`/personal/organisations`, `/organisation/organisations`) have separate URLs that work on reload. Organisation cases remain restricted by server-side membership; choosing a workspace is not a grant of access.
- The public Vercel production URL must allow the intended audience under Deployment Protection. Invitation codes grant application membership but do not bypass hosting-level access restrictions.

## Security design and boundaries

Random UUID case identifiers are references, never credentials. Every case API checks authenticated identity and case ownership or organisation membership. Account identifiers are stored as HMAC-SHA256 references; account names and emails are not persisted in case records or sent to organisation dashboards. Complaint titles and descriptions, messages, event content, evidence bytes, and filenames use AES-256-GCM with independent random 96-bit nonces and record-bound additional authenticated data. Category, priority, organisation, status, and timestamps remain queryable metadata. A secret DATA_KEY is provided by the hosting platform and never embedded in browser code. TLS is supplied by hosting.

Case views, evidence downloads, submissions, messages, and changes create audit records. Mutations validate same-origin requests and bounded field/file inputs. Evidence downloads force attachment and disable MIME sniffing. API responses containing case data disable caching.

This is pseudonymity, not perfect anonymity or end-to-end encryption. The operator controls the encryption key; account associations can be recomputed by the operator. Descriptions and file metadata may reveal identity. All invited organisation members have triage access to that organisation; granular assigned-handler roles are future work. Organisation registration is self-service and does not establish verified institutional affiliation. Keep invitation codes private; administrators can replace invitations, but membership removal is not implemented. Retention/deletion policy, key rotation, organisational verification, and independent security review remain rollout considerations.

## Scope relative to the report

Implemented: pseudonymous reporting, authenticated ownership and organisation access, two-way messaging, encrypted evidence, audit events, category/priority review, documented actions, case resolution, responsive UI.

No trained AI classifier or performance claims are included: the research paper states that its dataset/model have not yet been established. Category and urgency are selected by reporters and reviewed by human responders. Automated triage, per-handler assignments, and escalation integrations remain future work.

## Validation

`node --test scripts/crypto.test.mjs` verifies encryption round-trips, nonce uniqueness, wrong-key rejection, ciphertext tampering rejection, record-binding rejection, and keyed account-reference separation.

`npm run test:vercel` starts production Next.js servers against disposable local libSQL databases and encrypted file storage. It runs integration, team and private-authentication workflows and rejects forged platform identity headers. It does not verify remote Turso/Blob credentials.

`node --test scripts/case-progress.test.mjs scripts/crypto.test.mjs` verifies actual recorded stages, direct resolution without invented intermediate progress, reopened cases, and storage cryptography. For an isolated built-server integration run, set `TEST_URL` to the local server and optionally `TEST_DB_PATH` to its local D1 SQLite file; the integration test then also inspects stored rows for raw authenticated identities and unencrypted report content. Never run mutation tests against production.

`node --test scripts/private-identity.test.mjs scripts/crypto.test.mjs scripts/case-progress.test.mjs` verifies sign-in ID generation, digest domain separation, storage cryptography, and tracking. Run `scripts/private-auth-test.mjs` only against an isolated local server with both migrations; `TEST_DB_PATH` enables direct database inspection. This test checks registration, returning sign-in, session revocation, case isolation, status tracking, readable-ID absence, CSRF rejection, and throttling.

## Page structure

`/` is the public objective and introduction page. `/signin` and `/signup` offer the two account paths. Personal and organisation signup/sign-in are full pages, not dashboard dialogs. Organisation signup validates the organisation details before creating records and creates both account and organisation in a single database batch. Its one-time sign-in ID and invitation code are shown in separate save steps. Existing private IDs continue to work; account creation never reassigns existing cases. Workspace pages redirect signed-out visitors to the appropriate sign-in page. `/how-it-works`, `/privacy`, and `/support` are separate public information pages. Case details, evidence, and conversations stay together in the workspace’s case dialog.

## Visual design and imagery

The public pages use the user's ivory, deep-teal, and seafoam artwork. `public/images/` preserves all four supplied PNG originals and includes WebP delivery copies; the logo symbol and wordmark are displayed directly from the supplied logo. The favicon uses a deterministic crop of its symbol. CSS composes the provided waves with softly drifting cloud layers, sparse glints, a mouse-following glow, and mild illustration/card parallax. Form controls stay steady. A Pause motion button and the system reduced-motion preference disable the corresponding motion. Pointer reactions are enabled only for a fine mouse pointer and do not run per-frame React renders.

The homepage includes three clearly dated research facts with direct source links: UNESCO's 2019 school-bullying findings, the ILO/LRF/Gallup 2022 work-violence survey, and Gallup's disclosure findings from that same survey. They are explicitly identified as global research rather than SilentEcho usage or effectiveness figures. Supplied illustrations are not presented as users, testimonials, or endorsers.

## Joining a response team and ending a session

Teammates open `/organisation/join` and paste the organisation invitation into **Team invitation code**. New responders can create an account and join in one transaction, then save their own private sign-in ID. Existing users can sign in with their own ID and join. The organisation overview and My organisations page also contain an inline join block. An invitation is not an administrator's sign-in ID. Administrators can create a replacement code from their organisation card; this invalidates the previous invitation while preserving existing memberships.

**End session** is visible in the workspace header and on public pages when signed in. It revokes the current session and returns to the homepage. Other tabs in the same browser are notified. Independent sessions on other devices remain separate. Inbox and folder data refresh every five seconds while the page is visible, and when focus returns; updated case details refresh when no form is being edited. Case messages and evidence now also update the case's modification timestamp. Organisation folders show actual complaint counts and recent cases.

## Shared access across devices

Every device must use the same hosted HTTPS URL and shared Turso/private-Blob backend (D1/R2 for the optional Sites runtime). A `127.0.0.1` URL only reaches the device opening it; separate development copies have separate data. Sign in with the same saved private ID to use the same account on another device. Teammates must use their own IDs and join through an invitation. Public website access does not grant access to private case data. Keep the hosted DATA_KEY stable.

## Clearing local data

The retained `scripts/reset-local-data.mjs` applies only to the optional Cloudflare preview: stop that server, run `npm run build:sites`, then `node scripts/reset-local-data.mjs --confirm-local-reset`. It deletes only `.wrangler/state` and recreates the schema; it preserves source, artwork and `.dev.vars`. It never clears Turso, Blob or the new `.local/` data. No migration deletes existing users or organisations.

`node --test scripts/team-invites.test.mjs` checks pasted-code normalisation and useful ID/code errors. `scripts/team-workflow-test.mjs` runs against an isolated local database and tests invitation joins, folder counts, independent sessions, updates, code replacement permissions, and sign-out.
