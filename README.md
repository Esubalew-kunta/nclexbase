# NCLEX Bootcamp: static frontend clone

A frontend-only clone of `app.bootcamp.com/nclex`, built so redesigns and new features can be tried before anyone touches production. There is no backend. All progress is saved in the browser's `localStorage`.

The UI inventory, design tokens, and reference screenshots of the live app are in [`../research`](../research/INVENTORY.md).

## Run it

```bash
npm install
npm run dev        # http://localhost:3000  (redirects to /nclex)
npm run build      # static site in ./out, deployable to any static host
npm run preview    # serve ./out on http://localhost:4173
```

`npm run build` runs `scripts/flatten-export.mjs` after `next build`. Next 16 writes the segment-prefetch files as nested folders, but the client router requests them by dotted filenames. The script writes those dotted copies, so client-side navigation works on a plain static host.

## Deploy on Render

The repo includes `render.yaml`, so use **New → Blueprint** and pick this repo. Or create a **Static Site** by hand:

| Setting | Value |
|---|---|
| Build command | `npm ci && npm run build` |
| Publish directory | `out` |
| Environment | `NODE_VERSION=22.20.0` |

`/` redirects to `/nclex/`.

## Stack

- Next.js 16 (App Router, `output: "export"`), React 19, TypeScript
- Tailwind CSS v4. Design tokens are in `src/app/globals.css`, extracted from the live app.
- Zustand with `persist` for local state (tests, tags, schedule, settings)
- lucide-react icons, Figtree font (a stand-in for Adobe's proxima-nova)

## Structure

```
src/
  app/
    (app)/nclex/…            App shell pages: sidebar + gradient layout
      page.tsx               Home dashboard
      [subject]/[tab]/       Subject hubs (cases, standalone, videos, sheets, performance)
      next-gen-cases/        Case study list
      next-gen-standalone/   Standalone questions
      next-gen-readiness-exams/
      previous-tests/        List + review (score report) at /review?id=
      performance/  study-schedule/  crash-courses/  cheat-sheets/
      next-gen-strategy-course/  faqs/  account/  upgrade/
    (exam)/nclex/…           Full-screen Pearson-style exam routes (no app shell)
      custom-test/           The exam screen (?id=, &review=1)
      next-gen-cases/qbanks/[caseId]/        Deep link that starts a case
      next-gen-readiness-exams/qbanks/[id]/  Readiness exam intro
    auth/signin/             Mock login
  components/
    ui/          Primitives (Button, Card, Modal, Toggle, Gauge, ProgressRow…)
    shell/       Sidebar, TopBar, SearchBox, mobile drawer, Providers
    home/        Dashboard sections, lists, schedule, courses, cheat sheets
    test/        Create Test modal
    exam/        ExamScreen, ScenarioPanel, tools (calculator, settings, dialogs),
                 Feedback (tutor explanation + Ask Bootcamp AI), items/* renderers
    performance/ Subject and time tables shared by Performance and the score report
  data/          Catalog numbers mirrored from the live site + original mock questions
  lib/           types, store, scoring (NGN rules), bank, schedule, hooks, features
```

Routes mirror the live URLs (`/nclex/next-gen-cases`, `/nclex/previous-tests/review?…`, and so on), so screens can be compared side by side.

## What works

- **Create Test.** Tutor and timed modes, question pools (unused, learning, reviewing, mastered, bookmarked), subject tree, question count slider.
- **Exam screen.** Case tabs, timer, calculator, settings drawer (text size, question list), mark for review, navigator, pause, and end.
- **All Next Gen NCLEX item types.** Multiple choice, select all that apply, select N, matrix, drag-and-drop cloze, dropdown cloze, highlight, and bowtie.
- **NGN scoring.** 0/1 and +/- rules with partial credit.
- **Tutor mode.** Per-option marks, score card, explanation, linked video and cheat sheet, the Ask Bootcamp AI box (answers are simulated from the explanation), and mastery tags.
- **Score report.** Gauge, you vs. average, subject/system breakdown, time management, question breakdown with jump-to-review.
- **Performance.** Pass Targets, subject performance, and time management, all computed from local attempts.
- **Study Schedule.** The creator modal generates a day-by-day plan with days off and readiness exams.
- **Global search.** Opens with ctrl+F.
- **Free/premium states.** Upgrade walls for free users, and a pricing page.
- **Responsive layout.** Includes a mobile drawer and a mobile exam layout.

## Prototype-only controls

Not part of the live product: open **/nclex/prototype** (or press **Ctrl+Shift+P** anywhere). From there you can:
- switch between the Free and Premium plans,
- reset progress or clear all local data,
- toggle experiments.

## Adding a proposed feature

1. Register it in `src/lib/features.ts`:
   ```ts
   export const EXPERIMENTS = [{ key: "today-card", name: "Today card", description: "…" }];
   ```
2. Gate the UI with `useFeature("today-card")`.
3. Turn it on from /nclex/prototype, or append `?feature=today-card` to any URL.

Flags are off by default, so the clone keeps matching production and each proposal can be shown before and after on the same screen.

## How fidelity was checked

Every page was captured from the live app (free account) with a script that records each element's size, font, colors, borders, shadows, and its `:hover` / `:active` / `:focus` rules (`research/tree.js`, output in `research/walk/*.tree.txt`). Components were rebuilt from those values and compared side by side with the live screenshots.

Real catalog data comes from the live pages: systems per subject with averages (Performance), crash course lessons (Video/Bites with durations), 143 cheat sheets with their systems, and all FAQ answers. See `src/data/live/`.

## Content notes

- Question and case content is **original mock content** written for this prototype, not copied from the production bank. Catalog counts mirror the live site.
- UI assets (logo, subject icons, expert photos, app-store badges, icons) are the live app's own assets, for internal prototyping.
- Proxima Nova is licensed through Adobe, so the clone uses Figtree with -0.01em tracking, which matches Proxima's line widths within about 1%.
- Not replicated: video and PDF media, search illustrations, and the post-creation study schedule view (it didn't load for the free account, so that view is my own design).
