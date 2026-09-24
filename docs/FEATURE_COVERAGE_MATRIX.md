# Feature coverage matrix

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
