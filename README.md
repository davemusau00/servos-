# ServOS

Single-business hospitality operations for one installed POS terminal, with local SQLite storage and a Supabase remote replica. The React UI is retained inside Tauri for Windows, Linux and Android.

**This is an implementation in progress, not a deployment-ready release.** See [current release state](docs/CURRENT_RELEASE_STATE.md) for implemented commands, verification evidence and outstanding work. The browser preview contains demonstration data and must not be used for trading.

## Development

Use Node.js and npm. Run `npm ci`, `npm run lint`, `npm run build`, and `npm test`. Run `npm run dev` for the explicitly labelled UI preview. `npm run audit:ui` regenerates the static interaction inventory.

`npm run test:browser` checks desktop and narrow browser layouts. With Docker running, `npm run test:cloud` verifies migrations and SQL policies in disposable PostgreSQL without touching the configured project. See the [runbook](docs/DEPLOYMENT_RUNBOOK.md) for test limitations and native test options.

Native development additionally requires Rust and the platform's Tauri prerequisites. Use `npm run native:dev`, `npm run test:native`, and `npm run native:build`. Android additionally requires its SDK/NDK and `npm run tauri -- android init` before platform testing.

Copy .env.example to .env.local and configure the dedicated business Supabase project. Never place privileged server keys in frontend environment variables. Initial terminal enrollment requires an owner account; enrolled staff subsequently use local PINs offline.

## Windows POS terminal

Follow the [Windows deployment and recovery runbook](docs/DEPLOYMENT_RUNBOOK.md#build-a-windows-installer). Build the NSIS installer on a Windows build computer with `bash scripts/deploy-windows-pos.sh --package`. The cashier terminal does not need Bash, Node, Rust or C++ Build Tools; copy the setup executable, its SHA-256 sidecar and PowerShell install helper to it.

Install the XP-80T driver and configure the USB queue separately. The setup helpers do not create business records, enroll the terminal, configure a payment gateway, or claim successful printer output. Complete the real Intake → enrollment → Setup → Go Live flow and XP-80T paper acceptance before live sales. Standard Windows 10 support ended in October 2025; confirm the terminal's ESU/LTSC status before using it for business.

## Documentation

Start with [the documentation index](docs/README.md). No real payment gateway, fiscal submission, bank disbursement, messaging or device adapter is represented as configured. M-Pesa is manually confirmed by receipt code and reconciled separately.
