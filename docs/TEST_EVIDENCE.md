# Test evidence

## Expansion checks — 2026-09-26

### Stay, folio and paid-extension continuation

`node scripts/test-supabase.mjs --expansion` passed with migrations 008-009 and `tests/supabase/folios.sql`, plus all preceding legacy/domain/allocation tests and the independent two-connection room booking race. The new suite used real PostgreSQL records and journal entries to verify:

- opening a reservation folio, deposit liability and captured cash/change;
- check-in with cleanliness/current-interval guards, due nightly/day-use posting and repeated catch-up without duplicate effects;
- rejection of checkout before complete booked-period posting or settlement;
- bounded deposit application, manually confirmed external payment, normalized business-wide M-Pesa reference rejection and overpayment rejection;
- linked unpaid service-charge reversal and immutable folio/stay history;
- room moves with preserved billing, changed occupancy, dirty old room and a turnaround block;
- exact-price paid extensions, rollback of the extension charge/departure when payment reference validation fails, one successful extension after replay, and no repeat charge during catch-up;
- exact resulting revenue, tax, receivable and deposit totals, balanced journals and separate payment/reversal permissions.

`npm run lint`, documentation checks (33 guides/15 core documents) and `git diff --check` passed in this continuation. Native, browser and packaging checks were not rerun for this SQL/documentation slice; their earlier evidence remains below. These tests do not prove production Supabase, desktop/web UI integration, real provider reconciliation, offline grants or physical printing. Test fixtures for hotel services/payment accounts are not evidence of completed master-data UI or configured accounting integration.

### Operational cloud continuation

Staged migrations 003-007 and new asset/room suites passed `node scripts/test-supabase.mjs --expansion` against disposable PostgreSQL 18.6. The suite exercised asset tag uniqueness, guarded lifecycle/custody, immutable history, maintenance state transitions, stock/journal/payable completion, rollback after a later invalid supplier, same-command response-loss replay, permission denial and sensitive change-feed filtering. Expired allocations continued to protect another device's stock, asset and room resources. Room checks covered nightly/day-use overlap, exact day-use duration, turnaround boundary, maintenance blocks/inspection release, cancellation/no-show guards, housekeeping and rate-snapshot preservation.

The harness also launched two independent PostgreSQL connections using two registered devices to compete for the same room/time interval. Exactly one reservation committed; the other returned ROOM_UNAVAILABLE. Both outcomes retained command/audit records; only the committed booking entered the change feed. This is real database concurrency evidence, not full desktop/browser multi-device acceptance.

TypeScript, all 19 Node tests, documentation checks (33 guides/15 core docs), production Vite build and `git diff --check` passed again in this continuation. Native and browser suites were not rerun for this SQL/contract/documentation slice; their results below belong to the earlier receipt/storage work. No staged migration was applied to a live business project. Operational UI, stay/folio commands, acquisition linkage, offline grants and live recovery remain pending.

### Earlier receipt, settings and storage checks

Windows workspace, Node 26, Rust/MSVC and Docker available. Checks below apply to the source slices in [Completion ledger](COMPLETION_LEDGER.md), not the full expansion.

- `npm run lint`: passed.
- `npm test`: 19 passed.
- `npm run build`: passed. Final production JS bundle was 486.29 kB (130.49 kB gzip), without the earlier large-chunk warning; the explicitly enabled demo test bundle still emits that warning.
- `npm run docs:check`: passed, 33 guides and 15 core documents after the receipt/settings guide was added.
- `npm run audit:ui`: 1,901 controls/handlers/routes inventoried, not runtime acceptance.
- `cargo test --manifest-path native-tests/Cargo.toml`: 31 passed, including printer tests and new receipt/settings cases.
- `cargo test --manifest-path src-tauri/Cargo.toml --lib`: 31 passed, including current receipt/settings and printer code.
- `npm run test:browser`: 12 passed across desktop/mobile, including receipt print-root/footer/overflow, real IndexedDB restart/replay/rollback and service-worker offline shell reload without caching private API responses.
- `node scripts/test-supabase.mjs --expansion`: passed in disposable PostgreSQL, including legacy protocol, staged v2 command/replay/conflict/authorization/cursor/tombstone tests and allocation budget/interval/ownership/expiry/handover tests.

Receipt tests use real SQLite transactions; browser receipt tests mock Tauri transport. Browser queue tests exercise real IndexedDB with simulated cloud responses. Cloud tests use disposable PostgreSQL, not the configured Supabase project. No physical printer, Vercel publication, full multi-device trading, Rooms/Assets operational acceptance or live migration was performed.

Mobile receipt screenshot `test-results/preview-native-checkout-pr-2b26a-and-business-receipt-copies-mobile-layout/receipt-preview.png` was visually inspected: readable two-copy preview and footer with no horizontal clipping. This is screen evidence, not physical paper output. `git diff --check` passed.

