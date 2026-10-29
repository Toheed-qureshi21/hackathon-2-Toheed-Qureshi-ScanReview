# ScanReview — UI Implementation Tasks

**Status:** UI-first plan  
**Scope:** Frontend layouts and local interactions only. Backend implementation is a separate phase.  
**Sources:** `docs/prd.md`, `docs/trd.md`, external `scanreview-design/` HTML prototypes and branding kit.

## Working rules

- [x] Read `AGENTS.md`, `.cursor/rules/ui-first.mdc` (also mirrored at `.cursor/ui-first.mdc`), `docs/prd.md`, and `docs/trd.md`.
- [x] Confirm the external `scanreview-design/` folder is accessible.
- [x] Inspect each HTML prototype before implementing its corresponding page.
- [x] Keep prototype files and branding assets unchanged.
- [x] Use typed mock data and local state during the UI phase.
- [x] Do not implement real auth, database operations, API mutations, email, or Gemini integration yet.
- [x] Do not use Server Actions.
- [x] Update this checklist only after verifying the relevant work.

## Phase 0 — Repository and reference audit

- [x] Inspect the existing repository structure and current implementation.
- [x] Confirm Next.js version, App Router structure, TypeScript strictness, Tailwind setup, shadcn/ui setup, icon package, and available scripts.
- [x] Read `docs/prd.md` and `docs/trd.md` and identify the routes/screens that must be represented.
- [x] Locate and inspect `scanreview-design/index.html`.
- [x] Locate and inspect `scanreview-design/login.html`.
- [x] Locate and inspect `scanreview-design/onboarding.html`.
- [x] Locate and inspect `scanreview-design/dashboard.html`.
- [x] Locate and inspect `scanreview-design/feedback.html`.
- [x] Locate and inspect `scanreview-design/review.html`.
- [x] Locate and inspect `scanreview-design/accept-invite.html`.
- [x] Inspect the branding kit and extract its actual colors, typography, surfaces, radii, borders, and other tokens.
- [x] Report existing work, gaps, conflicts, and a page-by-page implementation plan before broad changes.

**Exit criteria:** Reference paths and existing project conventions are known; no implementation assumptions are hidden.

### Phase 0 audit record (2026-10-29)

**Repository (verified):** Next.js **16.4.3** App Router; only route **`/`** implemented (`app/page.tsx`, `app/layout.tsx`, `app/globals.css`). TypeScript **`strict: true`**. Tailwind **v4** via `@import "tailwindcss"` and `@tailwindcss/turbopack`. **shadcn/ui not initialized** (no `components.json`, no Radix/shadcn primitives). Icons: **lucide-react**. Scripts: `dev`, `build`, `start`, `lint` only — **no dedicated `typecheck` or test script** (build runs TypeScript). Prisma schema is a **stub** (generator + datasource only). Backend packages present in `package.json` but **unused in app code**. No `app/api/**`, no `proxy.ts`, no Server Actions in TS/TSX.

**Design references (all accessible under `../scanreview-design/`):** `index.html`, `login.html`, `onboarding.html`, `dashboard.html`, `feedback.html`, `review.html`, `accept-invite.html`; branding via `DESIGN.md`, `code.html`, `screen.png`. Extra files not required for MVP UI: `old-home-page.html`.

**Token alignment:** Implemented tokens in `app/globals.css` match HTML prototypes (`light` / `dark` / `natural` on `data-theme`) and `docs/frontend/design.md`. Material-style values in `DESIGN.md` / `code.html` are supplementary; page CSS in HTML prototypes is the layout fidelity source.

**PRD routes vs implementation:**

| Route | Reference | App status |
| --- | --- | --- |
| `/` | `index.html` | Implemented (landing) |
| `/login` | `login.html` (+ `#signup`) | Not implemented (404) |
| `/accept-invite` | `accept-invite.html` | Not implemented |
| `/dashboard/onboarding` | `onboarding.html` | Implemented (dashboard shell) |
| `/dashboard` | `dashboard.html` | Implemented (mock data, QR manager) |
| `/feedback/demo` (+ PRD-shaped `/feedback/[orgId]/[spotId]`) | `feedback.html` | Implemented; aligned to reference (Oct 2026) |
| `/feedback/demo/review` (+ `.../review`) | `review.html` | Implemented (local demo drafts) |
| `/auth/confirm` | PRD only | Not implemented |

