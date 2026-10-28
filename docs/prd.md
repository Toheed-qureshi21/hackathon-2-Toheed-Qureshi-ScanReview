# ScanReview PRD

Oct 28, 2026 · @nothing

## Overview

ScanReview lets restaurants catch bad experiences while the guest is still at the table, and turns every guest's feedback into a public review draft.

Guests scan a QR code on their table and rate the visit with stars, with no login. A rating of 1-2 stars emails the manager instantly with the table number, so staff can fix the problem before the guest leaves. Every guest, whatever the rating, can then use an AI drafter to turn their experience into an editable public review.

This PRD covers the MVP: one organization at a time, up to 50 QR-coded spots, built and demoed for restaurants. Chains, AI insights and multilingual support are future scope.

## Problem statement

Restaurants learn about bad experiences after the guest has gone, and unhappy guests who do want to post a review struggle to put it into words.

| Pain point | Who feels it | Consequence |
| --- | --- | --- |
| Delayed feedback: guests leave without telling staff | Manager | No chance to recover the visit |
| Slow response: complaints about service, waits or food quality surface too late | Manager | Problems repeat and reach public reviews first |
| Hard-to-write reviews: guests can't describe their experience clearly | Guest, restaurant | Fewer and weaker public reviews |

## Goals, non-goals, and success metrics

The MVP succeeds if a manager can be alerted to a 1-2 star rating at the table, and any guest can leave with a ready-to-post review draft.

**Goals**

- Alert the right person by email as soon as a guest gives 1-2 stars, naming the exact spot.
- Give guests a no-login, mobile-friendly rating flow that takes seconds.
- Let every guest, at any rating, generate and edit an AI review draft and reach the public review page.
- Let an admin set up an organization and print labeled QR codes in one onboarding session.

**Non-goals for the MVP**

- Posting reviews on a guest's behalf. Guests always paste and post themselves.
- Chains, centralized reporting, AI insights, multilingual feedback, or more than 50 QR codes.

**Proposed success metrics** (targets to be set by the team)

| Metric | What it tells us |
| --- | --- |
| Guest completion rate: scans that end in a submitted rating | Is the rating page low-friction? |
| Alert delivery time: 1-2 star rating to manager email | Can staff still reach the guest? |
| Drafter usage: guests who generate a draft, by rating | Is the drafter useful at every rating? |
| Post-click rate: guests who tap "Post your review" (orgs with a link) | Does the draft lead to a public review? |
| Contact-share rate on low ratings | How many unhappy guests allow follow-up? |
| Onboarding completion: admins who reach printed QR codes | Is setup quick enough? |

## Users and roles

There are three user types: two signed-in roles and a public guest. Full role-based access (owners, branch managers, staff) is future scope.

| User | How they get in | Can do | Cannot do |
| --- | --- | --- | --- |
| Admin | Signs up or logs in; created the organization | Edit settings, create spots and QR codes, add a manager, view feedback, receive alerts | Exceed 50 spots |
| Manager | Email invite, then sets a password at `/accept-invite` | Sign in, view their organization's feedback, receive 1-2 star alerts | Create spots or change settings |
| Guest | Scans a table QR code; no login | Rate, share optional contact details, draft and copy a review | See any other guest's data |

## Scope

The MVP covers the full loop from onboarding to alert to review draft, for restaurants, with a hard cap of 50 QR codes per organization.

**In scope (MVP)**

- Admin login and an onboarding page: organization name, business type, label type, number of spots.
- Label type picker with presets (Table, Counter, Desk, ...) and a custom label.
- Optional public review link (for example a Google Maps page), validated as a URL.
- Optional manager invite by email, with an accept-invite page where the manager sets a password.
- One labeled QR code per spot, maximum 50.
- Public guest page per spot: star rating, no login.
- Good rating (3-5): redirect to the AI review drafter.
- Low rating (1-2): sorry message, optional contact details, "I don't want to share my contact" option, then the AI review drafter.
- Validated storage of organization, spot, rating, optional comment, optional contact details and timestamp.
- Email alert to the manager (or admin) on 1-2 star ratings.
- AI-assisted, editable review draft at any rating, with a "Post your review" button when a review link exists.
- Dashboard behind Supabase Auth showing rating, spot and timestamp.

**Out of scope (future)**

- Multi-location chains with centralized reporting.
- AI insights: recurring complaints, sentiment trends, recommendations.
- Multi-tenant architecture with full role-based access.
- Multilingual feedback and cross-language summaries.
- More than 50 QR codes per organization.
- Business types beyond restaurants. Labels like Desk are supported, but the product is built and demoed for restaurants.

## User flows

Admins set up once, guests never log in, and every guest path ends at the AI drafter.

**Admin and manager setup**

