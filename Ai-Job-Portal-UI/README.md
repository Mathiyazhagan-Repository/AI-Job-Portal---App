# Kairo — AI Job Portal

Front-end implementation of [`../DESIGN.md`](../DESIGN.md), itself derived from
`../Deepthi_Documentation.pdf` (the 72-part PRD/SRS).

```
React 19 · React Router v7 (data mode) · Tailwind CSS v4 · shadcn-style components (Radix)
Lucide icons · Vite 6 · TypeScript
```

## Run it

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # type-check + production build
npm run preview
```

## Start here

| URL | What it is |
|---|---|
| `/variants` | **Start here.** Any page rendered in all three design directions, side by side, in live iframes |
| `/styleguide` | Every component in every state, in whichever direction is active |
| `/recruiter/jobs/j1/applicants` | The most important product screen — ranked triage with the docked screening card |
| `/recruiter/jobs/new` | The AI job-description generator |
| `/` · `/candidate` · `/recruiter` · `/admin` | The four consoles |

Press <kbd>⌘</kbd><kbd>K</kbd> (or <kbd>Ctrl</kbd><kbd>K</kbd>) anywhere to jump between them.

## The three design directions

Every page renders in three named directions. Switch with the **A / B / C** control in the
top bar, or append `?v=b` to any URL — so `/recruiter/jobs/j1/applicants?v=b` sends a
teammate the exact screen you mean.

| | Optimises for | Feel |
|---|---|---|
| **A · Editorial Clarity** | Legibility, first-time comprehension | Bento, cards, medium density |
| **B · Command Console** | Throughput — 200 applicants, keyboard only | Tables, split panes, no shadow, no motion |
| **C · Expressive Canvas** | Emotional pull, mobile, conversion | Full-bleed, decks, display type, motion |

## Why three variants are affordable

Variants differ in **composition, never in logic** (`DESIGN.md` §6.5). Two mechanisms:

1. **`src/styles/variants.css`** — ~40 lines that swap `--v-radius`, `--v-row-h`,
   `--v-gutter`, `--v-card-shadow`, `--v-motion`. This changes density, radius, shadow and
   motion across *every* component at once, with zero per-component work.
2. **Per-page composition files** — `Home.a.tsx` / `.b.tsx` / `.c.tsx`, all fed by **one
   shared data hook** called in `index.tsx` and passed down as props. Switching a variant
   can never change behaviour, only appearance.

Only `pages/` and `layouts/` have variant files. If you find yourself writing
`MatchPrism.b.tsx`, the abstraction is wrong — add a `layout` prop instead.

## Layer rule

```
pages/     ← the only layer with .a / .b / .c files
features/  ← domain-aware; mirrors the FastAPI packages in PRD Part 34
brand/     ← the 12 signature components
common/    ← generic composites; knows nothing about jobs
ui/        ← primitives; knows nothing about anything
```

A layer may only import from layers below it.

## The one rule the UI enforces everywhere

> *Reasoning is never hidden behind a single score.* — PRD Parts 16.3 / 19 / 45

- `<MatchPrism>` ships the score and its breakdown together, or not at all.
- The **same** explanation renders for the #1 candidate and the #200.
- Candidates failing a hard requirement are **grouped separately, never silently buried**.
- `<AIProvenanceChip>` is the one component identical in all three directions — it is a
  compliance surface, not a style choice.
- Publish stays **disabled** in the job editor until a human reviews every AI-drafted
  section.

## Verification

```bash
node smoke.mjs                       # all routes × all 3 variants, checks for console
                                     # errors, page errors, empty bodies, missing <h1>
MSYS_NO_PATHCONV=1 node shot.mjs "/|a|home-a|1150"   # screenshot: route|variant|name|height
```

Both use `playwright-core` against your installed Chrome. Current status: **63/63
route + variant combinations clean**.

## Data

`src/data/mock.ts` mirrors the PRD Part 29 schema field-for-field. All three variants of a
page share one data source, so they can never drift. Swapping to the FastAPI backend means
changing `services/apiClient.ts` — every component already receives data through props.
