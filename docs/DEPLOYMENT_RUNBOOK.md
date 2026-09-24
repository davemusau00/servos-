# Deployment and recovery runbook

## Prerequisites

A dedicated Supabase project, an owner Auth account, a supported POS operating system, and a working Rust/Tauri toolchain are required. Apply the checked-in migration to a non-production project first. A project operator must insert the owner's Auth UUID into `servos_private.managers` with role `owner`; the app cannot self-grant membership.

Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY at build time. No service-role key belongs in the terminal or browser. Build and install the package, sign in as owner to enroll, set a 6–12 digit local PIN, then configure genuine business data. A unique active-terminal constraint prevents accidentally enrolling a second writer.

## Current limitations

This release is not approved for production. Remote request application, broad domain integration, secure credential storage, backup encryption/rotation/upload, restore/device fencing, platform signing and physical-device acceptance remain open. Enrollment recovery after a server success followed by local failure also requires implementation.

## Backup

Business administration can create a consistent local SQLite backup using SQLite's backup API. The current backup includes credentials and pending operations and stays in the application data backup folder. It is not encrypted, automatically rotated, uploaded or restore-verified. Do not call it a completed recovery system.

Target policy: daily-close and pre-upgrade backups; seven daily and four weekly retained copies; encrypted remote copies; verified restoration on a replacement terminal, preserving pending operations and fencing old credentials.

## Release gate

Require frontend checks, native command tests, server policy/replay tests, every interaction acceptance scenario, a complete offline shift, reconnect parity, successful restore, genuine opening balances and owner-reviewed reports. Document which OS/device was tested. A Windows build cannot establish Android or Linux readiness.
