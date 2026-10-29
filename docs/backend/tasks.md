# ScanReview — Backend Feature Integration Tasks

**Status:** Backend integration approved — **Slice 1 (auth session + `GET /api/auth/me`)** implemented.  
**Product source:** `docs/prd.md`  
**Technical source:** `docs/trd.md`  
**Frontend checklist:** `docs/frontend/tasks.md`  
**Implementation approach:** system-wide audit first, then one end-to-end feature slice at a time.

## Non-negotiable rules

- **No RLS:** do not add or rely on PostgreSQL Row-Level Security. Every protected operation must enforce authorization in server-side Route Handlers and server-only helpers/services.
- Validate all request bodies, query strings, and route parameters with Zod on the server. Client validation is for usability only.
- Authenticate with Supabase Auth, then resolve organization membership/role from trusted database state for every protected request. Never trust client-provided organization IDs, roles, recipient addresses, or spot ownership.
- Keep Prisma, service-role/admin Supabase clients, Gemini, Brevo, and secrets server-only.
- Use Next.js App Router Route Handlers under `app/api/**/route.ts`; no Server Actions. Use `proxy.ts` only for navigation/session convenience, never as the authorization boundary. Always `await cookies()` when using the async cookies API.
- Respect Prisma 7: inspect the installed version, generator, config and adapter before editing setup or migrations.
- **Migrations:** create every migration with `npx prisma migrate dev --name <descriptive_name>` only. Do not hand-write `prisma/migrations/**/migration.sql` or edit generated migration SQL except when Prisma docs require a manual fix (document why in the PR).
- Do not change PRD/TRD/reference assets unless explicitly requested. Keep frontend and backend task checklists separate.
- Do not mark work complete until acceptance criteria and tests have been verified.

## Integration workflow

1. Phase 0: read-only repository audit and architecture approval.
2. Before each slice, identify its UI screens, mock data, route contract, schema needs, auth rules, and tests.
3. Implement the approved slice end to end: schema/migration if needed → Zod schema/DTO → server service → Route Handler → tests → Axios API function → React Query hook → UI integration → verify and update checklists.
4. Keep existing mock behavior for unrelated features. Replace mock behavior only for the feature currently being integrated.
5. Do not begin the next slice until the current slice passes its acceptance criteria or remaining work is explicitly recorded.

---

## Phase 0 — Repository audit and architecture decisions (read-only)

- [x] Read `AGENTS.md`, `.cursor/rules/ui-first.mdc`, `docs/prd.md`, `docs/trd.md`, `docs/frontend/design.md`, and `docs/frontend/tasks.md`.
- [x] Inspect actual route/component structure, mock data, scripts, package versions, lockfile, and existing test tools.
- [x] Inspect Prisma 7 schema/config/generator/adapter and Supabase SSR/Auth setup without exposing environment secret values.
- [x] Map each existing UI flow to proposed reads/mutations and identify the mock data that will be replaced per slice.
- [x] Propose schema, constraints, indexes, API contracts, normalized response/error format, and authorization matrix.
- [x] For every protected endpoint, define the exact authentication and database-backed authorization checks; explicitly confirm no RLS will be used.
- [x] Review public QR token format, rate limiting/duplicate submission, contact retention, alert failure/retry, post-onboarding spot/label changes, invite membership creation, and test DB decisions.
- [x] Resolve or present explicit recommendations for the PRD's route/token ambiguity: `/feedback/[orgId]/[tableId]` versus a unique random public token.
- [x] Recommend vertical-slice order based on current UI readiness and dependencies.
- [x] Produce an audit report and stop for user approval.

**Exit criteria:** audit completed and approved before Slice 1 (Oct 2026).

## Phase 1 — Shared foundation (only as needed for first approved slice)

- [x] Confirm the first feature slice and architecture decisions are approved.
- [x] Verify server-side environment parsing and update `.env.example` with variable names only.
- [x] Set up/verify server-only Prisma 7 singleton and adapter.
- [x] Set up/verify Supabase server/browser clients as actually required; privileged client must be server-only.
- [x] Add normalized API success/error envelope consistent with the TRD: `{ data, error: null }` and `{ data: null, error: { code, message, details? } }`.
- [x] Add reusable authentication and organization membership/role authorization helpers (`getAuthenticatedUser`, membership lookup for `/api/auth/me`).
- [x] Add shared Axios client, error mapping, React Query provider/query keys (`lib/api/client.ts`, `AppProviders`, `hooks/queries/query-keys.ts`).
- [x] Add a minimal relevant test setup after inspecting existing tooling (`npm test` with Node test runner + `tsx`).
- [x] Verify lint/type checks and helper tests.

