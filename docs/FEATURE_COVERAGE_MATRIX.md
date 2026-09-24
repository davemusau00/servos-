# Feature coverage matrix

Status definitions: **prototype** = visual/local-state behavior only; **implemented** = code exists; **locally verified** = named local checks passed; **sync verified** = real server replay and recovery tests passed; **deployment verified** = packaged-device and business acceptance passed.

No module is deployment verified. The generated UI inventory does not establish functional coverage. Exact command verification is recorded in CURRENT_RELEASE_STATE.md.

| Module | Current implementation | Remaining acceptance |
|---|---|---|
| Local runtime | Tauri scaffold, SQLite migration, owner enrollment, PIN sessions, command audit/outbox | Native builds, device smoke, recovery and secure credential storage |
| Catalog | Native product and stock master save/archive, version checks | Recipes/modifiers/portions, price rules, reference constraints |
| POS | Native simple orders, firing, unpaid transfer/merge, partial/manual payments, atomic split tender, internal receipts | Discounts, comps, item refunds, fired void stock disposition and full workflow acceptance |
| Floorplan | Atomic outlet layout save/archive and audited cleaning; locally verified Rust persistence/conflict/rollback tests and preview UI checks | Native UI rehearsal, section CRUD, minimum-spend enforcement and synced layout acceptance |
| KDS | Native ready/recall commands | Item/station routing and all lifecycle transitions |
| Inventory | Fire-time depletion, counts, transfers and waste commands | Production, approvals, reversal rules and full ledger acceptance |
| Reconciliation | Native receipt allocation and manager statement confirmation | Statement entry/import, discrepancies, reversals and customer credit UX |
| Accounting | Balanced payment journals with inclusive tax snapshots and partial-payment allocation | Period locks, receivables, accrual recognition and ledger controls |
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
| Remote management | Manager UI, replica queries, request polling, version checks and upload-dependent acknowledgement; SQL protocol/policies locally verified in disposable PostgreSQL | Live Auth/HTTP, conflicts and recovery acceptance; aggregate reporting |
| Hardware/external services | Unconfigured | Real adapters require separate evidence; no simulated success |
