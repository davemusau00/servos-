# Rooms engine

ServOS Rooms Studio manages room inventory and reservation availability through the native command boundary.

Section: Rooms
Roles: Admin, Manager
Permission: rooms.view / rooms.manage / rooms.operate
Screen: Rooms Studio

## Masters

Room types define the maximum guest capacity. Rooms belong to one room type and store a room number, guest capacity, turnaround minutes, floor/wing metadata, housekeeping state and availability condition.

Rate plans belong to a room type. A plan is either `NIGHTLY` or `DAY_USE`, uses KES, snapshots its price and tax basis into reservations, and can define meal plan and stay limits.

Room numbers and room-type codes must remain unique while active.

## Reservations and availability

Reservation intervals are half-open. A room is held from arrival through departure plus its configured turnaround minutes. Overlapping reserved or checked-in intervals are rejected. Active room blocks participate in the same availability check.

A reservation snapshots:

- room
- rate plan
- customer
- guest count
- arrival/departure
- turnaround
- rate plan
- rate units
- quoted amount

Changing a rate later does not silently reprice an existing reservation.

Reservations can be updated while `RESERVED`, cancelled with a reason, or marked no-show after the arrival time.

## Room state

Housekeeping follows:

`DIRTY → CLEANING → INSPECTION → CLEAN`

Inspection can return the room to `DIRTY`.

Room condition is independent from housekeeping. `OUT_OF_ORDER` rooms cannot accept reservations. Temporary unavailability should normally use an interval room block.

## Stay lifecycle boundary

Patch 05 intentionally does not invent a non-financial check-in/check-out path.

The expansion contract requires one reservation, one stay and one folio. Check-in and checkout therefore arrive with the stay/folio transaction integration, where deposits, receivables and accommodation posting can be validated atomically.

## CSV migration

After Patch 05, `room_types.csv`, `rooms.csv` and `rate_plans.csv` can be dry-run and applied through Import Center. They resolve `room_type_external_id` mappings and execute the same room-domain commands as the UI.

`hotel_services.csv` remains staged until Folios.
