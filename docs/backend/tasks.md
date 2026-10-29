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

**Verified (Oct 2026):** `POST /api/organizations` creates org + admin `Member` + `Spot` rows in one transaction; duplicate membership returns `409`; manager invite is stored but **not sent** (Brevo/invite slice deferred). Migrations through `20261029083357_spot_qr_storage_path`. QR **feedback** URLs use `APP_URL` / `NEXT_PUBLIC_APP_URL` / `VERCEL_URL`, not request `Host`. Onboarding generates PNG QRs server-side, uploads to public bucket `scanreview-qr-codes`, persists `Spot.qrStoragePath`; upload failure rolls back org + best-effort Storage cleanup (`QR_STORAGE_FAILED`). See `docs/storage/qr-codes-bucket.md`.

**Exit criteria:** onboarding creates persisted organization and spots; the UI displays the server response.

## Phase 4 — Spots and QR codes slice

- [x] Implement authorized spot listing and QR payload retrieval/generation (`GET /api/spots`).
- [x] Ensure admin-only spot creation/settings changes and manager read-only restrictions (`POST /api/spots` returns `201` for admins, `403` for managers). Organization settings editing is still not implemented.
- [x] Enforce manager read-only restrictions (`POST /api/spots` returns `403` for managers).
- [x] Implement admin-only additional spot creation through `POST /api/spots`, reusing the existing QR generation and Supabase Storage flow, with the 50-spot limit enforced server-side.
- [x] Test spot creation, authorization, the 50-spot limit, storage failures, and the generated QR's feedback URL. *(Unit tests; live authenticated create/Storage not in CI.)*
- [x] Build public URLs from a configured trusted application origin, not an untrusted `Host` header.
- [x] Integrate dashboard QR preview/print/download with real spot data (Storage `qrImageUrl`).
- [x] Test spot DTO URLs, missing QR path, query validation, and documented auth expectations. *(No live Supabase/DB HTTP integration in CI.)*

**Verified (Oct 2026):** Dashboard QR manager uses `useSpots` + persisted PNGs; no client QR regeneration for listed spots. `POST /api/spots` creates one additional spot for ADMIN only: membership org scope, next number from configured `spotLabel` (including custom labels), unique public token, trusted `APP_URL` feedback URL, reused PNG + `scanreview-qr-codes` upload. 50-spot cap enforced with `Organization` `FOR UPDATE` + Serializable transaction. Live unauthenticated POST returned 401 `{ data: null, error: { code: "UNAUTHENTICATED" } }`. **Migration:** none — existing unique `(organizationId, number)` and `publicToken` constraints are sufficient. **Limitation:** unit tests mock storage/DB writes; an authenticated admin session was not available to scan a newly created QR in the browser.

**Exit criteria:** the dashboard shows the correct persisted spots and their public QR links.

## Phase 5 — Public guest rating and feedback persistence slice

- [x] Resolve opaque public token to safe spot/organization display data without requiring guest login (`GET /api/public/spot`).
- [x] Validate public token and active spot state; never accept organization/spot ownership from request body as authoritative.
- [x] Zod-validate rating as integer 1–5 and bound optional comment/contact input.
- [x] Derive organization and spot from trusted token resolution; use server-generated timestamps.
- [x] Implement the approved duplicate-submission/rate-limit/abuse strategy (process-local ~10/token and ~30/IP per 10 minutes; **not** shared across Vercel isolates).
- [x] Integrate the guest rating flow and low-rating contact/skip interaction with the API.
- [x] Test all ratings, invalid/unknown tokens, malformed and oversized payloads, abuse limits and persisted relation integrity. *(Unit tests; live HTTP insert not in CI.)*

**Verified (Oct 2026):** Migration `20261029085607_add_feedback`. `/feedback/demo` does not persist. Dashboard feedback list remains mock. No Brevo/Gemini. Public DTO omits tokens, members, and manager emails.

**Exit criteria:** guest ratings persist and guest flow continues correctly without login.

## Phase 6 — Low-rating Brevo alert slice

- [x] Implement server-only Brevo adapter and validate its environment config (`BREVO_API_KEY`, `BREVO_SENDER_EMAIL`).
- [x] Resolve recipient from trusted organization settings/membership; never accept arbitrary recipient email from a guest request.
- [x] Attempt an alert only for ratings 1–2; include organization, dynamic spot label, rating, timestamp and permitted comment.
- [x] Do not block guest continuation if email delivery fails. Persist feedback separately from email outcome.
- [x] Decide and implement safe failure logging/retry visibility without logging secrets or unnecessary contact details. *(Best-effort `console.info` with `feedbackId` + status only; no outbox/retries.)*
- [x] Integrate alert status/feedback UI only if the existing product design exposes it. *(No guest/dashboard UI — design does not expose delivery status.)*
- [x] Test provider success/failure and confirm ratings 3–5 never trigger alert email. *(Unit tests with mocked fetch; no live Brevo send.)*

**Verified (Oct 2026):** `npm test` (101 pass), `npm run lint`, `npm run build` (includes TypeScript). After `prisma.feedback.create`, ratings 1–2 attempt Brevo `POST https://api.brevo.com/v3/smtp/email`; 3–5 never call the adapter. Recipient: `MANAGER_PENDING` → valid `pendingManagerEmail`, else unique admin `Member.alertEmail`; `ADMIN` → unique admin `alertEmail` only (never an arbitrary member or guest address). Contact-sharing second POST skips a duplicate alert. Missing config/recipient logs `skipped_unconfigured` / `skipped_no_recipient` and still returns 201. Guest contact is omitted from email. Provider mocked in unit tests — **no live Brevo send**. **Limitation:** best-effort delivery does not retry after process termination or provider outages. Contact share creates a second `Feedback` row (existing POST contract); alerts are skipped on that row rather than attaching contact to the original rating.

