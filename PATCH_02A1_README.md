# ServOS Patch 02A.1 Repair

This repair addresses the three failures observed after applying Patch 02A:

1. A package-preview `NativeDataReconciliationPanel.tsx` extracted at the repository root was picked up by TypeScript and could not resolve `../types/runtime`, `../runtime/RuntimeProvider`, `./ActionDialog`, or `./records`.
2. Rust correctly rejected the reconciliation `match` as non-exhaustive even though `(None, None)` cannot occur after iterating the union of keys.
3. The disposable PostgreSQL harness rejected the `DO $$ ... $$` test block, so the cloud test is rewritten as ordinary assertion statements.

The repair:
- removes only the known stray root TSX preview file;
- adds `(None, None) => continue` to the Rust comparison;
- replaces only the marked Patch 02A test block;
- backs up changed files;
- does not open `servos.sqlite`;
- does not contact Supabase.

Run from the repository root:

```powershell
node .\apply-servos-patch-02a1-repair.mjs C:\Users\Admin\Downloads\servos
```

Then verify:

```powershell
git diff --check
npm run lint
npm test
npm run test:native
npm run test:desktop
npm run build
npm run test:browser
npm run test:cloud
npm run audit:ui
npm run docs:check
```
