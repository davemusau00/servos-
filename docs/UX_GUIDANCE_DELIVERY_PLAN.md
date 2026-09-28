# ServOS UX and Guidance Delivery Plan

Updated: 2026-09-28  
Status: coordination plan; source UX and Guidance specifications remain authoritative for their own requirements.

## Purpose and source ownership

This document sequences the two existing product plans without replacing them:

- [Simple Operations UX](../simple-ux.md) owns task-first navigation, operational workflows, plain language, progressive disclosure, migration compatibility, and business safety requirements.
- `# ServOS Guidance System.md` owns guide definitions and rendering, staff training progress, contextual assistance, the offline Help Center connection, and guidance validation.
- This delivery plan owns dependencies, implementation order, and cross-plan acceptance evidence. Detailed UI or domain contracts stay in their source plan.

Both source documents describe the reviewed `4035337e5d63ba8785e87ba344565cc69c69e68d` checkout. Treat that hash as their original planning baseline, not the current checkout. Verify all proposed capabilities against current source and [release state](CURRENT_RELEASE_STATE.md) before implementation; source presence and staged database tests do not establish production acceptance.

## Current checkout baseline

- The installed Tauri shell now presents grouped, permission-filtered task navigation; the offline Help Center searches generated Markdown articles and can launch the shell tour.
- `RuntimeProvider.command()` returns after the native command commits and refreshes local state. It is the observation point for successful operation events; business command payloads and authorization remain unchanged.
- Native SQLite schema is version 10. Staff identities and expiring sessions are local. The first guidance slice stores per-staff progress separately from business records and keeps it outside the business outbox.
- Implemented foundation: task-group navigation, permission-aware Home/Quick Add destinations, the core shell tour, Help Center tour launch/progress, a native progress table, and commit-only guidance events. The current follow-up adds first-run catalog and inventory empty states plus human-readable common native errors. Detailed task workflows and their guides remain pending.
- The current release ledger remains authoritative for what is implemented and verified. This plan does not claim completion of the web expansion, production rollout, or target-device acceptance.

## Delivery order

1. **Coordination and baseline:** maintain this crosswalk, update source-document baseline labels when their contracts change, and record evidence in the existing completion ledger and test evidence log.
2. **Task-first foundation:** implement permission-filtered Home/task navigation and Quick Add entry points, then smart empty states, friendly errors, and defaults. Keep every existing route reachable to users with its existing permission. Current partial delivery: Home/Quick Add foundation, catalog/inventory empty states, and common save/movement error translation; room/property/import empty states and broader error coverage remain open.
3. **Guidance foundation in parallel:** add typed declarative definitions, duplicate/invalid-definition checks, semantic anchors, a small accessible shell tour, Help Center launch/progress, and native per-staff local persistence. Do not author workflow training before its target flow is stable.
4. **Workflow releases:** simplify item/catalog and stock workflows first, then rooms/front desk, property/maintenance, imports, and operational summaries following the source plan. Add anchors in each new surface; author that surface’s guides after behavior and wording settle. Product creation now has a task-first Drink/Food/Retail/Service form. Stock master creation now asks for the item name and count unit first, with generated code and operational controls in progressive disclosure. Master Data calls stock locations “Storage Places” and generates a code when omitted. Family/physical-variant modeling and atomic tracked-stock plus opening-balance creation remain outstanding; no partial multi-command write is used to claim those requirements.
5. **Outcome-based training:** connect guide steps only to named successful command commits. Drafts, failed operations, navigation alone, and stale UI state never count as successful completion. Continue the existing permission, audit, approval, offline, and local-authority acceptance for every workflow.

## Shared interfaces and invariants

- Guides are typed data: stable guide/step IDs, version, audience permissions, semantic target IDs, optional route, article reference, interaction mode, and explicit success operations. Guide definitions do not contain arbitrary React callbacks or raw CSS selectors.
- UI anchors use `data-guide-anchor` through a small anchor component; IDs are namespaced by shell or domain. Missing targets produce a readable fallback and never block the operation.
- A committed operation event is emitted only after `runtime.command()` succeeds and includes the operation name and command result. Failure paths emit no success event.
- Native progress reads and writes require a live staff session and derive the staff ID from that session. Progress is resumable per staff member, local-first, excluded from business records/outbox, and survives restart.
- Guidance can explain and observe operations but cannot grant permissions, execute business commands, or imply provider/payment/sync success.

## Acceptance evidence

- **Foundation:** navigation remains permission-filtered on desktop and narrow layouts; Home and Quick Add only expose eligible destinations; current modules remain reachable; the Help Center and articles continue to work offline.
- **Guidance:** definitions reject duplicate IDs and unknown targets; keyboard users can launch, advance, back, and close a guide; target loss is recoverable; staff progress is isolated and survives restart.
- **Outcome events:** a successful local commit can advance a matching step; command rejection and uncommitted drafts cannot. A refresh error after a committed write must not invite a duplicate transaction or erase the success event.
- **Each workflow release:** cover existing-record compatibility, permissions, approvals, audit effects, offline commits, and relevant restart/reload behavior with focused native/browser acceptance. Update completion and evidence documents with exact executed results; keep target hardware, live cloud, and deployment claims separate.

## Assumptions

- The two source specifications remain separate and authoritative; this file is the coordination layer.
- Guidance foundation work starts early; workflow guides follow stabilized workflows.
- Current source and release evidence take precedence over the source plans’ older checkout snapshot.