**Page-by-page plan (UI phase, in checklist order):** Phase 1 finish shadcn/token wiring → Phase 3 login/signup/accept-invite → Phase 4 onboarding → Phase 5 dashboard + `lib/mocks/` → Phase 6 guest feedback → Phase 7 review drafter → Phases 8–9 polish and verification.

**Known landing deviations (Phase 2, acceptable until polish):** Hero H1 copy uses “bad experience” vs reference “bad meal”; hero demo is an **auto loop** (label “AUTO DEMO”) vs reference **interactive** stars; mobile nav uses **hamburger &lt;768px** vs reference inline links with `.hs` hiding “Log in” only below 520px; CTAs point to `/login` but **404 until Phase 3**. Demo copy uses “Table 7” as **marketing mock**, not org-configured labels (guest flows must use dynamic labels per PRD).

**Blockers:** None for starting Phase 3. **Recommended before Phase 3:** decide whether to init shadcn/ui now (Phase 1) or continue custom `.btn` / landing components for auth screens.

## Phase 1 — UI foundation and design system

- [x] Create or refine global CSS variables based on the supplied branding kit.
- [ ] Configure Tailwind/shadcn theme tokens to consume centralized variables.
- [x] Establish typography, page background, surface, border, focus, destructive, muted, and accent conventions.
- [ ] Verify shadcn/ui components use ScanReview styles rather than generic defaults.
- [x] Establish shared layout/container patterns and responsive breakpoints consistent with the references.
- [x] Establish reusable button, input, label, textarea, card, badge, dialog/sheet, and feedback-state patterns where needed.
- [x] Add or refine shared navigation/footer/layout components only where supported by the references.
- [x] Confirm keyboard focus, contrast, semantic labels, and reduced-motion behavior.
- [ ] Capture or document baseline visual checks at mobile and desktop widths.

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

### Shared auth shell
- [x] Implement reusable `AuthLayout` with shared card, typography, and form styling tokens (preview on `/login`).

### Login (`login.html`)
- [x] Reproduce the login layout and visual hierarchy.
- [x] Implement accessible email/password fields and client-side UX validation.
- [x] Implement show/hide password behavior if present in the reference.
- [x] Implement disabled/loading/error visual states using clearly simulated local behavior.
- [x] Do not connect Supabase Auth during the UI phase.

### Signup
- [x] Confirm whether a separate signup design exists in the HTML references or PRD. Reuse the login visual system only if no separate design is supplied.
- [x] Implement the signup UI needed by the PRD without inventing unrelated fields.
- [x] Keep submission simulated and clearly separate from real authentication. *(UI phase — superseded for login/signup by Backend Slice 1 below.)*

### Backend Slice 1 — Supabase auth (login/signup only)

- [x] Wire login and signup to Supabase Auth (browser client + cookie session).
- [x] After sign-in, call `GET /api/auth/me` and route to `/dashboard/onboarding` when `onboardingRequired`, else `/dashboard` (or safe `?next=`).
- [x] Dashboard routes use `proxy.ts` redirect to login when no session (navigation convenience only).

### Accept invite (`accept-invite.html`)
- [x] Reproduce manager invite/password setup layout.
- [x] Implement password fields, validation UX, and relevant states.
- [x] Do not verify invite tokens or create memberships in this phase.

**Exit criteria:** Authentication and invite screens are visually complete, accessible, responsive, and use local demo behavior only.

## Phase 4 — Business onboarding UI (`onboarding.html`)

- [x] Reproduce organization/business setup layout from the reference.
- [x] Implement organization name and business type fields.
- [x] Implement preset/custom label selection.
- [x] Implement spot count input with client-side maximum of 50 and clear validation UX.
- [x] Implement optional public review URL input and client-side URL validation.
- [x] Implement alert-recipient choice: self or invited manager.
- [x] Show manager name/email fields only when the manager option is selected.
- [x] Implement a local review/confirmation state without creating real records or sending invitations.
- [x] Implement the QR result/print handoff state only to the extent shown by the reference.
- [x] Verify all conditional fields and responsive layouts.

**Exit criteria:** Onboarding interactions work locally and clearly do not persist data yet.

## Phase 5 — Dashboard and QR management UI (`dashboard.html`)

- [x] Reproduce dashboard layout, navigation, summary cards, feedback list, and QR-management areas present in the reference.
- [x] Add typed mock organization, spot, and feedback data in an isolated mock-data module.
- [x] Display rating, configured spot label, and timestamp.
- [x] Implement local search/filter/sort controls only if shown in the reference or required by the PRD.
- [x] Implement empty, loading, and error presentation states.
- [x] Implement spot/QR selection and detail states shown in the reference.
- [x] Implement QR preview with one high-contrast QR code per detail view; never place a logo over the code.
- [x] Implement print/download affordances. If the real QR URL/token generation is not implemented yet, use an explicit demo placeholder rather than implying the code is production-ready.
- [x] Keep manager/admin permission differences as UI states only if needed for the reference; server authorization is deferred.
- [x] Verify responsive table/list behavior and keyboard accessibility.