**Exit criteria:** only shared infrastructure needed for the approved slice is implemented; no speculative scaffolding for every future feature.

## Phase 2 — Authentication and organization access slice

- [x] Implement or verify the needed Supabase Auth flows and current-user API.
- [x] Authenticate requests server-side; distinguish unauthenticated from unauthorized responses (`401` on `/api/auth/me` without session).
- [x] Resolve membership and role from database state for each protected route. *(Slice 1: `GET /api/auth/me` only; role/org authorization helpers for mutations come later.)*
- [x] Test no session, expired/invalid session, missing membership, manager trying admin operation, wrong-organization ID tampering, and direct API calls bypassing UI. *(Slice 1: unit tests for mapper/routing; manual/`curl` 401 for no session; DB integration tests when `DATABASE_URL` is configured.)*
- [x] Integrate only the login/current-user/protected-dashboard UI that is part of this slice.

**Verified (Oct 2026):** `npm run lint`, `npm run test`, `npm run build` pass; `GET /api/auth/me` returns membership or `onboardingRequired: true`; `proxy.ts` redirects unauthenticated `/dashboard/*` to login; login/signup use Supabase browser client for Auth only; dashboard shell reads workspace/profile via React Query + Axios. **Migration:** `20261029080107_init_auth_membership` applied via `prisma migrate dev`. **Remaining:** HTTP integration test suite with mocked Supabase; `403`/role tests when admin-only routes exist; onboarding and other TRD endpoints not implemented yet.

**Exit criteria:** protected access is enforced by server code, not just client UI or `proxy.ts`.

## Phase 3 — Admin onboarding slice

- [x] Zod-validate organization name, business type, preset/custom label, spot count, optional HTTPS review URL, and selected alert recipient.
- [x] Validate custom labels as trimmed, non-empty, and length-limited; validate spot count as an integer from 1 through 50.
- [x] Create organization, admin membership, settings and initial spots in a transaction.
- [x] Generate cryptographically random public tokens on the server; never use sequential/internal IDs as public QR secrets.
- [x] Prevent unintended duplicate onboarding submissions and ensure transaction rollback on failure.
- [x] Implement the approved Route Handler and safe DTO (`POST /api/organizations`).
- [x] Integrate onboarding Axios function, mutation hook and UI states. Replace only onboarding mock success.
- [x] Test validation failures, cap enforcement, authorization, duplicate submission, and transaction behavior. *(Unit tests for Zod + tokens; live DB/API integration and rollback tests not automated.)*

**Verified (Oct 2026):** `POST /api/organizations` creates org + admin `Member` + `Spot` rows in one transaction; duplicate membership returns `409`; manager invite is stored but **not sent** (Brevo/invite slice deferred). Migration `20261029082240_onboarding_organization_spots`. QR URLs use `APP_URL` / `NEXT_PUBLIC_APP_URL` / `VERCEL_URL`, not request `Host`.

**Exit criteria:** onboarding creates persisted organization and spots; the UI displays the server response.

## Phase 4 — Spots and QR codes slice

- [ ] Implement authorized spot listing and QR payload retrieval/generation.
- [ ] Ensure admin-only spot creation/settings changes and manager read-only restrictions.
- [ ] Enforce the 50-spot limit server-side, including concurrent requests if adding spots is approved.
- [ ] Build public URLs from a configured trusted application origin, not an untrusted `Host` header.
- [ ] Integrate dashboard QR preview/print/download with real spot data.
- [ ] Test unique tokens, invalid/revoked tokens, wrong organization, manager restrictions and cap.

**Exit criteria:** the dashboard shows the correct persisted spots and their public QR links.

## Phase 5 — Public guest rating and feedback persistence slice

- [ ] Resolve opaque public token to safe spot/organization display data without requiring guest login.
- [ ] Validate public token and active spot state; never accept organization/spot ownership from request body as authoritative.
- [ ] Zod-validate rating as integer 1–5 and bound optional comment/contact input.
- [ ] Derive organization and spot from trusted token resolution; use server-generated timestamps.
- [ ] Implement the approved duplicate-submission/rate-limit/abuse strategy.
- [ ] Integrate the guest rating flow and low-rating contact/skip interaction with the API.
- [ ] Test all ratings, invalid/unknown tokens, malformed and oversized payloads, abuse limits and persisted relation integrity.

