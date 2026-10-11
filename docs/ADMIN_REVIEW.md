# Admin review: does the admin have full control?

Reviewed 2026-10-11, after the full-CRUD pass. Scope: the static admin at `/admin` (localStorage + IndexedDB),
judged as the product it will become once the backend exists.

**Verdict.** Yes for content and configuration. Every student-facing surface now has a matching admin control,
and every content type supports create, edit, publish/unpublish, archive and delete. Nothing the admin needs
to change is hard-coded any more. Two kinds of control are still limited:

- **Platform control** (real users, payments, email, access security). This needs the backend; a static app can't
  provide it.
- **A few prototype risks** (raw HTML, browser storage limits). These are listed under "Remaining gaps" with the
  fix for each.

---

## 1. Control coverage

Each student surface, the admin tab that controls it, and how much of it the admin controls. "Full" means
create, edit, reorder, hide, publish and delete, with nothing fixed in code.

| Student surface | Admin control | Coverage |
|---|---|---|
| Subjects list, subject pages, tabs | Subjects & Systems | Full. Create, rename, icon, tab order and visibility, systems (add, rename, reorder, merge, delete), merge subjects, delete unused. New subjects get `/nclex/subject?id=` pages. |
| Numbers on subject pages (question counts, averages) | Subjects & Systems, "Numbers shown to students" | Full. Set them by hand or take them from the bank with "Use bank". |
| Home sections, quick-action cards | Home & Navigation | Full. Reorder and hide sections; add, edit, reorder, hide and delete cards (built-in cards keep their special behaviour). |
| Sidebar | Home & Navigation | Full. Sections and links: add, rename, re-link, reorder, move between sections, open in new tab, hide, delete. |
| Announcement bar | Announcements | Full. Several at once, each with an audience, date window, style and order. |
| Page titles, descriptions, banners, messages | Pages & Copy | Full for the 35 registered texts (new ones are one line in `lib/admin/copy.ts`). Search, filter by page, reset each text to default. |
| Question bank (12 item types) | Question Bank | Full, with a live exam preview. |
| Case studies | Case Studies | Full. Scenario, tabs and questions. |
| CAT readiness exams | Readiness Exams | Full. Create and delete exams; set time, range, access, order and shuffle; use the whole pool or a chosen set of questions (added in this pass); manage the pool. |
| Crash course videos, Next Gen course | Courses & Lessons | Full. Modules and lessons, including new Next Gen modules. Video files are placeholders (see 2.9). |
| Cheat sheets, memory tricks | Cheat Sheets, Memory Tricks | Full. PDF upload, per-subject and per-system filing, coverage grid. |
| FAQs | FAQs | Full, including which pages each FAQ appears on. |
| Question of the Day, Daily Warmup | Question of the Day | Full. Calendar and pinning. |
| Study guide | Study Guide | Full. |
| Study schedule generator | Targets & Rules, "Plan template" | Full. Day-one items, NGN overview, minutes per case and per readiness exam, review cadence, practice blocks, review items. Cases and exams come from their own tabs. |
| Performance targets, readiness bands, catalog totals | Targets & Rules | Full. |
| Coach name and photo, branding, exam defaults, feature flags | Settings | Full. |
| Plans, prices, feature list, free-tier limits | Plans & Access | Full for display. No payments are taken (see 2.9). |
| Institution codes | Institution Codes | Full, with seat counts. |
| Users | Users | Create, edit, delete and bulk delete. Only the student in this browser is real; the rest are sample data (see 2.9). |
| Contact widget | Support Inbox | Full. Reply, change status, delete. |

What is deliberately not controlled from the admin is exam engine behaviour, such as how each item type is
scored and the timer mechanics. That is product code, and changing it should go through a release, not a
settings screen.

---

## 2. Findings by perspective

### 2.1 Data model and integrity

- **Good:** One repository (`lib/content`) merges the seed data with the admin's changes, and both sides read
  only through it. The student side never reads `src/data` directly. This is the most important design
  property, and it holds.