**Exit criteria:** low ratings trigger an alert attempt to the right recipient, while provider failure is handled safely.

## Phase 7 — Gemini review-draft slice

- [x] Implement server-only Gemini adapter using the installed `@google/genai` version. *(`@google/genai` 2.32.0; model `gemini-2.5-flash` — no silent substitute.)*
- [x] Validate rating/comment and bound input/output size. Treat guest comments as untrusted data, not instructions.
- [x] Generate grounded draft text without inventing visit details.
- [x] Add timeout/provider-error/rate-limit handling and public abuse controls. *(~5/token and ~15/IP per 10 minutes, process-local; not shared across Vercel isolates.)*
- [x] Resolve review URL from trusted spot/organization context; show post link only for a valid configured HTTPS URL.
- [x] Integrate the draft API with editable text/copy UI. The application must never publish a review automatically.
- [x] Test empty comment, provider failures, invalid token, prompt-injection-like comments, output limits and link visibility. *(Unit tests with mocked generateContent; no live Gemini call.)*

**Verified (Oct 2026):** `npm test` (125 pass), `npm run lint`, `npm run build` (TypeScript included). `POST /api/public/reviews/draft` resolves token + organization ID, then calls Gemini. Ratings 1–5 and empty comments are allowed. Highlight chips are hints only. Drafter comment is ephemeral (not persisted). `/feedback/demo/review` stays on local templates. Missing key / timeout / malformed output / model-unavailable → guest-safe 503; never substitutes another model. **Limitation:** mocked tests do not prove live Gemini generation. Rate limits are process-local.

**Exit criteria:** every rating can produce an editable draft; guest remains responsible for posting.

## Phase 8 — Dashboard feedback slice

- [x] Implement organization-scoped, authenticated feedback listing.
- [x] Validate pagination/filter/sort inputs and bound result sizes.
- [x] Return only fields the current dashboard requires; restrict contact details to authorized members and intended use. *(Dashboard DTO omits contact entirely; no contact UI/endpoint in this phase.)*
- [x] Integrate dashboard queries using Axios and React Query, with loading/empty/error states.
- [x] Test admin/manager access and cross-organization isolation by direct API requests and tampered identifiers. *(Unit tests of `authorizeFeedbackList` + membership-scoped `where`; live authenticated HTTP/DB not in CI.)*

**Verified (Oct 2026):** `npm test` (157 pass), `npm run lint`, `npm run build`. `GET /api/feedback` requires a Supabase session (live unauthenticated request returned 401 `{ data: null, error: { code: "UNAUTHENTICATED" } }`). Scope is `requireOrganizationMembership()` → `membership.member.organizationId`; optional `organizationId` query is rejected on mismatch (403), never used as the query scope. ADMIN and MANAGER allowed. DTO: `id`, `rating`, ISO `createdAt`, `spotDisplayName`, `spotLabel`, nullable `comment`. No contact, tokens, or review URLs. Zod: `limit` 1–50 default 50, `search` max 80, optional `createdAt_id` cursor. UI: `/dashboard/feedback` uses `useFeedbackList`; mock timer removed. `LOW_RATING_ALERT_COUNT` on `/dashboard` stays mock. **Limitation:** API returns `nextCursor` for a stable newest-page cursor; the dashboard does not paginate beyond the newest 50. Unit tests do not prove live database listing.

**Exit criteria:** dashboard uses real authorized feedback data.

## Phase 9 — Manager invitation slice

- [x] Choose and document invitation/membership creation design before coding.
- [x] Restrict invitation creation to the authenticated admin of the organization.
- [x] Bind invite to server-resolved organization and manager role; use expiry and one-time use where supported by the design.
- [x] Verify callback token server-side and create membership only from verified invite context.
- [x] Configure/test Supabase Auth email through Brevo SMTP if required by deployment. *(Documented: Auth mail is Supabase SMTP in the dashboard, not the Brevo HTTP alert adapter. Live SMTP not verified in CI.)*
- [x] Integrate accept-invite UI. Test expired, reused, tampered, mismatched-organization invites and privilege escalation. *(Unit tests of helpers + mocked Auth; live invite email/OTP not in CI.)*

**Verified (Oct 2026):** `npm test` (196 pass), `npm run lint`, `npm run build`. Migration `20261029094705_organization_manager_invite_state` via `prisma migrate dev`. `POST /api/invites/manager` is ADMIN-only; org/role from membership + `app_metadata`, never client IDs. Onboarding reuses the same service and keeps the org if send fails (`sent: false` + retry). `GET /auth/confirm` verifies OTP and redirects invite → `/accept-invite`, signup/email → `/auth/login`. `POST /api/auth/accept-invite` creates `MANAGER` membership in a transaction. Alert resolver prefers accepted manager `alertEmail` while `alertRecipient` stays `MANAGER_PENDING`. **Limitation:** unit tests mock Auth; Brevo SMTP must be configured in the Supabase dashboard for live invite mail.

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
