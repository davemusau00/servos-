# Current release state

Updated: 2026-09-24. **Bar-first source implementation substantially expanded. Production acceptance is still required on a supported target device.**

## Implemented in source

- Native installation state machine from intake through Go Live.
- Resumable pre-enrollment Intake Wizard and owner enrollment that no longer seeds fake operational outlets/stores.
- Business Setup Wizard with real tax, payments, service areas, stock locations, catalog, opening balances, staff access, till policy, floorplan and backup/sync rehearsal.
- Rust capability registry returned with authenticated runtime snapshots; installed UI no longer simulates roles.
- Single-use, target-aware manager approval tokens and staff create/update/deactivate/PIN-reset/role-change lifecycle.
- One-terminal SQLite transactions with command deduplication, immutable audit and ordered outbox.
- Native floorplan atomic save plus `table.ready` cleaning lifecycle.
- Bar POS orders, quick tabs/tables, quantities, portions, modifiers, recipe snapshots, price-rule snapshots, firing and ingredient depletion.
- Item-specific KDS states: FIRED → PREPARING → READY → SERVED.
- Unpaid transfer/merge, protected discounts/comps, fired-void stock disposition.
- Cash/card/manual M-Pesa and atomic split tender, manual M-Pesa reconciliation, refunds/reversals without automatic ingredient restock.
- Opening balance, stock receipt with weighted-average cost/evidence, physical count, transfer and waste movements.
- Till open, paid-in/out, blind close and protected variance override.
- Persisted close-day report covering sales, tax/levy, tenders, cash, discounts/comps/refunds, COGS/waste, gross profit, top products, staff sales and system state.
- Offline Help Center generated from 30 Markdown user-guide articles.
- Windows/Linux/Android build scripts and GitHub Actions CI source.
- Existing ordered Supabase replica and remote-request architecture retained.

## Verification executed in this environment

The current execution environment has Node but no Rust/Cargo or Docker and package installation timed out. Therefore native, Tauri, cloud-container and packaged-device acceptance are **not** claimed here.

Dependency-independent checks are recorded in [TEST_EVIDENCE.md](TEST_EVIDENCE.md). The target development machine must run the full `npm run verify` gate after `npm ci`.

## Remaining release gates

- successful `npm ci`, TypeScript/Vite build and Playwright run against the finished tree;
- successful Rust domain tests and Tauri desktop build;
- disposable PostgreSQL/Supabase protocol test;
- actual Windows/Linux/Android package builds as applicable;
- physical printer/drawer behavior where configured;
- complete Phase 16 fresh-install/offline/restart/reconnect/backup acceptance rehearsal;
- encrypted/rotated remote backups and verified replacement-terminal restore remain beyond the current local backup implementation.

No claim of **deployment verified** should be made until [BAR_PRODUCTION_ACCEPTANCE.md](BAR_PRODUCTION_ACCEPTANCE.md) is completed on the target hardware.
