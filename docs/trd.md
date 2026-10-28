# ScanReview --- Technical Requirements Document (TRD)

**Version:** 1.0\
**Date:** October 28, 2026\
**Status:** MVP implementation baseline\
**Source:** ScanReview Product Requirements Document (`docs/prd.md`)

------------------------------------------------------------------------

## 1. Purpose and scope

This document defines the technical architecture, implementation
conventions, data model, API contracts, security controls, and testing
expectations for the ScanReview MVP.

ScanReview helps restaurants collect guest feedback through
spot-specific QR codes, immediately notify the configured recipient
about 1--2 star ratings, and help every guest create an editable
AI-assisted public review draft.

The MVP supports one restaurant organization per admin, an optional
manager, and a maximum of 50 QR-coded spots per organization. Chains,
advanced analytics, multilingual support, and AI insights are out of
scope.

The PRD remains the source of truth for product scope and acceptance
criteria. If an implementation detail conflicts with the PRD, document
the conflict and ask for clarification rather than silently changing
product behavior.

## 2. Locked technology stack

  -----------------------------------------------------------------------
  Area                                Technology / rule
  ----------------------------------- -----------------------------------
  Framework                           Next.js 16, App Router

  Language                            TypeScript with strict mode

  Routing and request interception    `proxy.ts` using the Next.js 16
                                      Proxy convention; do not create
                                      legacy `middleware.ts`

  React rendering                     Server Components by default;
                                      Client Components only where
                                      browser-side state or interactivity
                                      is needed

  Backend operations                  Next.js Route Handlers
                                      (`app/api/**/route.ts`); do not use
                                      Server Actions for application
                                      mutations

  Database                            Supabase PostgreSQL

  ORM and migrations                  Prisma

  Authentication                      Supabase Auth

  Validation                          Zod, on both client boundaries
                                      where useful and always on the
                                      server

  UI primitives                       shadcn/ui

  Styling                             Tailwind CSS plus centralized
                                      global CSS variables/design tokens
                                      and reusable project classes

  Client data fetching                TanStack React Query
                                      (`@tanstack/react-query`)

  HTTP client                         Axios, wrapped in a centralized
                                      typed API client

  Email                               Brevo API for manager alerts;
                                      configure Brevo SMTP for Supabase
                                      auth emails as described in the PRD

  AI review drafting                  Google Gemini API through
                                      `@google/genai`

  QR generation                       `qrcode` npm package

  Deployment                          Vercel
  -----------------------------------------------------------------------

Use the package versions compatible with the repository's existing
lockfile and Next.js 16. Do not upgrade or replace dependencies without
first checking the installed versions and explaining why a change is
needed.

## 3. Architecture principles

### 3.1 Server Components by default

-   App Router pages and layouts should be Server Components unless
    client-side behavior is required.
-   Keep database reads, secret-bearing integrations, and server-only
    logic on the server.
-   Do not add `"use client"` to a page or layout just to use one
    interactive control. Extract the smallest useful interactive leaf
    into a Client Component.
-   Server Components may render Client Components and pass them
    serializable props.
-   Never pass Prisma objects containing unsupported values, secrets, or
    internal-only fields directly to a Client Component. Map database
    results to explicit DTOs.
-   Use `server-only` in modules that must never enter a client bundle,
    where appropriate.

### 3.2 Client Components for interactivity

Use Client Components for features such as: - Interactive star selection
and rating feedback. - Forms requiring client-side interaction and
immediate validation feedback. - Editable review drafts,
copy-to-clipboard, and loading states. - Dashboard filters, pagination
controls, dialogs, drawers, and toasts. - QR-code selection and
print/download interactions. - React Query hooks and client-side API
requests.

Client Components should not directly access Prisma or privileged
Supabase clients. They call the application's Route Handlers through the
centralized Axios client.

### 3.3 Route Handlers instead of Server Actions

All application backend mutations and client-consumed API operations
must be implemented as Route Handlers under `app/api/**/route.ts`. Do
not use Server Actions for these operations.

