# ServOS Patch 05 — Native Rooms Engine

Requires the local Patch 04 controlled-import source.

Patch 05 adds:

- native room-type, room, rate-plan, room-block and reservation commands;
- half-open interval availability checks with turnaround buffers;
- reservation rate snapshots and quoted amounts;
- room-condition and housekeeping state machines;
- Rooms Studio UI;
- `rooms.view`, `rooms.manage`, `rooms.operate`, `rooms.guests.view` permissions;
- Import Center application for `room_types.csv`, `rooms.csv` and `rate_plans.csv`;
- continued blocking of `hotel_services.csv` until Folios;
- a correction to the stock-location/outlet example dependency order;
- native/domain regression tests and source-level tests.

Patch 05 deliberately does not implement check-in/check-out. The staged architecture requires stay and folio state to be atomic. That financial boundary remains reserved for the stay/folio integration.

Apply:

```powershell
node .\apply-servos-patch-05.mjs C:\Users\Admin\Downloads\servos
```

Validate:

```powershell
git diff --check
npm run lint
npm test
npm run test:native
npm run test:desktop
npm run build
npm run test:browser
npm run audit:ui
npm run docs:check
```
