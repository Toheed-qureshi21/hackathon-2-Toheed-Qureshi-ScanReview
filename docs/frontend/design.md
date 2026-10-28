# ScanReview — Design Guidelines

**Purpose:** Define the UI implementation rules for ScanReview using the existing HTML prototypes and branding kit.  
**Status:** Reference and implementation guide for the UI-first phase.  
**Source of truth:** The original HTML files and branding kit in the external `scanreview-design/` directory.

## 1. Design sources and priority

Use these sources for different purposes:

1. **Product scope:** `docs/prd.md` defines users, features, routes, flows, and acceptance criteria.
2. **Technical constraints:** `docs/trd.md` defines the stack and architecture.
3. **Page layout and behavior:** The original HTML prototypes define the intended page structure, content, hierarchy, and interaction states.
4. **Visual identity:** The ScanReview branding kit defines the logo treatment, palette, typography, surfaces, and overall visual direction.
5. **Implementation conventions:** `AGENTS.md` and `.cursor/rules/ui-first.mdc` define how work should be carried out.

Do not infer a page layout from the branding board. Do not replace the HTML prototypes with an invented design. If a reference cannot be accessed or a visual detail is ambiguous, ask for the path or document the uncertainty instead of guessing.

## 2. UI-first implementation boundary

During the current UI phase:
- Build layouts, reusable UI components, responsive behavior, accessibility, and local interactions.
- Use typed mock data and local state for demonstrations.
- Keep mock data isolated from production service modules.
- Do not connect real authentication, database persistence, API mutations, email delivery, or Gemini generation unless explicitly approved.
- Do not use Server Actions. Backend work will be implemented separately using Next.js Route Handlers.
- Never present simulated behavior as proof that data was saved or a real email was delivered.

## 3. Brand identity

The ScanReview branding kit is authoritative for exact brand styling. Inspect the supplied asset before implementing or changing tokens.

The existing project brief describes the brand as:
- Product name: **ScanReview**
- Tagline: **“Hear about a bad meal before the guest leaves.”**
- Mark concept: star within a rounded square.

Use the actual supplied logo/brand asset as reference. Do not redraw or substitute the mark without a specific need.

### 3.1 Colors and theme tokens

The existing design specification describes three palettes. Verify each against the actual branding asset and HTML references before applying it. Do not invent additional theme modes.

**Light theme**
- Background: `#F5F6FB`
- Surface: `#FFFFFF`
- Primary text: `#12142B`
- Muted text: `#5A5F7A`
- Border: `#DFE2F0`
- Accent: `#3A3FE0`
- Accent soft: `#E9EAFF`
- Danger: `#B4232C`
- Star: `#F4A300`

**Dark theme**
- Background: `#0D0F1F`
- Surface: `#171A30`
- Primary text: `#EEF0FF`
- Muted text: `#9AA0C4`
- Border: `#2A2F52`
- Accent: `#8F93FF`
- Accent soft: `#23274A`
- Danger: `#FF8A8F`
- Star: `#FFC233`

**Natural theme**
- Background: `#E6EADB`
- Surface: `#F4F6EE`
- Primary text: `#25301F`
- Muted text: `#5F6B54`
- Border: `#CCD4BC`
- Accent: `#2F6B3C`
- Accent soft: `#D5E2C7`
- Danger: `#9C3A24`
- Star: `#D98E04`

Use only the themes that are actually represented in the supplied brand kit. If the image or HTML references disagree with these values, inspect the original sources and report the discrepancy before changing the tokens.

### 3.2 Typography

The existing brand specification identifies:
- Headings: **Bricolage Grotesque**, weights 700 and 800.
- Body: system UI sans-serif stack.

Verify the font names, weights, and usage in the actual HTML/CSS references. Load fonts through the existing project's approved font mechanism, and avoid unnecessary external requests if the font is already bundled or configured.

Use a consistent hierarchy for display headings, page headings, section headings, body text, helper text, labels, and metadata. Preserve the hierarchy shown in each HTML prototype rather than imposing the same layout on every page.

### 3.3 Shape, surfaces, and visual treatment

Use the branding kit and HTML references to determine:
- Border thickness and color.
- Corner radii.
- Surface elevation and shadows.
- Input and button heights.
- Spacing scale and content width.
- Icon size and stroke weight.
- Hover, pressed, selected, disabled, focus, and error treatments.

