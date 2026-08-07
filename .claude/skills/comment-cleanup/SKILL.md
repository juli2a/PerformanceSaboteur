---
name: comment-cleanup
description: use this skill when writing comments, tidying up or rewriting code comments in this repo — trims bloated/verbose comments and enforces this project's comment style rules.
---

# Comment Cleanup

Rules to apply when cleaning up comments in this codebase. Grows over time as more corrections come in.

## Rules

1. **No em dash.** Use a short hyphen (`-`) instead, and only when it's actually needed — otherwise drop it (e.g. rephrase or split into two sentences).
2. **Don't hard-wrap by column.** Write the comment as running text on one logical line; the editor soft-wraps to the window width on its own. Don't manually break a comment into short fixed-width lines.
3. **Delete comments that only restate WHAT the code does** — repeating the selector/variable name or a value already visible in the code (e.g. `/* Active nav item ring */` above `.nav-item-active { box-shadow: ... }`). Keep a comment only if it explains WHY (non-obvious reasoning, a hidden constraint, context not visible in the code itself).
4. **Don't defend a design/style decision with a comment unless getting it wrong would NOT be immediately obvious** (visually or behaviorally). If a wrong edit would visibly look/behave broken and get self-corrected on sight, the "why we chose this" comment is just narrative, drop it.
5. **Don't document how a fact was discovered** (debugging, manual testing, trial and error). State the fact itself, plainly, and only if it can be independently justified (from the code, a type signature, or documented library behavior), not just "observed once and it worked."
6. **Don't narrate comments as a fictional developer's reasoning** ("the developer assumed...", "someone thought..."). Describe what the code/case itself does and assumes, impersonally.
7. **Don't duplicate a WHY that's already stated, better anchored, in a sibling/related file.** If component A explains why its props are reference-stable, a shared component B that A renders through doesn't need to repeat that reasoning, just state the fact specific to B (e.g. that it's the shared markup both paths render through).
8. **Don't hardcode specific timing/delay numbers, counts, or line ranges in comments.** They drift from the real value in the code (confirmed multiple times: a comment said 2500ms, the actual delay was 1500ms; a `file.ts:38-81` range shifts silently the moment a line above it is added or removed). Reference the source by file (and function/selector name if needed) instead of a number that can silently go stale.
9. **Don't reference `docs/local-notes/`** (it's gitignored, only you can see it). If the reasoning matters, state it inline or drop the pointer.
10. **Don't explain a fact that's obvious from basic domain knowledge**, even if a real past decision led to the current code. E.g. "[role="row"] also matches the column-header row, data rows are the ones with [role="cell"] children" needs no comment, anyone who knows ARIA table semantics gets there instantly. If any reader with baseline knowledge of the domain would derive the fact on their own, the comment is just residue from when the decision was made, not forward-looking help; drop it.
