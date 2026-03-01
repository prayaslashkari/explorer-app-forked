# Planning Workflow

How we manage feature plans and refactors.

---

## Folder Structure

```
docs/plans/
├── README.md       # This file
├── drafts/         # Plans drafted but not yet approved for work
├── active/         # Plans currently being implemented
└── done/           # Completed plans (archive)
```

Filename format: `YYYY-MM-DD-<short-slug>.md`

---

## Workflow

1. **Ask**: "Do you want to draft this or implement it now?"

2. **If drafting** → write the plan and save to `docs/plans/drafts/`

3. **If implementing now** → write the plan to `docs/plans/active/`, implement it, then move to `done/` once complete

4. **Picking up a draft later** → move from `drafts/` → `active/`, implement, then move to `done/`

5. **After any major change** → ask the user if they want to add a changelog entry. If yes, append a numbered entry to the current week's file in `docs/changelog/` (e.g. `docs/changelog/2026-W09.md`)

---

## Plan File Template

```markdown
# <Title>

**Status**: draft | active | done
**Created**: YYYY-MM-DD
**Completed**: YYYY-MM-DD (fill when done)

## Problem
What's wrong or missing?

## Approach
How we'll solve it.

## Tasks
- [ ] Step 1
- [ ] Step 2

## Notes
Any context, trade-offs, or open questions.
```
