# Deployment and recovery runbook

## Configuration

Create `.env.local` from `.env.example` with the dedicated business Supabase project URL and publishable key. Never put a privileged service key in the client.

Apply the checked-in Supabase migrations in filename order to an isolated rehearsal project before production. Provision the owner's Auth identity and `servos_private.managers` owner membership using the actual Auth UUID.

## Build a Windows installer

Run this on a 64-bit Windows build computer with administrator access. Node, Rust and Visual Studio are build tools; do not install that full toolchain on the cashier terminal just to run ServOS.

1. Check out the repository on the build computer.
2. Open **PowerShell as Administrator** in the repository and run:

   ```powershell
   Set-ExecutionPolicy -Scope Process Bypass
   .\scripts\bootstrap-windows-pos.ps1 -Install
   ```

   This installs Git for Windows/Git Bash, Node.js LTS, Rust's 64-bit MSVC toolchain and Visual Studio C++ Build Tools. It installs WebView2 only if it is missing. Restart the terminal after installation.
3. Open **Git Bash** in the repository and run:

   ```bash
   bash scripts/deploy-windows-pos.sh --check
   ```

4. Configure `.env.local` from `.env.example` with the production business Supabase project URL and publishable key. These values are bundled into the frontend at build time, so changing `.env.local` later requires a rebuild. Never use a service-role or secret key in the client. Apply/rehearse the checked-in migrations and provision the real owner identity before enrolling the production terminal.
5. Build and verify the installer:

   ```bash
   bash scripts/deploy-windows-pos.sh --package
   ```

   The output path and a SHA-256 sidecar are printed. Copy both files to the POS terminal. `--skip-tests` is for local packaging iterations only, not release evidence. `--msi` builds an MSI instead of the default NSIS setup executable; Tauri requires Windows' optional **VBScript** feature for MSI. Use `--install` only when you want to install the package on this build computer.

## Install on a fresh Windows POS terminal

The target machine does not need Bash, Node, Rust or C++ Build Tools. Copy the generated setup executable, its `.sha256` file and `scripts/install-windows-pos.ps1` to it. For USB setup, also copy `scripts/configure-xprinter-usb.ps1` and `scripts/test-xprinter-usb.ps1`. The installer script checks 64-bit Windows, installs WebView2 only when missing, verifies the sidecar when provided, and then offers to launch the setup executable.

The current NSIS setup executable is unsigned. The `.sha256` sidecar detects file changes but does not identify a publisher, so Windows may show an unknown-publisher or reputation warning. A trusted code-signing certificate is needed for a publisher-identified installer.

For USB printing, install the XP-80T vendor driver, connect and power on the printer, then run elevated PowerShell:

```powershell
.\scripts\configure-xprinter-usb.ps1
```

The helper reuses a compatible XP-80 queue already assigned to the requested USB port, avoiding duplicate queues. Otherwise it creates queue `XP-80T USB` from driver `XP-80C` on port `USB001`. If Windows assigned different names, pass `-QueueName`, `-DriverName` or `-PortName` explicitly. To send a short non-sale RAW test slip and inspect paper output, run:

```powershell
.\scripts\test-xprinter-usb.ps1 -QueueName '<queue name printed above>' -Send
```

Use the exact queue name printed by the setup helper. The test slip sends no cash-drawer signal. A successful spooler response alone does not prove paper output; confirm the slip physically printed.

Install ServOS:

```powershell
.\scripts\install-windows-pos.ps1 -InstallerPath .\ServOS_0.1.0_x64-setup.exe
```

Use the exact installer filename produced by the build. Complete Intake → owner enrollment → Business Setup → Go Live with real business data. In Till Setup choose the exact USB queue or configure the XP-80T LAN address, then print and inspect the test slip and customer/business receipt pair. This terminal will not use a cash drawer. Follow [BAR_PRODUCTION_ACCEPTANCE.md](BAR_PRODUCTION_ACCEPTANCE.md) before live trading and the [XP-80T guide](user-guide/31-xprinter-xp-80t.md) for hardware checks.

Standard Windows 10 Home/Pro/Enterprise reached end of support on 2025-10-14. Before live sales, confirm the exact edition is covered by applicable ESU or an in-support LTSC lifecycle, or move to a supported Windows release. The install script warns but does not block installation.

## Build on other platforms

Windows PowerShell alternative:

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

## Receipt printer

Till Setup now offers direct XP-80T LAN ESC/POS (TCP 9100), direct Windows USB RAW queue, OS print dialog, and manual-copy profiles. The native path formats 48-column text by default and can cut between customer and business copies. Failed sends are saved locally for retry; an interrupted send is marked uncertain to avoid silent duplicate receipts. Use the setup test slip to check the connection.

On the connected Windows 11 host, Windows exposes the XP-80T as `Printer POS-80` on `USB001`. The existing queue is `Xprinter XP-80`, using driver `Xprinter XP-80`; the vendor `XP-80C` driver is also registered. `scripts/test-xprinter-usb.ps1` sent a short non-sale RAW slip through that USB queue. It physically printed after paper was loaded, as confirmed by the operator. This verifies one USB RAW test slip on this Windows 11 host. ServOS packaged-app printing, the customer/business receipt pair, cutter behavior and the fresh Windows 10 installation still need acceptance. LAN printing is unverified. This site does not use a cash drawer.
