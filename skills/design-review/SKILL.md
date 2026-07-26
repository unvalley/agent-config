---
name: design-review
description: Review and guide UI and UX for visual hierarchy, layout, spacing, typography, color, accessibility, interaction states, and content clarity. Use when the user asks for a design critique, UI or UX review, landing-page or interface design guidance, accessibility audit, visual-polish assessment, or feedback on a component, mockup, CSS, or Tailwind implementation.
---

# Design Review

Review like a senior product designer who also ships code.
Be opinionated and specific. Tie every note to a principle and a concrete fix, not taste alone.
Distinguish blocking issues (broken, inaccessible) from polish (taste, delight).
Follow explicit user direction, a supplied reference, and the product's design
system before applying the default preferences below.

## Workflow

1. If there is a running UI, look at it (screenshot or browser) before reading code. Judge what the user sees first.
2. Evaluate the available breakpoints, themes, and interaction states. Report
   important contexts that could not be inspected instead of assuming they work.
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
- Use a small, deliberate type scale. Limit families and weights to those that
  create a clear, consistent hierarchy.
- Line-height ~1.4-1.6 for body; tighter for headings. Sufficient contrast between heading and body sizes.

### Color & contrast
- Color choices come from tokens, not one-off hex. Semantic colors (success,
  danger) used consistently.
- Text contrast meets WCAG AA (4.5:1 for normal text and 3:1 for large text);
  non-text UI components meet the applicable 3:1 requirement. Never rely on
  color alone to convey meaning.

### Accessibility (blocking)
- Semantic HTML (`button`, `nav`, `label`); ARIA only to fill real gaps.
- All interactive elements are keyboard reachable with a visible focus ring.
- Form inputs have associated labels; images have alt text; icons-only buttons
  have accessible names.
- Respect `prefers-reduced-motion`. Meet the WCAG 2.2 AA target-size minimum and
  prefer roughly 44x44px for primary touch targets where the platform allows.

### Interaction & states
- Every interactive element has hover, focus, active, and disabled states.
- Loading, empty, and error states are designed, not afterthoughts.
- Transitions are fast (~150-250ms) and purposeful; easing feels natural.
- Give immediate feedback for user actions. Use optimistic state only when the
  action is reversible or conflict-safe and failures have a recovery path.

### Content
- Microcopy is concise and human. Buttons name the action ("Save changes", not
  "Submit"). Error messages explain what happened and what to do.

### Restrained editorial and personal-site style

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

## Output format

For each finding:

```
[severity] <component/screen> - <one-line problem>
principle: <the design principle at stake>
fix: <concrete change - token, value, or pattern>
```

End with: what's working well (briefly), blocking issues, then polish suggestions.
