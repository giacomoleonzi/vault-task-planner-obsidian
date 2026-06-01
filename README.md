# Vault Task Planner

A planning companion for the [Obsidian Tasks](https://publish.obsidian.md/tasks) plugin.

The idea is simple: **capture tasks freely, anywhere in your vault, without worrying about dates.** Then, when it's time to plan — open this view, see everything at once, and distribute your tasks across the coming weeks.

That's it. This plugin does one thing.

---

## The workflow

**1. Capture** — Write tasks wherever they belong, in whatever note makes sense. Don't force a date. Just get them down.

```markdown
- [ ] Review Q3 budget
- [ ] Call supplier about delivery
- [ ] Draft onboarding doc for new hire
```

**2. Plan** — Open Vault Task Planner when you're ready to plan (weekly review, Monday morning, whenever). You'll see every incomplete task in your vault — dated and undated — in a single view.

**3. Schedule** — Drag tasks from the *Unscheduled* pile into the timeline. Assign a date type (`due`, `start`, `before`, `end`) and pick a date. The plugin writes directly back to the source note — no copy-pasting.

---

## What this plugin is (and isn't)

**It is** a dedicated planning surface. One screen, all your tasks, a timeline to fill.

**It is not** a full task manager, a project tracker, or a replacement for the Tasks plugin. It reads from Tasks and writes back to it. Think of it as the planning session you were already doing manually — now with a UI.

---

## Features

### Unscheduled + scheduled in one view
Every incomplete task in your vault appears here — those with a date in their assigned column, those without in the *Unscheduled* section below the timeline.

### Timeline
- Sliding window: **−1 week → today → +4 weeks**
- Tasks land in the column matching their primary date
- Current day is highlighted
- Tasks older than the window appear in a separate **Overdue** section

### In-place scheduling
Click `+ Date` on any task to open an inline editor. Pick the type and the date — the plugin updates the source file immediately:

| Type | Written to file |
|------|----------------|
| Due | `📅 YYYY-MM-DD` |
| Before | `⏳ YYYY-MM-DD` |
| Start | `🛫 YYYY-MM-DD` |
| End | `🏁 YYYY-MM-DD` |

### Task completion
Tick the **☐** checkbox next to any task to mark it done. The change is written atomically to the source file; the task disappears from the view on the next refresh.

### Filters
Filter by source note or date type to focus on a specific area of your vault during planning.

---

## Supported date formats

The scanner reads both the [Tasks plugin](https://publish.obsidian.md/tasks) emoji syntax and [Dataview](https://blacksmithgu.github.io/obsidian-dataview/) inline fields. Dates are always written back in the Tasks emoji format.

| Format | Example |
|--------|---------|
| Tasks emoji | `📅 2025-06-10` · `🛫 2025-06-01` · `🏁 2025-06-15` · `⏳ 2025-06-08` |
| Dataview inline | `[due:: 2025-06-10]` · `[start:: 2025-06-01]` |

---

## Requirements

- Obsidian **1.4.0** or later
- [Tasks plugin](https://publish.obsidian.md/tasks) (recommended — this plugin is built around its format)

---

## Installation

### From a release (quickest)

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](../../releases).
2. Create the folder `<your-vault>/.obsidian/plugins/vault-task-planner/`.
3. Copy the three files into that folder.
4. In Obsidian: **Settings → Community plugins → reload**, then enable **Vault Task Planner**.

### Build from source — Docker (no npm on the host)

```bash
git clone git@github.com:giacomoleonzi/vault-task-planner-obsidian.git
cd vault-task-planner-obsidian
./build.sh
```

`build.sh` compiles everything inside a Docker container and outputs `main.js` to the project root. Then install as above.

### Build from source — local npm

```bash
npm install
npm run build
```

Requires Node 18+.

---

## Opening the planner

- **Ribbon** — click the calendar icon in the left sidebar
- **Command palette** — `Vault Task Planner: Open Task Planner`

The view opens in the right sidebar. Click any task text to jump to its source note at the exact line.

---

## Project structure

```
vault-task-planner/
├── src/
│   ├── main.ts              # Entry point — view, ribbon, command
│   ├── TaskPlannerView.ts   # Main ItemView (timeline + list + editor)
│   ├── taskScanner.ts       # Vault scan → VaultTask[]
│   ├── taskParser.ts        # Date tag parsing & serialisation
│   ├── taskWriter.ts        # Atomic write-back via vault.process()
│   └── types.ts             # VaultTask, TaskDate, DateType
├── styles.css
├── manifest.json
├── esbuild.config.mjs
├── Dockerfile
└── build.sh
```

---

## Known limitations

- The scanner reads all Markdown files on every refresh. Incremental scanning via `metadataCache` is planned for larger vaults.
- If a line shifts in the source file between the last scan and a write (concurrent edit elsewhere), the write may land on the wrong line. Re-opening the view forces a fresh scan.

---

## Status & contributing

Active development on the `dev` branch — core features work, rough edges remain.

PRs and issues welcome. Please target `dev`, not `main`.

---

## License

MIT
