# Feature coverage matrix

Status vocabulary: **prototype** = preview/local-only behavior; **source implemented** = code exists but acceptance evidence is incomplete; **locally verified** = named checks executed; **sync verified** = live replay/recovery accepted; **deployment verified** = packaged-device business rehearsal passed.

| Module | Current status | Remaining acceptance |
|---|---|---|
| Installation/runtime | source implemented | packaged fresh install, restart and recovery |
| Intake/enrollment/setup | source implemented | native UI/device rehearsal and enrollment server test |
| RBAC/staff | source implemented | Rust test execution for all capabilities/approval abuse cases |
| Catalog/portions/modifiers/recipes | source implemented | frontend build, native transaction tests, operator acceptance |
| Pricing/Happy Hour | source implemented | timed/overnight rule native tests and service rehearsal |
| POS/tables/tabs | source implemented | packaged shift acceptance |
| Floorplan/table.ready | source implemented with existing tests adapted as release gate | execute native suite |
| KDS / Bar Pass | source implemented | device/touch workflow acceptance |
| Inventory | source implemented for opening/receipt/count/transfer/waste | execute ledger/rollback tests and stocktake rehearsal |
| Payments | source implemented for cash/card/manual M-Pesa/split | execute duplicate/rounding/restart tests |
| Refunds/voids/comps/discounts | source implemented | native reversal/disposition tests and manager-approval acceptance |
| M-Pesa reconciliation | source implemented | statement discrepancy/reversal operational rehearsal |
| Till/close day | source implemented | blind count, variance approval and complete end-of-day rehearsal |
| Reports | source implemented close-day reports | report parity/export acceptance |
| Help Center | locally generatable from Markdown | packaged offline search/context help acceptance |
| Remote management/sync | existing source implemented | live policy/replay/conflict/recovery acceptance |
| Backup | local consistent SQLite copy source implemented | encryption/rotation/upload/restore verification |
| Restaurant/procurement/production/CRM/events/hotel/HR/guest order | browser prototypes or future scope | begins only after bar deployment gate |
