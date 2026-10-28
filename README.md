# ScanReview

**QR-based restaurant feedback and reputation management.**

Guests scan a QR code at their table and rate their experience. If the rating is low, the manager is alerted instantly with the table number, so the problem can be fixed before the guest leaves. Every guest, whatever their rating, can turn their experience into a ready-to-post public review with AI.

---

## The Problem

- **Delayed feedback:** Guests leave without telling staff about a bad experience, so managers lose the chance to fix it.
- **Slow response:** Managers find out about complaints too late (poor service, long waits, food quality).
- **Hard-to-write reviews:** Guests who want to leave a public review struggle to describe their experience clearly.

## The Solution

| Feature | What it does |
|---|---|
| **Admin onboarding** | After signing in, the admin enters the organization name, business type (e.g. Restaurant), what to call their spots (Table, Counter, Desk, or a custom label), and how many they have. Optionally, they add a public review link (e.g. their Google Maps page) and choose who receives alerts: themselves or a manager they invite. |
| **Spot-specific QR codes** | The app generates one unique QR code per spot (up to 50 for now) and shows each with its label underneath ("Table 1", "Counter 2", "Desk 3", ...). |
| **Public guest page** | Each QR code opens a mobile-friendly page for that table. Guests rate with stars. No login. |
| **Low-rating recovery** | On a low rating, the guest sees a sorry message and can optionally share contact details on the same page. |
| **Instant manager alerts** | A 1-2 star rating emails the manager (or the admin, if they didn't add one) with the restaurant, table number, rating, and comment where available. |
| **AI review drafter** | Every guest, whatever the rating, reaches a page that turns their experience into an editable review draft. They copy it, and if the admin added a review link, a button takes them straight to that page to paste it. |
| **Manager invite** | The admin can add a manager during onboarding. The manager gets an email invite, signs in, and sees their restaurant's feedback. |
| **Dashboard** | Admin and manager sign in to see feedback with rating, table, and timestamp. |

## User Flows

### Admin / manager (one-time setup)

1. Admin signs up or logs in.
2. **Onboarding page** asks for:
   - Organization name
   - Type of business (e.g. Restaurant)
   - **Label type**: what the spots are called. Pick from preset categories (Table, Counter, Desk, ...) or choose **Custom** and type your own (e.g. "Booth", "Room")
   - Number of spots (e.g. 30)
   - **Public review link (optional):** the URL where guests should post public reviews, such as the restaurant's Google Maps review page. Can be skipped.
   - **Who gets the alerts:** "Just me" (alerts go to the admin's email) or "A manager I'll invite" (manager's name and email).
3. The app creates that many spots and shows **30 QR codes**, each with its name below it, built from the chosen label (Table 1, Table 2, ... Table 30, or Counter 1, Desk 1, and so on).
4. **Limit:** a maximum of **50** QR codes for now. Reject anything above 50 with a clear message.
5. Admin prints the QR codes and places one on each table.
6. If a manager was added, they get an email invite and set their own password:
   1. The server sends the invite (`inviteUserByEmail`) with the organization ID and role `manager`.
   2. The manager clicks the link in the email and is verified and signed in.
   3. They land on `/accept-invite` and choose a password.
   4. They are sent to the dashboard for that organization. Later they sign in at `/login` with email and password.

### Guest (public, no login)

1. Guest scans the QR code on their table and lands on the public feedback page for that table.
2. Guest picks a star rating (1-5).
3. **Good rating (3-5 stars):** guest is redirected to the **AI review drafter page**.
4. **Low rating (1-2 stars):**
   - The same page shows a **sorry message** and asks for contact details (optional).
   - Guest either submits contact details, or clicks **"I don't want to share my contact"**.
   - Either way, the guest is then redirected to the **AI review drafter page**.
5. **AI review drafter page:** the guest adds optional comments, generates a draft with Gemini, edits it, and copies it.
6. **Post the review (only if the admin added a review link):** a "Post your review" button opens the organization's public review page in a new tab, so the guest can paste and submit the draft themselves. If no link was added, the guest just copies the draft and posts it wherever they prefer.

### Manager alert

- For ratings of 1-2 stars, the manager gets an email right away (or the admin, if no manager was added) naming the restaurant and **the exact spot** (e.g. "Table 5" or "Counter 2"), so staff can go there while the guest is still present.

## Tech Stack

- **App:** Next.js with TypeScript and App Router (frontend, dashboard, and API routes in one app)
- **Database:** Supabase PostgreSQL
- **ORM:** Prisma (schema, migrations, type-safe queries)
- **Auth:** Supabase Auth (admin and manager sign-in; managers join by email invite)
- **AI:** Google Gemini API (`@google/genai`) for review drafts
- **Email:** Brevo API for manager alerts
- **QR codes:** `qrcode` npm package
- **Validation:** Zod
- **Data fetching:** `@tanstack/react-query` (dashboard)
- **Deployment:** Vercel

## MVP Scope (what we are building now)

- [ ] Admin login with an onboarding page (organization name, business type, label type, number of spots)
- [ ] Add a manager in onboarding ("Just me" or the manager's email), sent as an email invite
- [ ] Accept-invite page where the manager sets a password, then goes to the dashboard
- [ ] Optional public review link field in onboarding (e.g. Google Maps), validated as a URL
- [ ] "Post your review" button on the AI drafter page that opens the review link, shown only when a link exists
- [ ] Label type picker with preset categories (Table, Counter, Desk, ...) and a custom label option
- [ ] Generate and display one labeled QR code per spot, maximum 50
- [ ] Public guest feedback page per table (star rating, no login)
- [ ] Good rating: redirect to the AI review drafter page
- [ ] Low rating: sorry message, optional contact details on the same page, "I don't want to share my contact" option, then redirect to the AI review drafter page
- [ ] Validate and store: organization, table, rating, optional comment, optional contact details, timestamp
- [ ] Email alert to the manager on 1-2 star ratings (restaurant name, table number, rating, comment)
- [ ] AI-assisted editable review draft for any rating (guest copies and pastes it themselves)
- [ ] Manager dashboard behind Supabase Auth (rating, table, timestamp)

## Out of Scope (future)

- Multi-location restaurant chains with centralized reporting
- AI insights: recurring complaints, sentiment trends, recommendations
- Multi-tenant architecture with role-based access (owners, branch managers, staff)
- Multilingual feedback and cross-language summaries
- More than 50 QR codes per organization
- Business types beyond restaurants (label types like Desk are already supported, but the product is built and demoed for restaurants)

## Data Model (high level)

- **Organization:** id, name, business type, label type (preset or custom text), optional public review URL
- **Member:** user, organization, role (`admin` or `manager`), alert email
- **Table** (a spot, whatever the label type): id (random UUID), organization, number, display name (e.g. "Table 7", "Counter 2", "Desk 3")
- **Feedback:** id, organization, table, rating (1-5), optional comment, optional contact details, created at

## Routes (draft)

| Route | Who | Purpose |
|---|---|---|
| `/login` | Admin | Sign in |
| `/auth/confirm` | Manager | Verifies the invite link token, then redirects to `/accept-invite` |
| `/accept-invite` | Manager | Set a password after the email invite (reuse the login layout) |
| `/onboarding` | Admin | Org name, business type, label type, number of spots, review link, manager |
| `/dashboard` | Admin | QR codes and feedback list |
| `/feedback/[orgId]/[tableId]` | Guest (public) | Star rating, plus sorry message and contact form for low ratings |
| `/feedback/[orgId]/[tableId]/review` | Guest (public) | AI review drafter |

## Environment Variables

Server-side only, set locally in `.env.local` and in Vercel:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
DATABASE_URL=
DIRECT_URL=
SUPABASE_SERVICE_ROLE_KEY=   # server only, used to send manager invites

# Google Gemini
GEMINI_API_KEY=

# Brevo
BREVO_API_KEY=
BREVO_SENDER_EMAIL=
```

## Manager Invite Setup

How a manager gets their password (Supabase Auth):

1. **Send the invite** from a server route or server action only: `supabase.auth.admin.inviteUserByEmail(managerEmail, { data: { organization_id, role: 'manager' }, redirectTo: '<site>/accept-invite' })`.
2. **Confirm route:** add `/auth/confirm`, which calls `verifyOtp({ token_hash, type: 'invite' })` and then redirects to `/accept-invite`. In the Supabase dashboard, point the invite email template link at this route.
3. **Accept-invite page:** the manager enters and confirms a password, which calls `supabase.auth.updateUser({ password })`, then redirects to the dashboard.
4. **Membership:** save the manager's membership (user, organization, role `manager`), either with a database trigger or on first dashboard load, using the `organization_id` from the invite.
5. **Email delivery:** connect Brevo SMTP in the Supabase settings, because the built-in email sender has a very low rate limit. Test the full invite flow before the demo.
6. **Fallback:** if time runs short, sign managers in with a magic link instead of a password.

## Getting Started

```bash
# install dependencies
npm install

# set up the database
npx prisma migrate dev

# run locally
npm run dev
```

Then open http://localhost:3000.

## Dependencies

`@supabase/supabase-js`, `@supabase/ssr`, `prisma`, `@prisma/client`, `zod`, `qrcode`, `@google/genai`, `@tanstack/react-query`, `axios` (optional, native `fetch` also works for Brevo)

## Demo Script (2 minutes)

1. **Problem:** guests leave unhappy, managers find out too late.
2. **Onboarding:** log in as admin, enter the organization name, choose Restaurant, pick the label type (Table, or try a custom one), enter 10 spots, add a manager's email, and show the labeled QR codes.
3. **Scan:** open the QR for Table 5 on a phone.
4. **Low rating:** tap 1 star, show the sorry message and contact option, then show the manager's email arriving naming Table 5.
5. **AI review:** continue to the drafter, generate a draft, edit it, copy it, then tap "Post your review" to jump to the restaurant's Google Maps page.
6. **Good rating:** scan Table 2, give 5 stars, and show it goes straight to the AI drafter.
7. **Dashboard:** sign in as the manager and show the feedback list.
8. **Future:** chains, AI insights, multilingual support.

## Notes for Contributors and AI Agents

- Only signed-in admins can create spots and QR codes, only for their own organization, and never more than 50.
- Each QR code links to a unique, random URL for that spot. The spot is identified by the link, so guests never type a table number.
- Labels are dynamic. Never hardcode the word "Table" in the UI, QR captions, alert emails, or dashboard: always use the organization's chosen label (e.g. "Counter 2 at Cafe X gave 1 star"). Custom labels must be validated (Zod): trimmed, non-empty, and a short maximum length.
- Customer pages are public. Never require login. Guest contact details are always optional, and the "I don't want to share my contact" button must always lead to the AI drafter page.
- There are two roles. **Admin** (the person who created the organization) can edit settings, create spots, and add a manager. **Manager** (invited by email) can sign in, view that organization's feedback, and receive low-rating alerts, but cannot create spots or change settings. Full role-based access stays in future scope.
- The Supabase service role key must never reach the browser. Send invites only from server code, and keep the key out of any `NEXT_PUBLIC_` variable.
- A manager can only join the organization named in their invite. Never trust an organization ID sent from the client when saving a membership.
- Alerts go to the manager's email. If the admin chose "Just me" in onboarding, they go to the admin's email. Validate the manager email with Zod.
- The manager dashboard must be protected by Supabase Auth, and managers may only see their own organization's feedback.
- Validate every submission server-side with Zod (rating must be an integer 1-5, table must belong to the organization).
- The email alert fires only for ratings of 1-2.
- The public review link is optional. Validate it server-side with Zod as a well-formed `https://` URL, store it on the organization, and only show the "Post your review" button when it exists. Open it in a new tab with `rel="noopener noreferrer"`. We only send the guest there; they paste and post the review themselves.
- The AI drafter works for any rating, is based on the guest's own rating and comment, and the guest posts the review themselves. We never post for them.
- Keep API keys server-side only.

<!-- Screens we have
1. Landing page
2. Login / signup page
3. Onboarding

For guests:
4. Rating page: the star rating. On a 1-2 star rating, the same page shows the sorry message, the optional contact form, and the "I don't want to share my contact" button, so it's one screen with two states.
5. AI review drafter page: optional comment, generate the draft, edit it, copy it, and the "Post your review" button if the admin added a review link.
6. Accept invite page: the manager chooses a password after clicking the email invite (reuse the login layout).
-->