Route Handlers must: 1. Authenticate the request when required. 2.
Authorize the user against the requested organization/resource. 3.
Validate request parameters, query parameters, and body data with Zod.
4. Execute business logic using server-only services. 5. Return a
consistent JSON response and appropriate HTTP status. 6. Avoid exposing
secrets, raw database internals, or sensitive stack traces.

Server Components may perform server-side reads directly through
service/repository functions when appropriate; do not make an HTTP
request back to the same application from a Server Component merely to
call its own Route Handler. Client Components use Route Handlers via
Axios and React Query.

### 3.4 Next.js 16 Proxy and async cookies

-   Use the Next.js 16 `proxy.ts` convention for lightweight request
    interception, such as redirecting clearly unauthenticated users away
    from protected page routes where the session can be checked safely.
-   Do not use `middleware.ts` as the project's request interception
    entry point.
-   Proxy is not the authorization boundary. Every protected Route
    Handler and sensitive server-side operation must independently
    authenticate and authorize the request.
-   Next.js `cookies()` is asynchronous. Always await it before reading
    or writing cookies, for example:

``` ts
import { cookies } from "next/headers";

const cookieStore = await cookies();
const sessionCookie = cookieStore.get("example-session");
```

-   Follow the installed Supabase SSR client guidance for refreshing and
    persisting auth cookies in Proxy and server/client helpers. Do not
    implement a separate, competing cookie mechanism.
-   In Server Components, cookie writes may not be available in every
    rendering context. Handle cookie refresh/write operations in the
    supported Proxy or Route Handler context.
-   Never store service-role keys, API keys, or other secrets in
    browser-readable cookies.

## 4. Suggested project structure

Adapt this structure to the existing repository rather than moving files
blindly. Keep the HTML prototypes and branding kit outside the
application repository in the separate design-reference directory.

``` text
scanreview/
├── app/
│   ├── (marketing)/
│   │   └── page.tsx
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── accept-invite/page.tsx
│   ├── onboarding/page.tsx
│   ├── dashboard/page.tsx
│   ├── feedback/[orgId]/[tableId]/
│   │   ├── page.tsx
│   │   └── review/page.tsx
│   ├── auth/confirm/route.ts
│   ├── api/
│   │   ├── auth/
│   │   ├── organizations/
│   │   ├── spots/
│   │   ├── feedback/
│   │   ├── reviews/
│   │   └── invites/
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                 # shadcn/ui primitives
│   ├── layout/
│   ├── auth/
│   ├── onboarding/
│   ├── dashboard/
│   ├── feedback/
│   ├── review/
│   └── qr/
├── lib/
│   ├── api/                # Axios instance and API helpers
│   ├── auth/               # Supabase SSR/browser clients and auth helpers
│   ├── db/                 # Prisma client singleton
│   ├── validations/        # Zod schemas
│   ├── services/            # Server-side business logic
│   ├── repositories/        # Database access, if separation is useful
│   ├── email/
│   ├── ai/
│   ├── qr/
│   └── utils/
├── hooks/                  # Client hooks, including React Query hooks
├── types/                  # Shared DTOs and domain types
├── prisma/
│   └── schema.prisma
├── docs/
│   ├── prd.md
│   └── trd.md
├── proxy.ts
├── components.json
└── ...
```

Keep Route Handlers thin. They should call service functions; services
coordinate validation/business rules and repositories or Prisma for
persistence. Avoid unnecessary abstraction for a small MVP, but never
mix privileged integration code into client components.

## 5. UI system, shadcn/ui, and styling

### 5.1 shadcn/ui usage

-   Use shadcn/ui components for common accessible primitives such as
    Button, Input, Label, Textarea, Select, Checkbox, RadioGroup,
    Dialog, AlertDialog, Sheet, DropdownMenu, Table, Card, Skeleton,
    Badge, Form-related controls, and Toast/Sonner where suitable.
-   Install or generate only components that are needed.
-   Compose shadcn/ui primitives into ScanReview-specific components
    instead of reimplementing accessible primitives from scratch.
-   Use the existing HTML references for page structure and interaction
    intent. Use the branding kit for visual identity. Neither should be
    replaced by a generic shadcn default look.
-   Preserve accessibility: keyboard operation, focus indicators,
    semantic labels, suitable contrast, and clear error messaging.

