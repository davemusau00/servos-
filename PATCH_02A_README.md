# ServOS Patch 02A — Data Reconciliation Engine

Base expected: Patch 01 committed on top of `54af395366a132c656545a5e5459a8c3bebb0193`.

This patch is development-safe. It adds comparison machinery but does not perform repairs or v2 cutover.

## Apply

Extract this package into the ServOS repository root, then:

```powershell
node .\apply-servos-patch-02a.mjs C:\Users\Admin\Downloads\servos
```

The applicator:
- is resume-safe;
- refuses to overwrite an unrelated existing migration/UI/doc file;
- backs up every modified existing file;
- does not open or modify `servos.sqlite`;
- does not contact Supabase;
- only changes source/tests/docs.

## Verify

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

`npm run test:cloud` requires Docker because it creates a disposable PostgreSQL instance.

Do not apply the new Supabase migration to the real business project until the terminal is available and Patch 01 checkpoint evidence has been captured.
