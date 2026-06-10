# Changelog

All notable changes to this project will be documented in this file.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
versioning follows [Semantic Versioning](https://semver.org/).

## [1.0.6] - 2026-06-10

### Fixed
- Date editor now opens below the task row (full width) instead of appearing as a flex item on the same line — no longer clipped in narrow sidebar layouts

### Added
- Optional time input (`HH:MM`) in the date editor — writes `📅 2026-06-10 10:30` to the source file if set, date-only otherwise

---

## [1.0.5] - 2026-06-10

### Changed
- Replaced the `+ Date` right-side button with a `📅` icon anchored left of the task text — always visible regardless of task title length or sidebar width

---

## [1.0.4] - 2026-06-10

### Fixed
- `+ Date` button was clipped off-screen on long task titles in narrow layouts — now shown on hover only (interim fix, superseded by 1.0.5)

---

## [1.0.3] - 2026-06-10

### Added
- Configurable task font size (10–24 px, default 14) via Settings → Appearance
- Font size applies instantly to both the task list and timeline chips via CSS custom property

---

## [1.0.2] - 2026-06-10

### Added
- Nearest heading displayed next to the source note name: `Note (Section heading)`
- Timeline range stepper controls in the view header — change weeks back/forward on the fly, persists to settings
- Settings tab with sliders for default timeline window (weeks back / forward)
- Full English UI — all Italian strings removed, date labels use `en-US` locale

### Fixed
- Obsidian plugin guidelines compliance:
  - Removed all `console.log` calls
  - Removed `detachLeavesOfType()` from `onunload()`
  - Replaced `createEl('h2')` with `setHeading()` in settings tab
  - Applied sentence case to all UI labels

---

## [1.0.1] - 2026-06-01

### Changed
- Replaced `builtin-modules` dependency with Node's native `node:module` `builtinModules`
- Scanner now uses `Vault.cachedRead` for read-only access
- Removed `as any` casts: typed `Vault.process` and `MarkdownView` instanceof checks
- Sentence-case command and ribbon labels per Obsidian UI guidelines

---

## [1.0.0] - 2026-06-01

### Added
- Vault-wide incomplete task scanner (supports Tasks plugin emoji format and Dataview inline fields)
- Monthly timeline view with weekly columns (−1 week / today / +4 weeks), overdue section, current-day highlight
- Sorted task list (scheduled → unscheduled) with per-source and per-date-type filters
- Inline date editor: assign or change `due / before / start / end` dates directly from the view
- Write-back via `vault.process()` (atomic, race-condition-safe)
- One-click task completion (☐ checkbox) from both the list and the timeline chips
- Optimistic UI with automatic rollback on write failure
- Auto-refresh on vault `modify / create / delete` events
- Click on task text opens the source note and positions the cursor at the task line
- Docker-based build pipeline (`Dockerfile` + `build.sh`) — no npm required on the host