### 5.2 Centralized global styling

-   Define the brand palette, typography, surfaces, borders, radii,
    shadows, and spacing conventions centrally in `app/globals.css`
    using CSS custom properties and the project's Tailwind/shadcn theme
    conventions.
-   Keep theme tokens centralized; do not scatter raw brand hex values
    across components.
-   Apply shared styling through global tokens, Tailwind utility
    classes, and reusable project-level classes/components.
-   Use semantic tokens such as background, foreground, card, muted,
    border, input, ring, primary, secondary, destructive, and accent.
    Add explicit ScanReview brand tokens where shadcn semantic tokens
    are insufficient.
-   Keep component-level classes focused on layout and local variants.
    Avoid large repeated inline styles and duplicated class strings.
-   Use `cn()` and the existing utility conventions for conditional
    class composition.
-   Implement the brand kit's approved themes only if they are present
    in the supplied branding reference. Do not invent new theme modes.
-   Match the original HTML references for page spacing, hierarchy,
    responsiveness, and interaction states.

### 5.3 Design reference rules

The external `scanreview-design/` directory is the design source and
should remain reference-only. It contains the original HTML prototypes
and branding kit. Do not edit these files or copy them into the
production route tree. Inspect them before implementing each page, and
ask for the correct path if they are not accessible from the development
workspace.

## 6. Data fetching, Axios, and React Query

### 6.1 Centralized Axios client

-   Create a single configured Axios instance in `lib/api/` with the
    application's base URL strategy, common headers, and shared error
    handling.
-   Use typed request/response DTOs and small endpoint-specific API
    functions. Do not scatter raw `axios.get/post` calls throughout
    components.
-   Keep auth credentials in the supported Supabase SSR/browser session
    mechanism. Do not put secret API keys in Axios defaults or client
    code.
-   Normalize API errors into a consistent shape that UI components can
    handle.
-   Avoid setting a hard-coded production URL. Use same-origin relative
    `/api/...` routes in the browser where practical.

### 6.2 React Query configuration

-   Add a single `QueryClientProvider` at the appropriate
    client-provider boundary.
-   Define stable query keys centrally, preferably with query-key
    factories, for example:
    -   `["organization", "current"]`
    -   `["spots", { organizationId }]`
    -   `["feedback", { organizationId, filters }]`
    -   `["feedback", { organizationId, feedbackId }]`
-   Set deliberate `staleTime`, `gcTime`, retry, and refetch behavior
    based on the resource and expected freshness. Do not apply one
    aggressive global policy to every query.
-   Use `useQuery` for client-side reads and `useMutation` for writes.
-   Avoid duplicate fetching when server-provided initial data can be
    safely hydrated into React Query. Use a documented hydration
    strategy only when it provides value; do not introduce unnecessary
    complexity.

### 6.3 Update cache directly after mutations

The preferred pattern is to update the React Query cache directly after
a successful mutation rather than issuing another GET request just to
refresh data that the mutation response already provides.

Examples: - After creating a spot, insert the returned spot into the
cached spots list and update the cached spot count. - After updating
organization settings, update the cached organization object with the
response. - After a feedback mutation, update the relevant cached
feedback entry/list if the returned data is sufficient. - For operations
whose result affects multiple lists or aggregates, update all known
affected query keys where correctness is clear.

Use `queryClient.setQueryData` or `queryClient.setQueriesData` for
direct updates. For an optimistic UI: 1. Cancel conflicting outgoing
queries. 2. Snapshot the relevant cache. 3. Apply the optimistic update.
4. Roll back on error. 5. On success, reconcile with the authoritative
mutation response. 6. Invalidate/refetch only if the final state cannot
be determined safely from the response.

Do not invalidate every query after every mutation. Target invalidation
only to data that may have become stale and cannot be updated reliably
from the mutation result. A low-rating feedback submission and its email
alert are server-side side effects; the UI must not assume email
delivery succeeded merely because the feedback row was saved.

Use the React Query cache for client-side server state, not as a
replacement for the database or server authorization.

## 7. Authentication and authorization

### 7.1 Supabase Auth

