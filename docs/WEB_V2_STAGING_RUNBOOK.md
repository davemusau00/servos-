# Web v2 staging and activation runbook

## Overview

ServOS production browser access remains on the legacy Remote Manager unless two independent conditions are true:

1. the Vercel build has `VITE_ENABLE_WEB_V2=true`; and
2. the authenticated Supabase `servos_v2_session` response reports `enabled=true`.

The feature flag is a frontend release gate. The database control flag is the server authority gate. Neither one alone is sufficient to activate the transactional web workspace.

Production should keep `VITE_ENABLE_WEB_V2=false` until the coordinated v2 cutover is accepted. Preview/staging deployments may set it to `true` only when they use an isolated non-production Supabase project.

## Procedure

Production:

```text
VITE_ENABLE_WEB_V2=false
VITE_ENABLE_DEMO=false
```

Isolated Vercel preview/staging:

```text
VITE_ENABLE_WEB_V2=true
VITE_ENABLE_DEMO=false
```

Install staged `supabase/expansion/*.sql` only in the disposable PostgreSQL harness or an isolated staging Supabase project. Never operate legacy and v2 business writers concurrently.

## Rollback

Before any v2 business command has synchronized, disable server control and redeploy with `VITE_ENABLE_WEB_V2=false`. After v2 writes exist, use coordinated restore/replay or forward repair with old devices fenced.
