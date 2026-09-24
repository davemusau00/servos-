# Deployment and recovery runbook

## Project and enrollment

Use one dedicated Supabase project and one terminal. Configure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in ignored `.env.local` before building. Never use a privileged key in the client. Connectivity alone does not establish schema installation or enrollment.

Before changing a project, inspect existing tables and migration history and preserve business data. Apply the checked-in SQL migrations in filename order, first on an isolated rehearsal project:

1. `supabase/migrations/202609240001_terminal_replica.sql`
2. `supabase/migrations/202609240002_remote_requests.sql`
3. `supabase/migrations/202609240003_request_validation.sql`

The first two are initial migrations, not scripts to rerun over an existing installation. The third replaces only the request-validation function and preserves records. Apply only migrations absent from the project's migration history. They pass the local PostgreSQL harness but have not passed live authenticated integration acceptance. Create the owner's Supabase Auth account, then a project operator provisions membership using its actual Auth UUID:

```sql
insert into servos_private.managers (user_id, role)
values ('REPLACE_WITH_OWNER_AUTH_UUID'::uuid, 'owner');
```

Build the native package with a supported Rust/Tauri platform toolchain. Sign in as owner to enroll and set an individual 6-12 digit local PIN. Pending terminal credentials are retained locally to retry interrupted enrollment. One active terminal is enforced server-side. Configure genuine outlets, catalog, inclusive tax policy, opening stock and staff before attempting trading acceptance. Owner authentication credentials should be entered in the app, not shared in chat.

## Remote management and verification

Browser remote management requires connectivity and provisioned manager membership. It can browse replicated records and request selected master changes. Requests stay pending until the terminal processes them; applied status follows upload of the resulting operation. Test duplicate batches, lost acknowledgements, version conflicts, expired authentication and revoked authors before claiming synchronization works.

Latest project probe: Auth settings returned HTTP 200; anonymous replica access now returns HTTP 401 with PostgreSQL code 42501, permission denied for business_records. This establishes that the table is exposed and anonymous access is denied, replacing the earlier 404 observation. This agent has not deployed migrations or inspected business data. Owner membership, terminal enrollment and real synchronization still require verification.

## Reproducible local checks

Run `npm run lint`, `npm run build`, `npm test` and `npm run test:browser`. With Docker running, `npm run test:cloud` creates a disposable PostgreSQL container, applies minimal Auth test fixtures and all migrations, then checks replay, transactional rollback, authorization and request processing. It exposes no host port, stops its own container afterward and does not use the configured Supabase project. Its Auth fixtures do not test Supabase JWT issuance or HTTP behavior.

`npm run test:native:container` runs the real Rust store tests in a Linux Rust container, with the checkout mounted read-only and build/registry caches in dedicated Docker volumes. This is an alternative to the local `npm run test:native` toolchain. Neither domain-test command establishes desktop or Android package acceptance.

## Backup and recovery

Business administration can create a consistent local SQLite backup including pending operations and credentials. It stays in the application backup folder. It is not encrypted, rotated, uploaded or restore-verified.

Target policy: daily-close and pre-upgrade backups, seven daily and four weekly retained copies, encrypted remote copies, and verified replacement-terminal restoration with old enrollment fenced. These remain implementation work.

## Release gate

This release is not approved for production. Require frontend checks, native command tests, server policy/replay tests, every interaction acceptance scenario, a complete offline shift, reconnect parity, successful restore, genuine opening balances and owner-reviewed reports. Record each tested OS/device. Secure device credentials, domain integration, backup recovery and signed packages remain open.