-   Use Supabase Auth for admin sign-in and manager invite
    acceptance/sign-in.
-   Keep separate, appropriately configured Supabase clients for browser
    and server contexts.
-   Use the Supabase SSR integration compatible with Next.js App Router
    and async cookies.
-   Use the server-side authenticated user as the source of identity.
    Never trust a client-provided user ID or organization ID as proof of
    access.
-   Do not expose the Supabase service-role key in `NEXT_PUBLIC_*`
    variables or client bundles.

### 7.2 Roles and organization access

The MVP supports `admin` and `manager` roles. Every protected operation
must resolve the authenticated user's membership and verify access to
the organization involved.

-   Admin: manage their organization settings and spots; view
    organization feedback; configure alert recipient.
-   Manager: view feedback for the organization they were invited to;
    receive low-rating alerts; cannot create spots or change
    organization settings.
-   Guest: no login; may submit a rating, optional contact information
    and comment for a valid public spot, and generate an editable review
    draft.

Do not rely on Proxy redirects or hidden UI controls for authorization.
Enforce access in every relevant Route Handler/service.

### 7.3 Manager invitation integrity

-   Send invites only from server-side code.
-   Bind the invitation to the intended organization and `manager` role
    in trusted server-side state/metadata.
-   Verify the invite token in `/auth/confirm`, then let the manager set
    a password at `/accept-invite`.
-   Derive the organization membership from verified invitation state,
    not a client-submitted organization ID.
-   Ensure replayed, expired, or mismatched invitations cannot attach a
    user to another organization.
-   If the password invite path cannot be completed in time, use the
    PRD's documented magic-link fallback and record that deviation.

## 8. Data model and database constraints

The following is the recommended logical model based on the PRD. Confirm
exact field names and relations against the existing Prisma schema
before implementing migrations.

### 8.1 Organization

-   `id`: UUID primary key.
-   `name`: required, trimmed, length-limited.
-   `businessType`: required enum or validated string for MVP restaurant
    setup.
-   `labelType`: preset label or custom label configuration.
-   `customLabel`: nullable, trimmed and length-limited when used.
-   `publicReviewUrl`: nullable, valid HTTPS URL.
-   `createdAt`, `updatedAt`.

### 8.2 Member

-   `id`: UUID primary key.
-   `userId`: unique Supabase Auth user ID.
-   `organizationId`: foreign key to Organization.
-   `role`: `ADMIN` or `MANAGER`.
-   `alertEmail`: validated email for the alert recipient where
    appropriate.
-   `createdAt`, `updatedAt`.

Use a database constraint or unique index to prevent unintended
duplicate membership for the same user and organization. The exact
uniqueness rule must support the MVP's one-organization membership
assumptions.

### 8.3 Spot (PRD calls this Table)

Use the neutral domain term `Spot` internally because labels can be
Table, Counter, Desk, or a custom label. The UI should display the
configured label, never hardcode "Table".

-   `id`: UUID primary key and opaque identifier.
-   `organizationId`: foreign key to Organization.
-   `number`: positive sequential number within the organization.
-   `displayName`: generated from the configured label, e.g. `Table 7`
    or `Counter 2`.
-   `publicToken`: cryptographically random, unique token used in the
    public QR URL; do not expose sequential IDs as the only protection.
-   `createdAt`, `updatedAt`.

Constraints: - Unique `(organizationId, number)`. - Unique
`publicToken`. - Maximum 50 spots per organization, enforced
transactionally in server-side business logic. Consider
transaction/locking or a robust count-and-create strategy to prevent
concurrent requests exceeding the cap.

### 8.4 Feedback

-   `id`: UUID primary key.
-   `organizationId`: foreign key to Organization.
-   `spotId`: foreign key to Spot.
-   `rating`: integer constrained to 1--5.
-   `comment`: nullable and length-limited.
-   `contactName` / `contactEmail` / `contactPhone`: optional fields
    only as supported by the chosen contact form; collect the minimum
    necessary data.
-   `createdAt`: server-generated timestamp.
-   Optional abuse-control fields if adopted after deciding the PRD's
    open questions.

