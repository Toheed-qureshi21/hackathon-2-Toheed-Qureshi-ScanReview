# ScanReview — UI Implementation Tasks

**Status:** UI-first plan  
**Scope:** Frontend layouts and local interactions only. Backend implementation is a separate phase.  
**Sources:** `docs/prd.md`, `docs/trd.md`, external `scanreview-design/` HTML prototypes and branding kit.

## Working rules

- [ ] Read `AGENTS.md`, `.cursor/rules/ui-first.mdc`, `docs/prd.md`, and `docs/trd.md`.
- [ ] Confirm the external `scanreview-design/` folder is accessible.
- [ ] Inspect each HTML prototype before implementing its corresponding page.
- [ ] Keep prototype files and branding assets unchanged.
- [ ] Use typed mock data and local state during the UI phase.
- [ ] Do not implement real auth, database operations, API mutations, email, or Gemini integration yet.
- [ ] Do not use Server Actions.
- [ ] Update this checklist only after verifying the relevant work.

## Phase 0 — Repository and reference audit

- [ ] Inspect the existing repository structure and current implementation.
- [ ] Confirm Next.js version, App Router structure, TypeScript strictness, Tailwind setup, shadcn/ui setup, icon package, and available scripts.
- [ ] Read `docs/prd.md` and `docs/trd.md` and identify the routes/screens that must be represented.
- [ ] Locate and inspect `scanreview-design/index.html`.
- [ ] Locate and inspect `scanreview-design/login.html`.
- [ ] Locate and inspect `scanreview-design/onboarding.html`.
- [ ] Locate and inspect `scanreview-design/dashboard.html`.
- [ ] Locate and inspect `scanreview-design/feedback.html`.
- [ ] Locate and inspect `scanreview-design/review.html`.
- [ ] Locate and inspect `scanreview-design/accept-invite.html`.
- [ ] Inspect the branding kit and extract its actual colors, typography, surfaces, radii, borders, and other tokens.
- [ ] Report existing work, gaps, conflicts, and a page-by-page implementation plan before broad changes.

**Exit criteria:** Reference paths and existing project conventions are known; no implementation assumptions are hidden.

## Phase 1 — UI foundation and design system

- [x] Create or refine global CSS variables based on the supplied branding kit.
- [ ] Configure Tailwind/shadcn theme tokens to consume centralized variables.
- [x] Establish typography, page background, surface, border, focus, destructive, muted, and accent conventions.
- [ ] Verify shadcn/ui components use ScanReview styles rather than generic defaults.
- [x] Establish shared layout/container patterns and responsive breakpoints consistent with the references.
- [x] Establish reusable button, input, label, textarea, card, badge, dialog/sheet, and feedback-state patterns where needed.
- [x] Add or refine shared navigation/footer/layout components only where supported by the references.
- [x] Confirm keyboard focus, contrast, semantic labels, and reduced-motion behavior.
- [x] Capture or document baseline visual checks at mobile and desktop widths.

**Exit criteria:** Shared styling is centralized and the first page can be implemented without duplicating brand tokens.

## Phase 2 — Marketing landing page (`index.html`)

- [x] Reproduce the landing page structure and content from the HTML reference.
- [x] Apply ScanReview brand styling from the branding kit.
- [x] Implement responsive navigation and any menu behavior in the reference.
- [x] Implement the hero and any visual demo/animation present in the reference.
- [x] Implement CTA links to the intended existing routes.
- [x] Implement the remaining sections and footer shown in the reference.
- [x] Add appropriate hover, focus, and reduced-motion states.
- [x] Verify mobile, tablet, and desktop layouts.

**Exit criteria:** Landing page matches the supplied reference closely and links work locally.

## Phase 3 — Authentication and invite acceptance UI

### Login (`login.html`)
- [ ] Reproduce the login layout and visual hierarchy.
- [ ] Implement accessible email/password fields and client-side UX validation.
- [ ] Implement show/hide password behavior if present in the reference.
- [ ] Implement disabled/loading/error visual states using clearly simulated local behavior.
- [ ] Do not connect Supabase Auth during the UI phase.

### Signup
- [ ] Confirm whether a separate signup design exists in the HTML references or PRD. Reuse the login visual system only if no separate design is supplied.
- [ ] Implement the signup UI needed by the PRD without inventing unrelated fields.
- [ ] Keep submission simulated and clearly separate from real authentication.

### Accept invite (`accept-invite.html`)
- [ ] Reproduce manager invite/password setup layout.
- [ ] Implement password fields, validation UX, and relevant states.
- [ ] Do not verify invite tokens or create memberships in this phase.

**Exit criteria:** Authentication and invite screens are visually complete, accessible, responsive, and use local demo behavior only.

## Phase 4 — Business onboarding UI (`onboarding.html`)

- [ ] Reproduce organization/business setup layout from the reference.
- [ ] Implement organization name and business type fields.
- [ ] Implement preset/custom label selection.
- [ ] Implement spot count input with client-side maximum of 50 and clear validation UX.
- [ ] Implement optional public review URL input and client-side URL validation.
- [ ] Implement alert-recipient choice: self or invited manager.
- [ ] Show manager name/email fields only when the manager option is selected.
- [ ] Implement a local review/confirmation state without creating real records or sending invitations.
- [ ] Implement the QR result/print handoff state only to the extent shown by the reference.
- [ ] Verify all conditional fields and responsive layouts.