Do not guess numeric values when they are visible in the reference. Extract and centralize them when practical.

## 4. Global styling rules

- Centralize design tokens in the existing global stylesheet, typically `app/globals.css`, using CSS custom properties and the installed Tailwind/shadcn theme conventions.
- Use semantic tokens for background, foreground, card, popover, muted, border, input, ring, primary, secondary, accent, and destructive states.
- Add named ScanReview tokens only where the standard semantic tokens do not express the brand requirement.
- Components should consume tokens instead of scattering raw hex values.
- Prefer Tailwind utilities and reusable project classes for layout and variants.
- Use the project's `cn()` helper for conditional class composition if available.
- Avoid repeated arbitrary values, duplicated class strings, and large inline style objects.
- Do not introduce a new styling framework or replace the current Tailwind setup without approval.
- Preserve existing responsive breakpoints unless the reference or current project requires a justified adjustment.

## 5. shadcn/ui component rules

Use shadcn/ui primitives when they suit the UI, including:
- Button, Input, Label, Textarea, Select, Checkbox, RadioGroup.
- Card, Badge, Separator, Skeleton, Table.
- Dialog, AlertDialog, Sheet, DropdownMenu, Popover.
- Toast/Sonner and other components already installed in the project.

Rules:
- Reuse and compose accessible primitives instead of recreating standard controls.
- Apply ScanReview tokens and classes to make components match the reference.
- Do not accept generic shadcn defaults when they conflict with the supplied design.
- Do not install every available component pre-emptively; add only what the current UI needs.
- Preserve semantic HTML, accessible names, keyboard operation, visible focus, and correct disabled states.
- Use the icon package already installed. The references call for Lucide-style icons; use the existing package rather than adding another icon library.

## 6. Page-by-page reference mapping

Inspect each corresponding HTML file before implementing the route.

| Reference file | Intended UI |
|---|---|
| `index.html` | Marketing landing page and hero/demo animation |
| `login.html` | Login/authentication screen |
| `onboarding.html` | Organization setup, label type, spot count, review URL, alert recipient, QR setup flow |
| `dashboard.html` | Dashboard, feedback list, and QR management as represented by the reference |
| `feedback.html` | Public guest rating and low-rating recovery states |
| `review.html` | Editable AI-assisted review draft experience |
| `accept-invite.html` | Manager invitation acceptance and password setup |

Use the PRD to resolve product requirements and the HTML prototype to resolve the specific visual layout. If the PRD requires a behavior not visible in the HTML, add it in a way that minimally disrupts the referenced design and note the deviation.

## 7. Page-specific interaction guidance

Preserve interactions demonstrated in the references, including where applicable:
- Navigation links and mobile navigation.
- Hero demonstration and motion.
- Star hover, selection, and selected-rating feedback.
- Conditional low-rating apology/contact form.
- “I don't want to share my contact” path.
- Review draft loading/reveal state and editable text.
- Copy-to-clipboard feedback.
- Conditional “Post your review” button when a review URL exists.
- Onboarding conditional manager fields.
- QR selection, detail view, print/download affordances.
- Dashboard filters, menus, dialogs, toasts, and drawers.

During the UI-only phase, these interactions should use local state and mock data. Do not call real external services. If a feature cannot be simulated honestly, provide a clear demo state rather than implying the real operation succeeded.

## 8. Component design principles

- Prefer small, focused components with clear responsibilities.
- Extract reusable components when they appear across multiple pages or have independent interaction logic.
- Keep page-specific layout in page-level components; avoid a universal component that forces unrelated screens into the same structure.
- Keep mock data separate from presentation components.
- Define typed props and stable interfaces for components that will later receive API data.
- Keep interactive state close to the component that owns it unless multiple components genuinely need to share it.
- Avoid unnecessary global state and avoid introducing a state-management library without a demonstrated need.
- Use consistent naming that matches the existing repository conventions.

Potential shared UI elements, subject to actual reference inspection:
- Site navigation and page containers.
- Form field wrappers and validation messages.
- Primary/secondary buttons.
- Rating stars and rating summary.
- Spot label and QR preview.
- Feedback list item/card.
- Dialog/sheet patterns.
- Empty, loading, error, and success states.

## 9. React rendering boundaries