Ensure the spot belongs to the specified organization. Prefer deriving
the organization from the resolved spot rather than trusting a
client-supplied organization ID. Consider storing only the spot relation
and deriving organization through the relation, if that fits the
reporting/query patterns.

### 8.5 Database integrity

-   Add foreign keys, appropriate indexes, unique constraints, and
    rating-range constraints where supported.
-   Index feedback by `(organizationId, createdAt)` and by
    `(spotId, createdAt)` for dashboard queries.
-   Use transactions for organization + initial spots creation and for
    operations that must be atomic.
-   Prisma schema and migrations are the source of truth for database
    structure. Do not make undocumented manual production schema
    changes.

## 9. API conventions

All client-consumed backend operations use Route Handlers. The endpoint
list below is a recommended API contract derived from the PRD; align
naming with existing routes before implementation and document any
differences.

### 9.1 Response format

Success response:

``` json
{
  "data": {},
  "error": null
}
```

Error response:

``` json
{
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please check the submitted fields.",
    "details": {}
  }
}
```

Use suitable HTTP statuses: `200`/`201` success, `400` malformed input,
`401` unauthenticated, `403` unauthorized, `404` missing or inaccessible
resource, `409` conflict/cap reached, `422` semantic validation error if
consistently used, `429` rate limit, and `500` unexpected server error.
Do not expose stack traces or secret-bearing details.

### 9.2 Proposed endpoints

  -------------------------------------------------------------------------------------
  Method            Endpoint                       Purpose            Access
  ----------------- ------------------------------ ------------------ -----------------
  `GET`             `/api/auth/me`                 Return current     Signed in
                                                   authenticated user 
                                                   and permitted      
                                                   membership summary 

  `POST`            `/api/organizations`           Create             Admin
                                                   organization and   signup/session
                                                   initial spots      
                                                   during onboarding  

  `GET`             `/api/organizations/current`   Read current       Admin/manager
                                                   user's             
                                                   organization       
                                                   settings           

  `PATCH`           `/api/organizations/current`   Update allowed     Admin only
                                                   organization       
                                                   settings           

  `GET`             `/api/spots`                   List spots and QR  Admin
                                                   metadata for       
                                                   current            
                                                   organization       

  `POST`            `/api/spots`                   Add spots without  Admin
                                                   exceeding the cap  

  `GET`             `/api/feedback`                List feedback with Admin/manager
                                                   pagination and     
                                                   filters            

  `GET`             `/api/feedback/[feedbackId]`   Read one           Admin/manager
                                                   authorized         
                                                   feedback item if   
                                                   needed             

  `POST`            `/api/public/feedback`         Validate and save  Public,
                                                   a guest rating and rate-limited
                                                   optional           
                                                   contact/comment    

  `POST`            `/api/public/reviews/draft`    Generate a review  Public,
                                                   draft from rating  rate-limited
                                                   and optional       
                                                   comment            

  `POST`            `/api/invites/manager`         Invite a manager   Admin
                                                   to the admin's     
                                                   organization       

  `POST`            `/api/auth/accept-invite`      Complete manager   Verified invite
                                                   password           
                                                   setup/membership   
                                                   flow if required   
                                                   by the auth design 

  `GET`             `/auth/confirm`                Verify Supabase    Invite token
                                                   invite token and   
                                                   redirect           
  -------------------------------------------------------------------------------------

Route Handlers should use `request.json()` only after handling malformed
JSON, and should validate all input with Zod. Public endpoints must
resolve the public token to a real spot and derive the associated
organization on the server.

The PRD does not require a dedicated API endpoint for QR generation. QR
images can be generated server-side or in a controlled UI utility from
the public URL, provided the underlying public token is generated
securely and the code reliably resolves to the correct spot.

## 10. Core service workflows

### 10.1 Onboarding and QR creation

1.  Validate organization fields, label selection, optional HTTPS review
    URL, alert recipient, and spot count using Zod.
2.  Require spot count to be an integer from 1 to 50.
3.  Determine the final display label from the preset/custom label
    configuration.
4.  In a database transaction, create the organization, initial admin
    membership, and spots with unique random public tokens.
