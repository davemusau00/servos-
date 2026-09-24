# Current release state

Updated: 2026-09-24. **Partial implementation. Not deployment ready.**

## Latest progress and next slice

Documentation separates the accepted deployment target from source implementation and local verification. The obsolete platform specification and administration surface were removed; the retained index covers business operations, implementation, verification and deployment. Supabase configuration is stored locally outside version control. The live replica table now rejects anonymous access with a database permission error; this does not establish enrollment or synchronization.

The table-lifecycle slice is implemented: native layout saving is atomic and version-checked; occupied table ownership is preserved; removing occupied tables is rejected; cleaning completion is attributable; seating and transfer require availability. The designer preserves stored positions, uses real staff assignments, supports coordinate editing and keeps errors/drafts visible. SQL migration 003 rejects malformed remote requests without changing business records. Native execution and full trading acceptance remain priorities.

## Implemented in source

- Tauri scaffold, typed command boundary, versioned SQLite records, audit, command deduplication and transactional outbox.
- Argon2 PIN verification, persistent retry throttling, role checks and expiring local sessions.
- Selected master save/archive commands; simple orders, firing, recipe stock depletion, KDS transitions, unpaid transfer/merge and unfired voids.
- Atomic outlet floorplans and versioned table cleaning confirmation; table lifecycle cannot be reset by layout edits.
- Stock counts, waste and transfers with movement records and negative-stock rejection.
- Till opening/closing, manual cash/card/M-Pesa, atomic split payments, receipt uniqueness/allocation and manager reconciliation.
- Configured inclusive-tax snapshots and balanced payment journals, including partial-payment rounding. Full accrual accounting remains pending.
- Internal receipt preview, text export and OS print/PDF handoff; simulated device diagnostics removed.
- Restart-safe enrollment credentials, ordered Supabase uploads, remote request polling/version checks and acknowledgements after replica upload.
- Online manager login, replica browsing, terminal health and selected administrative change requests.
- Consistent manual SQLite backup. Credentials are included; encryption and restore are not implemented.

These are source implementation claims. Verification below applies only to the named checks, not whole-module acceptance.

## Verification evidence

- `npm run lint`, `npm run build`, and `npm test`: passed; five documentation/SQLite integrity tests. Build warns about the large frontend bundle.
- Browser preview: four desktop/narrow-layout checks passed, covering module navigation and floorplan draft editing/cancellation/truthful preview saving. These do not verify native UI persistence.
- Static interaction inventory: 1,209 controls, handlers and routes; all require workflow classification and acceptance.
- Native domain tests: **14 passed** on Windows against the actual Rust store and bundled SQLite. Coverage includes restart persistence, payment replay, changed-payload rejection, split rollback, M-Pesa allocation limits, tax rounding, stock bounds, role checks, PIN throttling, audit immutability, stale floorplan conflicts, occupied-table preservation and cleaning/reseating. `cargo check --tests` also passed. This used Rust GNU, Zig for C compilation (sanitizer instrumentation disabled), and Rust LLD; the earlier linker failure is resolved for domain tests. Tauri package verification remains separate and open. The optional Linux container test has not been verified; its image download did not complete.
- `npm run test:cloud`: passed in disposable PostgreSQL 18.6 with minimal Supabase Auth fixtures. All three migrations apply. Assertions cover retry-safe enrollment, one active terminal, unchanged/changed replays, sequence-gap rollback, read/write permissions, malformed requests, upload-before-applied acknowledgement, revoked request authors and fenced terminals.
- Configured project: Auth settings HTTP 200. Latest anonymous replica probe HTTP 401 / PostgreSQL 42501, permission denied for business_records (previously 404). No remote migrations or business-data mutations performed by this agent; no sync claim established.
- Live Supabase Auth/HTTP integration, authenticated native end-to-end, physical devices, offline shift and restore rehearsals: not verified.

## Release blockers

Unconnected native modules display an integration-pending screen. Browser fixtures and legacy handlers remain prototype behavior, not production functionality.

Outstanding: modifiers/portions/discounts/comps/refunds; full stock disposition and period locks; customer credit accounting and UI; procurement, hotel, CRM, events, HR and production integration; staff revocation; secure credentials; backup encryption/rotation/upload/restore; complete domain constraints and asynchronous UI contracts; platform packaging and every interaction's acceptance scenario. Guest ordering remains a prototype. Remote requests and enrollment recovery exist in source but need adverse-condition server tests.

No module is sync verified or deployment verified. Continue the [accepted implementation plan](IMPLEMENTATION_PLAN.md), beginning with native execution, cloud migration verification and the complete trading rehearsal.
