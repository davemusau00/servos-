# Operational workflows

These are acceptance targets. Consult the coverage matrix before treating a workflow as available.

## Trading and restaurant service

Enroll owner -> configure outlets, stock locations, catalog, taxes and opening balances -> enroll staff -> open till -> create table/walk-in order -> add seats, courses, portions and modifiers -> fire courses -> deplete snapshotted ingredients once -> prepare/serve -> allocate payments -> issue an internal receipt -> reconcile tenders -> close till.

Reservations progress booked/confirmed/arrived/seated/completed, with cancelled/no-show alternatives. Waitlist parties seat against actual availability. Floorplan edits preserve active orders. Splits and merges preserve item ownership and payment allocation. Fired voids require return-versus-waste disposition. Refunds reverse money without automatically returning stock.

The implemented table lifecycle is AVAILABLE -> ORDERING -> CLEANING after payment, transfer or eligible void -> AVAILABLE after staff select Mark clean. Cleaning confirmation does not open a new order. Floor Studio saves all changes together, preserves occupied table ownership and rejects stale layout versions. Failed saves leave the draft open with an error. Preview saves explicitly require the installed application.

## Manual M-Pesa

Cashier checks the business receipt, enters code/account/amount/time and confirms it. The terminal records the payment as manually confirmed, with reconciliation pending. Codes are normalized and unique per account. Allocations cannot exceed the recorded receipt; surplus needs a customer credit owner. Managers compare statement evidence and confirm matching amounts. Discrepancy and reversal workflows remain required before full release.

## Procurement and production

Supplier -> PO -> approval -> partial GRN -> inventory receipt -> supplier invoice -> three-way match -> AP allocation. Repeated receipt cannot duplicate stock. Batch production consumes raw inputs and produces measured output in one command; waste and yield are explicit.

## Hotel, CRM and events

Reservation -> conflict check -> deposit -> check-in/manual key issuance -> folio charges -> settlement -> checkout -> housekeeping inspection. Room-charge settlement must not recognize the same revenue twice. CRM timelines and loyalty derive from these records. Event capacity controls ticket sale; each ticket can be admitted once. Commissions and refunds require actual manually confirmed outgoing payment references.

## Staff and accounting

Provision staff -> schedule/attendance -> leave/advances -> payroll calculation using effective configuration -> approval -> manually evidenced disbursement. Till movements and variances are attributable. Every posted journal balances; closed periods reject ordinary mutation. Corrections use reversals and linked replacement records.

## Offline and recovery

Enrolled staff unlock locally. Every accepted command saves records, audit and outbox atomically. Restart must retain them. Reconnection replays commands idempotently. Remote changes stay pending until the terminal applies them. Restore must include pending outbox data and fence the replaced terminal before syncing.