5.  Generate a public URL for each spot and a QR representation using
    the `qrcode` package.
6.  Return only the required DTOs to the browser.
7.  If a manager was requested, send the invitation through server-side
    code and surface a clear outcome if invitation delivery fails.
8.  Ensure retries do not accidentally create duplicate
    organizations/spots; use idempotency or an explicit recovery
    strategy if needed.

### 10.2 Public guest rating

1.  Resolve the random public token to the spot and its organization.
2.  Validate rating as an integer from 1 through 5 and validate optional
    contact/comment fields.
3.  Save feedback with a server-generated timestamp.
4.  For a 1--2 star rating, show the recovery state and attempt to send
    an alert to the configured manager or admin.
5.  For a 3--5 star rating, do not send a low-rating alert.
6.  Continue to the review drafter at every rating.
7.  Ensure a failed email does not erase the saved feedback. Log a
    sanitized failure and implement a documented retry/monitoring
    approach if time permits.

The guest must be able to continue without sharing contact information.
Never make contact details mandatory for low ratings.

### 10.3 Low-rating alert

-   Use Brevo from server-only code.
-   Resolve the alert recipient from trusted organization/member
    configuration.
-   Include organization name, configured spot display name, rating,
    timestamp, and comment when available.
-   Do not include optional guest contact information unless it is
    necessary for the recipient and the product's privacy policy permits
    it.
-   Send no low-rating alert for 3--5 stars.
-   Handle provider errors without leaking API credentials or preventing
    the guest from proceeding.

### 10.4 AI review draft

-   Use `@google/genai` from a server-only service.
-   Send only the rating and guest-provided comment needed to generate a
    draft.
-   Treat user comments as untrusted content, not instructions to
    override system behavior.
-   Return editable draft text to the client; do not publish it
    automatically.
-   Validate and bound input length, handle empty comments, provider
    errors, timeouts, and malformed responses.
-   Do not claim that the draft is a verified or factual account beyond
    the guest's own input.
-   Never post reviews on the guest's behalf.
-   Display the "Post your review" action only when the organization has
    a valid HTTPS review URL. Open it in a new tab with
    `rel="noopener noreferrer"`.

### 10.5 Manager invite and acceptance

-   Admin submits manager name and email to the protected invite
    endpoint.
-   Server verifies the current user is an admin of the organization.
-   Server initiates the Supabase invitation using a safe redirect to
    `/auth/confirm`.
-   Confirmation verifies the OTP/token and redirects to
    `/accept-invite`.
-   Manager sets a password using Supabase Auth.
-   Membership creation must use trusted invitation metadata or
    server-verified invite state.
-   Redirect to the dashboard only after authentication and membership
    are established.
-   Never accept a client-provided organization ID as sufficient
    evidence for membership.

## 11. Validation and error handling

Create reusable Zod schemas in `lib/validations/` and infer TypeScript
types from those schemas where appropriate.

Minimum validation rules: - Organization name: trimmed, non-empty,
reasonable maximum length. - Business type: allowed MVP value(s). -
Label type: known preset or custom. - Custom label: trimmed, non-empty
when selected, length-limited. - Spot count: integer from 1 to 50. -
Review URL: optional; if provided, valid `https://` URL. - Manager
name/email: validated if manager invitation is selected. - Rating:
integer from 1 to 5. - Comment/contact fields: optional, length-limited,
and validated according to the chosen input model. - Public spot token:
format checked and resolved server-side. - Review draft requests: input
size and request frequency bounded.

Return user-safe errors. Log diagnostic details server-side with secrets
and personal data redacted. Do not show raw Prisma, Supabase, Gemini, or
Brevo error messages to guests.

## 12. Security, privacy, and abuse controls

-   Treat all client input as untrusted, including hidden fields, query
    parameters, organization IDs, spot IDs, and role values.
-   Enforce authentication and organization authorization in every
    protected Route Handler.
-   Keep Supabase service-role credentials, Gemini keys, and Brevo keys
    server-only. No secret may use a `NEXT_PUBLIC_` prefix.
-   Use HTTPS in production and secure cookie settings through the
    supported Supabase SSR integration.
