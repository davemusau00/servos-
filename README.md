# ServOS

Single-business hospitality operations for one installed POS terminal, with local SQLite storage and a Supabase remote replica. The React UI is retained inside Tauri for Windows, Linux and Android.

**This is an implementation in progress, not a deployment-ready release.** See [current release state](docs/CURRENT_RELEASE_STATE.md) for implemented commands, verification evidence and outstanding work. The browser preview contains demonstration data and must not be used for trading.

## Development

Use Node.js and npm. Run `npm ci`, `npm run lint`, `npm run build`, and `npm test`. Run `npm run dev` for the explicitly labelled UI preview. `npm run audit:ui` regenerates the static interaction inventory.

Native development additionally requires Rust and the platform's Tauri prerequisites. Use `npm run native:dev`, `npm run test:native`, and `npm run native:build`. Android additionally requires its SDK/NDK and `npm run tauri -- android init` before platform testing.

Copy `.env.example` to `.env.local` and configure the dedicated business Supabase project. Never place privileged server keys in frontend environment variables. Initial terminal enrollment requires an owner account; enrolled staff subsequently use local PINs offline.

## Documentation

Start with [the documentation index](docs/README.md). No real payment gateway, fiscal submission, bank disbursement, messaging or device adapter is represented as configured. M-Pesa is manually confirmed by receipt code and reconciled separately.
