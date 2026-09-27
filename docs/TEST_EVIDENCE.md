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