-   Use random, unguessable public spot tokens in QR URLs.
-   Apply request-size limits and rate limiting or an equivalent
    abuse-control strategy to public rating and AI draft endpoints. The
    exact provider/implementation is an open implementation decision and
    must be documented before launch.
-   Prevent duplicate or automated submissions where feasible without
    making normal QR usage difficult. The PRD leaves the precise policy
    open.
-   Collect only the optional guest contact information the product
    needs. Restrict access to authorized members of the same
    organization.
-   Avoid logging guest contact details or full comment text unless
    necessary for support; redact sensitive data from error logs.
-   Validate outbound review URLs and open them safely.
-   Use secure, expiring invitation flows and prevent invitation replay
    or organization substitution.
-   Apply appropriate response headers and avoid returning unnecessary
    internal fields.
-   Decide and document data retention/deletion policy for guest contact
    details before production use.

## 13. Performance and caching

-   Keep public guest pages mobile-first and fast; avoid requiring
    authentication or loading the admin dashboard bundle for guests.
-   Use React Query for client-side server state and cache updates as
    described in Section 6.
-   Use direct cache writes from mutation responses whenever possible;
    do not refetch simply to make the UI reflect a mutation that has
    already returned authoritative data.
-   Set resource-specific `staleTime` and refetch rules. Dashboard
    feedback may need fresher data than static organization settings.
-   Do not cache user-specific or sensitive responses in a shared public
    cache.
-   Be deliberate with Next.js server/data caching for authenticated
    data. Avoid accidental cross-user or cross-organization cache reuse.
-   Use pagination on feedback lists as data grows; do not return
    unbounded feedback history by default.
-   Load QR generation and other heavier UI utilities only where needed.
-   Use loading, empty, error, and retry states for async UI. Prevent
    duplicate submissions while a mutation is pending.

## 14. Accessibility and responsive behavior

-   Guest rating and review-drafter flows must be usable on small phone
    screens.
-   Star controls must be keyboard-accessible and have meaningful
    accessible names, not rely on color alone.
-   Form inputs must have labels and clear validation messages.
-   Dialogs and sheets must support focus management and keyboard
    dismissal.
-   Buttons must show focus, disabled, and loading states.
-   Dashboard tables or lists must remain usable on smaller screens.
-   Respect reduced-motion preferences for non-essential animations.
-   Use semantic HTML and the accessibility behavior provided by
    shadcn/ui primitives.

## 15. Testing requirements

Use the repository's existing test tooling if present; inspect it before
adding a new framework. At minimum, add tests for:

### Unit tests

-   Zod validation for onboarding, labels, ratings, contact details,
    review URLs, and invite inputs.
-   Spot display-name generation for preset and custom labels.
-   Spot-cap enforcement, including attempts to create more than 50
    spots.
-   Review-draft input preparation and safe provider-error handling.
-   Query-cache update helpers where non-trivial cache transformations
    are extracted.

### Integration/API tests

-   Unauthenticated requests cannot read protected organization data.
-   Managers cannot create spots or change settings.
-   Members cannot read another organization's feedback.
-   Invalid ratings and unknown spot tokens are rejected.
-   A spot cannot be attached to a different organization by altering
    client input.
-   1--2 star feedback is saved and triggers an alert attempt.
-   3--5 star feedback does not trigger a low-rating email.
-   Review draft generation never publishes a review.
-   Invalid/mismatched/expired invites cannot create cross-organization
    membership.
-   Spot creation cannot exceed the 50-spot cap.

### End-to-end tests

-   Admin onboarding creates labeled QR codes.
-   Public QR route opens the correct spot.
-   Low-rating path offers optional contact sharing and reaches the
    drafter.
-   High-rating path reaches the drafter directly.
-   Draft can be generated, edited, and copied.
-   Review button is hidden without a configured URL and opens safely
    when configured.
-   Manager invite acceptance leads to the correct organization's
    dashboard.
-   Dashboard displays feedback with rating, spot label, and timestamp.

Mock external provider calls in automated tests. Use a dedicated test
database/environment for integration tests; never run destructive test
setup against production data.

## 16. Observability and reliability

