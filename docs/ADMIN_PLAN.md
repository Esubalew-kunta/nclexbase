# NCLEXBase Admin: build plan (static phase)

Status: **built (static) on 2026-10-11**, at `/admin` in the same app, with a single super admin. See "What was built" at the end for what differs from this plan.

The admin side controls everything students see: content, which features and tabs show up, what is free or premium, and the rules behind targets and schedules. This first version is static, like the rest of the app. It has no server, and its data lives in the browser. It is built so that a backend can later replace the storage without the screens changing. Each entity below is also a first draft of the database table it will become.

---

## 1. How it works

### 1.1 Where it lives
- Same Next.js app, new route group `src/app/(admin)/admin/...`, with its own layout (admin sidebar and top bar, no student shell). Static export still works because every admin page is client-rendered.
- Entry: `/admin`. Mock admin login at `/admin/login`, which is separate from the student login.
- Students never see links to `/admin`.

### 1.2 Data flow (the most important decision)

```
seed files (src/data/*)  ─┐
                          ├─> content repository (lib/content/*) ──> student hooks (useMemoryTricks, useQuestions, ...)
admin edits (localStorage ─┘                                    └──> admin screens (list / edit / preview)
 + IndexedDB for files)
```

- **Seed** = today's static data (catalog, cases, standalone, readiness, sheets, FAQs, memory tricks). It never changes at runtime.
- **Admin edits** = a separate persisted store (`nclexbase-admin`) holding, per collection: created records, patches to seed records, soft deletes, and order. Uploaded files (PDFs, images) go to **IndexedDB**, because localStorage holds only about 5 MB. They are served through object URLs.
- **Repository** = one module per collection that merges seed and edits and exposes typed `list / get / create / update / archive / reorder`. The student side reads only published records through hooks. `lib/content.ts` (`useMemoryTricks`) is the first of these hooks.
- **Sync**: the student tabs in the same browser update immediately, and a `storage` event refreshes other open tabs.
- **Hand-off**: *Export JSON* and *Import JSON* for the whole admin state. This is how a demo moves between machines, and later how the real database gets seeded.

**Static limitation (say this in every demo):** edits are visible only in the browser that made them, until the backend exists.

### 1.3 Rules every content record follows
| Field | Meaning |
|---|---|
| `id` | stable, never reused |
| `status` | `draft` → `published` → `archived`. Students see only `published`. |
| `access` | `free` or `premium` (where it applies) |
| `order` | position inside its parent (drag to reorder) |
| `subject`, `system` | taxonomy links (section 3.1). `system: null` means the record applies to the whole subject. |
| `updatedAt`, `updatedBy` | shown in lists; written by the repository |

Deleting is **archive** (reversible). Hard delete is available only on an archived record and asks for confirmation.

### 1.4 Roles (mock, but enforced in the UI)
| Role | Can |
|---|---|
| Owner | everything, including Settings, Roles, and Data reset |
| Content editor | all content tabs; cannot change plans or prices, users, or settings |
| Support | Users, Codes, Inbox; read-only content |
| Viewer | read-only everywhere |

### 1.5 Audit log
Every write records `{ when, who, action, entity, id, summary of changes }`. It is shown on the Dashboard and in Settings › Audit, and can be filtered by user, entity, and date.

---

## 2. One standard for every list, search, filter, and editor

Every tab uses the same building blocks so the admin learns them once.

**List page**
- Table with sticky header, row checkboxes, and column sort. Pagination: 25 / 50 / 100.
- **Search box**: debounced (200 ms) across the record's text fields *and* its id. `/` focuses it. Matches are highlighted.
- **Filters**: dropdown chips that show a count per option (faceted). Filters depend on each other, so *System* only lists the systems of the chosen *Subject*. Every list has *Status*, plus *Access* where it applies. There is a "Clear all" button.
- **URL holds the state** (`?q=&subject=&system=&status=&access=&sort=&page=`), so the back button, refresh, and shared links all keep the same view.
- **Saved views** per list (stored per admin), for example "Drafts in Pharmacology".
- **Two different empty states**: "Nothing here yet, add the first one" vs "No results for these filters, clear filters".
- **Bulk actions** on selected rows: Publish, Unpublish (draft), Archive, Change access, Move to subject/system, Export CSV.

**Editor**
- Full page for big records (questions, cases) and a side panel for small ones (FAQ, code).
- Inline validation, with errors listed at the top. **Save draft** and **Publish** are separate buttons.
- An unsaved-changes guard when leaving the page.
- **Preview as student**, with a Free/Premium toggle. It renders the real student component (for example the exam `ItemView`), not a copy.
- **History**: the last 10 saved versions, each with "Restore".

