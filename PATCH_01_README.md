# ServOS Patch 01 - Production Data Preservation & Health Audit

Prepared against `davemusau00/servos-` HEAD `dbefee308edb6beca307a7553d8f6656a5460e83`.

This patch is intentionally non-destructive. It does not reset Intake, re-enroll the terminal, rewrite business records, apply the staged v2 Supabase migrations, or alter production financial/stock history.

## What it adds

- `store::production_health_audit` read-only local audit;
- `runtime_health_audit` Tauri command;
- typed RuntimeProvider method;
- Business Admin production-data safety panel;
- collection/version manifest for the upcoming Supabase reconciliation patch;
- checkpoint backup button using the existing SQLite backup mechanism;
- a native regression test proving the audit does not mutate records/commands/audit/outbox and does not expose stored cloud/device secrets;
- the complete patch roadmap in `docs/PRODUCTION_UPGRADE_PATCH_PLAN.md`.

## Apply to a local checkout

From any folder with Node installed:

```powershell
node .\apply-servos-patch-01.mjs C:\Users\Admin\Downloads\servos
```

The script backs up every changed source file into an ignored `.servos-patch-backup-<timestamp>` directory before writing and aborts if any expected source anchor no longer matches.

## Verify

Run from the repository after applying:

```powershell
npm ci
npm run lint
npm test
npm run test:native
npm run test:desktop
npm run build
npm run test:browser
npm run audit:ui
npm run docs:check
```

Do not promote the build to the live terminal until these gates pass on the exact patched commit.

## First production use

After installing the verified build on the already-enrolled terminal:

1. Unlock as Admin or Manager.
2. Open Business Admin.
3. Run **Read-only audit**.
4. Confirm SQLite `quick_check` is `ok`.
5. Note pending outbox, last sync, last backup, record count and warnings.
6. Synchronize if there are expected pending operations.
7. Create a **checkpoint backup**.
8. Do not apply v2 Supabase migrations yet.

Patch 02 will compare the local manifest with Supabase before any authority/cutover work begins.