- **Good:** Integrity checks run before destructive actions:
  - A subject can be deleted only when nothing uses it. Otherwise "merge" moves everything first.
  - A system can be deleted only when unused. Otherwise it is merged into another system.
  - Deleting a module also deletes its lessons.
- **Watch:** References between records are plain ids with no database constraints.
  - Example: a question can be pinned as Question of the Day and then archived. The student page handles this
    gracefully, but nothing warns the admin.
  - The backend should add foreign keys, plus "used by" counts in the editors.
- **Watch:** Saving settings replaces the whole section (`setConfig`). This is correct, because it allows
  clearing values, but two editors saving the same section from different tabs means the last save wins (see 2.6).

### 2.2 Publishing workflow

- **Good:** Every content type uses the same lifecycle: draft, published, archived.
  - "Save draft" and "Publish" are separate buttons.
  - The editors warn about unsaved changes.
  - Announcements also have scheduled start and end dates.
- **Gap:** Only announcements have date windows. With a backend, "publish at" on any record is cheap and useful,
  for example releasing a new readiness exam on a set date.
- **Gap:** There is no review step, because there is a single super admin by decision. When roles arrive, add
  "submitted for review" between draft and published.

### 2.3 Audit and recovery

- **Good:**
  - Every write records an audit entry. The log keeps the last 800 entries and can be searched.
  - Each record keeps its last 10 versions with one-click restore.
  - Export and import cover all admin data plus uploaded files.
  - "Reset to seed" asks for confirmation first.
- **Good:** Records are archived before they can be deleted. "Delete" only appears on archived records (or on
  records with no status) and asks for confirmation.
- **Gap:** A hard delete can't be undone: there is no trash. That is acceptable while records must be archived
  first and exports exist. On the backend, use soft deletes with a 30-day purge.
- **Gap:** The audit log and version history live in the same browser storage as the content. If that storage is
  cleared, all three are lost together. The backend must keep them server-side, with no way to edit them.

### 2.4 Search, filter and list UX

- **Good:** All lists share one kit:
  - Search and filters are stored in the URL, so a filtered list can be shared as a link.
  - Filters show how many records match each option.
  - Filters depend on each other (choosing a subject narrows the system options).
  - Views can be saved.
  - Bulk actions apply to selected rows.
  - `?edit=` opens a record's editor directly from a link.
- **Good:** Ctrl+K jump-to search covers questions, cases, subjects, courses, announcements, codes and users.
- **Minor:** Some fields put a segmented control inside a `<label>`, which gives the buttons slightly odd
  accessible names, such as "Questions Choose questions". Fix `Field` so it labels only single inputs.

### 2.5 Security (prototype limits)

These are acceptable in a static prototype. **Each one blocks a real launch.**

- **Sign-in is client-side only.** The admin password is stored in plain text in localStorage, and anyone can
  open `/admin`. The backend needs server sessions, hashed passwords, 2FA for the super admin, and role checks
  on every API call.
- **Admin-written HTML is rendered as-is** in question stems, FAQs, QOTD and the email preview (9 places use
  `dangerouslySetInnerHTML`). This is harmless while one trusted admin writes everything. Once there are several
  authors it becomes a stored-XSS risk. The fix is to sanitise HTML on the server when it is saved, and again
  when it is rendered (DOMPurify).
- **Uploaded files are not checked.** PDFs and images are size-limited (10 MB and 2 MB) but not scanned. The
  backend should check file types by their content, scan them, and serve them from a separate domain.

### 2.6 Consistency across tabs

- **Good:** A `storage` listener reloads both stores whenever another tab writes. As a result:
  - The student side updates live while the admin edits in another tab.
  - A tab whose data has gone stale doesn't overwrite newer changes when it next saves.
- **Gap:** If two admin tabs edit the same record at the same time, the last save wins. The backend should send
  `updatedAt` as a version and reject stale saves (HTTP 409), and the editor should then offer to reload.