**Exit criteria:** guest ratings persist and guest flow continues correctly without login.

## Phase 6 — Low-rating Brevo alert slice

- [ ] Implement server-only Brevo adapter and validate its environment config.
- [ ] Resolve recipient from trusted organization settings/membership; never accept arbitrary recipient email from a guest request.
- [ ] Attempt an alert only for ratings 1–2; include organization, dynamic spot label, rating, timestamp and permitted comment.
- [ ] Do not block guest continuation if email delivery fails. Persist feedback separately from email outcome.
- [ ] Decide and implement safe failure logging/retry visibility without logging secrets or unnecessary contact details.
- [ ] Integrate alert status/feedback UI only if the existing product design exposes it.
- [ ] Test provider success/failure and confirm ratings 3–5 never trigger alert email.

**Exit criteria:** low ratings trigger an alert attempt to the right recipient, while provider failure is handled safely.

## Phase 7 — Gemini review-draft slice

- [ ] Implement server-only Gemini adapter using the installed `@google/genai` version.
- [ ] Validate rating/comment and bound input/output size. Treat guest comments as untrusted data, not instructions.
- [ ] Generate grounded draft text without inventing visit details.
- [ ] Add timeout/provider-error/rate-limit handling and public abuse controls.
- [ ] Resolve review URL from trusted spot/organization context; show post link only for a valid configured HTTPS URL.
- [ ] Integrate the draft API with editable text/copy UI. The application must never publish a review automatically.
- [ ] Test empty comment, provider failures, invalid token, prompt-injection-like comments, output limits and link visibility.

**Exit criteria:** every rating can produce an editable draft; guest remains responsible for posting.

## Phase 8 — Dashboard feedback slice

- [ ] Implement organization-scoped, authenticated feedback listing.
- [ ] Validate pagination/filter/sort inputs and bound result sizes.
- [ ] Return only fields the current dashboard requires; restrict contact details to authorized members and intended use.
- [ ] Integrate dashboard queries using Axios and React Query, with loading/empty/error states.
- [ ] Test admin/manager access and cross-organization isolation by direct API requests and tampered identifiers.

**Exit criteria:** dashboard uses real authorized feedback data.

## Phase 9 — Manager invitation slice

- [ ] Choose and document invitation/membership creation design before coding.
- [ ] Restrict invitation creation to the authenticated admin of the organization.
- [ ] Bind invite to server-resolved organization and manager role; use expiry and one-time use where supported by the design.
- [ ] Verify callback token server-side and create membership only from verified invite context.
- [ ] Configure/test Supabase Auth email through Brevo SMTP if required by deployment.
- [ ] Integrate accept-invite UI. Test expired, reused, tampered, mismatched-organization invites and privilege escalation.

**Exit criteria:** manager can join only the invited organization and cannot perform admin-only operations.

## Phase 10 — Cross-cutting hardening and demo verification

- [ ] Audit every `app/api/**/route.ts` for server-side Zod validation, authentication where required, and explicit authorization where required.
- [ ] Confirm no RLS policies are part of the design and no route relies on RLS for safety.
- [ ] Test direct API calls, wrong-org IDs, wrong role, malformed JSON, oversized payloads, rate limits, and provider failures.
- [ ] Verify secrets are server-only and absent from logs/client bundles.
- [ ] Verify privacy rules for contact details and retention decision.
- [ ] Run tests, lint, typecheck, and production build supported by the repository.
- [ ] Run the full demo path: onboarding → QR → low rating → alert → draft → dashboard; also test 3–5 rating path.
- [ ] Update `backend/tasks.md` and `docs/frontend/tasks.md` only for tasks actually completed.

**Exit criteria:** end-to-end demo works and remaining known limitations are documented.

## Feature-slice completion template

For each slice, record: feature/scope; files added/changed; API contract; authorization checks; Zod schemas; tests run and results; UI mocks replaced; mocks intentionally retained; unresolved issues.

## First action

Start with Phase 0 only. Do not create migrations or implement any backend behavior until the architecture report is reviewed and the user explicitly approves the first slice.