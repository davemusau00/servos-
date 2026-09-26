# ServOS Patch 01 recovery

This recovery is for the failure sequence:

1. the original Patch 01 applicator changed source files and then failed because `SERVOS_PATCH_ROADMAP.md` was not beside the applicator;
2. a second run started again, duplicated the production-health type block, then stopped because `RuntimeProvider.tsx` was already patched.

Do **not** reset or restore the repository before running the repair script. It is designed to normalize this partially-applied state.

## Run

Place `apply-servos-patch-01-repair.mjs` in `C:\Users\Admin\Downloads\servos`, then from PowerShell:

```powershell
cd C:\Users\Admin\Downloads\servos
node .\apply-servos-patch-01-repair.mjs C:\Users\Admin\Downloads\servos
```

The repair script:

- tolerates Patch 01 sections that are already present;
- removes duplicate `ProductionHealth*` type declarations created by the interrupted rerun;
- restores exactly one health-audit runtime API, Rust audit function, Tauri command, admin panel, and regression test;
- embeds the roadmap internally, so `SERVOS_PATCH_ROADMAP.md` is no longer required beside the script;
- backs up the pre-repair source files under `.servos-patch-backup-<timestamp>`;
- does not touch `servos.sqlite`, enrollment metadata, business transactions, or Supabase.

## Verify after the repair script succeeds

```powershell
git status --short
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

If one of those commands fails, send the complete output. Do not reinstall or reset the live terminal yet.
