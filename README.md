# Vault Task Planner

An [Obsidian](https://obsidian.md) plugin that aggregates every incomplete task in your vault into a single planning view — with a monthly timeline, per-day columns, and in-place date editing that writes back directly to the source note.

> **Status:** early development (`dev` branch). Core features work; some rough edges remain before a stable release.

---

## Features

### Timeline view
- Sliding window: **−1 week → today → +4 weeks**
- Tasks with a date land in the matching day column
- Current day is visually highlighted
- Overdue tasks (older than the window) appear in a dedicated section at the bottom

### Task list
- All incomplete tasks, sorted: **scheduled first** (chronological), then **unscheduled**
- Each row shows: task text, source note name, and any dates already assigned
- Filter by **source note** or **date type**

### In-place date editing
Select a date type and pick a value directly in the plugin view — no need to touch the source file manually:

| Type | Emoji written to file |
|------|-----------------------|
| Due | `📅 YYYY-MM-DD` |
| Before | `⏳ YYYY-MM-DD` |
| Start | `🛫 YYYY-MM-DD` |
| End | `🏁 YYYY-MM-DD` |

### Task completion
Click the **☐ checkbox** next to any task (in the list or on a timeline chip) to mark it as `- [x]`. The task disappears from the view on the next auto-refresh.

### Write-back & safety
- All writes use `vault.process()` — atomic read-modify-write that serialises correctly with open editors, preventing race conditions
- Optimistic UI: the checkbox updates immediately; if the write fails, it reverts automatically with an error notice

### Auto-refresh
The view re-scans the vault automatically whenever any Markdown file is created, modified, or deleted.

---

## Supported date formats

The scanner recognises both the [Tasks plugin](https://publish.obsidian.md/tasks) emoji syntax and [Dataview](https://blacksmithgu.github.io/obsidian-dataview/) inline fields:

| Format | Example |
|--------|---------|
| Tasks emoji | `📅 2025-06-10` `🛫 2025-06-01` `🏁 2025-06-15` `⏳ 2025-06-08` |
| Dataview inline | `[due:: 2025-06-10]` `[start:: 2025-06-01]` |

When editing a date from the plugin view, it is always written (or updated) in the Tasks emoji format.

---

## Installation

### From the compiled build (quickest)

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](../../releases).
2. Create the folder `<your-vault>/.obsidian/plugins/vault-task-planner/`.
3. Copy the three files into that folder.
4. In Obsidian: **Settings → Community plugins → reload plugins**, then enable **Vault Task Planner**.

### Build from source (Docker — no npm required on the host)

```bash
git clone git@github.com:giacomoleonzi/vault-task-planner-obsidian.git
cd vault-task-planner-obsidian
./build.sh
```

`build.sh` builds the image, compiles the TypeScript inside the container, and extracts `main.js` to the project root. Then copy the three files as above.

### Build from source (local npm)

```bash
npm install
npm run build
```

Requires Node 18+ and npm.

---

## Usage

Open the planner via:
- The **calendar ribbon icon** on the left sidebar
- **Command palette** → `Vault Task Planner: Open Task Planner`

The view opens in the right sidebar. Click any task text to jump to the source note at the exact line.

---

## Project structure

```
vault-task-planner/
├── src/
│   ├── main.ts              # Entry point — registers the view, ribbon, and command
│   ├── TaskPlannerView.ts   # Main ItemView (timeline + list + inline editor)
│   ├── taskScanner.ts       # Vault scan logic → VaultTask[]
│   ├── taskParser.ts        # Regex parsing & serialisation of date tags
│   ├── taskWriter.ts        # Atomic write-back to source files
│   └── types.ts             # Shared interfaces: VaultTask, TaskDate, DateType
├── styles.css
├── manifest.json
├── package.json
├── tsconfig.json
├── esbuild.config.mjs
├── Dockerfile
└── build.sh
```

---

## Known limitations

- The scanner reads all Markdown files on every refresh. For very large vaults, incremental scanning via `metadataCache` would be more efficient (planned).
- If a line shifts in the source file between the last scan and a write-back (e.g. due to a concurrent edit), the write may land on the wrong line. Re-opening the planner forces a fresh scan.

---

## Contributing

The project is in active development on the `dev` branch. PRs and issues are welcome.

1. Fork the repo and create a feature branch off `dev`
2. Make your changes
3. Open a PR targeting `dev`

---

## License

MIT
