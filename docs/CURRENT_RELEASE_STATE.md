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
- Offline Help Center generated from 31 Markdown user-guide articles.
- Windows build bootstrap, Bash-driven preflight/NSIS packaging, target runtime install/check and XP-80T USB queue helper source are now present alongside the existing Linux/Android scripts.
- Existing ordered Supabase replica and remote-request architecture retained.

## Hardware status checked 2026-09-24

- The Windows host enumerated the connected XP-80T as USB device `Printer POS-80` and exposes port `USB001`.
- The installed Windows print driver is named `XP-80C`, but no Windows printer queue was present. Creating a queue from this non-elevated session failed, so no paper test was sent.
- An administrator-only `scripts/configure-xprinter-usb.ps1` helper now registers a queue from the existing XP-80C driver and USB port; it has not been run on the target Windows 10 terminal.
- Source now includes an XP-80T profile for direct LAN ESC/POS (default TCP port 9100), a Windows RAW USB queue path, 48-column receipt formatting, optional cut between copies, a setup test slip, and a locally persisted retry list. Network/spooler acceptance is not proof of physical paper output; USB and LAN remain unverified on the device.
- This installation will not use a cash drawer.

## Verification executed in this environment

PowerShell parsing passed for the build bootstrap, Windows build wrapper, target installer and printer-queue helper. Git Bash passed `-n` syntax checking and the deployment script's `--help` path. `git diff --check` passed.

The Windows packaging preflight ran on Windows 11 Pro (build 26200) with Node 26.5, Git Bash, Visual Studio C++ Build Tools and WebView2 available. Rust/Cargo were missing, so the preflight correctly stopped and no Tauri installer was produced. The target Windows 10 installation, USB queue creation, paper output and LAN printing remain unverified.

The bootstrap warns about unsupported standard Windows 10 editions; the target install script handles the WebView2 runtime and installer integrity check without putting business data or enrollment state in the build scripts.

Dependency-independent checks are recorded in [TEST_EVIDENCE.md](TEST_EVIDENCE.md). The target development machine must run the full `npm run verify` gate after `npm ci`.

## Remaining release gates

- successful `npm ci`, TypeScript/Vite build and Playwright run against the finished tree;
- successful Rust domain tests and Tauri desktop build;
- disposable PostgreSQL/Supabase protocol test;
- actual Windows/Linux/Android package builds as applicable;
- XP-80T queue creation with the new helper, customer/business two-copy paper output, LAN/USB handoff, cut behavior, retry/restart recovery, and physical printer acceptance;
- complete Phase 16 fresh-install/offline/restart/reconnect/backup acceptance rehearsal;
- encrypted/rotated remote backups and verified replacement-terminal restore remain beyond the current local backup implementation.

No claim of **deployment verified** should be made until [BAR_PRODUCTION_ACCEPTANCE.md](BAR_PRODUCTION_ACCEPTANCE.md) is completed on the target hardware.
