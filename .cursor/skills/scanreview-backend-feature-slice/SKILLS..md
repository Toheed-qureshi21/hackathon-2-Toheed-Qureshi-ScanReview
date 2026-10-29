---
name: scanreview-backend-feature-slice
description: Implement and integrate one approved ScanReview feature end to end, from server validation and Route Handler through tests, Axios/React Query, and UI.
---

# ScanReview feature-by-feature integration

Use only after the user explicitly approves backend integration and names the feature slice. Follow `backend/tasks.md` and `backend/folder-structure.md`.

## Before coding

1. Read the root `AGENTS.md`, `.cursor/rules/ui-first.mdc`, PRD, TRD, frontend design/tasks, relevant screen/components, and current mock data.
2. Confirm the feature's API contract, schema/migration need, auth rules, expected UI behavior, error states, and tests.
3. If a necessary product/security decision is unresolved, report it and ask instead of guessing.
4. Limit edits to the approved feature and necessary shared foundation.

## Required implementation sequence

1. Add/adjust Prisma schema and migration only if required and approved; verify Prisma 7 setup first.
2. Add Zod schemas for all untrusted request input. Client validation does not replace server validation.
3. Add or reuse server-side authentication and organization membership/role authorization.
4. Put domain logic/database access in a server-only service.
5. Implement a thin `app/api/**/route.ts` Route Handler; no Server Actions.
6. Return the documented normalized API response envelope and safe DTOs.
7. Add unit/integration tests, especially unauthorized and cross-organization attempts.
8. Add/update feature-specific Axios function and React Query hook if the feature is dashboard/authenticated data. Public guest routes still use a client API function if that is the existing convention.
9. Integrate the corresponding UI and replace only the mock behavior for this slice. Preserve mocks for unrelated unfinished features.
10. Run relevant tests, lint/typecheck/build where available; update only verified checkboxes in `backend/tasks.md` and `docs/frontend/tasks.md`.

## No-RLS requirement

Do not use or rely on PostgreSQL RLS. For every protected endpoint, verify identity and check membership/role from trusted database state before performing any organization-scoped read or mutation. Do not rely on Proxy, UI visibility, client-supplied organization IDs, or client-supplied roles. Include direct API authorization tests.

## Completion report

Report feature scope, files changed, endpoint contract, authorization performed, tests and results, mock behavior replaced, mock behavior remaining, and unresolved limitations. Do not move to the next slice without user direction unless explicitly asked to continue.