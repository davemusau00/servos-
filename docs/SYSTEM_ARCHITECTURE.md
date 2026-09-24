# System architecture

## Data flow

Installed React views -> typed Tauri commands -> native authorization and validation -> SQLite transaction containing business records, audit and outbox -> authenticated Supabase upload -> Postgres replica -> remote reporting.

The installed terminal is the authoritative writer. Server outages do not disable locally enrolled staff access. A successful local command means its SQLite transaction committed; it does not mean a server or external provider accepted it.

The local migration contains staff credentials, expiring sessions, versioned domain records, command deduplication, append-only application audit, an outbox and a unique M-Pesa code registry. Domain records currently use validated JSON envelopes, not a complete normalized relational model. Expanding relational constraints remains release work.

The React runtime gate selects the native provider only inside Tauri. Ordinary browser access opens an explicitly labelled sample-data preview. The legacy context is retained for that preview while native workflows are migrated. Unconnected native modules display a pending-integration message.

## Commands and synchronization

Commands carry a UUID, schema version, operation, payload and optional expected record version. The backend derives the actor from a local session. A repeated command ID returns its stored result only if the payload matches. Transactions create the audit and outbox together with business changes.

Uploads contain ordered operation envelopes. The server serializes each terminal stream, rejects sequence gaps and changed replays, and commits the batch before returning an acknowledgement. The terminal acknowledges only uploaded operations. Scheduled foreground sync uses backoff; resume and reconnection trigger retries. Native background execution is not guaranteed on Android.

The server stores remote change requests. An online manager UI browses replicas and requests selected master changes. The terminal uploads local work before polling requests, checks expected versions and persists outcomes. Applied acknowledgement waits until the resulting local command has uploaded. This protocol exists in source but has not passed live server acceptance.

## Security and limitations

Local PINs use Argon2 with random salts and persistent throttling. Native sessions expire after 15 minutes without commands and are deleted on restart. Remote roles are project-provisioned Supabase memberships. Server upload credentials are hashed on the server; the current local device token is in the OS application database. Secure-keystore integration, encrypted backups and recovery fencing remain release blockers.

No unrestricted SQL command is exposed to the frontend. Backend commands enforce roles. An application audit trigger prevents normal updates/deletes, but this is not protection against an administrator modifying the database file.
