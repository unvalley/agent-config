---
name: design-review
description: Review and guide UI and UX for visual hierarchy, layout, spacing, typography, color, accessibility, interaction states, and content clarity. Use when the user asks for a design critique, UI or UX review, landing-page or interface design guidance, accessibility audit, visual-polish assessment, or feedback on a component, mockup, CSS, or Tailwind implementation.
---

# Design Review

Critique like a senior product designer who also ships code. Be opinionated and
specific. Tie every note to a principle and a concrete fix, not taste alone.
Distinguish blocking issues (broken, inaccessible) from polish (taste, delight).

## Workflow

1. If there is a running UI, look at it (screenshot or browser) before reading
   code. Judge what the user sees first.
2. Evaluate at multiple breakpoints (mobile + desktop) and in both light/dark if
   themed.
3. Group findings: accessibility/correctness > hierarchy/clarity > polish.
4. Keep the worktree read-only unless the user also asks to implement the fixes.

## What to check

### Visual hierarchy
- The primary action and key information should win attention. One clear focal
  point per view; secondary actions visually subordinate.
- Size, weight, color, and spacing should encode importance consistently.

### Layout & spacing
- Spacing comes from a scale (4/8px or the design system's tokens), not arbitrary
  values. Consistent rhythm between related elements; more space between groups.
- Alignment to a grid; avoid optical misalignment. Respect max line lengths
  (~60-75ch for body text).

### Typography
- A small, deliberate type scale. Limit families and weights.
- Line-height ~1.4-1.6 for body; tighter for headings. Sufficient contrast
  between heading and body sizes.

### Color & contrast
- Color choices come from tokens, not one-off hex. Semantic colors (success,
  danger) used consistently.
- Text/background contrast meets WCAG AA (4.5:1 body, 3:1 large/UI). Never rely
  on color alone to convey meaning.

### Accessibility (blocking)
- Semantic HTML (`button`, `nav`, `label`); ARIA only to fill real gaps.
- All interactive elements are keyboard reachable with a visible focus ring.
- Form inputs have associated labels; images have alt text; icons-only buttons
  have accessible names.
- Respects `prefers-reduced-motion`; tap targets >= 44x44px.

### Interaction & states
- Every interactive element has hover, focus, active, and disabled states.
- Loading, empty, and error states are designed, not afterthoughts.
- Transitions are fast (~150-250ms) and purposeful; easing feels natural.
- Optimistic feedback for user actions; no dead-feeling clicks.

### Content
- Microcopy is concise and human. Buttons name the action ("Save changes", not
  "Submit"). Error messages explain what happened and what to do.

### Section labels
- Do not add decorative eyebrow or kicker labels above every section heading.
  They repeat the heading and make the page feel template-driven.
- Remove labels such as "Features", "Pricing", "Explore", or uppercase slogans
  when the heading already identifies the section.
- Keep a label only when it adds unique status or category information, such as
  "Beta", "Missing since 1969", or "Early price".

## Output format

For each finding:

```
[severity] <component/screen> - <one-line problem>
principle: <the design principle at stake>
fix: <concrete change - token, value, or pattern>
```

End with: what's working well (briefly), blocking issues, then polish suggestions.
