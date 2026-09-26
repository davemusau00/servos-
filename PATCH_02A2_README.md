# ServOS Patch 02A.2 Repair

Fixes the two remaining Patch 02A validation failures:

1. Adds the required Rust `(None, None) => continue` reconciliation match arm.
2. Removes the cloud test's direct anonymous `SELECT` against `public.business_records`. RLS is supposed to deny that query. The replacement verifies read-only behavior using the authenticated reconciliation RPC itself.

Run:

```powershell
node .\apply-servos-patch-02a2-repair.mjs C:\Users\Admin\Downloads\servos
```

Then:

```powershell
npm run lint
npm run test:native
npm run test:desktop
npm run test:cloud
```

If those pass, run the complete Patch 02A gate.
