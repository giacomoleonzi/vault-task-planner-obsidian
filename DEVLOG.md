# DEVLOG — Vault Task Planner

## [2026-05-29] Completamento task dalla view

### ✅ Aggiunto / Implementato
- `taskWriter.completeTask()` — sostituisce `- [ ]` con `- [x]` nella riga sorgente
- Checkbox cliccabile in ogni task row (lista): feedback ottimistico immediato (☑ + strikethrough + opacity), poi write-back e auto-refresh via `vault.on('modify')`
- Bottone `☐` sui chip della timeline con stesso comportamento
- Rollback visivo automatico se il write fallisce (es. file non trovato)
- Stili CSS per stati `--completing` (row/chip): testo barrato + opacity

---

## [2026-05-29] Sessione iniziale — plugin scaffolding completo

### ✅ Aggiunto / Implementato

- **`src/types.ts`** — Tipi `VaultTask`, `TaskDate`, `DateType` + costanti emoji/label
- **`src/taskParser.ts`** — Parsing regex per formato Tasks (emoji 📅🛫🏁⏳) e Dataview inline (`[due:: ]`); `setDateInLine` e `removeDateFromLine` per write-back
- **`src/taskScanner.ts`** — `scanFile` e `scanVault` per scansione completa del vault, esclude task completati
- **`src/taskWriter.ts`** — `writeTaskDate` e `removeTaskDate`: legge file, modifica riga, scrive con `vault.modify()`
- **`src/TaskPlannerView.ts`** — `ItemView` con:
  - Timeline a settimane (−1w → oggi → +4w), indicazione giorno corrente, sezione "Scaduti"
  - Lista task ordinata (scheduled → unscheduled)
  - Editor inline per assegnare/cambiare date con write-back immediato
  - Auto-refresh su `vault.on('modify'|'create'|'delete')`
  - Click su task → apre il file sorgente posizionandosi sulla riga corretta
- **`src/main.ts`** — Entry point, registra view, ribbon icon, command palette
- **`styles.css`** — Stili completi con supporto dark/light mode tramite variabili CSS Obsidian
- **`manifest.json`**, **`package.json`**, **`tsconfig.json`**, **`esbuild.config.mjs`** — Configurazione standard Obsidian plugin
- **`Dockerfile`** + **`build.sh`** — Build containerizzata (no npm sull'host)

### 🏗️ Decisioni tecniche

- UI vanilla DOM invece di Svelte: zero dipendenze aggiuntive, build più snella (9.1 KB minificato)
- Timeline a finestra fissa (−7gg / +28gg) con colonne giornaliere per settimana
- ID task = `"filepath:lineNumber"` — semplice e stabile per vault normali; potrebbe collidere se una riga viene spostata tra un'apertura e un write-back

### ⚠️ Aperto / Da fare

- La scansione legge tutti i file ad ogni refresh: per vault molto grandi sarebbe meglio usare `metadataCache` + cache incrementale (scansione solo dei file modificati)
- Nessuna gestione dei task con `sourceLine` cambiato dopo un'altra modifica concorrente (edge case raro)
- Manca filtro "mostra solo questa settimana"
- Possibile feature futura: drag-and-drop dei chip sulla timeline per cambiare data