1. Admin signs up or logs in.
2. On the onboarding page, the admin enters the organization name, business type, label type (preset or custom), number of spots (maximum 50), an optional public review link, and who gets alerts: "Just me" or "A manager I'll invite" (name and email).
3. The app creates the spots and shows one labeled QR code for each, such as Table 1 to Table 30 or Counter 1 and Desk 1.
4. The admin prints the codes and places one on each spot.
5. If a manager was added, they get an email invite, click the link, set a password at `/accept-invite`, and land on the dashboard. Later they sign in at `/login`.

**Guest and alert flow**

&#91;embedded content: guest flow · 1 decision, 2 outcomes\]

On 1-2 stars the guest sees the sorry message and the manager is emailed at once; either way the guest then reaches the drafter. The drafter uses the guest's rating and optional comment, and "Post your review" appears only when the admin added a review link.

## Functional requirements

Every MVP feature below is must-have (P0) except the items marked P1, which can slip or use the stated fallback.

| ID | Feature | Requirement | Acceptance criteria | Priority |
| --- | --- | --- | --- | --- |
| FR-1 | Onboarding | Admin enters organization name, business type, label type, number of spots, optional review link, and alert recipient. | Submitting valid input creates the organization and spots; invalid input shows a clear error. | P0 |
| FR-2 | Label type | Admin picks a preset (Table, Counter, Desk, ...) or a custom label. | Custom label is trimmed, non-empty and short (Zod). The label appears in QR captions, alert emails and the dashboard; "Table" is never hardcoded. | P0 |
| FR-3 | Spot cap | A maximum of 50 spots per organization. | Any number above 50 is rejected with a clear message, server-side. | P0 |
| FR-4 | QR codes | One unique QR code per spot, captioned with its name ("Table 1", "Counter 2"). | Each code opens a unique, random URL for that spot; guests never type a table number. | P0 |
| FR-5 | Guest rating | Public mobile page with a 1-5 star rating, no login. | Rating is an integer 1-5 and the spot belongs to the organization (validated server-side). | P0 |
| FR-6 | Low-rating recovery | On 1-2 stars, the same page shows a sorry message and an optional contact form. | Guest can submit contact details or tap "I don't want to share my contact"; both lead to the AI drafter. | P0 |
| FR-7 | Good-rating path | On 3-5 stars, the guest goes straight to the AI drafter. | Redirect happens without extra steps. | P0 |
| FR-8 | Manager alert | Email on 1-2 star ratings via Brevo, to the manager or to the admin if no manager was added. | Email names the organization, the exact spot with its label, the rating, and the comment where available. No email for 3-5 stars. | P0 |
| FR-9 | AI review drafter | Guest adds an optional comment, generates a Gemini draft from their rating and comment, edits it, and copies it. | Works at any rating. Guest posts the review themselves; the app never posts for them. | P0 |
| FR-10 | Post your review | Button opens the organization's public review page in a new tab. | Shown only if a review link exists; link is a well-formed `https://` URL; opens with `rel="noopener noreferrer"`. | P0 |
| FR-11 | Manager invite | Admin adds a manager by name and email; manager receives an invite and sets a password. | Invite is sent server-side only; manager joins only the organization named in the invite; manager lands on that organization's dashboard. | P0 |
| FR-12 | Dashboard | Admin and manager sign in and see feedback with rating, spot and timestamp. | Protected by Supabase Auth; users see only their own organization's feedback. | P0 |
| FR-13 | Magic-link fallback | If password invites run short on time, managers sign in with a magic link instead. | Used only as the documented fallback. | P1 |

## Screens, routes and data model

Six screens and seven routes carry the MVP. The guest rating page is one screen with two states (normal, and low-rating recovery).

**Screens**

1. Landing page
2. Login / signup
3. Onboarding
4. Guest rating page (stars; on 1-2 stars, sorry message, optional contact form and "I don't want to share my contact")
5. AI review drafter (optional comment, generate, edit, copy, "Post your review" if a link exists)
6. Accept invite (manager sets a password; reuses the login layout)

**Routes**

| Route | Who | Purpose |
| --- | --- | --- |
| `/login` | Admin | Sign in |
| `/auth/confirm` | Manager | Verifies the invite token, then redirects to `/accept-invite` |
| `/accept-invite` | Manager | Set a password after the email invite |
| `/onboarding` | Admin | Organization name, business type, label type, spots, review link, manager |
| `/dashboard` | Admin | QR codes and feedback list |
| `/feedback/[orgId]/[tableId]` | Guest (public) | Star rating, plus sorry message and contact form for low ratings |
| `/feedback/[orgId]/[tableId]/review` | Guest (public) | AI review drafter |

**Data model (high level)**

| Entity | Fields |
| --- | --- |
| Organization | id, name, business type, label type (preset or custom text), optional public review URL |
| Member | user, organization, role (`admin` or `manager`), alert email |
| Table (a spot, whatever its label) | id (random UUID), organization, number, display name ("Table 7", "Counter 2", "Desk 3") |
| Feedback | id, organization, table, rating (1-5), optional comment, optional contact details, created at |