Final production-bundle smoke on local port 3012 passed: `/#/hotel` opens authenticated Remote business management and exposes no Open UI preview button or sample route. No online business sign-in or deployment was performed.

## Historical environment — 2026-09-24

Date: 2026-09-24.

Available: Node 22, npm 10, global `tsc`.

Unavailable: Rust/Cargo and Docker. `npm ci` timed out due environment network access, so Vite/Playwright/Tauri package execution cannot be honestly claimed from this environment.

## Dependency-independent checks

Run before handoff:

```bash
node scripts/build-help-index.mjs
node scripts/docs-check.mjs
node scripts/audit-ui.mjs
node --test tests/*.test.mjs
```

The final handoff response must report their actual results.

## Full target-machine gate

After successful dependency installation:

```bash
npm ci
npm run lint
npm run build
npm test
npm run test:browser
npm run test:native
npm run test:cloud
npm run audit:ui
npm run docs:check
```

Do not change a status to deployment verified unless the complete packaged-device rehearsal in [BAR_PRODUCTION_ACCEPTANCE.md](BAR_PRODUCTION_ACCEPTANCE.md) also passes.

## Verification update — 2026-09-27

### Staff, devices and approvals — 2026-09-28

`node scripts/test-supabase.mjs --expansion` passed the legacy and expansion migrations 001-016, all domain suites, `tests/supabase/staff-devices.sql`, and the real two-connection room booking race. The new SQL suite uses disposable PostgreSQL/Auth substitutes. It verifies canonical permission profiles, Auth-bound staff creation and role synchronization, denied Server-to-Admin escalation, device list/revoke, and command denial after revocation. Approval tests reject wrong action, target, initiator, expiry and replay; procurement over-receipt consumes the scoped approval in its transaction and records the approver on its GRN. These checks do not prove hosted Auth invitations, credential recovery, shared physical terminal accounts, or a production policy configuration.

`npm run lint`, `npm test` (70 tests before the new staff source regression), and `npm run audit:ui` passed during implementation. The full `npm run verify` will be reported after its current-tree run. No hosted migrations, credentials, or production controls were changed. Browser approval tokens are retained in the current IndexedDB command payload until the queued command is acknowledged; encrypting/protecting that sensitive local data is pending.

### Staged POS settlement, refunds and close-day

Against the current tree, `npm run verify` passed the production build and lint, all 70 Node tests, all 16 desktop/mobile browser cases, all 55 native domain tests, the UI interaction inventory (2,738 controls/handlers/routes), and documentation checks (40 guides/15 core documents). Browser transaction tests exercised till open, online cash settlement, refund and close-day report through the disposable PostgreSQL web bridge. They are local staged acceptance, not hosted Supabase or production browser evidence. The production build reports a 808.12 kB main JavaScript chunk above the configured 500 kB warning threshold; Rust emits two pre-existing unused-assignment warnings.

`node scripts/test-supabase.mjs --expansion` passed migrations 001-015 and all disposable PostgreSQL protocol/domain suites, including cash/split/manual MPesa/card payments, replay/conflict/authorization checks, partial refund, over-refund rejection, full reversal, balanced journal/immutable history, close-day totals and the independent two-connection room-booking race. The harness creates disposable local PostgreSQL infrastructure. It does not connect to or modify the configured Supabase project.

Still unverified: hosted migration/RLS acceptance, real provider payment/refund or MPesa statement reconciliation, room-charge settlement, full close-day void/inventory/system-health coverage, authenticated permissions against configured business roles, desktop adapter, signed offline rights, production cutover, real multi-device trading, target installation and physical printer acceptance. The browser bridge does not establish those properties.

The controlled room CSV UPDATE defect is fixed in the native import planner. Planning keeps the staged row separate and removes the create-only `initialStatus` field from the actual room UPDATE command. `room_csv_imports_apply_through_native_room_commands` now covers stage → plan → apply for create and update, verifies the planned UPDATE omits `initialStatus`, changes floor/wing, and preserves existing housekeeping and maintenance state.

Executed against the final source:

- `npm run lint` — passed.
- `npm test` — 68 passed.
- `cargo test --manifest-path native-tests/Cargo.toml` — 55 passed.
- `cargo test --manifest-path src-tauri/Cargo.toml --lib` — 55 passed.
- `npm run verify` — passed: production Vite build, Node suite, browser suite (12 passed, 2 PostgreSQL-backed browser cases skipped because no staging browser session is configured), native container suite (55 passed), UI inventory, and documentation checks.
- `node scripts/test-supabase.mjs --expansion` — passed migrations 001–013 and all disposable PostgreSQL suites, including the real two-connection room booking race.
- `git diff --check` — passed.