### 2.7 Performance and scale

- **Limit:** localStorage holds about 5 MB per site. Admin data is currently tens of KB; Settings shows the size.
  Uploads are stored separately in IndexedDB and don't count toward it.
- **Fixed in this pass:** when storage is full, the edit was previously kept only in memory and silently lost on
  reload. The admin now gets an error toast that says the change was not saved.
- **Scale:** Lists filter in memory, which is fine for thousands of records. A backend should page and filter on the server once lists pass about 5,000 rows.

### 2.8 Backend and API readiness

The admin layer maps cleanly onto an API:

- Each collection in `lib/admin/types.ts` becomes a table.
- `crud.ts` (create, update, setStatus, hardDelete, restore, reorder) becomes the REST/RPC surface.
- `getConfig` sections become a settings table, one row per section.
- The export file format is the seed format for the database.

Only `lib/content` and `crud.ts` need to change; the pages keep working.

Pages for created records use query-param URLs (`/nclex/subject?id=…`) because a static export can't pre-build
them. With server rendering these can become pretty URLs again, with no data changes.

### 2.9 Out of scope for a static app

These need servers and cannot be completed now:

- Real student accounts and their progress data. The Users list holds sample records.
- Payments and receipts.
- Email delivery: Daily Warmup emails and password resets.
- Video hosting and streaming.
- Adaptive CAT question selection.
- Per-student analytics on the Dashboard.

The admin UI for each one exists, so the backend only has to provide the data.

---

## 3. Changes in this pass

**No more hard-coded content.** These were fixed in code before and are now CRUD:

- **Subjects:** create, delete, merge, icons, student-facing counts. `SubjectId` is now any string.
- **Home and sidebar:** quick-action cards and sidebar links are lists of records instead of fixed switches.
- **Announcements:** now a collection (several at once, audiences, dates). Before, there was a single bar.
- **Page text:** the new Pages & Copy tab edits titles and messages that used to be fixed.
- **Study schedule:** the plan template (intro items, blocks, review cadence, minutes) used to be fixed in code.
- **Catalog totals and coach:** the totals students see and the coach name and photo are now settings.
- **Content collections:** delete was added to Readiness Exams, Courses (Next Gen modules), Cheat Sheets, Memory
  Tricks, FAQs, Plans, Codes, Users (single and bulk) and Inbox.

**Fixes found by this review:**

- **Readiness exams:** each exam can use a chosen set of pool questions. A case study is always picked as a
  whole.
- **Full storage:** a full browser storage now shows an error instead of silently losing the change.
- **New subjects without seed tab data:** these broke server rendering (`tabsFor` returned `undefined`). They now
  get the default tabs.

**Verification:** two Playwright suites, 30 checks, all pass. They create a subject, sidebar link, quick action,
announcement, page text, readiness exam, Next Gen module and user, then confirm each one appears on the student
side. TypeScript, ESLint and `next build` are clean.

---

## 4. Remaining gaps, in priority order

| # | Gap | When | Fix |
|---|---|---|---|
| 1 | Client-side admin sign-in, plain-text password | Before launch | Server sessions, hashing, 2FA, role checks on the API |
| 2 | Admin-written HTML rendered without sanitising | Before a second author | Sanitise on save and on render |
| 3 | Last save wins between two admins | With the backend | `updatedAt` version check, HTTP 409, reload prompt |
| 4 | Audit log and history kept in the same storage as the data | With the backend | Append-only server tables |
| 5 | No trash for hard deletes | With the backend | Soft delete with a 30-day purge |
| 6 | Scheduled publishing only on announcements | Nice to have | "Publish at" and "unpublish at" on every record |
| 7 | No "used by" warnings (QOTD pin, readiness choices) | Nice to have | Reference counts in the editors |
| 8 | Accessible names in `Field` with segmented controls | Small | Use a `<label>` only for single inputs |
