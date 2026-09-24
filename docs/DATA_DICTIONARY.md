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

Product records can contain `portions[]`, `modifiers[]`, `recipeIngredients[]`, barcode/favorite metadata, preparation route and outlet assignment. Order lines freeze the chosen portion, modifier list, ingredient recipe, price rule, tax policy and product version.

## Transactions and ledgers

`orders`, `payments`, `mpesaReceipts`, `refunds`, `tillSessions`, `cashMovements`, `stockMovements`, `inventoryReceipts`, `journalEntries`, `closeDayReports`.

Stock is altered only through explicit movement-producing business commands. Financial refunds create reversal journals and do not automatically recreate consumed ingredients.
