# Deployment and recovery runbook

## Project and enrollment

Use one dedicated Supabase project and one terminal. Configure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in ignored `.env.local` before building. Never use a privileged key in the client. Connectivity alone does not establish schema installation or enrollment.

Before changing a project, inspect existing tables and migration history and preserve business data. Apply the checked-in SQL migrations in filename order, first on an isolated rehearsal project:

1. `supabase/migrations/202609240001_terminal_replica.sql`
2. `supabase/migrations/202609240002_remote_requests.sql`

These are initial migrations, not scripts to rerun over an existing installation. They have not yet passed live policy/integration acceptance. Create the owner's Supabase Auth account, then a project operator provisions membership using its actual Auth UUID:

```sql
insert into servos_private.managers (user_id, role)
values ('REPLACE_WITH_OWNER_AUTH_UUID'::uuid, 'owner');
```

Build the native package with a supported Rust/Tauri platform toolchain. Sign in as owner to enroll and set an individual 6-12 digit local PIN. Pending terminal credentials are retained locally to retry interrupted enrollment. One active terminal is enforced server-side. Configure genuine outlets, catalog, inclusive tax policy, opening stock and staff before attempting trading acceptance. Owner authentication credentials should be entered in the app, not shared in chat.

## Remote management and verification

Browser remote management requires connectivity and provisioned manager membership. It can browse replicated records and request selected master changes. Requests stay pending until the terminal processes them; applied status follows upload of the resulting operation. Test duplicate batches, lost acknowledgements, version conflicts, expired authentication and revoked authors before claiming synchronization works.

Current project probe: Auth settings returned HTTP 200; the replica table endpoint returned HTTP 404. No schema was deployed by this patch. Existing project business data has not been inspected.

## Backup and recovery

Business administration can create a consistent local SQLite backup including pending operations and credentials. It stays in the application backup folder. It is not encrypted, rotated, uploaded or restore-verified.

Target policy: daily-close and pre-upgrade backups, seven daily and four weekly retained copies, encrypted remote copies, and verified replacement-terminal restoration with old enrollment fenced. These remain implementation work.

## Release gate

This release is not approved for production. Require frontend checks, native command tests, server policy/replay tests, every interaction acceptance scenario, a complete offline shift, reconnect parity, successful restore, genuine opening balances and owner-reviewed reports. Record each tested OS/device. Secure device credentials, domain integration, backup recovery and signed packages remain open.
