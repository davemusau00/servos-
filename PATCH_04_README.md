# ServOS Patch 04 — CSV Onboarding & Controlled Migration

Base expected: Patch 03 commit `7f307b0accbcc04505a0661696200d8208b64880` or later.

Apply:

```powershell
node .\apply-servos-patch-04.mjs C:\Users\Admin\Downloads\servos
```

Verify:

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

The applicator edits source/tests/docs only. It does not open the business SQLite database and does not contact Supabase.
