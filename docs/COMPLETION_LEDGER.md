# Completion ledger

This ledger distinguishes source implementation from executed verification.

| Slice | Backend | Installed UI | Docs | Executed evidence here | Acceptance status |
|---|---|---|---|---|---|
| Floorplan + table.ready | implemented | implemented | updated | source inspection; native suite pending | source implemented |
| Native capability RBAC | implemented | permission-driven shell | RBAC guide | docs/source checks pending final run | source implemented |
| Manager single-use approval | implemented | approval dialog | RBAC guide | native execution pending | source implemented |
| Intake → enrollment → setup → Go Live | implemented | implemented | onboarding + guide | native execution pending | source implemented |
| Catalog/portions/modifiers/recipes/pricing | implemented | implemented | user guide | native/frontend execution pending | source implemented |
| Bar POS/KDS/table lifecycle | implemented | implemented | user guide | native/frontend execution pending | source implemented |
| Payments/M-Pesa/split/refund | implemented | implemented | user guide | native execution pending | source implemented |
| Inventory receipt/count/transfer/waste | implemented | implemented | user guide | native execution pending | source implemented |
| Till/cash movements/close day | implemented | implemented | user guide | native execution pending | source implemented |
| Offline Help Center | generated from Markdown | implemented | 30 articles | generator/docs checks executable with Node | locally generatable |
| CI/deploy scripts | source implemented | n/a | runbook | syntax/source checks required | source implemented |

When a target-machine check passes, add the commit, OS/device, exact command, date and result to [TEST_EVIDENCE.md](TEST_EVIDENCE.md).
# Expansion ledger — 2026-09-26

| Expansion slice | Source | Evidence / remaining work |
|---|---|---|
| Documentation | written before code | contracts, workflows, audit, receipts, migration/runbook, acceptance; docs checks passed |
| Native receipt documents/layout/history | implemented | payment-transaction capture, cash/change, immutable migration, history/reprint, both copies/footer, print portal; native/browser tests passed; physical output pending |
| Live business settings | identity, tax/message, payment methods and printer/till editors implemented | atomic identity/version and printer validation tested; broader settings remain pending |
| Vercel provisioning | config, authenticated production entry, explicit demo flag | no Vercel deployment performed; web remains existing remote manager |
| Cloud v2 protocol | staged command dispatcher and permission-filtered feed | disposable PostgreSQL tests passed for protocol and domain handlers; production disabled |
| Allocations | private stock/interval/custody primitives | disposable tests passed; signed grants, issuance/handover UI and domain command integration pending |
| Browser storage/sync | staged IndexedDB queue, pull cursor/tombstones, retry and automatic worker | browser reload/rollback/lost-response tests passed; not wired to live transactional UI |
| Offline shell | build-generated service worker, opt-in registration | browser offline reload/private-response exclusion tests passed; shell only, not transactional offline rights; queue-aware cache retirement pending |
| Rooms | staged masters, reservations, housekeeping, check-in/out, room moves and paid extensions | disposable database overlap, snapshot, stay/move, paid-extension rollback and booking-race checks passed; UI and end-to-end acceptance pending |
| Folios | staged accommodation catch-up, services, deposits/application, cash/manual settlement and charge reversals | disposable database replay, revenue/tax/receivable/deposit conservation, checkout and payment-reference checks passed; cloud receipts, refunds, credit/POS transfers and UI remain pending |
| Assets | staged lifecycle, custody history and maintenance commands | database maintenance stock/journal/payable atomicity and replay checks passed; acquisition integration, UI and end-to-end acceptance pending |
| Existing-module expansion | specification and existing desktop baseline | cloud operational integration and end-to-end acceptance pending |
| Multi-device cutover/recovery | not performed | live migration, real two-device trading and replacement-device rehearsal pending |

Baseline and executed checks are recorded in [test evidence](TEST_EVIDENCE.md). See [phase gates](EXPANSION_PLAN.md). The expansion is not complete or deployed.
