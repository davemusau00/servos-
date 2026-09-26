# Test evidence

## Expansion checks — 2026-09-26

Windows workspace, Node 26, Rust/MSVC and Docker available. Checks below apply to the source slices in [Completion ledger](COMPLETION_LEDGER.md), not the full expansion.

- `npm run lint`: passed.
- `npm test`: 19 passed.
- `npm run build`: passed; existing large-bundle warning remains.
- `npm run docs:check`: passed, 33 guides and 15 core documents after the receipt/settings guide was added.
- `npm run audit:ui`: 1,901 controls/handlers/routes inventoried, not runtime acceptance.
- `cargo test --manifest-path native-tests/Cargo.toml`: 31 passed, including printer tests and new receipt/settings cases.
- `cargo test --manifest-path src-tauri/Cargo.toml --lib`: 31 passed, including current receipt/settings and printer code.
- `npm run test:browser`: 12 passed across desktop/mobile, including receipt print-root/footer/overflow, real IndexedDB restart/replay/rollback and service-worker offline shell reload without caching private API responses.
- `node scripts/test-supabase.mjs --expansion`: passed in disposable PostgreSQL, including legacy protocol, staged v2 command/replay/conflict/authorization/cursor/tombstone tests and allocation budget/interval/ownership/expiry/handover tests.

Receipt tests use real SQLite transactions; browser receipt tests mock Tauri transport. Browser queue tests exercise real IndexedDB with simulated cloud responses. Cloud tests use disposable PostgreSQL, not the configured Supabase project. No physical printer, Vercel publication, full multi-device trading, Rooms/Assets operational acceptance or live migration was performed.

Mobile receipt screenshot `test-results/preview-native-checkout-pr-2b26a-and-business-receipt-copies-mobile-layout/receipt-preview.png` was visually inspected: readable two-copy preview and footer with no horizontal clipping. This is screen evidence, not physical paper output. `git diff --check` passed.

## Historical environment — 2026-09-24

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
