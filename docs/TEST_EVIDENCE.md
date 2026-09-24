# Test evidence

## Current environment

Date: 2026-09-24.

Available: Node 22, npm 10, global `tsc`.

Unavailable: Rust/Cargo and Docker. `npm ci` timed out due environment network access, so Vite/Playwright/Tauri package execution cannot be honestly claimed from this environment.

## Dependency-independent checks

Run before handoff:

```bash
node scripts/build-help-index.mjs
node scripts/docs-check.mjs
node scripts/audit-ui.mjs
node --test tests/*.test.mjs
```

The final handoff response must report their actual results.

## Full target-machine gate

After successful dependency installation:

```bash
npm ci
npm run lint
npm run build
npm test
npm run test:browser
npm run test:native
npm run test:cloud
npm run audit:ui
npm run docs:check
```

Do not change a status to deployment verified unless the complete packaged-device rehearsal in [BAR_PRODUCTION_ACCEPTANCE.md](BAR_PRODUCTION_ACCEPTANCE.md) also passes.
