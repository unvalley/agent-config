---
name: english-writing
description: Rewrite and copyedit existing English prose for clarity, natural rhythm, concision, tone, and audience fit while preserving meaning, factual claims, voice, citations, links, and structure. Use when a user supplies English text or a prose file and asks to polish, simplify, tighten, remove formulaic or AI-sounding phrasing, match a writing sample, or produce a final rewrite across essays, posts, documentation, articles, marketing, personal writing, or fiction. For commit messages and pull request copy, use conventional-commits first to ground the text in the diff.
---

# English Writing

Edit toward the user's stated goal without imposing a generic idea of good
English.

## Resolve the brief

Apply guidance in this order:

1. Follow the user's requested meaning, constraints, and output format.
2. Match any supplied writing sample or style guide.
3. Respect the source's genre, audience, and established register.
4. Apply the defaults in this skill only where the higher priorities are silent.

Infer missing context from the source. Preserve its voice and make the minimum
change needed when the brief is ambiguous.

## Preserve meaning and evidence

- Preserve every assertion, name, number, date, quotation, citation, link,
  technical term, and proper noun unless the user asks to change it.
- Preserve claim strength, uncertainty, attribution, causality, chronology,
  negation, and scope. Do not turn `may` into `will`, correlation into cause, or
  an attributed view into a fact.
- Do not add, strengthen, weaken, or delete a claim merely because the user did
  not supply supporting evidence. Fact-check or remove claims only when the task
  explicitly includes verification and evidence is available.
- Do not invent facts, sources, unnamed authorities, quotations, biography, or
  implications.
- Preserve intentional quirks, concrete details, humor, opinion, ambiguity, and
  uneven rhythm when they carry the author's voice.
- In fiction, preserve established story facts during copyediting. Add invented
  detail only when the task asks for drafting, expansion, or creative revision.

## Rewrite with judgment

- Fix grammar, syntax, ambiguity, redundancy, transitions, and paragraph flow
  to the depth the user requested.
- Prefer concrete wording and direct verbs when they express the same meaning
  more clearly.
- Cut boilerplate that contributes no concrete claim, including canned chatbot
  transitions, inflated significance, vague celebration, and generic outlooks
  or conclusions. Preserve persuasive or rhetorical language when the brief or
  genre calls for it.
- Treat repeated words, rhetorical openers, passive voice, sentence fragments,
  metaphors, groups of three, and dashes as context-dependent signals, not
  forbidden patterns.
- Match the author's punctuation and sentence rhythm. Preserve punctuation that
  carries meaning, including numeric and date ranges.
- Respect genre. Marketing may persuade, fiction may use metaphor, personal
  writing may digress, and changelogs or incident reports may narrate change.
- Restructure, merge, or split passages when useful, but avoid cosmetic
  variation that makes the text less recognizable as the author's.

## Protect files and structured content

- When editing Markdown or another structured file, change prose text by
  default. Preserve frontmatter, code blocks, inline code, structured data,
  tables, HTML or MDX structure, reference identifiers, and link targets unless
  the user asks otherwise.
- Change headings, list structure, link labels, or other formatting only when
  the requested edit requires it and the meaning remains intact.
- For commit messages, pull request titles, and pull request descriptions, use
  `conventional-commits` to inspect the diff and establish accurate content
  before applying this skill as a prose pass.

## Workflow

1. Determine whether the task is a pasted-text rewrite, a file edit, creative
   expansion, or explicit fact-check.
2. Identify the audience, purpose, voice, required format, and content that must
   remain unchanged.
3. Rewrite at the minimum depth needed to satisfy the brief.
4. Compare source and result for lost claims, changed modality, altered
   attribution, names, numbers, dates, quotations, citations, links, and
   formatting.
5. For pasted text, return only the rewrite unless the user asks for commentary
   or alternatives. For a file edit, make the change and report the path, scope,
   and validation without pasting the full file unless asked.