-   Log request correlation IDs, operation outcomes, and sanitized
    provider errors.
-   Track feedback-save success separately from alert-email delivery
    success.
-   Make the email failure behavior visible to operators through logs or
    a minimal status mechanism; the PRD leaves the exact retry strategy
    open.
-   Handle Gemini and Brevo timeouts and provider failures gracefully.
-   Use idempotent behavior for retryable onboarding/invitation
    operations where practical.
-   Configure Vercel environment variables separately for development,
    preview, and production.
-   Never log secrets, auth tokens, or unnecessary guest personal data.

## 17. Environment variables

Use `.env.example` to document required variable names without real
values. Confirm exact variable names against the existing project and
installed SDKs.

Typical server/environment configuration:

``` dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
DIRECT_URL=
GEMINI_API_KEY=
BREVO_API_KEY=
BREVO_SENDER_EMAIL=
NEXT_PUBLIC_APP_URL=
```

Notes: - Use only public Supabase values in `NEXT_PUBLIC_*` variables. -
Keep service-role, database, Gemini, and Brevo secrets server-side. - Do
not duplicate secrets under multiple variable names without a concrete
need. - If the project uses the newer Supabase publishable-key format,
use the existing project's naming and update the example consistently
rather than introducing a second alias. - Configure Brevo SMTP in
Supabase Auth settings for authentication emails; SMTP credentials
should be managed securely in the provider configuration. - Do not
commit `.env` files containing credentials.

## 18. Implementation sequence

1.  **Repository audit:** inspect current files, installed dependencies,
    Next.js version, Prisma schema, Supabase setup, and existing tests.
2.  **Foundation:** define global design tokens, shadcn/ui conventions,
    Axios instance, React Query provider/query keys, Prisma singleton,
    and server/client Supabase helpers.
3.  **Authentication:** implement login, auth confirmation, invitation
    acceptance, async cookie handling, and `proxy.ts` redirects.
4.  **Data model:** verify and implement Prisma schema/migrations for
    Organization, Member, Spot, and Feedback.
5.  **Onboarding and QR:** validate setup, transactionally create
    organization/spots, generate QR codes, and support print/download.
6.  **Public guest feedback:** implement public spot resolution, rating
    submission, low-rating recovery, optional contact capture, and abuse
    controls.
7.  **Alerts:** integrate Brevo and test 1--2-star-only alert behavior.
8.  **AI drafter:** integrate Gemini, editing, copy-to-clipboard, and
    safe public review navigation.
9.  **Dashboard:** implement organization-scoped feedback reads,
    filters/pagination as needed, and React Query cache updates after
    mutations.
10. **Verification:** run unit, API/integration, and end-to-end tests;
    verify responsive behavior, security boundaries, and Vercel
    deployment configuration.

At the start of each phase, inspect the original HTML references and use
them to guide the page layout. Do not implement all pages in one
unreviewed pass.

## 19. Open technical decisions

The PRD explicitly leaves these questions unresolved. Document decisions
rather than silently assuming them: - Public endpoint rate limiting and
duplicate-rating/abuse strategy. - Guest contact-detail retention and
deletion. - Email failure retry policy and alert delivery
observability. - Whether admins can add spots or change labels after
initial onboarding. - Whether the MVP permits repeat ratings from the
same guest during one visit. - Exact success metric targets. - Exact
manager invitation membership creation mechanism (database trigger
versus verified server-side creation). - Exact deployment and
test-environment strategy for Prisma migrations and Supabase.

## 20. Definition of done

A feature is complete when: - It matches the PRD's acceptance criteria
and the relevant HTML reference. - Server input is validated with Zod. -
Authentication and organization authorization are enforced server-side
where required. - Secrets remain server-only. - The UI uses shared
shadcn/ui primitives and centralized styling tokens. - Server Components
remain the default; Client Components are limited to interactive
needs. - Client data operations use the shared Axios/React Query
conventions. - Mutation responses update the React Query cache directly
where possible, with targeted invalidation only when necessary. -
Loading, empty, error, success, and responsive states are handled. -
Relevant tests pass and no unrelated project files are changed. - Any
deviation from the PRD or reference design is reported and approved.