**Exit criteria:** Dashboard can be demonstrated with mock data and all visible local controls behave predictably.

## Phase 6 — Guest feedback UI (`feedback.html`)

- [x] Reproduce the public, no-login mobile rating experience.
- [x] Implement accessible 1–5 star selection.
- [x] Implement selected, hover, focus, and disabled states.
- [x] Implement the 1–2 star recovery branch and apology message.
- [x] Implement optional contact fields and the “I don't want to share my contact” path.
- [x] Implement the 3–5 star path that proceeds directly to the review drafter.
- [x] Carry the selected rating and optional comment into local UI state/navigation.
- [x] Implement local success/error states without persisting feedback or sending an email.
- [x] Verify phone-sized layouts and keyboard operation.

**Exit criteria:** Both low-rating and high-rating guest flows can be demonstrated end to end with local state.

**Verified (Oct 2026):** `npm run lint` and `npm run build` pass; manual checks on `/feedback/demo` and `/feedback/org-bloom-birch/t07` for 1★ skip → review (`rating=1`), 5★ auto-redirect (~1.6s), dual aria-live copy, theme toggle, and keyboard star navigation. **Known deviations:** brand links to `/` (not `#`); `prefers-reduced-motion` skips high-path auto-redirect (Continue remains); contact share adds format validation; global `.btn::after` shimmer on primary buttons.

## Phase 7 — AI review drafter UI (`review.html`)

- [x] Reproduce review-drafter layout from the HTML reference.
- [x] Display the rating and optional comment from the prior local flow where feasible.
- [x] Implement optional comment entry.
- [x] Implement generate/loading/error states using clearly simulated demo behavior.
- [x] Implement editable draft text.
- [x] Implement copy-to-clipboard behavior and visible feedback.
- [x] Show the “Post your review” control only when a mock organization review URL is configured.
- [x] Open the configured link safely in a new tab with `rel="noopener noreferrer"`.
- [x] Do not call Gemini or publish a review during the UI phase.

**Exit criteria:** Draft generation is visibly simulated, editing/copying works, and review-link visibility follows the PRD.

**Verified (Oct 2026):** `npm run lint` and `npm run build` pass; browser checks on demo review (with/without `link` query), mock-id review (`org-bloom-birch/t07`), invalid demo params, chip + generate + draft text, `note` query pre-fill, and Post link when `https://` URL is configured. **Known deviations:** extra demo disclaimer line; header matches guest feedback (Lucide mark + theme toggle) vs reference text ★; guest feedback page gradients not applied on review route; `.btn::after` shimmer on primary buttons; “Post your review” appears after first generate (same as reference `#out` visibility).

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
- [ ] Implement Supabase Auth and organization authorization. *(Partial: Slice 1 — login/signup + `/api/auth/me`; accept-invite, dashboard data, and role gates still mock/deferred.)*
- [ ] Implement Next.js Route Handlers; do not use Server Actions.
- [x] Connect Axios endpoint functions and React Query queries/mutations for **current user** (`GET /api/auth/me` via `useCurrentUser`, login cache seed). *(Oct 2026)*
- [x] Connect Axios/React Query for **admin onboarding** (`POST /api/organizations`, `useCreateOrganization`, QR grid uses persisted Supabase Storage `qrImageUrl` — no client-side QR generation on success). *(Oct 2026)*
- [x] Connect Axios/React Query for **spots list** (`GET /api/spots`, `useSpots`, dashboard QR manager). *(Oct 2026)*
- [x] Connect Axios/React Query for **public guest spot + feedback** (`GET /api/public/spot`, `POST /api/public/feedback`). *(Oct 2026)*
- [ ] Connect Axios/React Query for organization read/update, dashboard feedback list, invites, and review draft APIs.
- [ ] Use mutation responses to update React Query cache directly where possible; invalidate only affected data when a safe direct update is not possible.
- [ ] Implement QR token generation, feedback persistence, Brevo alerts, Gemini draft generation, and invite acceptance.
- [ ] Add server-side Zod validation, abuse controls, integration tests, and end-to-end tests.
- [ ] Replace mock data only after the corresponding API is ready and tested.
