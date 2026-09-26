# Data dictionary

## SQLite system tables

- `metadata`: terminal/cloud configuration, intake profile, installation stage, last sync and last backup.
- `staff`: local identity, persisted role, Argon2 PIN hash, active state and login throttling.
- `sessions`: expiring local bearer sessions; deleted on process restart.
- `approvals`: short-lived single-use manager approval tokens scoped to initiator/capability/target.
- `records`: versioned JSON domain records keyed by collection/id.
- `commands`: command ID + fingerprint + committed result for idempotency.
- `audit`: immutable ordered attribution record.
- `outbox`: ordered operation envelope pending server acknowledgement.
- `mpesa_codes`: unique account/code mapping to receipt.
- `remote_requests`: durable outcomes for remote manager requests.

## Setup/domain records

`organization`, `property`, `businessSetup`, `paymentConfig`, `tillPolicy`, `outlets`, `stockLocations`, `employees`.

## Bar masters

`products`, `stockItems`, `suppliers`, `priceRules`, `tables`.

Product and stock records may include `barcode` as text, preserving leading zeroes. It is unique within its own collection; a sellable and its related stock master may intentionally have the same physical code. `stockItems.scanUnitQuantity` is the positive quantity represented by one package scan, expressed in that stock item's `baseUnit`. Product records can also contain `portions[]`, `modifiers[]`, `recipeIngredients[]`, favorite metadata, preparation route and outlet assignment. Order lines freeze the chosen portion, modifier list, ingredient recipe, price rule, tax policy and product version.

## Procurement records

`purchaseOrders` store supplier, approved quantities in stock base units, agreed unit cost, cumulative delivered/accepted/rejected quantities and PO status. The line's `scanUnitQuantity` snapshots the package size when the order is created. `goodsReceipts` are immutable GRNs with delivery evidence, receiver, location, per-line accepted/rejected quantities and rejection reason. `inventoryReceipts` and `stockMovements` record accepted quantity only. `supplierPayables` accrue accepted quantity at the approved PO cost; invoice-match fields retain exact PO/GRN comparison and due date. `supplierPayments` are manually confirmed external settlements. Each payment and payable accrual has a balanced paired `journalEntries` record.

## Transactions and ledgers

`orders`, `payments`, `mpesaReceipts`, `refunds`, `tillSessions`, `cashMovements`, `stockMovements`, `inventoryReceipts`, `goodsReceipts`, `supplierPayables`, `supplierPayments`, `journalEntries`, `closeDayReports`.

Stock is altered only through explicit movement-producing business commands. Financial refunds create reversal journals and do not automatically recreate consumed ingredients.


## Commissioning evidence

`installationProfile`: commissioning snapshot containing confirmed non-secret Intake, terminal ID, owner identity and initial Administrator ID. It is not part of generic CRUD.
# Expansion data model

Planned v2 records, uniqueness, money/time representation and migration compatibility are specified in [Expansion contracts](EXPANSION_CONTRACTS.md). Existing structures below remain current until implementation and cutover evidence is recorded.

Implemented receipt additions: `receiptDocuments` in the native records table; immutable UPDATE/DELETE triggers in SQLite migration 003; source command/order/device IDs, device-local receipt sequence, captured header/items/totals/payments, integer minor units. Payments add nullable `cashTenderedMinor` and `changeMinor`; null means unknown/not cash. Original payments without captured receipts are not reconstructed with current identity data. New receipt records join the same audit/outbox transaction as their payments.

## Staged cloud operational records (not migrated live)

Expansion migrations 003-007 retain the private `(collection,id)` record key and optimistic `version`. All writes enter the v2 command transaction; authenticated clients have no direct table access. The transactional control-row lock serializes shared-resource checks with their effects. This is deliberately a conservative concurrency implementation for one property, not a claim of high-throughput scaling.

- `assets`: permanent unique tag across archived history, category, room/location, supplier/acquisition cost, warranty, condition, custodian and lifecycle status. Editing metadata cannot change custody/location; dedicated transfer records an immutable `assetEvents` before/after snapshot. Archiving does not revive retired/disposed assets.
- `maintenanceOrders`: asset/room references, priority, assignment, REPORTED/ASSIGNED/IN_PROGRESS/COMPLETED/CANCELLED state, resolution and parts. Completion atomically reduces stock, writes stock movements, posts expense/inventory journals and, for manual supplier invoices, payable/expense journals. Failure in any later step rolls back every earlier effect. No supplier payment is invented.
- `rooms`: unique permanent number, room type, capacity, turnaround minutes, amenities and independent housekeeping/maintenance fields. Structural edits with active reservations/allocations are blocked.
- `ratePlans`: room type, NIGHTLY or DAY_USE mode, day-use duration, integer KES minor-unit price and tax basis points. Reservation records snapshot the rate; later rate changes do not rewrite quotes.
- `roomReservations`: guest/customer, capacity, UTC start/end, turnaround-inclusive blockedUntil, mode/rate snapshot, units, quote and lifecycle. Nairobi calendar-date differences determine nightly units. Fixed-duration day use must exactly match its selected rate. Bookings and room blocks share availability checks across registered devices.
- `roomBlocks`: room/time interval, reason, optional shared maintenance order and explicit inspected release. Completing maintenance does not silently release a room.

Cloud `journalEntries`, `folioEntries`, `assetEvents`, `stayEvents`, `stayExtensions`, `stockMovements`, `receiptDocuments` and `payments` cannot be updated or deleted. The change feed filters collections by explicit permission while retaining empty sequence slots for safe cursor advancement. Unknown collections default to deny for non-admin members. Permission changes and local cache eviction still require adapter integration.

### Staged stay/folio records (migrations 008-009)

`stays` and `folios` share their reservation's stable ID. Occupancy is derived from active stays; housekeeping remains independent. `stayEvents` preserves arrival, departure and movement attribution. Moves update reservation `occupancyStartsAt` for availability without changing the original billing start or rate. Actual departure writes a finite turnaround block, including IDs of incoming reservations affected by a late departure.

`folios` stores OPEN/CLOSED, balanceMinor and unapplied depositMinor. Only dedicated commands change these amounts. Each immutable `folioEntries` record stores its signed balanceDeltaMinor/depositDeltaMinor and source command. Accommodation entries use a reservation/period-derived key; each original booked period can post once, including catch-up or settlement before early departure. Inclusive gross is split into net/tax minor units in the recorded charge. Service charges snapshot active hotelServices masters and require their baseline version.

`payments` captures purpose, account/method, amount, currency, actor/time, cash tender/change when known, and normalized external references. CASH_RECEIVED and MANUALLY_CONFIRMED do not claim provider reconciliation. M-Pesa references are unique business-wide; other external references are unique per method/account. Payment-account baseline versions prevent silently changing how an accepted tender is recorded. Deposit journals credit a liability; deposit application and settlement credit receivables, never revenue again.

`stayExtensions` records its own rate, units, old/new departure interval, exact amount and linked payment. Accepting an extension posts the charge and payment in the same command transaction; original accommodation units remain unchanged to prevent catch-up duplication. `folio.reverse` currently reverses unpaid charges with source linkage; payment refunds/payouts and credit/POS receivable transfers remain separate unimplemented commands. Journals currently use fixed control-account codes; full configured chart/mapping integration is pending. Cloud receipt-document generation is also pending.
