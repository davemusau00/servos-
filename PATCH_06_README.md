# ServOS Patch 06 — Front Desk + Housekeeping

Requires the Patch 05 native Rooms engine marker in `src-tauri/src/store.rs`.

Patch 06 adds:
- Front Desk route and seven/fourteen-day tape chart;
- Nairobi-hotel-date arrivals and departures;
- safe native check-in;
- in-house room moves with old-room dirtying and turnaround block;
- zero-value folio shell creation at check-in;
- dedicated Housekeeping board;
- room condition/block operations surfaced operationally;
- explicit Patch 07 gates for paid extension and checkout;
- source tests, Rust regression tests, and two user guides.

The installer also repairs the Patch 05 Rooms guide metadata if the separate 05.1 documentation repair has not yet been applied.

Apply:

```powershell
node .\apply-servos-patch-06.mjs C:\Users\Admin\Downloads\servos
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