---

## 3. Tabs, in build order

Each tab lists: what it controls on the student side, the data it manages, the list (search and filters), the editor, and how the student side gets wired to it ("Done when").

### 3.1 Taxonomy: Subjects & Systems (foundation, build first)
Every other filter depends on this tab.
- **Controls:** sidebar Subjects list, subject pages and their tab order and visibility, Create Test tree, Cheat Sheet and Memory Trick system chips, Performance tables.
- **Subject:** `id, name, slug, icon, order, visible, tabs[]` (which subject tabs show and in what order. This is today's `lib/subjectTabs.ts`. Example: Fundamentals has no Case Studies). Also holds the displayed counters that are currently hard-coded.
- **System (sub-subject):** `id, subjectId, name, order, visible`.
- **List:** subjects with their systems nested; drag to reorder; search by name.
- **Safety:** a system that is in use cannot be deleted. Instead the admin gets a choice to *merge into another system* or *archive*, and sees a "used by N questions, M sheets, K memory tricks" panel.
- **Done when:** the sidebar, subject tabs, and every system chip read from the repository.

### 3.2 Memory Tricks (first content tab; proves the file pattern)
- **Controls:** the subject › **Memory Tricks** tab (built now), global search results.
- **Entity:** `MemoryTrick` in `src/data/memoryTricks.ts`: `title, subject, system|null, description (hook), access, status, order, file {url,name,pages,sizeKb}, updatedAt`.
- **List columns:** title, subject, system, access, status, file (pages · size), updated.
- **Search:** title, hook, file name, id. **Filters:** subject → system (including "General"), access, status, "missing file".
- **Editor:** PDF upload (drag and drop; PDF only; max 10 MB; page count read automatically), with an inline preview of the uploaded PDF. Replacing the file keeps the id and the student links.
- **Coverage view:** a grid of subjects × systems showing how many tricks each cell has, so empty systems are easy to spot. This answers "where are we missing material".
- **Done when:** `useMemoryTricks` returns seed plus admin edits, and an uploaded PDF opens in the student viewer.

### 3.3 Cheat Sheets
Same pattern as 3.2, with multi-system tags (`systems[]` for the all-subjects page, `subjectSystems[]` for the subject tab).
- **Controls:** the Cheat Sheets page, the subject Cheat Sheets tab, the "linked sheet" card in exam explanations, and search.
- **Extra:** a global chip list editor, so the admin controls which system chips appear on the all-subjects page.

### 3.4 Question Bank (standalone questions)
- **Controls:** the Standalone tab, Create Test pools, Question of the Day picks, and readiness pools.
- **Entity:** today's `Item` union (`lib/types.ts`): 12 types (mcq, sata, selectN, matrix, matrixMulti, dragCloze, dropdown, highlight, highlightText, bowtie, dragTopN, fitb) with `subject, system, topic, stem, lead, rationale {explanation, incorrect[], takeaway[]}, linkedVideo, linkedSheet, avgPercent, access, status`.
- **List columns:** id, stem (first line), type, subject, system, access, status, avg %, used in (Standalone / Case / Readiness / QOTD), updated.
- **Search:** stem, options, rationale text, topic, id. **Filters:** subject → system, item type, status, access, "used in", avg % band (<40, 40–70, >70), "missing rationale", "missing linked sheet/video".
- **Editor:** a form that changes with the item type (options with a correct-answer marker, matrix grid, cloze blanks, bowtie columns, highlight segments). The scoring rule (0/1, +/-) is shown automatically from the type. A live **exam preview** on the right uses the real renderer, including tutor feedback.
- **Validation:** an answer key that matches the type (for example, SATA needs at least one correct option, selectN needs exactly N), no empty options, and a rationale before publishing.
- **Bulk:** move to a system, change access, publish/unpublish, export CSV/JSON.

### 3.5 Case Studies
- **Controls:** the Case Studies page, subject Case Studies tabs, and the deep links `/next-gen-cases/qbanks/:id`.
- **Entity:** `CaseStudy`: `title, subject, intro, exhibit?, tabs[] (text | nurses' notes | table), items[] (6, each a 3.4 question with "tabs visible from item N"), access, status, order`.
- **List:** title, subject, items count, access, status, updated. **Search:** title, scenario text, item stems. **Filters:** subject, status, access, "incomplete (<6 items)".
- **Editor:** a scenario-tab builder (add a tab and pick its kind; the notes editor has a time column; the table editor works like a small spreadsheet). The 6 item slots are reorderable, and each opens the 3.4 editor. A *progressive tabs* control sets which tabs unlock at which item. Preview opens the real exam screen.

### 3.6 CAT Readiness Exams
- **Controls:** the Readiness page, exam intro, adaptive length, and Pass Targets.
- **Entity:** `ReadinessExam`: `number, title, minQuestions (85), maxQuestions (150), minutes (300), access, status, pool[] (question ids), passingStandard`.
- **Editor:** a pool picker that reuses the 3.4 list and its filters, with "add filtered results". It shows the pool's mix by subject and item type against the NCLEX test-plan targets, and warns when the mix is off.

### 3.7 Crash Course Videos & Next Gen Strategy Course
- **Controls:** the Crash Courses page, subject Videos tab, lesson player, and Next Gen Course.
- **Entity:** `Course` (per subject or NGN module) → `Lesson`: `type video|bites, title, duration, videoUrl (or uploaded file later), bitesQuestionIds[], access, status, order`.
- **List:** lessons grouped by course; drag to reorder; search by title. **Filters:** course, type, access, status, "missing video".
- **Done when:** the "0 of 0 lessons" counters are computed from published lessons, not hard-coded.

### 3.8 Question of the Day & Daily Warmup
- **Controls:** the `/question-of-the-day` page, the Daily Warmup email preview, and the home quick action.
- **Entity:** `QotdSchedule`: `date → questionId`, plus the fallback rule (today's `lib/daily.ts` pick by date) and email settings (sender name, subject line, footer).
- **UI:** a month calendar; click a day to pick a question with the 3.4 search. It warns about repeats within 90 days. The email preview uses the real `EmailPreview`.

### 3.9 Study Schedule rules
- **Controls:** the Create Schedule modal and the generated calendar.
- **Settings:** intro assignments (the "Create Your First Test" items), assignment durations per content type, study speeds (`SPEEDS`), hours-per-day tiers and their messages (good ≤6, busy ≤9, too much above that), and default calendar preferences.
- **Preview:** "generate a schedule for these dates" runs the real `buildPlan` with the draft rules.

### 3.10 Performance & Pass Targets
- **Controls:** the Performance page, the score report, and readiness status labels.
- **Settings:** targets (score 62%, usage 85%, attempt all readiness exams), readiness bands (High ≥70, Borderline ≥60), Chance of Passing thresholds, the "students like you" average figures per subject and system (today from `data/live/systems.json`), and the coach messages on the score report.
- **Validation:** bands must not overlap; a target must be between 0 and 100.

### 3.11 Plans, Pricing & Access
- **Controls:** the Upgrade page, every lock and Upgrade button, and the sidebar and top-bar upgrade prompts.
- **Entity:** `Plan`: `months, price, wasPrice, blurb, featured, guarantee, installments, order, visible`, plus the "What's included" list.
- **Free tier rules (one place):** free question count, free case studies per subject, free readiness exams, which content types are premium by default, and the paywall copy.
- **Safety:** price changes need the Owner role and are written to the audit log.

### 3.12 Home, Navigation & Announcements
- **Controls:** the order and visibility of Home sections, Quick Action cards (show/hide, order, label, free vs premium behaviour), sidebar sections and links (show/hide, order, label), and a site-wide **announcement bar** (message, link, audience all/free/premium, start and end date, dismissible).
- **Preview:** the home page at desktop and phone width, with a Free/Premium toggle.

### 3.13 FAQs
- **Controls:** FAQ lists on Home, Performance, Readiness, Schedule, Review, and the FAQs page.
- **Entity:** `Faq`: `question, answerHtml, placements[] (which pages), order, status`.
- **Search:** question and answer text. **Filters:** placement and status. Drag to reorder within a placement. The editor is rich text with links. This tab also replaces the leftover bootcamp.com emails and links in the FAQ answers.

### 3.14 Study Guide
- **Controls:** the Study Guide page and its download.
- **Settings:** the intro text; either "generated from the taxonomy and cheat sheets" (today's behaviour) or "use an uploaded PDF instead".

### 3.15 Users & Institutional Codes (mock data)
- **Users list:** name, email, plan, status, signup date, last active, institution. **Search:** name and email. **Filters:** plan, status, signup range, institution, "inactive more than 30 days".
- **User detail:** progress summary (from sessions), tests taken, tags; actions to change plan, reset progress, and deactivate. All actions are logged.
- **Codes:** `code, institution, seats, used, expiresAt, plan granted`, with generate, deactivate, export, and a usage view. This controls Account › Redeem Institutional Code.

### 3.16 Support Inbox
- **Controls:** the Contact widget. Messages are stored instead of discarded.
- **List:** from, first line, status (open, pending, closed), received date. **Search:** text and email. **Filters:** status and date. Replies are stored, and the student sees them in the widget.

### 3.17 Settings
- **Branding:** site name, logo files (read-only view of the official set), and support email and links (Terms, Privacy).
- **Feature flags:** today's `EXPERIMENTS` (`lib/features.ts`), switched on or off globally.
- **Exam defaults:** text size, timer, NCLEX restrictions, answer stats, and the Ask AI toggle.
- **Admins & Roles** (1.4), **Audit log** (1.5).
- **Data:** Export JSON, Import JSON (with a diff preview before applying), and Reset to seed (Owner only, typed confirmation).

### 3.18 Dashboard (built last, because it summarises everything above)
- Counts by content type and status, plus drafts waiting to be published.
- **Content health:** questions without a rationale, systems with no memory tricks or cheat sheets, empty readiness pools, files that fail to load, and archived records still linked from published ones.
- Recent audit entries and quick links to saved views.

---

## 4. Phases

| Phase | Builds | Why in this order |
|---|---|---|
| 0 | Admin shell and login, roles, content repository with IndexedDB file store, audit log, list/editor kit (section 2), Export/Import | Every tab reuses these |
| 1 | 3.1 Taxonomy, 3.2 Memory Tricks, 3.3 Cheat Sheets | Simple records that prove the list → edit → publish → student path end to end, including file uploads |
| 2 | 3.4 Question Bank, 3.5 Case Studies, 3.6 Readiness | The core exam content; depends on the taxonomy |
| 3 | 3.7 Videos, 3.8 QOTD, 3.13 FAQs, 3.14 Study Guide | Remaining content |
| 4 | 3.9 Schedule rules, 3.10 Targets, 3.11 Plans & Access, 3.12 Home & Nav | Behaviour and configuration |
| 5 | 3.15 Users & Codes, 3.16 Inbox, 3.17 Settings, 3.18 Dashboard | Operations; the Dashboard summarises everything |

Every phase ends with: student pages for that tab read from the repository, type-check, lint, and build pass, and a browser check of admin edit → student view.

## 5. Decisions to confirm before Phase 0
1. Admin at `/admin` in the same app (recommended) vs. a separate app.
2. The mock admin accounts and roles to demo (proposed: one Owner, one Content editor, one Support).
3. Whether the "students like you" averages (3.10) stay editable, or become computed once the backend exists.

---

## What was built (2026-10-11)

Sign in at `/admin/login` (prototype: `admin@nclexbase.com` / `admin123`, changeable in Settings).

- **Foundation:** `lib/admin/store.ts` (edits, audit log, version history, saved views), `lib/admin/seed.ts` (seed adapters),
  `lib/admin/files.ts` (IndexedDB PDFs), `lib/content` (the repository both sides read), `lib/admin/crud.ts` (writes),
  `components/admin/*` (shell with Ctrl+K jump-to search, list kit, editors, dialogs).
- **Tabs:** Dashboard, Subjects & Systems, Question Bank (+ editor for all 12 item types with live exam preview),
  Case Studies (+ scenario/tab/question editor), Readiness Exams, Courses & Lessons, Cheat Sheets, Memory Tricks
  (+ coverage grid), FAQs, Question of the Day (calendar + pinning), Study Guide, Home & Navigation (announcement,
  sections, quick actions, sidebar), Plans & Access (plans, feature list, free tier), Targets & Rules, Users,
  Institution Codes, Support Inbox, Settings (branding, exam defaults, flags, sign-in, export/import/reset), Audit Log.
- **Student side wired:** sidebar, subject pages and tabs, Home, quick actions, announcement bar, memory tricks,
  cheat sheets (uploaded PDFs open in the viewer), lessons and courses, question bank (new tests, QOTD), case lists,
  readiness exams (title, time, range, access), FAQs on every page, Upgrade page, performance targets and bands,
  schedule tiers, redeem codes (seats count down), contact widget (messages and replies), study guide, AI toggle,
  global feature flags, exam defaults for new students.

**Different from the plan / deferred to the backend**
- One super admin instead of four roles (decision 2); the audit log records every change by that account.
- ~~New subjects can't be created~~ Done in the full-CRUD pass: subjects, systems, merges, icons and student-facing
  counts are all editable. See [ADMIN_REVIEW.md](ADMIN_REVIEW.md).
- ~~Readiness exams share one question pool~~ Each exam can use the whole pool or a chosen set; true adaptive
  (CAT) selection still needs the engine on the server.
- Video files, emails (Daily Warmup, password reset) and payments are previews only.
- Users other than the student on this browser are sample data.
- Seed data fixes: seven hand-written standalone questions used system names that don't exist in the taxonomy
  (e.g. "Mobility"); they now point to the official systems (e.g. "Basic Care and Comfort").