**Exit criteria:** Onboarding interactions work locally and clearly do not persist data yet.

## Phase 5 — Dashboard and QR management UI (`dashboard.html`)

- [ ] Reproduce dashboard layout, navigation, summary cards, feedback list, and QR-management areas present in the reference.
- [ ] Add typed mock organization, spot, and feedback data in an isolated mock-data module.
- [ ] Display rating, configured spot label, and timestamp.
- [ ] Implement local search/filter/sort controls only if shown in the reference or required by the PRD.
- [ ] Implement empty, loading, and error presentation states.
- [ ] Implement spot/QR selection and detail states shown in the reference.
- [ ] Implement QR preview with one high-contrast QR code per detail view; never place a logo over the code.
- [ ] Implement print/download affordances. If the real QR URL/token generation is not implemented yet, use an explicit demo placeholder rather than implying the code is production-ready.
- [ ] Keep manager/admin permission differences as UI states only if needed for the reference; server authorization is deferred.
- [ ] Verify responsive table/list behavior and keyboard accessibility.

**Exit criteria:** Dashboard can be demonstrated with mock data and all visible local controls behave predictably.

## Phase 6 — Guest feedback UI (`feedback.html`)

- [ ] Reproduce the public, no-login mobile rating experience.
- [ ] Implement accessible 1–5 star selection.
- [ ] Implement selected, hover, focus, and disabled states.
- [ ] Implement the 1–2 star recovery branch and apology message.
- [ ] Implement optional contact fields and the “I don't want to share my contact” path.
- [ ] Implement the 3–5 star path that proceeds directly to the review drafter.
- [ ] Carry the selected rating and optional comment into local UI state/navigation.
- [ ] Implement local success/error states without persisting feedback or sending an email.
- [ ] Verify phone-sized layouts and keyboard operation.

**Exit criteria:** Both low-rating and high-rating guest flows can be demonstrated end to end with local state.

## Phase 7 — AI review drafter UI (`review.html`)

- [ ] Reproduce review-drafter layout from the HTML reference.
- [ ] Display the rating and optional comment from the prior local flow where feasible.
- [ ] Implement optional comment entry.
- [ ] Implement generate/loading/error states using clearly simulated demo behavior.
- [ ] Implement editable draft text.
- [ ] Implement copy-to-clipboard behavior and visible feedback.
- [ ] Show the “Post your review” control only when a mock organization review URL is configured.
- [ ] Open the configured link safely in a new tab with `rel="noopener noreferrer"`.
- [ ] Do not call Gemini or publish a review during the UI phase.

**Exit criteria:** Draft generation is visibly simulated, editing/copying works, and review-link visibility follows the PRD.

## Phase 8 — Shared interaction polish and accessibility

- [ ] Audit buttons, links, menus, dialogs, forms, and interactive cards for keyboard behavior.
- [ ] Add clear validation, loading, empty, success, and error states where relevant.
- [ ] Check focus visibility and semantic labels.
- [ ] Check contrast against the branding kit.
- [ ] Respect reduced-motion preferences.
- [ ] Confirm no page uses a broad `"use client"` directive when only a child needs it.
- [ ] Confirm shadcn/ui components are styled through project tokens and classes.
- [ ] Check responsive layouts at representative mobile, tablet, and desktop widths.
- [ ] Remove accidental placeholder copy, broken links, console errors, and unused components.

## Phase 9 — UI verification and handoff

- [ ] Run the existing lint command.
- [ ] Run the existing TypeScript/type-check command, if configured.
- [ ] Run available unit/component tests.
- [ ] Run the production build.
- [ ] Manually verify every implemented route and primary interaction.
- [ ] Compare each page against its HTML reference.
- [ ] Document visual deviations and remaining UI gaps.
- [ ] Confirm all demo/mock behavior is clearly identified in code and does not imply real persistence.
- [ ] Update this checklist accurately.
- [ ] Prepare a backend integration handoff listing required DTOs, API contracts, and mutation/query needs without implementing them yet.

**UI phase completion criteria:** All agreed UI routes are implemented and reviewed against the references; checks are reported accurately; mock data is isolated; no backend functionality has been silently introduced.

## Phase 10 — Backend integration (future; do not start during UI phase)

This phase is intentionally deferred until the UI is reviewed and approved.

- [ ] Finalize API contracts and DTOs.
- [ ] Implement Prisma schema/migrations and database access.
- [ ] Implement Supabase Auth and organization authorization.
- [ ] Implement Next.js Route Handlers; do not use Server Actions.
- [ ] Connect Axios endpoint functions and React Query queries/mutations.
- [ ] Use mutation responses to update React Query cache directly where possible; invalidate only affected data when a safe direct update is not possible.
- [ ] Implement QR token generation, feedback persistence, Brevo alerts, Gemini draft generation, and invite acceptance.
- [ ] Add server-side Zod validation, abuse controls, integration tests, and end-to-end tests.
- [ ] Replace mock data only after the corresponding API is ready and tested.
