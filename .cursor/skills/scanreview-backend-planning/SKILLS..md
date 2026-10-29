---
name: scanreview-backend-planning
description: Audit ScanReview's backend architecture, map frontend mocks to API contracts, and plan safe feature-by-feature integration before implementation.
---

# ScanReview backend planning

Use this skill for read-only repository audits, architecture proposals, API contract design, and sequencing.

## Required reading

Read `AGENTS.md`, `.cursor/rules/ui-first.mdc`, `docs/prd.md`, `docs/trd.md`, `docs/frontend/design.md`, `docs/frontend/tasks.md`, `backend/tasks.md`, and `backend/folder-structure.md`. Inspect actual source files and installed package versions. Do not assume a file, route, dependency or configuration exists because it appears in a plan.

## Security and data access policy

- PostgreSQL RLS will not be used. Do not propose or add RLS policies.
- Every protected API endpoint must authenticate the Supabase user and authorize the operation in server-side code using trusted database membership/role.
- Every request body, route parameter, and query parameter must be validated on the server with Zod.
- Prisma and privileged Supabase operations are server-only. Never trust client-supplied organization IDs or roles.

## Workflow

1. Inspect repository state, app routes, mock data, package scripts, lockfile, Prisma 7 configuration/adapter, Supabase setup, test tooling and environment variable names. Never print secret values.
2. Map existing UI features to mock data and the APIs required to replace those mocks.
3. Propose schema, constraints/indexes, response envelope, endpoint contracts, authorization matrix, and file placement.
4. Identify PRD/TRD conflicts and open product/security decisions. In particular, do not silently resolve the conflict between the PRD's guest route shape and its unique random QR token requirement.
5. Recommend the smallest shared foundation and the next vertical slice.
6. Produce a report and stop for approval.

## Do not

- Do not implement migrations, Route Handlers, auth, database writes, Brevo, or Gemini during an audit-only task.
- Do not replace `docs/frontend/tasks.md` with backend tasks.
- Do not modify PRD/TRD/reference assets unless explicitly asked.
- Do not claim architecture or integration tests passed unless actually run.