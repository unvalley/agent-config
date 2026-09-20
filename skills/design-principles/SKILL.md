---
name: design-principles
description: Principles for designing and reviewing UI and UX - visual hierarchy, layout and spacing, typography, color and contrast, accessibility, interaction states, and content clarity. Use when building or changing an interface, a component, CSS, or Tailwind, and when asked for a design critique, UI or UX review, landing-page or interface guidance, accessibility audit, or visual-polish assessment.
---

# Design Principles

How interfaces should be built here, and what to judge them against when
reviewing. Be opinionated and specific: tie every note to a principle and a
concrete fix, not taste alone. Distinguish blocking issues (broken,
inaccessible) from polish (taste, delight).

Explicit user direction, a supplied reference, and the product's design system
all come before the defaults below. When reviewing, tie each note to a
principle above and a concrete fix, and raise what the design does not
establish as a question rather than a finding.

## Visual hierarchy

- The primary action and key information should win attention. One clear focal
  point per view; secondary actions visually subordinate.
- Size, weight, color, and spacing should encode importance consistently.

## Layout & spacing

- Spacing comes from a scale (4/8px or the design system's tokens), not
  arbitrary values. Consistent rhythm between related elements; more space
  between groups.
- Alignment to a grid; avoid optical misalignment. Respect max line lengths
  (~60-75ch for body text).

## Typography

- Use a small, deliberate type scale. Limit families and weights to those that
  create a clear, consistent hierarchy.
- Line-height ~1.4-1.6 for body; tighter for headings. Sufficient contrast
  between heading and body sizes.

## Color & contrast

- Color choices come from tokens, not one-off hex. Semantic colors (success,
  danger) used consistently.
- Text contrast meets WCAG AA (4.5:1 for normal text and 3:1 for large text);
  non-text UI components meet the applicable 3:1 requirement. Never rely on
  color alone to convey meaning.

## Accessibility (blocking)

- Semantic HTML (`button`, `nav`, `label`); ARIA only to fill real gaps.
- All interactive elements are keyboard reachable with a visible focus ring.
- Form inputs have associated labels; images have alt text; icons-only buttons
  have accessible names.
- Respect `prefers-reduced-motion`. Meet the WCAG 2.2 AA target-size minimum and
  prefer roughly 44x44px for primary touch targets where the platform allows.

## Interaction & states

- Every interactive element has hover, focus, active, and disabled states.
- Loading, empty, and error states are designed, not afterthoughts.
- Transitions are fast (~150-250ms) and purposeful; easing feels natural.
- Give immediate feedback for user actions. Use optimistic state only when the
  action is reversible or conflict-safe and failures have a recovery path.

## Content

- Microcopy is concise and human. Buttons name the action ("Save changes", not
  "Submit"). Error messages explain what happened and what to do.
- Do not use visible prose to explain what an interface is or how to read an
  otherwise self-evident UI. Make hierarchy, labels, controls, and data
  visualization communicate the product model directly.
- Treat explanatory introduction copy as design debt. Remove it unless it is
  necessary for onboarding, safety, legal consent, an irreversible
  consequence, or a genuinely unfamiliar concept that the interface cannot
  express. Content such as names, dates, artwork context, and editorial
  narrative is not explanatory UI copy; accessible names and hints may remain
  nonvisual.

## Restrained editorial and personal-site style

When the requested direction is restrained, editorial, or personal rather than
promotional:

- Avoid eyebrow or kicker labels that add no essential category or status
  information. Prefer putting necessary context in the heading, body,
  navigation, breadcrumb, or an in-content status badge.
- Avoid generated-looking CTA panels with oversized tinted cards, decorative
  strips, redundant checklists, and pill buttons. Prefer whitespace, a simple
  rule, concise copy, and one clear action.
- Treat these as style-specific defaults, not universal prohibitions. Preserve
  established brand components or a supplied reference unless the user asks to
  depart from them.