The production build still reports a main JavaScript chunk above 500 kB. PostgreSQL tests used disposable local infrastructure, not the configured business Supabase project. No v2 activation, live migration, fresh-device rehearsal, or physical acceptance was performed by these checks. A Windows Tauri release executable compiled, but `npm run native:build` exited 1 during MSI bundling because Tauri could not resolve/download its WiX bundle tool (`No such host is known`, OS error 11001). This is an environment/network packaging failure, not installer acceptance.

Windows packaging follow-up: `npm run native:build` compiled the optimized `servos.exe`, then failed before producing the MSI because Tauri attempted to download WiX and DNS resolution failed (`No such host is known`, OS error 11001). Re-run packaging on a host with the required WiX toolchain available; a compiled executable is not an installer or terminal acceptance.

### UX and Guidance foundation — 2026-09-28

Executed against the current working tree after adding the Home/task navigation and native guidance foundation:

- `npm run lint` — passed.
- `npm test` — 79 passed, including UX/guidance alignment, permission-filtered navigation, commit-event source checks, and executable guide-registry validation.
- `npm run test:browser` — 16 passed across desktop and mobile-layout projects. The native Tauri mock unlock flow checked Home, the core tour, Quick Add permission filtering, and the existing receipt flow. This is browser-mocked UI evidence, not packaged terminal acceptance.
- `cargo test --manifest-path src-tauri/Cargo.toml --lib` — 56 passed, including staff-isolated, restart-durable guidance progress kept outside the business outbox and schema 10 acceptance.
- `npm run test:native:container` — 56 passed.
- `npm run docs:check` — passed: 40 Help Center articles and 15 core documents.
- `npm run audit:ui` — inventoried 2,798 controls, handlers, and routes; this is static inventory, not acceptance.
- `npm run build` — passed. The main JavaScript chunk is 833.26 kB, above the 500 kB warning threshold.
- `git diff --check` — rerun after the evidence update.

### Simple Operations Release A follow-up — 2026-09-28

Implemented first-run catalog and inventory empty states and translated common version, duplicate, missing-reference, and validation errors into staff-facing messages. This changes UI presentation only; native command payloads and transaction semantics are unchanged.

- `npm run lint` — passed.
- `npm run build` — passed; generated 40 offline help articles. Main JavaScript chunk is 835.41 kB and still triggers Vite's 500 kB warning.
- `npm run docs:check` — passed: 40 Help Center guides and 15 core documents.
- `git diff --check` — passed.

Room/property/import empty states, complete centralized error coverage, smart-default audit, and task workflow acceptance remain open.

### Products & Menu creation follow-up — 2026-09-28

New product creation now starts with a unified Drink/Food/Retail/Service choice, name, selling price and fulfillment destination. It generates an editable item code, offers existing-stock tracking as an explicit opt-in, and defers portions/recipes to later setup. Existing products retain the established advanced edit form. No family/physical-variant data model or atomic new-stock/opening-balance orchestration was added in this UI-only slice.

- `npm run lint` — passed after implementation.
- `npm run build` — passed (835.41 kB main chunk warning; see above).
- `npm run docs:check` — passed: 40 Help Center guides and 15 core documents.
- `git diff --check` — passed after implementation.

Family/variant compatibility, stock setup orchestration, storage-place workflow, and targeted browser/native acceptance remain open.

### Stock master and Storage Places follow-up — 2026-09-28

Stock master creation now starts with the item name and count unit; item code is generated and editable under advanced controls with barcode, scan quantity, average cost and reorder level. The form explicitly says it creates a master only and directs opening quantities to ledger-backed receiving/opening-balance flows. Master Data labels stock locations as Storage Places, offers an optional location description, generates an internal place code when omitted, and gives an actionable empty state. The existing `stockLocations` collection, `inventory.adjust` permission, and archive reference protections remain in force.

- `npm run lint` — passed.
- `npm run docs:check` — passed: 40 Help Center guides and 15 core documents.
- `git diff --check` — passed.

Atomic create-stock-plus-opening-balance, physical product variants, place use across remaining screens, and focused workflow acceptance remain open.

### Quick Add and guide routing follow-up — 2026-09-28

Reconciled the user-supplied upstream-main review against checked-out local source. Quick Add now encodes direct `add-item`, `add-room`, and `add-asset` actions, exposes them only with manage permissions, and opens the matching flow or its prerequisite. Guide cards use their own versioned progress, route steps request shell navigation through the permission-filtered allowlist, and the tour observes target resize and closes on Escape. Focused checks are pending.

The source workflows for product/catalog, stock, rooms/property, imports, and operational summaries, along with their task-specific guides, are not implemented by this foundation slice. No target-device, hosted cloud, or production acceptance is claimed.
