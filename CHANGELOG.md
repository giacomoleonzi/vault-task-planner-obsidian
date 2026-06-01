# Changelog

All notable changes to this project will be documented in this file.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
versioning follows [Semantic Versioning](https://semver.org/).

## [Unreleased]

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
