from pathlib import Path
root=Path(__file__).resolve().parents[1]
documents={
'README.md':'''# ServOS

Single-business hospitality operations for one installed POS terminal, with local SQLite storage and a Supabase remote replica. The React UI is retained inside Tauri for Windows, Linux and Android.

**This is an implementation in progress, not a deployment-ready release.** See [current release state](docs/CURRENT_RELEASE_STATE.md) for implemented commands, verification evidence and outstanding work. The browser preview contains demonstration data and must not be used for trading.

## Development

Use Node.js and npm. Run `npm ci`, `npm run lint`, `npm run build`, and `npm test`. Run `npm run dev` for the explicitly labelled UI preview. `npm run audit:ui` regenerates the static interaction inventory.

Native development additionally requires Rust and the platform's Tauri prerequisites. Use `npm run native:dev`, `npm run test:native`, and `npm run native:build`. Android additionally requires its SDK/NDK and `npm run tauri -- android init` before platform testing.

Copy `.env.example` to `.env.local` and configure the dedicated business Supabase project. Never place privileged server keys in frontend environment variables. Initial terminal enrollment requires an owner account; enrolled staff subsequently use local PINs offline.

## Documentation

Start with [the documentation index](docs/README.md). No real payment gateway, fiscal submission, bank disbursement, messaging or device adapter is represented as configured. M-Pesa is manually confirmed by receipt code and reconciled separately.
''',
'docs/README.md':'''# ServOS documentation

ServOS targets one business and one installed terminal. Multiple internal outlets and stock locations remain business configuration.

- [Current release state](CURRENT_RELEASE_STATE.md): evidence and blockers.
- [Architecture](SYSTEM_ARCHITECTURE.md): local backend, data ownership and replication.
- [Feature coverage](FEATURE_COVERAGE_MATRIX.md): module implementation status.
- [Implementation roadmap](GAP_ANALYSIS_AND_ROADMAP.md): remaining work in dependency order.
- [Operational workflows](MODULE_WORKFLOWS.md): expected transactions and completion rules.
- [Business operations specification](BUSINESS_OPERATIONS_SPEC.md): accepted scope.
- [Decomposition guide](REFACTORING_AND_DECOMPOSITION_GUIDE.md): migration boundaries.
- [Deployment and recovery](DEPLOYMENT_RUNBOOK.md): enrollment, backups and release gates.
- [Data dictionary](DATA_DICTIONARY.md): persisted contracts.
- [Interaction inventory](generated/UI_INTERACTION_INVENTORY.json): static controls and handlers; not evidence of acceptance.
''',
'docs/SYSTEM_ARCHITECTURE.md':'''# System architecture

## Data flow

Installed React views -> typed Tauri commands -> native authorization and validation -> SQLite transaction containing business records, audit and outbox -> authenticated Supabase upload -> Postgres replica -> remote reporting.

The installed terminal is the authoritative writer. Server outages do not disable locally enrolled staff access. A successful local command means its SQLite transaction committed; it does not mean a server or external provider accepted it.

The local migration contains staff credentials, expiring sessions, versioned domain records, command deduplication, append-only application audit, an outbox and a unique M-Pesa code registry. Domain records currently use validated JSON envelopes, not a complete normalized relational model. Expanding relational constraints remains release work.

The React runtime gate selects the native provider only inside Tauri. Ordinary browser access opens an explicitly labelled sample-data preview. The legacy context is retained for that preview while native workflows are migrated. Unconnected native modules display a pending-integration message.

## Commands and synchronization

Commands carry a UUID, schema version, operation, payload and optional expected record version. The backend derives the actor from a local session. A repeated command ID returns its stored result only if the payload matches. Transactions create the audit and outbox together with business changes.

Uploads contain ordered operation envelopes. The server serializes each terminal stream, rejects sequence gaps and changed replays, and commits the batch before returning an acknowledgement. The terminal acknowledges only uploaded operations. Scheduled foreground sync uses backoff; resume and reconnection trigger retries. Native background execution is not guaranteed on Android.

The server migration also stores remote change requests. Terminal polling/application and the remote manager web application remain unfinished; requests must not be represented as applied.

## Security and limitations

Local PINs use Argon2 with random salts and persistent throttling. Native sessions expire after 15 minutes without commands and are deleted on restart. Remote roles are project-provisioned Supabase memberships. Server upload credentials are hashed on the server; the current local device token is in the OS application database. Secure-keystore integration, encrypted backups and recovery fencing remain release blockers.

No unrestricted SQL command is exposed to the frontend. Backend commands enforce roles. An application audit trigger prevents normal updates/deletes, but this is not protection against an administrator modifying the database file.
''',
'docs/FEATURE_COVERAGE_MATRIX.md':'''# Feature coverage matrix

Status definitions: **prototype** = visual/local-state behavior only; **implemented** = code exists; **locally verified** = named local checks passed; **sync verified** = real server replay and recovery tests passed; **deployment verified** = packaged-device and business acceptance passed.

No module is deployment verified. The generated UI inventory does not establish functional coverage. Exact command verification is recorded in CURRENT_RELEASE_STATE.md.

| Module | Current implementation | Remaining acceptance |
|---|---|---|
| Local runtime | Tauri scaffold, SQLite migration, owner enrollment, PIN sessions, command audit/outbox | Native builds, device smoke, recovery and secure credential storage |
| Catalog | Native product and stock master save/archive, version checks | Recipes/modifiers/portions, price rules, reference constraints |
| POS | Native order creation, simple item add/remove, firing, partial cash/card/manual M-Pesa payments, atomic split tender | Discounts, comps, transfer/merge, item refunds, tax policy, real receipts |
| KDS | Native ready/recall commands | Item/station routing and all lifecycle transitions |
| Inventory | Stock depletion at firing | Transfers, counts, waste, production and opening-balance controls |
| Reconciliation | Native receipt allocation and manager statement confirmation | Statement entry/import, discrepancies, reversals and customer credit UX |
| Accounting | Balanced receipt journal records | Tax allocation, period locks, receivables, accrual recognition and ledger controls |
| Staff/till | Local staff enrollment, till opening/closing and variance restriction | Staff lifecycle, shifts, leave, advances, payroll and disbursements |
| Host and reservations | Prototype | Native lifecycle and conflicts |
| Hotel | Prototype | Reservations, folios, deposits, check-in/out and room status workflows |
| CRM | Prototype | Durable profile workflows, loyalty, customer credit and source timelines |
| Events | Prototype | Ticket sales, capacity, admission, commissions and manual payout evidence |
| Procurement/AP | Prototype | POs, partial receiving, matching, supplier credits and payments |
| Batch production | Prototype | Recipes, input/output ledger, yield and reversals |
| Reports/command centre | Prototype | Shared queries, drilldowns and export parity |
| Settings/control | Partial native business administration | Configuration, permissions, approvals, derived alerts and audit browser |
| Guest ordering | Prototype | Restricted online endpoint, heartbeat, acknowledgement and duplicate handling |
| Remote management | Database request queue only | Manager app, polling, version conflicts and applied acknowledgements |
| Hardware/external services | Unconfigured | Real adapters require separate evidence; no simulated success |
''',
'docs/GAP_ANALYSIS_AND_ROADMAP.md':'''# Implementation roadmap

The accepted objective covers every existing operational module. Completing the foundation does not complete the objective.

1. Establish reproducible builds and finish the runtime interaction audit, including non-button cards, responsive layouts and modal behavior.
2. Verify native SQLite transactions and local permissions, complete enrollment recovery, secure device credentials and backups, and normalize domain constraints.
3. Exercise upload/replay against a configured Supabase project. Implement remote request polling, conflict handling, staff revocation, device replacement and remote owner UI.
4. Finish the complete trading slice: product modifiers/portions/pricing, fire-time stock snapshots, lifecycle controls, tax-configured journals, receipts, refunds, split/merge/transfer, till accounting and customer credit.
5. Integrate procurement and production, hotel/host, CRM, events, HR, controls and reports. Replace component-local fixtures with native queries and dedicated commands, preserving cross-module atomicity.
6. Finish guest ordering, manual external handoffs, accessible interactions and report/export parity.
7. Rehearse business opening-to-close, extended offline trading, reconnect replay, upgrades and backup restoration on the actual terminal platform.

Each workflow requires happy-path, invalid input, permission denial, reload, failure, duplicate and synchronization evidence before its coverage status advances. Do not count hidden or disabled prototype features as implemented.
''',
'docs/MODULE_WORKFLOWS.md':'''# Operational workflows

These are acceptance targets. Consult the coverage matrix before treating a workflow as available.

## Trading and restaurant service

Enroll owner -> configure outlets, stock locations, catalog, taxes and opening balances -> enroll staff -> open till -> create table/walk-in order -> add seats, courses, portions and modifiers -> fire courses -> deplete snapshotted ingredients once -> prepare/serve -> allocate payments -> issue an internal receipt -> reconcile tenders -> close till.

Reservations progress booked/confirmed/arrived/seated/completed, with cancelled/no-show alternatives. Waitlist parties seat against actual availability. Floorplan edits preserve active orders. Splits and merges preserve item ownership and payment allocation. Fired voids require return-versus-waste disposition. Refunds reverse money without automatically returning stock.

## Manual M-Pesa

Cashier checks the business receipt, enters code/account/amount/time and confirms it. The terminal records the payment as manually confirmed, with reconciliation pending. Codes are normalized and unique per account. Allocations cannot exceed the recorded receipt; surplus needs a customer credit owner. Managers compare statement evidence and confirm matching amounts. Discrepancy and reversal workflows remain required before full release.

## Procurement and production

Supplier -> PO -> approval -> partial GRN -> inventory receipt -> supplier invoice -> three-way match -> AP allocation. Repeated receipt cannot duplicate stock. Batch production consumes raw inputs and produces measured output in one command; waste and yield are explicit.

## Hotel, CRM and events

Reservation -> conflict check -> deposit -> check-in/manual key issuance -> folio charges -> settlement -> checkout -> housekeeping inspection. Room-charge settlement must not recognize the same revenue twice. CRM timelines and loyalty derive from these records. Event capacity controls ticket sale; each ticket can be admitted once. Commissions and refunds require actual manually confirmed outgoing payment references.

## Staff and accounting

Provision staff -> schedule/attendance -> leave/advances -> payroll calculation using effective configuration -> approval -> manually evidenced disbursement. Till movements and variances are attributable. Every posted journal balances; closed periods reject ordinary mutation. Corrections use reversals and linked replacement records.

## Offline and recovery

Enrolled staff unlock locally. Every accepted command saves records, audit and outbox atomically. Restart must retain them. Reconnection replays commands idempotently. Remote changes stay pending until the terminal applies them. Restore must include pending outbox data and fence the replaced terminal before syncing.
''',
'docs/BUSINESS_OPERATIONS_SPEC.md':'''# Single-business operations specification

One business owns one installed terminal, with internal outlets and stock locations. Android, Windows and Linux packaging are targets; each needs platform-specific acceptance. Other devices are not offline clients in this release.

Preserve the present hospitality UI and its business workflows: restaurant tables, seats, coursing, waitlist/reservations, kitchen/bar preparation, catalog recipes/portions/modifiers, pricing, inventory/yield, procurement, hotel, CRM/loyalty, events, staff/payroll, reconciliation, accounting, reports and approvals.

Every editable master record needs create/read/update/archive, validation, usable empty/error states and persisted relationships. Transactions need lifecycle commands rather than arbitrary editing or deletion. Each existing card, menu and modal must either complete its documented workflow or clearly identify a release-blocking gap in the coverage inventory.

Payments use manually confirmed cash, external card approval references and M-Pesa receipt codes. Provider delivery, fiscal signatures, device actions and payouts are not inferred from UI interaction. Remote managers view replicated data and request administrative changes. The terminal is authoritative and conflicts require review.

Production contains no sample transactions, guests, employees, suppliers, stock or balances. Initial owner enrollment creates only the owner and minimum business/outlet/store configuration. All configurable financial rules require owner-reviewed effective values before acceptance.
''',
'docs/REFACTORING_AND_DECOMPOSITION_GUIDE.md':'''# Decomposition guide

The legacy ServOS context and component fixtures remain only in the browser preview. The installed runtime uses RuntimeProvider for enrollment/session/synchronization and NativeServOSProvider as the compatibility adapter for existing views.

Move each module to explicit asynchronous query/command hooks. Do not add new business effects to React setters. Command handlers own permissions, validation, version checks, derived records, audit and outbox transactions. Views own drafts, filters, selections and progress/error states.

The current native adapter still has synchronous compatibility signatures and explicit unavailable operations. Replace these with Promise-returning interfaces as each module is migrated. Never call a success toast or close a form before its command commits. Remove each legacy implementation only after its replacement passes persistence and workflow tests.

Keep platform integration outside domain commands. Do not expose a generic SQL execution IPC API. Split domain modules from the growing native store when extending inventory, accounting, reservations and staff.
''',
'docs/DEPLOYMENT_RUNBOOK.md':'''# Deployment and recovery runbook

## Prerequisites

A dedicated Supabase project, an owner Auth account, a supported POS operating system, and a working Rust/Tauri toolchain are required. Apply the checked-in migration to a non-production project first. A project operator must insert the owner's Auth UUID into `servos_private.managers` with role `owner`; the app cannot self-grant membership.

Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY at build time. No service-role key belongs in the terminal or browser. Build and install the package, sign in as owner to enroll, set a 6–12 digit local PIN, then configure genuine business data. A unique active-terminal constraint prevents accidentally enrolling a second writer.

## Current limitations

This release is not approved for production. Remote request application, broad domain integration, secure credential storage, backup encryption/rotation/upload, restore/device fencing, platform signing and physical-device acceptance remain open. Enrollment recovery after a server success followed by local failure also requires implementation.

## Backup

Business administration can create a consistent local SQLite backup using SQLite's backup API. The current backup includes credentials and pending operations and stays in the application data backup folder. It is not encrypted, automatically rotated, uploaded or restore-verified. Do not call it a completed recovery system.

Target policy: daily-close and pre-upgrade backups; seven daily and four weekly retained copies; encrypted remote copies; verified restoration on a replacement terminal, preserving pending operations and fencing old credentials.

## Release gate

Require frontend checks, native command tests, server policy/replay tests, every interaction acceptance scenario, a complete offline shift, reconnect parity, successful restore, genuine opening balances and owner-reviewed reports. Document which OS/device was tested. A Windows build cannot establish Android or Linux readiness.
''',
'docs/DATA_DICTIONARY.md':'''# Data dictionary

| Store | Purpose and invariant |
|---|---|
| metadata | Installation identity, cloud connection settings and last successful sync |
| staff | Local identity, role, salted PIN hash, active state and persistent attempt throttling |
| sessions | Random local bearer session, staff identity and idle deadline |
| records | Collection/id key, optimistic version, JSON domain payload, archive flag |
| commands | Unique command ID, serialized request fingerprint and committed result |
| audit | Ordered command attribution; application-level update/delete rejection |
| outbox | Exact operation envelope linked to audit sequence; acknowledgement only after server commit |
| mpesa_codes | Unique receiving account/code mapped to one receipt |
| remote_requests | Reserved local request processing state |

BusinessCommand contains id, schemaVersion, operation, optional targetVersion and payload. Actor and terminal identity come from native session/enrollment rather than frontend claims. CommandResult returns record IDs, audit reference and local sequence.

Sync operations carry sequence, command ID, operation, actor, time and changed versioned records. Cloud business_records is a read replica, not an independent writer. Remote changes have pending/applied/rejected/conflict state.

Payments retain integer amountMinor alongside compatibility KES fields. Existing UI-shaped records still contain decimal monetary and quantity fields; full integer/precision normalization remains unfinished. Do not imply that a JSON record store establishes all domain constraints.
'''
}
for filename,content in documents.items():
    (root/filename).write_text(content,encoding='utf-8')
for filename in ['docs/RESTAURANT_SAAS_EXPANSION_SPEC.md','src/components/platform/PlatformAdminView.tsx','src/types/saas.ts']:
    path=root/filename
    if path.exists():path.unlink()
(root/'.env.example').write_text('VITE_SUPABASE_URL=https://your-project.supabase.co\nVITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key\n',encoding='utf-8')
