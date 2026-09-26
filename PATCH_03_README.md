# ServOS Patch 03 — Import Center

Requires Patch 02A source to be present locally.

Apply:

```powershell
node .\apply-servos-patch-03.mjs C:\Users\Admin\Downloads\servos
```

Patch 03 creates a version-4 SQLite migration for an isolated import staging workspace, a dedicated Import Center UI/route, 14 canonical CSV templates, validation/history/cancellation APIs, immutable import events and regression tests.

It deliberately does **not** create an import apply command.

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

Cargo will add the `csv` and `sha2` dependencies to the lockfile during the first Rust build.