## Non-functional requirements, security and privacy

The guest experience must stay public and frictionless, while everything on the admin and manager side is locked to the right organization.

- **Guest access:** guest pages never require login. Contact details are always optional, and "I don't want to share my contact" always leads to the AI drafter.
- **Mobile-first:** the guest rating and drafter pages must work well on a phone.
- **Server-side validation:** every submission is validated with Zod (rating is an integer 1-5; the spot belongs to the organization; manager email is valid; custom labels are trimmed and length-limited).
- **Authorization:** the dashboard is protected by Supabase Auth. Admins can create spots only for their own organization; managers can only view their organization's feedback.
- **Invite integrity:** a manager joins only the organization named in their invite. The organization ID is never trusted from the client when saving a membership.
- **Secrets:** the Supabase service role key and all API keys (Gemini, Brevo) stay server-side and out of any `NEXT_PUBLIC_` variable. Invites are sent only from server code.
- **QR URLs:** each QR code links to a unique, random URL; the spot is identified by the link.
- **Outbound links:** the review link opens in a new tab with `rel="noopener noreferrer"`.
- **Email deliverability:** Supabase invite emails go through Brevo SMTP, because the built-in sender has a very low rate limit.

## Technical approach and dependencies

The MVP is a single Next.js app (frontend, dashboard and API routes) on Vercel, backed by Supabase and two external services.

| Layer | Choice |
| --- | --- |
| App | Next.js, TypeScript, App Router |
| Database | Supabase PostgreSQL with Prisma (schema, migrations, type-safe queries) |
| Auth | Supabase Auth; managers join by email invite |
| AI | Google Gemini API (`@google/genai`) for review drafts |
| Email | Brevo API for manager alerts |
| QR codes | `qrcode` npm package |
| Validation | Zod |
| Data fetching | `@tanstack/react-query` (dashboard) |
| Deployment | Vercel |

**Manager invite flow**

1. The server calls `inviteUserByEmail` with the organization ID and role `manager`, redirecting to `/accept-invite`.
2. The invite link hits `/auth/confirm`, which verifies the token (`verifyOtp`) and redirects to `/accept-invite`.
3. The manager chooses a password (`updateUser`) and is sent to the dashboard.
4. Membership (user, organization, role `manager`) is saved by a database trigger or on first dashboard load, using the organization ID from the invite.
5. Fallback if time runs short: sign managers in with a magic link instead of a password.

**Server-side environment variables:** Supabase URL, anon key, database URLs, service role key, Gemini API key, Brevo API key and sender email.

## Risks, assumptions and open questions

The biggest delivery risk is the manager invite flow, and the biggest product questions are about abuse, privacy and alert reliability on the public guest pages.

**Risks**

| Risk | Mitigation |
| --- | --- |
| Supabase's built-in email sender has a very low rate limit, so invites may fail | Connect Brevo SMTP in Supabase settings and test the full invite flow before the demo |
| Invite flow takes longer than planned | Fall back to magic-link sign-in for managers |
| Guests skip the review link or don't post | The draft is copy-paste ready; the link is optional and the guest always posts themselves |
| A custom label or spot name breaks alert emails, QR captions or the dashboard | Always render the organization's label dynamically; validate custom labels with Zod |

**Assumptions**

- Guests are on a phone with a camera that can scan QR codes.
- Each organization has one admin; the optional manager is the only other signed-in user in the MVP.
- Guest contact details are optional free-form input.

**Open questions** (proposed by this PRD, not covered in the README)

- What numeric targets should the success metrics use?
- How are the public rating and drafter endpoints protected against spam or repeated submissions?
- How long are guest contact details kept, and who can see them besides the manager and admin?
- What happens if the alert email fails to send: retry, log, or surface in the dashboard?
- Can an admin change the label type or add spots after onboarding, given the 50-spot cap?
- Can one guest rate the same spot more than once in a visit?

## Demo plan

The MVP is demonstrated in a two-minute script that shows the low-rating alert and the AI drafter end to end. No release dates are set yet.

1. **Problem:** guests leave unhappy and managers find out too late.
2. **Onboarding:** log in as admin, enter the organization name, choose Restaurant, pick the label type (Table, or a custom one), enter 10 spots, add a manager's email, and show the labeled QR codes.
3. **Scan:** open the QR code for Table 5 on a phone.
4. **Low rating:** tap 1 star, show the sorry message and contact option, then show the manager's email arriving and naming Table 5.
5. **AI review:** continue to the drafter, generate a draft, edit and copy it, then tap "Post your review" to jump to the restaurant's Google Maps page.
6. **Good rating:** scan Table 2, give 5 stars, and show it going straight to the AI drafter.
7. **Dashboard:** sign in as the manager and show the feedback list.
8. **Future:** chains, AI insights, multilingual support.
