# ScanReview — Agent Instructions

## Project Overview

ScanReview is a QR-based restaurant feedback and reputation management
platform.

Tagline: "Hear about a bad meal before the guest leaves."

The application helps restaurants collect guest feedback, identify
negative experiences, manage QR codes, prepare review drafts, and
coordinate team access.

## Required Reading

Before making changes, read these files:

1. `AGENTS.md`
2. `.cursor/rules/ui-first.mdc`
3. `docs/prd.md`
4. `docs/trd.md`
5. `docs/frontend/design.md`
6. `docs/frontend/tasks.md`

Use the original HTML prototypes and branding assets in the external
sibling directory `scanreview-design/` as visual references.

If the external directory is not available in the current workspace,
ask the user to make it accessible. Do not recreate or guess its
contents.

## Source of Truth

- `docs/prd.md` defines product requirements.
- `docs/trd.md` defines technical requirements.
- `docs/frontend/design.md` defines frontend design and implementation
  guidance.
- `docs/frontend/tasks.md` tracks frontend implementation progress.
- `scanreview-design/` contains the original HTML design references
  and branding assets.

Do not silently change requirements from the PRD or TRD.

## UI-First Development Boundary

The current phase focuses on implementing the UI before integrating
the real backend.

During this phase:

- Use typed mock data isolated in `lib/mocks/`, `data/mock/`, or an
  equivalent existing project convention.
- Use local component state for interactions.
- Implement responsive layouts and accessible UI.
- Reuse existing components, dependencies, and project conventions.
- Keep mock data separate from production business logic.
- Clearly distinguish mock interactions from real operations.
- Do not display success messages that imply data was permanently
  saved or an email was actually sent when only mock state changed.

Do not implement the following unless the user explicitly approves
moving into backend integration:

- Real Supabase authentication or session handling.
- Prisma persistence or database mutations.
- Route Handler business logic or API mutations.
- Real Brevo email delivery.
- Real Gemini API calls.
- Real backend data fetching or mutations.

Do not simulate backend requests using Axios or React Query during
the UI-only phase.

## Framework and Architecture Rules

- Use Next.js 16 App Router conventions.
- Use TypeScript and preserve the repository's existing strictness.
- Prefer React Server Components.
- Add `"use client"` only to components that require client-side
  interaction, state, effects, or browser APIs.
- Keep Client Component boundaries as small as practical.
- Use Route Handlers under `app/api/**/route.ts` for backend operations
  when backend implementation is authorized.
- Do not use Server Actions for backend operations.
- Use `proxy.ts` rather than the legacy `middleware.ts` convention
  when request interception is required.
- `cookies()` is asynchronous: use `await cookies()`.
- Use existing shadcn/ui primitives and customize them with the
  ScanReview design tokens.
- Keep branding colors, typography, spacing, and theme values
  centralized in the existing design system.
- Avoid unnecessary dependencies, broad refactors, and duplicated
  components.

## Design and Visual Fidelity

Before implementing a screen:

1. Read `docs/frontend/design.md`.
2. Identify the corresponding original HTML reference.
3. Inspect the branding assets when available.
4. Follow the established design tokens and component conventions.
5. Match the reference's layout, typography, spacing, responsive
   behavior, and interactions.
6. Do not modify original reference HTML files or branding assets.

Do not introduce arbitrary brand colors or a new visual language
without explicit approval.

## Data and Interaction Rules

- Keep mock data typed and isolated.
- Use realistic but clearly mock values.
- Make visible controls functional when they are part of the task.
- Use local state for UI-only interactions.
- Do not add fake API calls.
- Do not assume an interaction succeeded on a real backend.
- Preserve existing application behavior unless the task explicitly
  requires a change.

## Task Tracking

Before starting work:

1. Read `docs/frontend/tasks.md`.
2. Identify the relevant phase and unfinished tasks.
3. Implement only the requested scope.
4. Run appropriate checks available in the project.
5. Update `docs/frontend/tasks.md` only for work actually completed.
6. Preserve unfinished checkboxes and existing acceptance criteria.

Do not mark tasks complete merely because a screen was started.

## Scope Protection

Unless explicitly requested, do not modify:

- `docs/prd.md`
- `docs/trd.md`
- Original HTML prototypes.
- Original branding assets.
- Unrelated application features.

Avoid unrelated refactors.

## Completion Report

When finishing a task, report:

- What was implemented.
- Which files were changed.
- Which checks were run and their results.
- Any unfinished work or limitations.
- Whether any behavior still uses mock data.