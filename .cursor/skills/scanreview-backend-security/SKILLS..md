---
name: scanreview-backend-security
description: Review ScanReview Route Handlers and integrations for server-side validation, authorization, privacy, public-token abuse, invitation integrity, and secret handling without RLS.
---

# ScanReview backend security review

## Mandatory architecture assumption

ScanReview will not use PostgreSQL RLS. Authorization must be enforced by server-side Route Handlers and server-only helpers/services. Treat every missed server authorization check as a serious vulnerability. Do not add RLS policies or claim RLS protects a query.

## Review each Route Handler

- Validate path params, query params, and request body with Zod. Bound string lengths, arrays, pagination, and payload size.
- For protected routes, verify the Supabase Auth session server-side, then load membership from the database and check organization and role before reading or mutating data.
- Never trust client-supplied `userId`, `organizationId`, `role`, recipient email, or spot ownership. Derive organization scope from verified identity/membership, or validate a public token/invitation server-side.
- Ensure managers cannot create spots or edit settings; admins are scoped to their own organization; managers cannot view another organization's feedback.
- Test requests made directly to the API, not only through the UI. Include no-session, wrong-role, wrong-organization, tampered ID, missing membership, and malformed input cases.

## Public QR and guest endpoints

- Public QR tokens must be cryptographically random and opaque; never use sequential database IDs as the public token.
- Return only necessary public organization/spot display fields.
- Validate rating 1–5 as an integer; bound comments and optional contact fields.
- Add the approved rate-limit and duplicate-submission policy; do not invent one without documenting the decision.
- Ensure guest endpoints cannot read other feedback or arbitrary organization details.

## Integrations and privacy

- Keep Prisma, Supabase admin/service-role client, Brevo and Gemini code server-only. No secret in `NEXT_PUBLIC_*`, client bundles, logs or error responses.
- Resolve alert recipients from trusted organization settings/membership, not request input. Send alert only for ratings 1–2. Handle email failure separately from feedback persistence.
- Treat guest comments as untrusted prompt content. Bound AI input/output, handle provider errors and never automatically publish a review.
- Do not expose guest contact details to public responses or unnecessary logs. Apply only the retention/access behavior approved for the product.
- Validate outbound review URLs as HTTPS and use `rel="noopener noreferrer"` in the UI.

## Report

For each finding, state severity, file/route, exploit scenario, required fix, and test that proves the fix. Distinguish verified vulnerabilities from risks that cannot be confirmed from available code.