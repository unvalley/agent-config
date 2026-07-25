---
name: english-writing
description: Rewrite and copyedit English prose so it sounds natural, specific, and appropriate for its audience while preserving supported facts and the author's voice. Use for revising essays, posts, documentation, articles, reference text, marketing copy, personal writing, fiction, or prose in Markdown and other files, especially when the user asks to improve clarity, remove formulaic or AI-sounding language, match a writing sample, or return a polished final rewrite.
---

# English Writing

Rewrite prose for meaning, specificity, and natural rhythm. Preserve the source's
substance and voice instead of imposing a generic style.

## Priorities

- Preserve every supported claim, name, number, date, quote, citation, and link.
- Never add factual detail absent from the source. Remove unsupported claims or
  keep their uncertainty explicit.
- Match the author's voice, register, vocabulary, and punctuation when a writing
  sample is available. Treat that sample as higher priority than this skill's
  default style preferences.
- Preserve intentional quirks and concrete details. Do not flatten distinctive
  writing into generic simplicity.
- Prefer clarity over cosmetic variation. Restructure, merge, or split passages
  when useful.
- Allow invented detail in fiction when the task calls for it.

## What to Fix

Look for clusters of these patterns. Do not rewrite a phrase merely because it
matches one item.

### Inflated content

- Replace claims that ordinary facts are pivotal, symbolic, enduring, or part
  of a broader trend with the concrete fact they point to.
- Remove promotional words such as `vibrant`, `groundbreaking`, `renowned`,
  `breathtaking`, `rich`, or `must-visit` unless the source supports and needs
  them.
- Remove empty significance attached with `highlighting`, `showcasing`,
  `underscoring`, `reflecting`, or similar `-ing` clauses.
- Remove generic challenges, future outlooks, and upbeat conclusions that add
  no concrete information.
- Do not infer notability from source lists, follower counts, or vague media
  coverage.

### Vague or invented authority

- Do not introduce unnamed authorities such as `experts argue`, `observers
  note`, or `industry reports`.
- Do not present speculation as biography or fact.
- Do not fill missing information with phrases such as `maintains a low profile`
  or `likely grew up`.
- Name a source only when the source text names it. Otherwise qualify, simplify,
  or remove the claim.

### Formulaic language

- Replace repeated AI-favored words such as `additionally`, `crucial`, `delve`,
  `enhance`, `foster`, `interplay`, `intricate`, `landscape`, `pivotal`,
  `showcase`, `tapestry`, `testament`, and `underscore` when ordinary wording is
  clearer.
- Prefer simple verbs over elaborate substitutes such as `serves as`, `stands
  as`, `boasts`, and `offers`.
- Remove forced groups of three, synonym cycling, and false `from X to Y`
  ranges.
- Avoid `Not only ... but ...`, `It is not just ...`, and clipped endings such
  as `no guessing`.
- Remove persuasive throat-clearing such as `the real question`, `at its core`,
  and `what really matters`.
- Remove tutorial announcements such as `Let's dive in` and `Here's what you
  need to know`.
- Remove fake-candid hooks such as `Honestly?`, `Here's the thing`, and `Let's
  be honest`.
- Replace aphorisms and metaphors that stand in for a precise claim.
- Use direct verbs and ordinary syntax. Prefer honest repetition to strained
  synonyms.

### Mechanical style

- Vary sentence rhythm and paragraph shape naturally.
- Avoid runs of short sentences written only for dramatic effect.
- Avoid excessive passive voice and subjectless fragments when the actor
  matters.
- Remove heavy bolding, emoji headings, title-case headings, and lists made from
  bold labels unless the source format benefits from them.
- Do not follow a heading with a sentence that merely repeats the heading.
- Describe the current state instead of narrating a code or document change.
- Remove chatbot residue such as `Of course`, `Great question`, `I hope this
  helps`, and offers to continue.
- Cut wordy filler and stacked hedges.
- Keep formatting when it improves comprehension or belongs to the source
  format.

### Punctuation

- Avoid em and en dashes by default. Use periods, commas, colons, or parentheses.
- Match dash usage when the author's sample uses dashes regularly.
- Do not normalize punctuation blindly. Preserve quotes, code, identifiers,
  proper names, and user-controlled formatting when changing them could alter
  meaning.

## What to Preserve

Do not treat these as AI signs on their own:

- Correct grammar, formal vocabulary, or consistent style
- A single transition word, em dash, rhetorical opener, or short emphatic
  sentence
- Curly quotes created by an editor
- Mixed casual and formal language
- Unsourced prose
- Complex formatting

Prefer leaving passages alone when they contain:

- Specific, unusual details
- Mixed feelings or unresolved tension
- Era-specific slang, references, or in-jokes
- Genuine asides, self-corrections, or uneven rhythm
- Clear first-person choices

## Voice

- Preserve opinion, humor, uncertainty, and personality in essays, posts, and
  personal writing.
- Keep technical, legal, academic, and reference text neutral unless asked
  otherwise.

## Workflow

1. Determine the audience, purpose, and intended voice from the request and
   source.
2. Identify clusters of formulaic patterns.
3. Rewrite for meaning, specificity, and natural rhythm.
4. Verify that no facts, citations, links, or implications were invented or
   lost.
5. Return only the final rewrite unless the user asks for analysis,
   alternatives, or a change summary.

When editing a file, change prose only. Preserve frontmatter, code blocks,
structured data, and link targets unless the user asks to edit them.
