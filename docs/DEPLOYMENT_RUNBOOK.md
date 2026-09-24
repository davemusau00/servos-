# Deployment and recovery runbook

## Configuration

Create `.env.local` from `.env.example` with the dedicated business Supabase project URL and publishable key. Never put a privileged service key in the client.

Apply the checked-in Supabase migrations in filename order to an isolated rehearsal project before production. Provision the owner's Auth identity and `servos_private.managers` owner membership using the actual Auth UUID.

## Build

Windows:
```powershell
.\scripts\deploy-windows.ps1
```

Linux:
```bash
./scripts/deploy-linux.sh
```

Android:
```powershell
.\scripts\deploy-android.ps1 -Initialize
```

The scripts require Node/npm, Rust/Cargo and platform Tauri prerequisites. Android additionally requires SDK/NDK configuration.

## Release gate

Run `npm run verify`, then complete [BAR_PRODUCTION_ACCEPTANCE.md](BAR_PRODUCTION_ACCEPTANCE.md) on each supported packaged target. A browser preview or successful frontend build is not native acceptance.

## Backup/recovery

Current source creates a consistent local SQLite backup including pending outbox state and local credentials. Target policy remains daily-close and pre-upgrade copies, seven daily + four weekly retained, encrypted remote copies, and verified replacement-terminal restore with the old terminal fenced before synchronization.
