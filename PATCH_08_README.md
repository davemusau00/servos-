# ServOS Patch 08 — Native Assets & Maintenance Domain

Expected local base:
- Patch 07 Folios applied;
- Patch 07.1 Go-Live/test repair applied.

Patch 08 is deliberately a domain-engine patch. Patch 09 remains the Asset Register and procurement-commissioning UI patch.

Patch 08 adds:
- SQLite schema v7;
- permanent case-insensitive asset tags across active/archived history;
- asset categories;
- asset save/archive/reactivate;
- assign/return/transfer/inspect/lose/retire/dispose;
- immutable asset and maintenance events;
- maintenance REPORTED → ASSIGNED → IN_PROGRESS → COMPLETED/CANCELLED;
- room-linked maintenance blocks;
- maintenance part issues using stock version baselines;
- maintenance stock movements and expense/inventory journals;
- external service supplier payables and AP journal;
- asset category / asset CSV application through Import Center;
- native/domain regression tests and source-level invariants.

Apply:

```powershell
node .\apply-servos-patch-08.mjs C:\Users\Admin\Downloads\servos
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
