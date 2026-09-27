# ServOS Patch 07 — Folios, POS Room Charging & Checkout Conservation

Expected base: Patch 06 at or after `09567221e38035a6ff73753c813e41421297696b`.

Patch 07 adds:
- SQLite schema v6 financial-history immutability;
- native folio accommodation/service/deposit/payment/application/refund/reversal commands;
- paid stay extension;
- conserved checkout with immutable hotel receipt capture;
- POS → guest-folio receivable transfer without cash or duplicate revenue;
- Front Desk checkout and folio-aware check-in/moves;
- Folios UI;
- hotel-service CRUD and CSV application;
- close-day hotel revenue/tender integration;
- sanitized room-charge targets for POS staff;
- regression/source tests and user documentation.

Apply:

```powershell
node .\apply-servos-patch-07.mjs C:\Users\Admin\Downloads\servos
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

The applicator does not open the business SQLite database and does not contact Supabase.
