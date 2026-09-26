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
