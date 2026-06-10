# DEVLOG — Vault Task Planner

## [2026-06-10] Date editor UX overhaul + narrow layout fixes

### 🐛 Bug discovered
- `+ Date` button was positioned at the far right of the task row. On long task titles the button was pushed off-screen and became unreachable in narrow sidebar layouts.
- Date editor was appended **inside** the flex row container, causing it to appear as another flex item on the same line (pushed to the right), instead of below the task.

### 🔧 Bug fixed
- Replaced the `+ Date` right-side button with a `📅` emoji icon anchored **left** of the task text (after the checkbox). Always visible regardless of task length or window width.
- Date editor now inserts as a **sibling element after the row** (`insertAdjacentElement('afterend', editor)`) instead of inside it, so it always opens full-width below the task.
- Added optional **time input** (`HH:MM`) to the date editor. If set, writes `📅 2026-06-10 10:30` to the source file; if left empty, writes date only.

### 🏗️ Technical decisions
- Editor identified by `data-editor-id` attribute (keyed on `task.id`) so toggle (click again to close) works correctly even when multiple editors could theoretically be open.
- CSS accent left-border (`border-left: 3px solid var(--interactive-accent)`) visually anchors the editor to its task row.

---

## [2026-06-10] Settings system + timeline range controls + full English UI

### ✅ Added / Implemented
- `PluginSettings` interface (`weeksBack`, `weeksForward`, `taskFontSize`) in `types.ts`
- `src/settings.ts`: `SettingTab` with sliders — weeks back (0–8), weeks forward (1–12), task font size (10–24 px)
- `main.ts`: `loadSettings` / `saveSettings` via Obsidian `data.json`; settings tab registered; view receives plugin reference
- Timeline range stepper controls (`−` / value / `+`) in the view header — changes persist to settings and update the view instantly
- Configurable task font size applied via CSS custom property `--tp-task-font-size` on the root container
- All remaining Italian strings translated to English; date labels switched to `en-US` locale

### 🏗️ Technical decisions
- CSS custom property approach for font size: one variable declaration controls both `.tp-task-text` and `.tp-chip-text` without duplicating rules.

---

## [2026-06-10] Obsidian plugin guidelines compliance

### 🔧 Fixed
- Removed all `console.log` calls (guidelines: console should show errors only in default config)
- Removed `detachLeavesOfType()` from `onunload()` (guidelines: don't detach leaves on unload)
- Replaced `createEl('h2')` with `setHeading()` in `SettingTab` (guidelines: use `setHeading` for consistent styling)
- Applied sentence case to all UI labels per guidelines

---

## [2026-06-10] Nearest heading in task source label

### ✅ Added
- `nearestHeading()` in `taskScanner.ts`: scans backwards from each task line to find the closest heading (any level h1–h6)
- `sourceHeading: string | null` field added to `VaultTask`
- Task rows now display `Note title (Section heading)` instead of just the note name

---

## [2026-05-29] Task completion from the view

### ✅ Added / Implemented
- `taskWriter.completeTask()` — replaces `- [ ]` with `- [x]` on the source line
- Clickable checkbox on every task row (list): immediate optimistic feedback (☑ + strikethrough + opacity), then write-back and auto-refresh via `vault.on('modify')`
- `☐` button on timeline chips with the same behaviour
- Automatic visual rollback if the write fails (e.g. file not found)
- CSS styles for `--completing` states (row/chip): strikethrough text + reduced opacity
- Switched all writes from `vault.read()` + `vault.modify()` to **`vault.process()`** (atomic read-modify-write, prevents race conditions when the file is open in an editor)

---

## [2026-05-29] Initial session — full plugin scaffold

### ✅ Added / Implemented

- **`src/types.ts`** — `VaultTask`, `TaskDate`, `DateType` types + emoji/label constants
- **`src/taskParser.ts`** — Regex parsing for Tasks plugin format (emoji 📅🛫🏁⏳) and Dataview inline fields (`[due:: ]`); `setDateInLine` and `removeDateFromLine` for write-back
- **`src/taskScanner.ts`** — `scanFile` and `scanVault` for full vault scan, skips completed tasks
- **`src/taskWriter.ts`** — `writeTaskDate` and `removeTaskDate`: reads file, patches line, writes with `vault.modify()`
- **`src/TaskPlannerView.ts`** — `ItemView` with:
  - Weekly timeline (−1w → today → +4w), current day highlight, "Overdue" section
  - Sorted task list (scheduled → unscheduled)
  - Inline date editor with immediate write-back
  - Auto-refresh on `vault.on('modify'|'create'|'delete')`
  - Click on task → opens source file and moves cursor to the correct line
- **`src/main.ts`** — Entry point, registers view, ribbon icon, command palette
- **`styles.css`** — Full styles with dark/light mode support via Obsidian CSS variables
- **`manifest.json`**, **`package.json`**, **`tsconfig.json`**, **`esbuild.config.mjs`** — Standard Obsidian plugin configuration
- **`Dockerfile`** + **`build.sh`** — Containerised build (no npm on host)

### 🏗️ Technical decisions

- Vanilla DOM UI instead of Svelte: zero extra dependencies, leaner build (9.1 KB minified)
- Fixed timeline window (−7d / +28d) with per-day columns grouped by week
- Task ID = `"filepath:lineNumber"` — simple and stable for normal vaults; could collide if a line shifts between scan and write-back

### ⚠️ Open / To do

- Scanner reads all files on every refresh: for very large vaults it would be better to use `metadataCache` + incremental cache (scan only modified files)
- No handling of tasks whose `sourceLine` changed due to a concurrent edit (rare edge case)
- Missing "show current week only" filter
- Potential future feature: drag-and-drop chips on the timeline to reassign dates
