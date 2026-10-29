ScanReview backend integration pack
This pack defines where backend files belong and how to integrate one feature at a time. It does not authorize backend implementation by itself. Keep the existing AGENTS.md, .cursor/rules/ui-first.mdc, PRD, TRD, and frontend checklist.
Included
- backend/tasks.md — phased, feature-by-feature integration checklist.
- backend/folder-structure.md — recommended source tree and file placement guide.
- backend/AGENTS.backend-addendum.md — text to merge into the existing root AGENTS.md; do not replace the whole file.
- .cursor/skills/scanreview-backend-planning/SKILL.md — audit and plan before coding.
- .cursor/skills/scanreview-backend-feature-slice/SKILL.md — integrate one feature end to end.
- .cursor/skills/scanreview-backend-security/SKILL.md — server-side validation and authorization rules, with RLS explicitly not used.
Install the files
1. Copy backend/ into the repository root, so you have backend/tasks.md and the related docs.
2. Merge the supplied .cursor/skills/ folders into the existing repository .cursor/skills/. Do not delete or overwrite unrelated skills.
3. Merge the relevant section from backend/AGENTS.backend-addendum.md into the existing root AGENTS.md; preserve your existing content.
4. Keep docs/frontend/tasks.md as the frontend checklist. Do not rename it or merge backend tasks into it.
5. Keep .cursor/rules/ui-first.mdc. When you are ready to start integration, explicitly tell Cursor that backend integration is approved and name the first feature slice.
Workflow
First run a read-only audit and settle architecture/security questions. Then implement one vertical slice at a time: schema/migration if needed, Zod validation, service, Route Handler, tests, Axios function, React Query hook, and UI integration. Verify the slice before moving to the next. Do not build the entire backend and postpone frontend integration.
No-RLS policy
This project will not use PostgreSQL Row-Level Security (RLS). All request validation and application authorization must be enforced on the server in Route Handlers and their server-only service/helper layer. Every protected request must authenticate the Supabase user and verify database-backed organization membership and role before accessing organization data. Prisma and privileged Supabase operations must never run in the browser. Never rely on UI hiding, Proxy redirects, a client-provided organization ID, or a client-provided role as security controls. Because RLS is not a backstop, endpoint-by-endpoint authorization tests are mandatory.

The no-RLS decision increases the impact of a missed authorization check. Use a server-only database connection and least-privileged credentials where practical; keep secrets out of NEXT_PUBLIC_*; never expose the service-role key.
First Cursor prompt
Read AGENTS.md, .cursor/rules/ui-first.mdc, docs/prd.md, docs/trd.md, docs/frontend/design.md, docs/frontend/tasks.md, backend/README.md, backend/folder-structure.md, and backend/tasks.md. Perform only Backend Phase 0 (read-only repository and architecture audit). Respect the no-RLS policy: propose server-side authorization for every protected endpoint. Propose schema, endpoint contracts, and a feature-slice order. Do not create migrations, API routes, auth integration, email calls, Gemini calls, or database writes. Identify conflicts and open decisions; stop for approval.