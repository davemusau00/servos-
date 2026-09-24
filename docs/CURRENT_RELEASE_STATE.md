# Current release state

Updated: 2026-09-24. **Partial implementation. Not deployment ready.**

## Latest progress and next slice

Documentation now separates the accepted deployment target from source implementation and local verification. The obsolete platform specification and administration surface were removed; the retained documentation index covers only business operations, implementation, verification and deployment. Supabase configuration is stored locally outside version control. Schema installation and enrollment have not been established by the connectivity probe.

The next trading slice closes a table-lifecycle gap: paid or transferred tables enter CLEANING, but currently have no native cleaning-completion command and can be reopened prematurely. Implement an audited readiness command, enforce availability when seating/transferring, and verify failed commands leave no partial records. Native execution remains a priority alongside this work.

## Implemented in source

- Tauri scaffold, typed command boundary, versioned SQLite records, audit, command deduplication and transactional outbox.
- Argon2 PIN verification, persistent retry throttling, role checks and expiring local sessions.
- Selected master save/archive commands; simple orders, firing, recipe stock depletion, KDS transitions, unpaid transfer/merge and unfired voids.
- Stock counts, waste and transfers with movement records and negative-stock rejection.
- Till opening/closing, manual cash/card/M-Pesa, atomic split payments, receipt uniqueness/allocation and manager reconciliation.
- Configured inclusive-tax snapshots and balanced payment journals, including partial-payment rounding. Full accrual accounting remains pending.
- Internal receipt preview, text export and OS print/PDF handoff; simulated device diagnostics removed.
- Restart-safe enrollment credentials, ordered Supabase uploads, remote request polling/version checks and acknowledgements after replica upload.
- Online manager login, replica browsing, terminal health and selected administrative change requests.
- Consistent manual SQLite backup. Credentials are included; encryption and restore are not implemented.

These are source implementation claims, not native or server acceptance evidence.

## Verification evidence

- `npm run lint`, `npm run build`, and `npm test`: passed; five documentation/SQLite integrity tests. Build warns about the large frontend bundle.
- Browser preview: two desktop/narrow-layout route smoke tests passed. This does not verify native business workflows.
- Static interaction inventory: 1,206 controls, handlers and routes; all require workflow classification and acceptance.
- Native tests: ten domain tests written. The GNU/Zig toolchain attempt compiled the store but did not establish executable test results; linking stalled. Desktop check failed in a Tauri dependency build script with `STATUS_ACCESS_VIOLATION`. Use a supported Windows toolchain for native acceptance.
- Configured project's Auth settings endpoint: HTTP 200 with the supplied publishable key. Replica table probe: HTTP 404. No remote migrations or data mutations performed; no sync claim established.
- Supabase policy/replay, authenticated native end-to-end, physical devices, offline shift and restore rehearsals: not verified.

## Release blockers

Unconnected native modules display an integration-pending screen. Browser fixtures and legacy handlers remain prototype behavior, not production functionality.

Outstanding: modifiers/portions/discounts/comps/refunds; full stock disposition and period locks; customer credit accounting and UI; procurement, hotel, CRM, events, HR and production integration; staff revocation; secure credentials; backup encryption/rotation/upload/restore; complete domain constraints and asynchronous UI contracts; platform packaging and every interaction's acceptance scenario. Guest ordering remains a prototype. Remote requests and enrollment recovery exist in source but need adverse-condition server tests.

No module is sync verified or deployment verified. Continue the [accepted implementation plan](IMPLEMENTATION_PLAN.md), beginning with native execution, cloud migration verification and the complete trading rehearsal.
