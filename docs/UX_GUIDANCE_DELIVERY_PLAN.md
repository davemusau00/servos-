# ServOS UX and Guidance Delivery Plan

Updated: 2026-09-28  
Status: coordination plan; source UX and Guidance specifications remain authoritative for their own requirements.

## Purpose and source ownership

This document sequences the two existing product plans without replacing them:

- [Simple Operations UX](../simple-ux.md) owns task-first navigation, operational workflows, plain language, progressive disclosure, migration compatibility, and business safety requirements.
- `# ServOS Guidance System.md` owns guide definitions and rendering, staff training progress, contextual assistance, the offline Help Center connection, and guidance validation.
- This delivery plan owns dependencies, implementation order, and cross-plan acceptance evidence. Detailed UI or domain contracts stay in their source plan.

Both source documents describe the reviewed `4035337e5d63ba8785e87ba344565cc69c69e68d` checkout. Treat that hash as their original planning baseline, not the current checkout. Verify all proposed capabilities against current source and [release state](CURRENT_RELEASE_STATE.md) before implementation; source presence and staged database tests do not establish production acceptance.

## External review reconciliation — 2026-09-28

A user-supplied review of upstream `main` cites commit `c33762fe29dff5384c61c409979877d9b105bf72`. That remote revision was not fetched in this workspace. The checked-out local `HEAD` at reconciliation is `be83578727d6e0b49fe23c264bc4fb465ffc2a05`, with the current UX implementation changes in the worktree; local source inspection, not the remote commit claim, governs delivery status here.

A follow-up user review sharpened the next priority: product families, physical container variants, and sale formats should precede additional beverage setup; the room and property entry points are improved but their workspaces remain technical; first-login onboarding and operational guides are still absent. The review called recent direct-action verification pending. Since then, the checkout advanced to `1544de44db93946911d89011c5082bff1a3b35a6`, and local verification completed: 79 Node tests, lint, and all 16 browser cases passed, including the item Quick Add route on desktop and mobile. Current evidence below supersedes that pending note. The cited upstream hash remains user-provided and was not fetched.

The review's main architectural assessment aligns with this checkout: task-group navigation and Home are permission-filtered; Help is offline; guide progress uses per-staff local storage; command events are commit-based; new product and stock forms disclose advanced fields progressively; and the domain remains authoritative. The review also calls out work not yet delivered in this checkout:

- Quick Add is still a workspace launcher, not a direct creation action. Creation choices must be filtered by **manage/create** permission, then open the requested form directly.
- Home currently uses the core guide's progress row for every guide card. Resolve progress by each guide ID before adding more guides.
- `GuideStep.route` is declared but not acted on. Add permission-checked route transitions before authoring cross-workspace steps; expand semantic anchors from a central registry and improve resize/keyboard handling before scaling the guide set.
- There is one orientation guide, not role-personalized first-use onboarding or workflow training. Keep onboarding non-blocking and permission-derived; add it only after multi-guide state and deep actions work.
- Inventory still centers its table and item-first adjustments; location-first count and a simple receiving flow remain later workflow work. Product family, physical container variants, and sale formats were the next high-priority model slice; that slice is now implemented and recorded below.
- The existing product, stock, room, and asset creation screens are not all equally simplified. Quick Add may deep-link only to operations that the target screen can safely open; missing prerequisites must produce an actionable setup state, not a false completion.

These points are a reconciled backlog from the supplied review and inspected local files; they do not mean the upstream commit was independently validated.

### Delivered after review reconciliation

- Quick Add choices require `catalog.manage`, `rooms.manage`, or `assets.manage`; selecting a choice adds a route action and opens the relevant create flow. Room setup opens room creation when a type exists, or the required room-type setup when it does not. Asset creation checks for a category and physical place and explains missing prerequisites.
- Home reads each guide card's progress by that guide's ID and version, so one guide cannot incorrectly label another as resumable.
- Guide steps with a route dispatch a shell navigation request. The shell enforces its normal permission-filtered route allowlist and supports an optional action. Anchor tracking observes element resize, and Escape closes the active tour.
- These are local source changes in the current worktree; exact checks and results are recorded in the test evidence document.

