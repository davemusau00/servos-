# Shared transaction and offline contracts

Target v2 specification, not an enabled protocol. Legacy schemaVersion 1 remains until cutover.

## Commands and persistence

Command: id, schemaVersion=2, deviceId, actorId, operation, payload, expectedVersions[{collection,id,version}], allocationRefs[{id,version}], clientSequence, occurredAt. Stable UUID through retries. Actor/device checked against authenticated membership or verified offline grant, never trusted from payload alone.

Result: commandId, status, serverSequence, recordVersions, auditReference, optional error{code,message,retryable}. Status: DRAFT, COMMITTED_LOCAL, PENDING_SYNC, SYNCHRONIZED, CONFLICT, REJECTED. Lost response retries original ID. Changed payload/actor cannot reuse ID. Refresh failure after commit is not a failed write.

Errors: AUTH_REQUIRED, PERMISSION_DENIED, DEVICE_REVOKED, GRANT_EXPIRED, VERSION_CONFLICT, ALLOCATION_REQUIRED, ALLOCATION_EXHAUSTED, RESOURCE_OWNED, VALIDATION_FAILED, DUPLICATE_REFERENCE, PROTOCOL_UNSUPPORTED. Preserve conflict command/local evidence for review; never delete recorded cash silently.

PostgreSQL command transaction validates permission/version/references/allocation, writes records, journal/stock effects, audit, command result and change feed together. Explicit function search_path/EXECUTE grants; no browser direct write grants. RLS/read contracts restrict payroll, guest and financial fields. Rust/browser offline validation uses common conformance fixtures.

New record families: devices, memberships, deviceOperators, offlineGrants, resourceAllocations, commandsV2, changeFeed, conflicts, receiptDocuments, roomTypes, ratePlans, roomReservations, stays, folios/entries, assets/categories/events and shared maintenanceOrders. Stable record IDs, optimistic versions, integer minor-unit money, bounded quantities, UTC timestamps with property-timezone billing boundaries.

Constraints: unique command, device/sequence, device/receipt sequence, asset tag, payment account/code, source effect, stay/charge-period and ticket admission; room interval exclusion. Immutable financial/stock/audit/folio/custody history. Master archive/reactivate checks active references.

## Allocation

Grant: device/operator, capability policy version, validity bounds, resource IDs and budgets. Allocation RESERVED -> ACTIVE -> RETURN_REQUESTED -> RETURNED; QUARANTINED requires explicit reconciliation. Expiry stops spending but does not release uncertain resources.

| Resource | Reservation | Guard |
|---|---|---|
| Stock | item/location quantity | consume all recipe/modifier allowances atomically |
| Rooms | exclusive interval plus turnaround | reservation/move/extension must all be covered |
| Orders/tables/folios | exclusive device ownership | acknowledged handover before another writer |
| Credit/points | spending budget | no unreserved offline redemption |
| Tickets | assigned ticket IDs | one admission per ticket |
| Assets | exclusive workflow custody | versioned transfer/return |

Online uses unreserved pool or own allowance. Forced device recovery quarantines uncertain capacity. Unallocated work may remain draft, never confirmed sale/booking. Rule/schema updates preserve earlier valid snapshots. Offline cash may finalize within grants; external references are pending global validation and cannot become duplicated confirmed payment allocations. Clock rollback disables offline finalization pending revalidation; use last server time plus monotonic session checks.

## Sync and storage

One worker/device; browser tabs coordinate queue ownership. Trigger after commit, reconnect/resume, every 15 seconds active/connected. Retry 5/10/20/40/80/160/300 seconds with jitter. Stable command IDs and per-device ordering. Push commands, not overwrite snapshots. Pull server-ordered pages/tombstones, atomically persist changes and cursor. Notifications trigger pull only. Keep pending local overlay separate from acknowledged base. Never lose original receipt/audit on conflict.

SQLite/IndexedDB atomically commit effects plus queue. Initial online login and device registration required. Offline unlock is device-local, no shared desktop PIN hashes. Membership changes learnable on reconnect/grant expiry; online-only privileged membership/tax/allocation policy changes. Logout locks rather than erases pending data.

Browser storage scoped by business/device/schema, minimum authorized data, persistent-storage request and durable write/read probe. Disable offline finalization if storage fails. Cache versioned shell only, not arbitrary authenticated responses. Upgrades preserve queues and compatible caches. Browser closure is not promised background sync. Recovery export warns about sensitive content.

## Migration/recovery

Backup, drain legacy outbox, checkpoint, import IDs/history/balances, register devices, allocate rights, disable old uploader, enable v2. Never both writers/protocols together. Before v2 writes, legacy rollback may restore checkpoint. After v2 writes, forward repair or coordinated restore/replay with old devices fenced and uncertain allocations quarantined. Verify record counts, balances, audit continuity and pending operations. Browser storage is not the only backup.
