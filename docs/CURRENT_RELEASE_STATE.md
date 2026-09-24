# Current release state

Updated: 2026-09-24. **Partial implementation. Not deployment ready.**

## Implemented in source

- Tauri application scaffold, typed frontend/native command boundary and version-one SQLite schema.
- Argon2 local PIN verification, persistent attempt throttling, native role checks and expiring sessions.
- Versioned record saves/archives for selected master collections, command deduplication, application audit and transactional outbox.
- Basic order creation/items/firing, stock depletion, KDS status updates, till open/close and manual cash/card/M-Pesa payments.
- Atomic split payment command; M-Pesa account/code uniqueness, remaining receipt allocation and manager statement confirmation.
- Supabase enrollment/upload migration with dedicated-project manager membership, one active terminal, ordered replay checks and manager-only read policies.
- Native startup/reconnect/foreground sync with retries and local queue acknowledgements after an upload response.
- Native administration and reconciliation views; preserved browser UI explicitly labelled as sample-data preview.
- Manual consistent local SQLite backup command.

These are source implementation claims. Native execution and live-server behavior must be separately verified.

## Verification evidence

- `npm run lint`: passed after the initial foundation changes.
- Dependency installation: passed after correcting the pre-existing Vite/esbuild peer conflict and retrying an interrupted registry download.
- Frontend build: pending final result.
- Native tests: written, not yet executed; Rust toolchain download and a compatible C/linker toolchain remain unresolved in this environment.
- Supabase migration/policy/replay tests: not executed against a configured project.
- Physical-device, authenticated end-to-end, offline shift and restore acceptance: not performed.

## Release blockers

The native adapter still explicitly rejects many operations. Unconnected native modules show an integration-pending screen; that is not feature completion. Browser preview fixtures and legacy local-state handlers are not production implementations.

Priority gaps: complete trading command validation and tax accounting; true asynchronous view contracts; modifiers/portions/discounts/refunds/merge/transfer; stock adjustments and procurement; remote request polling/application and manager UI; staff lifecycle/revocation; secure credential storage; enrollment recovery; backup encryption/rotation/upload/restore; full module integration and platform acceptance.

Several existing receipt/hardware/provider preview surfaces still need removal of simulated claims. The static UI inventory needs runtime classification and acceptance evidence. No module is sync verified or deployment verified.

## Next work

Continue the accepted [implementation plan](IMPLEMENTATION_PLAN.md). Resolve build/toolchain checks, finish the first trading workflow and its transactional tests, then integrate the remaining modules in dependency order. Keep broad release blockers open until their acceptance evidence exists.
