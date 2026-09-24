# Accepted implementation plan

## Outcome

Complete every existing business module and UI interaction for one installed POS terminal on Android, Windows or Linux. Preserve the current React interface. Use a native Tauri backend with SQLite for offline operations and a dedicated Supabase project for synchronization and remote management.

This document records the accepted target, not completion. [CURRENT_RELEASE_STATE.md](CURRENT_RELEASE_STATE.md) records actual evidence and [FEATURE_COVERAGE_MATRIX.md](FEATURE_COVERAGE_MATRIX.md) records module gaps.

## Locked decisions

- One terminal is the authoritative business writer. No local-network client service in this release.
- Initial enrollment requires online owner authentication; enrolled staff use local PINs offline.
- Cashiers manually check and record M-Pesa receipts. Manager reconciliation is a separate audited action. No automated payment gateway.
- Remote managers view replicated records and submit versioned administrative requests. Requests remain pending until applied by the terminal.
- External submissions, messages, keys, payouts and hardware actions use truthful manual handoffs until real adapters are tested.
- Production starts with genuine business configuration and opening balances, not demonstration records.

## Work packages, in execution order

1. **Baseline:** inventory routes, controls, cards, forms, menus, filters, exports and drilldowns; establish build/typecheck results; replace unsupported documentation claims.
2. **Local foundation:** versioned schema, typed commands, UUIDs, monetary precision, native permissions, PIN throttling, idle locking, transaction audit/outbox, master record archives and transaction reversals.
3. **Remote foundation:** authenticated enrollment, ordered idempotent uploads, acknowledgements, 60-second foreground sync, reconnect/resume recovery, version conflicts, remote request application, owner interface and stale-data indicators.
4. **Trading:** catalog/pricing -> tables/orders/seats/courses -> KDS and stock depletion -> partial/mixed payments -> receipt and journals -> reconciliation and till close -> replicated reports. Include modifiers, refunds, comps, void stock disposition, split/merge/transfer and receivables.
5. **Remaining operations:** procurement/AP, batches/yield, hotel/housekeeping/maintenance, host, CRM/loyalty/credit, events/admission/commissions, staff/leave/payroll, approvals/audit, reports and configuration. Integrate the same durable records across modules.
6. **Deployment:** restricted online guest ordering, usable loading/error/empty states, accessibility and responsive checks, exports, packaging, signed updates, backup rotation/encryption/upload and replacement-terminal restoration.

## Required transaction properties

- Business records, related ledger effects, audit and outbox commit together.
- Replayed commands never duplicate receipts, stock, loyalty, journals or admissions.
- Snapshot transaction prices, configured taxes and recipes; future master edits cannot change history.
- Stock depletes once at firing; monetary refunds do not automatically restock.
- Room/corporate receivable settlement does not recognize revenue twice.
- Normalize M-Pesa account/code uniqueness; allocations cannot exceed the recorded receipt. Surplus has an identified customer credit owner.
- Enforce period locks, booking/capacity conflicts, received/refunded quantity limits, permissions and documented exceptional approvals.
- Never acknowledge provider success from a local record or claim cloud sync before durable server acknowledgement.

## Completion criteria

For every interaction: permission checks, valid and invalid input, business effects, reload/restart persistence, duplicate/failure behavior, offline operation and synchronization evidence. Verify exports against their filtered source records. Test stale/conflicting remote requests and expired/revoked authentication.

Run complete opening-to-close and offline/reconnect rehearsals, plus backup restoration to a fenced replacement terminal. Verify each platform on an actual supported device. Record exact evidence and remaining gaps rather than counting a build, button or toast as acceptance.

Backup target: consistent copies at daily close and before upgrades; seven daily and four weekly retained copies; encrypted remote copies when connected. Replication is not backup.
