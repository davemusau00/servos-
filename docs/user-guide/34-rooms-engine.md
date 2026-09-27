# Rooms engine

ServOS Rooms Studio manages room inventory and reservation availability through the native command boundary.

Section: Rooms
Roles: Admin, Manager
Permission: rooms.view, rooms.manage, rooms.operate
Screen: Rooms Studio

## Overview

Rooms Studio provides the native room-domain controls for room types, physical rooms, rate plans, room blocks, housekeeping state, room condition, and reservations.

Reservations use half-open occupancy intervals and hold the room through its configured turnaround period. Existing reservations retain a snapshot of the selected rate and quoted amount, so later rate edits do not silently reprice a booking.

Patch 05 deliberately stops before check-in and checkout. The staged ServOS contract requires reservation, stay, and folio state to move together when a guest checks in or out. That financial boundary is implemented with the stay/folio integration rather than through a non-financial shortcut.

## Procedure

### Configure room types

1. Open **Rooms Studio**.
2. Choose **Room type**.
3. Enter a unique code, name, and maximum guest capacity.
4. Save the room type before creating rooms or rate plans that depend on it.
5. Archive a room type only after all active rooms and rate plans referencing it have been resolved.

### Configure physical rooms

1. Choose **Room**.
2. Enter the room number and select its room type.
3. Set guest capacity and turnaround minutes.
4. Optionally record the floor, wing, amenities, and notes.
5. For a new room, choose its initial state: `READY`, `DIRTY`, or `OUT_OF_ORDER`.
6. Save the room. Active room numbers must remain unique.

Room housekeeping follows:

`DIRTY → CLEANING → INSPECTION → CLEAN`

Inspection can return a room to `DIRTY`.

Room condition is independent from housekeeping. `OUT_OF_ORDER` rooms cannot accept reservations.

### Configure rate plans

1. Choose **Rate plan**.
2. Select the room type.
3. Choose `NIGHTLY` or `DAY_USE`.
4. Enter the KES rate and tax basis points.
5. For day use, enter the fixed duration.
6. Set meal plan and applicable stay limits.
7. Save the rate plan.

A reservation snapshots the selected rate plan. Editing the master rate later does not alter existing reservation quotes.

### Create a reservation

1. Choose **New reservation**.
2. Select the guest, room, and compatible rate plan.
3. Enter the number of guests.
4. Enter arrival and departure.
5. Review the interval and save.

ServOS rejects:

- guest counts above room capacity;
- rate plans belonging to another room type;
- overlapping active reservations;
- overlaps with active room blocks;
- invalid day-use durations;
- nightly stays outside the rate plan limits;
- reservations on an out-of-order room.

The reservation holds the room through departure plus its configured turnaround minutes.

### Update or close a reservation

A reservation can be edited only while it is `RESERVED`.

Choose **Cancel / no-show** to close a reservation with a reason. A no-show cannot be recorded before the scheduled arrival time. If a later folio contains money, cancellation/no-show requires the folio funds to be resolved first.

### Block or release a room

Use **Block** when a room should be unavailable for a specific interval without permanently taking it out of service.

A block cannot overlap another active booking or block. To release it, record an inspection note.

Use **Out of order** for a broader room-condition problem. A room with active reservations cannot simply be switched out of order without first resolving the affected reservations.

### Import room data

After Patch 05, Import Center can dry-run and apply:

- `room_types.csv`
- `rooms.csv`
- `rate_plans.csv`

Apply room types first because rooms and rate plans resolve `room_type_external_id` through the durable migration mapping.

`hotel_services.csv` remains staged until Folios so service price/tax snapshots and posting rules are atomic.

## Reservation and stay boundary

Patch 05 does not expose check-in or checkout.

The hospitality transaction contract requires one reservation, one stay, and one folio. Check-in and checkout therefore arrive with the stay/folio integration, where accommodation charges, deposits, receivables, and room-state transitions can be validated atomically.
