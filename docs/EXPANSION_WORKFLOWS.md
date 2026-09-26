# Domain workflow specification

Planned unless completion ledger states otherwise. All mutations inherit command identity, auth, versions, audit and atomic effects from [contracts](EXPANSION_CONTRACTS.md). Capabilities below are target families, not an assertion they exist today.

## Masters/settings

record.save/archive/reactivate: collection manage permission, uniqueness, active references, guarded archives. settings.update: business.configure/tax/system capability, version/effective time, changed-field audit; sensitive policies online only. Same validation in setup/live. Preserve last administrator. Historical snapshots unaffected. MASTER/SETTINGS acceptance includes denial/stale/reload/second user.

## POS/host/production/procurement

- reservation.create/update/cancel/seat and waitlist.add/update/contact/seat: host.manage; date/capacity validation, atomic order/table claim; manual contact evidence. Offline owned table only.
- Existing order mutations plus courses: pos/order capabilities, owned order/table, price/tax/recipe snapshot, deplete once on fire; no automatic stock recreation on refund.
- production.create/post/reverse: inventory.production; DRAFT -> POSTED -> REVERSED. Ingredient consumption, output yield/cost and waste together; offline requires all affected stock rights.
- purchaseOrder.save/submit/cancel/receive, goodsReceipt.return, supplierPayable.match/pay: procurement capabilities; draft-only editing, linked receipt/stock/payable/journal effects. Returns reference original receipt; paid adjustments need credit/reversal. Offline settlements draft pending validation.

## Rooms

rooms.manage masters: types, amenities, capacity, rate plans. Reservation RESERVED -> CHECKED_IN -> CHECKED_OUT or CANCELLED/NO_SHOW. Housekeeping DIRTY -> CLEANING -> INSPECTION -> CLEAN independently of occupancy and AVAILABLE/OUT_OF_ORDER condition.

roomReservation.create/update/cancel/noShow; stay.checkIn/extend/move/checkOut: rooms.operate. Validate guest/capacity, UTC intervals/property timezone, turnaround and overlap. Nightly local arrival/departure, day-use fixed duration/price, extensions explicitly priced. Room move locks both intervals; offline all intervals must be allocated.

folio.postAccommodation/postService/roomCharge/deposit/pay/reverse/transferCredit: folio.manage/payment.record. Immutable minor-unit entries, rate/tax snapshot, unique stay/charge-period for restart catch-up. POS transfers receivable, never cash or duplicate revenue. Deposits liability until allocated; minibar depletes once. Checkout zero balance or approved credit transfer, then dirty room. No generic balance edits. ROOM/MONEY/GL proves conservation.

## Assets/maintenance

asset.save/archive/reactivate: assets.manage, unique tag, category/location/supplier/acquisition references. asset.assign/return/transfer/inspect/lose/retire/dispose: assets.operate, versioned custody and immutable event/reason; offline requires ownership. No depreciation.

maintenance.report/assign/start/complete/cancel: maintenance.manage; REPORTED -> ASSIGNED -> IN_PROGRESS -> COMPLETED. Shared room/asset references, stock-part movements and cost links. Release room block explicitly after inspection, never clear occupied guest. Acquisition receives stock OR asset, not both. ASSET/STOCK verifies repeated parts/acquisitions.

## CRM/events/staff

- customer.save/archive, loyaltyRule.save, loyalty.earn/redeem/reverse, credit.limit/charge/settle: crm/credit permissions; source-linked immutable points/credit ledger, refunds reverse earnings, offline redemption limited to reserved budgets.
- event.save/publish/cancel, ticket.sell/refund/admit, promoter.save, commission.accrue/pay/reverse: event manage/admit permissions, capacity, actual ticket identity, one admission; offline assigned tickets only. Commissions derive eligible settled sales; payouts manual evidence.
- employee.save/deactivate, shift.save/clockIn/clockOut, leave.request/approve/reject/cancel, advance.request/approve/pay, payroll.generate/approve/pay/reverse: HR/payroll permissions. Preserve employee/login linkage, roster/leave conflict guards, payroll effective-rule snapshots with no sample statutory defaults. Approved runs immutable; manual payout/reference. Attendance may queue under grant; payroll approval/payment online.

## Accounting/reports/control

account.save/archive, journal.saveDraft/post/reverse, expense.record/reverse: accounting manage/post; balanced minor units, active accounts, immutable posted history. Manual fiscal records do not imply submission/certification. Statements derive posted entries.

alert.acknowledge/resolve and approval.request/decide: target/action/version bound, single-use approval and initiator/approver attribution. REPORT queries real sales/occupancy/yield/stock/credit/assets/payroll by permission/date/timezone/business day. CSV creates bytes and escapes formulas; printable export uses selected real data.

All views require search/filter, paginated history, details/source links, empty/loading/error states. No hard deletion of money/stock/audit/folio/custody. Unreferenced masters archive/reactivate after uniqueness checks. Guest QR remains sample only; hardware actions local or explicit registered agent.