- Prefer React Server Components for page shells, static content, and non-interactive layout.
- Use Client Components only for browser state, event handlers, effects, clipboard/print interactions, dialogs, and other client-only behavior.
- Put `"use client"` on the smallest practical component boundary.
- Do not turn an entire page into a Client Component just to support one widget.
- Pass serializable props from Server Components to Client Components.
- Do not access Prisma, privileged Supabase clients, secrets, or server-only integrations from Client Components.
- Use `proxy.ts`, not legacy `middleware.ts`, if request interception is later required.
- Treat Next.js `cookies()` as asynchronous and use `await cookies()` in server contexts. Real auth integration remains outside the UI-only phase.

## 10. Responsive design and accessibility

- Use mobile-first layouts, especially for guest feedback and review drafting.
- Match the mobile and desktop structures shown in the original prototypes.
- Ensure forms fit narrow viewports without horizontal overflow.
- Ensure dashboard tables/lists remain usable on smaller screens.
- Provide visible focus indicators and keyboard navigation for interactive controls.
- Give rating stars clear accessible names and keyboard interaction; do not rely on color alone.
- Use semantic form labels and associate errors with the relevant fields.
- Maintain readable contrast using the actual theme tokens.
- Support reduced motion for non-essential animations.
- Ensure dialogs/sheets manage focus correctly and can be dismissed with expected keyboard controls.
- Use clear text in addition to color to communicate errors and status.

## 11. Mock data and UI states

During UI development, provide states appropriate to each page:
- Initial/default state.
- Hover/focus/selected state where relevant.
- Disabled and pending state.
- Empty state.
- Error state.
- Success state.
- Responsive state.

Mock records should be plausible and typed. Keep them in a dedicated mock module and avoid coupling them to production services. Avoid hardcoding the same sample data in multiple components.

Do not claim mock actions have persisted to a database, sent an email, created a real invitation, or called Gemini. Label simulated behavior where needed.

## 12. Visual QA checklist

Before marking a page complete:
- Compare it side by side with its original HTML prototype.
- Confirm correct content, hierarchy, layout, spacing, colors, typography, borders, radii, and icons.
- Check mobile and desktop widths.
- Exercise the primary interaction paths and conditional states.
- Verify hover, focus, disabled, loading, error, and success treatments as applicable.
- Check keyboard navigation and accessible names.
- Check browser console for avoidable errors.
- Confirm the page uses global tokens and shared components instead of duplicated styles.
- Confirm no original reference files were modified.
- Record any intentional deviations from the reference.
- Update `docs/frontend/tasks.md` only after verification.

## 13. Out of scope for this document's current phase

This design guide does not authorize implementation of:
- Prisma schema or migrations.
- Real Supabase Auth, session handling, or organization membership.
- Backend Route Handler business logic.
- Real Brevo email delivery.
- Real Gemini requests.
- Production QR token creation or persistent QR records.
- Real server-state fetching or mutation integration.

These belong to the separate backend phase defined by the TRD. Do not use Server Actions. When backend work begins, connect the UI to Route Handlers with Axios and React Query according to `docs/trd.md`, updating React Query cache directly from mutation responses whenever safe.


# ScanReview Design References

This directory contains the original HTML prototypes and branding
assets used to implement ScanReview.

These files are visual references. Keep the original prototypes and
branding assets unchanged while implementing the application.

## Screen References

| File | Screen |
|---|---|
| `index.html` | Landing page and hero animation |
| `login.html` | Login/authentication |
| `onboarding.html` | Business onboarding |
| `dashboard.html` | Dashboard and QR management |
| `feedback.html` | Guest feedback |
| `review.html` | Review draft |
| `accept-invite.html` | Team invitation and password setup |

## Branding Asset

Use the branding kit image in this directory to verify the logo,
brand identity, colors, and other visual decisions.

Check the actual image filename in this directory before referencing
it. Do not rename, replace, or modify the original asset as part of
normal UI implementation.

## How to Use These References

1. Read `docs/frontend/design.md` in the application repository.
2. Open the HTML prototype matching the screen being implemented.
3. Inspect the branding kit.
4. Reproduce the intended layout, typography, colors, spacing,
   responsive behavior, and interactions in the application.
5. Use the existing design tokens and shadcn/ui components.
6. Keep all original HTML and branding assets unchanged.

The application repository's `docs/frontend/design.md` is the detailed
implementation guide. This file is only an index to the original
references.