### Product model boundary

The delivered implementation is an additive product family and physical-variant layer over existing generic JSON product records. Each sellable variant remains a distinct product record with its own identifier/barcode, optional existing stock-item link, and its own embedded sale portions. Family identity and package metadata group variants without rewriting legacy products or introducing a parallel sale ledger. POS must continue to price and consume stock through the existing committed order commands and frozen ingredient snapshots. Avoid claiming atomic creation of a new stock master/opening balance until one native command can enforce it within the existing transaction.


### Product family and physical variants - implemented slice

The catalog now groups additive physical variants with `productFamilyId`, `productFamilyName`, package type, container quantity/unit, and a canonical variant label. Each size remains its own legacy-compatible product record with its own generated/editable code, optional barcode, optional existing stock link, and existing embedded portions for whole-container and serving formats. The Add another size flow creates within an existing family. Native `record.save` validation requires complete physical metadata, positive quantities and valid portions, rejects duplicate sizes, and prevents reuse of the same stock item inside one family. Existing products without family metadata remain valid.

Order firing continues through the established domain commands. The focused Rust regression creates two stock masters, sets opening quantities through existing inventory commands, saves two physical sizes, rejects duplicate size/stock links, and verifies whole-container and serving portions consume their own committed stock quantities. This does not implement atomic creation of a new stock master and its opening balance; that remains a separate native transaction slice. Location-first counts, receiving, and workflow-specific training remain open.

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
4. **Finish shell-to-action and guide reliability before expanding content:** first implementation slice now provides manage-filtered Quick Add direct actions, per-guide Home progress, permission-checked guide route steps, element-resize tracking, and Escape close. Remaining in this track: centralize/expand anchor definitions, expose article links in tour UI, improve focus handling, and test route/action loss across responsive layouts.
5. **Product family and physical variants:** preserve old product records as standalone compatible products. Add family identity, package/container quantity and unit, variant label, per-variant barcode and stock link. Support another size within the same family, and represent bottle/glass/single/double formats using existing portions until an evidence-backed normalized model is required. Verify separate stock depletion per physical variant.
6. **Stock operations:** add location-first count and continuous scanner sessions, then simple receiving. Atomic product + new stock master + opening quantity is a separate native transaction slice and cannot be faked by several frontend saves.
7. **Other workflows and staff guidance:** simplify room and property creation, imports, and operational summaries. Then add a non-blocking, per-staff welcome and permission-derived recommendations, followed by workflow guides on stabilized screens. Practice advances only on named successful commits.

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
- **Quick Add:** each choice requires the target's real creation permission and opens its form directly. Missing prerequisites show a safe next step.
- **Guide growth:** each Home card reflects its own guide progress; route steps navigate only to permission-allowed workspaces; anchors remain recoverable through resize, mobile layouts, and keyboard close.
- **Quick Add:** each choice requires the target's real creation permission and opens its form directly. Missing target prerequisites show a safe next step.
- **Guide growth:** each Home card reflects its own guide progress; route steps navigate only to permission-allowed workspaces; anchors remain recoverable through resize, mobile layouts, and keyboard close.
- **Each workflow release:** cover existing-record compatibility, permissions, approvals, audit effects, offline commits, and relevant restart/reload behavior with focused native/browser acceptance. Update completion and evidence documents with exact executed results; keep target hardware, live cloud, and deployment claims separate.

## Assumptions

- The two source specifications remain separate and authoritative; this file is the coordination layer.
- Guidance foundation work starts early; workflow guides follow stabilized workflows.
- Current source and release evidence take precedence over the source plans’ older checkout snapshot.
