# CRUD coverage and mutation policy

ServOS does **not** expose generic CRUD over every record type. That is intentional.

## Safe master-data CRUD

The installed Admin/Manager surfaces may create and edit reusable master data through the versioned `record.save` command where the backend collection policy allows it.

| Collection | Create | Read | Update | Archive | Permission |
|---|---:|---:|---:|---:|---|
| Customers | yes | yes | yes | yes, if no open-order reference | `catalog.manage` |
| Suppliers | yes | yes | yes | yes, if no open PO/payable | `procurement.manage` |
| Service areas / outlets | yes | yes | yes | no generic archive | `business.configure` |
| Stock locations | yes | yes | yes | yes, only when unused and empty | `inventory.adjust` |
| Products | yes | yes | yes | backend archive supported | `catalog.manage` |
| Stock items | yes | yes | yes | only at zero stock | `inventory.adjust` |
| Price rules | yes | yes | yes | yes | `pricing.manage` |
| Tables | dedicated floorplan CRUD | yes | dedicated | guarded | `floorplan.manage` |
| Staff | dedicated lifecycle commands | yes | dedicated | deactivate only | staff permissions |

## Dedicated-command records

Orders, payments, refunds, till sessions, cash movements, stock movements, goods receipts, purchase orders, supplier payables/payments, journal entries, close-day reports, audit, outbox, approvals and similar ledgers require dedicated business commands.

A generic editor must never rewrite committed financial, stock, audit or synchronization history.

## Concurrency and deletion

Master data uses optimistic record versions. Updates/archive fail with `CONFLICT` when stale. Where removal is appropriate, ServOS archives instead of physically deleting.
