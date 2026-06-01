# DEVLOG — Vault Task Planner

## [2026-05-29] Task completion from the view

### ✅ Added / Implemented
- `taskWriter.completeTask()` — replaces `- [ ]` with `- [x]` on the source line
- Clickable checkbox on every task row (list): immediate optimistic feedback (☑ + strikethrough + opacity), then write-back and auto-refresh via `vault.on('modify')`
- `☐` button on timeline chips with the same behaviour
- Automatic visual rollback if the write fails (e.g. file not found)
- CSS styles for `--completing` states (row/chip): strikethrough text + reduced opacity
- Switched all writes from `vault.read()` + `vault.modify()` to **`vault.process()`** (atomic read-modify-write, prevents race conditions when the file is open in an editor)
- Debug logging added under `[TaskPlanner]` prefix (visible in Obsidian DevTools console)

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
