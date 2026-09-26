# Expansion implementation handoff — 2026-09-26

## Implemented and checked

Documentation was written first. Native sale payments now capture immutable receipt documents atomically; cash/change/header/items are retained. POS offers receipt history/reprint, full 80mm copies, print portal and hard-coded attribution without fiscal disclaimer text. Identity updates are atomic/versioned; live Admin settings edit tax/message/payment/printer/till policy. Printer validation runs in the native backend. Successful command commit is no longer reported as failure merely because reload failed.

Vercel config and authenticated production entry are prepared. Sample UI requires explicit demo config. The optional service worker caches build assets only. Staged v2 master command protocol, change feed, replay/conflict/audit/fencing and private allocation primitives passed disposable PostgreSQL tests. IndexedDB queue/sync passed browser restart, response-loss, cursor rollback and tombstone tests.

## Exact next implementation boundaries

Latest verified continuation: migrations 008-009 and `tests/supabase/folios.sql` passed the disposable expansion suite, including exact ledger conservation and rollback of a paid extension on duplicate payment reference. TypeScript/docs checks passed. The real two-connection booking race still passed. Prior native/browser/build results remain earlier evidence; they were not rerun for this SQL-only continuation.

1. Continue cloud domain validation and cutover tooling. Staged migrations 003-009 add dedicated dispatch, immutable business ledgers, Assets/maintenance, permission-filtered change feed, room/rate/reservations and stay/folio transactions. Keep enabled=false and legacy production behavior until migration acceptance. Sales, credit transfers, POS-to-folio transfers and refund/payout operations still reject as unsupported.
2. Implement signed device/operator grants, issuance, handover/recovery and resource proofs. Current allocation helpers are private database primitives; they must run inside real domain transactions. Do not expose direct resource consumption to browsers. Device registration currently binds one auth owner, not shared multi-operator terminals.
3. Connect web/desktop v2 adapters and read projections to authenticated views. BusinessStore is a staged durable master-edit queue; it does not apply offline business effects, issue grants, or unlock offline users. Account/device recovery and sensitive local storage protection remain pending.
4. Complete folio refund/credit/POS transfers and cloud receipt snapshots, Assets acquisition linkage, and authenticated UI/adapters for both workspaces. Staged stays now include check-in/out, moves and paid extensions. Folios include idempotent accommodation periods, service charges, deposit liabilities/application, manual external or cash payment, and linked unpaid charge reversal. Checkout checks complete accommodation posting and zero balance/deposit. Current source and SQL tests are not complete operational modules. Tests live in tests/supabase/rooms.sql, assets.sql and folios.sql. Hotel service/payment-account CRUD and configured accounting mappings remain integration dependencies; test fixtures do not constitute those features.
5. Add full settings/capability policy profiles, exports, actual two-device failure testing and Vercel/Supabase isolated staging. No production deployment has occurred.

## Known receipt follow-ups

Physical packaged XP-80T paper/cut/retry acceptance remains. Historical payments without receipt documents stay unavailable for snapshot reprint rather than using current identity. Refund/folio receipt document types and cloud receipt generation belong to their domain integration. ESC/POS ASCII substitution remains deterministic; non-ASCII printer glyph support is not added.

## Verification commands

`npm run lint`, `npm test` (19), native and desktop tests (31 each, overlapping source), browser tests (12), docs checks (33 guides), build, UI inventory (1,901), and `node scripts/test-supabase.mjs --expansion`.

Tests do not establish live sync or physical printing. The explicit demo bundle retains a size warning; the final production bundle was below the warning threshold and its authenticated entry was smoke-tested. Preserve existing barcode/CSV functionality and backup artifacts. External commits appeared during the session; no reset/revert or branch rewrite was performed.
