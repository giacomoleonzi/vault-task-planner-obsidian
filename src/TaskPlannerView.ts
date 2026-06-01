import { ItemView, WorkspaceLeaf, TFile, Notice } from 'obsidian';
import { VaultTask, DateType, DATE_EMOJI, DATE_LABEL } from './types';
import { scanVault } from './taskScanner';
import { writeTaskDate, completeTask } from './taskWriter';
import VaultTaskPlannerPlugin from './main';

export const VIEW_TYPE = 'vault-task-planner';

// ─── date helpers ────────────────────────────────────────────────────────────

function isoToday(): string {
	return new Date().toISOString().slice(0, 10);
}

function addDays(iso: string, n: number): string {
	const d = new Date(iso + 'T00:00:00');
	d.setDate(d.getDate() + n);
	return d.toISOString().slice(0, 10);
}

function startOfWeek(iso: string): string {
	const d = new Date(iso + 'T00:00:00');
	const diff = d.getDay() === 0 ? -6 : 1 - d.getDay(); // Monday-based
	d.setDate(d.getDate() + diff);
	return d.toISOString().slice(0, 10);
}

function fmtWeekLabel(iso: string): string {
	const d = new Date(iso + 'T00:00:00');
	return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fmtDayLabel(iso: string): string {
	return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
}

function shortFileName(path: string): string {
	return path.split('/').pop()?.replace(/\.md$/, '') ?? path;
}

function getTaskPrimaryDate(task: VaultTask): string | null {
	for (const type of ['due', 'before', 'end', 'start'] as DateType[]) {
		const d = task.dates.find(d => d.type === type);
		if (d) return d.value;
	}
	return null;
}

// ─── interfaces ──────────────────────────────────────────────────────────────

interface WeekColumn {
	startIso: string;
	endIso: string;
	label: string;
	isCurrentWeek: boolean;
	days: DayBucket[];
}

interface DayBucket {
	iso: string;
	label: string;
	isToday: boolean;
	isPast: boolean;
}

// ─── view ────────────────────────────────────────────────────────────────────

export class TaskPlannerView extends ItemView {
	private plugin: VaultTaskPlannerPlugin;
	private tasks: VaultTask[] = [];
	private filterPath: string = '';
	private filterType: DateType | '' = '';

	constructor(leaf: WorkspaceLeaf, plugin: VaultTaskPlannerPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType(): string { return VIEW_TYPE; }
	getDisplayText(): string { return 'Task Planner'; }
	getIcon(): string { return 'calendar-check'; }

	async onOpen(): Promise<void> {
		await this.refresh();

		this.registerEvent(
			this.app.vault.on('modify', async (file) => {
				if (file instanceof TFile && file.extension === 'md') {
					console.log('[TaskPlanner] vault:modify →', file.path);
					await this.refresh();
				}
			})
		);
		this.registerEvent(this.app.vault.on('create', () => this.refresh()));
		this.registerEvent(this.app.vault.on('delete', () => this.refresh()));
	}

	async refresh(): Promise<void> {
		console.log('[TaskPlanner] refresh() — tasks before:', this.tasks.length);
		this.tasks = await scanVault(this.app);
		console.log('[TaskPlanner] refresh() — tasks after:', this.tasks.length);
		this.render();
	}

	render(): void {
		const container = this.containerEl.children[1] as HTMLElement;
		container.empty();
		container.addClass('task-planner-root');

		this.renderHeader(container);
		this.renderTimeline(container);
		this.renderTaskList(container);
	}

	// ─── header ────────────────────────────────────────────────────────────

	private renderHeader(container: HTMLElement): void {
		const header = container.createEl('div', { cls: 'tp-header' });

		const titleRow = header.createEl('div', { cls: 'tp-title-row' });
		titleRow.createEl('h2', { text: 'Task Planner' });
		titleRow.createEl('span', { cls: 'tp-count', text: `${this.filteredTasks().length} tasks` });

		// ── filters row ──
		const filters = header.createEl('div', { cls: 'tp-controls' });

		// Filter: source note
		const fileSelect = filters.createEl('select', { cls: 'tp-select' });
		fileSelect.createEl('option', { value: '', text: 'All notes' });
		[...new Set(this.tasks.map(t => t.sourcePath))].sort().forEach(p => {
			const opt = fileSelect.createEl('option', { value: p, text: shortFileName(p) });
			if (p === this.filterPath) opt.selected = true;
		});
		fileSelect.addEventListener('change', () => { this.filterPath = fileSelect.value; this.render(); });

		// Filter: date type
		const typeSelect = filters.createEl('select', { cls: 'tp-select' });
		typeSelect.createEl('option', { value: '', text: 'All date types' });
		(['due', 'before', 'start', 'end'] as DateType[]).forEach(type => {
			const opt = typeSelect.createEl('option', { value: type, text: `${DATE_EMOJI[type]} ${DATE_LABEL[type]}` });
			if (type === this.filterType) opt.selected = true;
		});
		typeSelect.addEventListener('change', () => { this.filterType = typeSelect.value as DateType | ''; this.render(); });

		// Refresh button
		const refreshBtn = filters.createEl('button', { cls: 'tp-btn', text: '↻ Refresh' });
		refreshBtn.addEventListener('click', () => this.refresh());

		// ── timeline range row ──
		const rangeRow = header.createEl('div', { cls: 'tp-range-row' });
		rangeRow.createEl('span', { cls: 'tp-range-label', text: 'Timeline window:' });

		this.renderWeekStepper(rangeRow, '← weeks back', this.plugin.settings.weeksBack, 0, 8,
			async (v) => { this.plugin.settings.weeksBack = v; await this.plugin.saveSettings(); });

		rangeRow.createEl('span', { cls: 'tp-range-sep', text: 'today' });

		this.renderWeekStepper(rangeRow, 'weeks forward →', this.plugin.settings.weeksForward, 1, 12,
			async (v) => { this.plugin.settings.weeksForward = v; await this.plugin.saveSettings(); });
	}

	private renderWeekStepper(
		parent: HTMLElement,
		label: string,
		current: number,
		min: number,
		max: number,
		onChange: (v: number) => Promise<void>,
	): void {
		const wrap = parent.createEl('div', { cls: 'tp-stepper' });

		const decBtn = wrap.createEl('button', { cls: 'tp-stepper-btn', text: '−' });
		const valueEl = wrap.createEl('span', { cls: 'tp-stepper-value', text: String(current) });
		const incBtn = wrap.createEl('button', { cls: 'tp-stepper-btn', text: '+' });
		wrap.createEl('span', { cls: 'tp-stepper-label', text: label });

		let value = current;

		const update = async (delta: number) => {
			const next = Math.min(max, Math.max(min, value + delta));
			if (next === value) return;
			value = next;
			valueEl.setText(String(value));
			decBtn.disabled = value <= min;
			incBtn.disabled = value >= max;
			await onChange(value);
		};

		decBtn.disabled = value <= min;
		incBtn.disabled = value >= max;
		decBtn.addEventListener('click', () => update(-1));
		incBtn.addEventListener('click', () => update(+1));
	}

	// ─── filtered task list ─────────────────────────────────────────────────

	private filteredTasks(): VaultTask[] {
		return this.tasks.filter(t => {
			if (this.filterPath && t.sourcePath !== this.filterPath) return false;
			if (this.filterType && !t.dates.some(d => d.type === this.filterType)) return false;
			return true;
		});
	}

	// ─── timeline ───────────────────────────────────────────────────────────

	private renderTimeline(container: HTMLElement): void {
		const today = isoToday();
		const windowStart = addDays(today, -(this.plugin.settings.weeksBack * 7));
		const windowEnd   = addDays(today,  this.plugin.settings.weeksForward * 7);

		// Build week columns
		const weeks: WeekColumn[] = [];
		let weekStart = startOfWeek(windowStart);
		while (weekStart <= windowEnd) {
			const days: DayBucket[] = [];
			for (let i = 0; i < 7; i++) {
				const iso = addDays(weekStart, i);
				if (iso < windowStart || iso > windowEnd) continue;
				days.push({
					iso,
					label: fmtDayLabel(iso),
					isToday: iso === today,
					isPast: iso < today,
				});
			}
			if (days.length > 0) {
				const weekEnd = days[days.length - 1].iso;
				weeks.push({
					startIso: weekStart,
					endIso: weekEnd,
					label: `Week of ${fmtWeekLabel(weekStart)}`,
					isCurrentWeek: weekStart <= today && today <= weekEnd,
					days,
				});
			}
			weekStart = addDays(weekStart, 7);
		}

		const section = container.createEl('div', { cls: 'tp-section' });
		section.createEl('h3', { text: '📅 Timeline' });

		const timelineEl = section.createEl('div', { cls: 'tp-timeline' });
		const tasksWithDates = this.filteredTasks().filter(t => getTaskPrimaryDate(t) !== null);

		for (const week of weeks) {
			const weekEl = timelineEl.createEl('div', {
				cls: 'tp-week' + (week.isCurrentWeek ? ' tp-week--current' : ''),
			});
			weekEl.createEl('div', { cls: 'tp-week-label', text: week.label });

			const daysEl = weekEl.createEl('div', { cls: 'tp-days' });
			for (const day of week.days) {
				const dayEl = daysEl.createEl('div', {
					cls: ['tp-day',
						day.isToday ? 'tp-day--today' : '',
						day.isPast  ? 'tp-day--past'  : '',
					].filter(Boolean).join(' '),
				});
				dayEl.createEl('div', { cls: 'tp-day-label', text: day.label });

				const dayTasks = tasksWithDates.filter(t => getTaskPrimaryDate(t) === day.iso);
				if (dayTasks.length === 0) {
					dayEl.createEl('div', { cls: 'tp-day-empty', text: '—' });
				} else {
					dayTasks.forEach(t => this.renderTaskChip(dayEl, t));
				}
			}
		}

		// Overdue
		const overdue = tasksWithDates.filter(t => {
			const d = getTaskPrimaryDate(t);
			return d !== null && d < windowStart;
		});
		if (overdue.length > 0) {
			const overdueEl = section.createEl('div', { cls: 'tp-overdue' });
			overdueEl.createEl('div', { cls: 'tp-section-label', text: '⚠️ Overdue — before timeline window' });
			overdue.forEach(t => this.renderTaskRow(overdueEl, t));
		}
	}

	// ─── task chip (timeline) ───────────────────────────────────────────────

	private renderTaskChip(parent: HTMLElement, task: VaultTask): void {
		const chip = parent.createEl('div', { cls: 'tp-chip' });
		chip.setAttribute('title', `${task.text}\n${shortFileName(task.sourcePath)}`);

		const doneBtn = chip.createEl('button', { cls: 'tp-chip-done', text: '☐' });
		doneBtn.setAttribute('title', 'Mark as complete');
		doneBtn.addEventListener('click', async (e) => {
			e.stopPropagation();
			doneBtn.setText('☑');
			chip.addClass('tp-chip--completing');
			try {
				await completeTask(this.app, task.sourcePath, task.sourceLine);
			} catch (err) {
				doneBtn.setText('☐');
				chip.removeClass('tp-chip--completing');
				new Notice(`Could not complete task: ${(err as Error).message}`);
			}
		});

		const text = chip.createEl('span', { cls: 'tp-chip-text', text: task.text });
		text.addEventListener('click', () => this.openSource(task));

		const editBtn = chip.createEl('button', { cls: 'tp-chip-edit', text: '✎' });
		editBtn.setAttribute('title', 'Edit date');
		editBtn.addEventListener('click', (e) => {
			e.stopPropagation();
			this.openDateEditor(task, chip);
		});
	}

	// ─── task list ──────────────────────────────────────────────────────────

	private renderTaskList(container: HTMLElement): void {
		const tasks = this.filteredTasks();
		const withDate = tasks
			.filter(t => getTaskPrimaryDate(t) !== null)
			.sort((a, b) => (getTaskPrimaryDate(a) ?? '') < (getTaskPrimaryDate(b) ?? '') ? -1 : 1);
		const unscheduled = tasks.filter(t => getTaskPrimaryDate(t) === null);

		const section = container.createEl('div', { cls: 'tp-section' });
		section.createEl('h3', { text: '📋 All Tasks' });

		if (withDate.length > 0) {
			section.createEl('div', { cls: 'tp-section-label', text: 'Scheduled' });
			withDate.forEach(t => this.renderTaskRow(section, t));
		}
		if (unscheduled.length > 0) {
			section.createEl('div', { cls: 'tp-section-label', text: 'Unscheduled' });
			unscheduled.forEach(t => this.renderTaskRow(section, t));
		}
		if (tasks.length === 0) {
			section.createEl('div', { cls: 'tp-empty', text: 'No incomplete tasks found.' });
		}
	}

	// ─── task row (list) ────────────────────────────────────────────────────

	private renderTaskRow(parent: HTMLElement, task: VaultTask): void {
		const row = parent.createEl('div', { cls: 'tp-task-row' });

		const checkbox = row.createEl('span', { cls: 'tp-checkbox', text: '☐' });
		checkbox.setAttribute('title', 'Mark as complete');
		checkbox.addEventListener('click', async () => {
			checkbox.setText('☑');
			checkbox.addClass('tp-checkbox--done');
			row.addClass('tp-task-row--completing');
			try {
				await completeTask(this.app, task.sourcePath, task.sourceLine);
			} catch (e) {
				checkbox.setText('☐');
				checkbox.removeClass('tp-checkbox--done');
				row.removeClass('tp-task-row--completing');
				new Notice(`Could not complete task: ${(e as Error).message}`);
			}
		});

		const body = row.createEl('div', { cls: 'tp-task-body' });
		const textEl = body.createEl('span', { cls: 'tp-task-text', text: task.text });
		textEl.addEventListener('click', () => this.openSource(task));

		const meta = body.createEl('div', { cls: 'tp-task-meta' });
		meta.createEl('span', { cls: 'tp-task-source', text: shortFileName(task.sourcePath) });
		task.dates.forEach(d => {
			meta.createEl('span', { cls: `tp-date-tag tp-date-${d.type}`, text: `${DATE_EMOJI[d.type]} ${d.value}` });
		});

		const editBtn = row.createEl('button', { cls: 'tp-btn-small', text: '+ Date' });
		editBtn.addEventListener('click', () => this.openDateEditor(task, row));
	}

	// ─── inline date editor ─────────────────────────────────────────────────

	private openDateEditor(task: VaultTask, anchor: HTMLElement): void {
		const existing = anchor.querySelector('.tp-date-editor');
		if (existing) { existing.remove(); return; }

		const editor = anchor.createEl('div', { cls: 'tp-date-editor' });

		const typeSelect = editor.createEl('select', { cls: 'tp-select' });
		(['due', 'before', 'start', 'end'] as DateType[]).forEach(type => {
			typeSelect.createEl('option', { value: type, text: `${DATE_EMOJI[type]} ${DATE_LABEL[type]}` });
		});

		const dateInput = editor.createEl('input', { cls: 'tp-date-input', type: 'date' });

		const prefill = () => {
			const cur = task.dates.find(d => d.type === typeSelect.value);
			dateInput.value = cur?.value ?? isoToday();
		};
		prefill();
		typeSelect.addEventListener('change', prefill);

		const saveBtn = editor.createEl('button', { cls: 'tp-btn', text: 'Save' });
		saveBtn.addEventListener('click', async () => {
			if (!dateInput.value) { new Notice('Pick a date first.'); return; }
			try {
				await writeTaskDate(this.app, task.sourcePath, task.sourceLine, typeSelect.value as DateType, dateInput.value);
				editor.remove();
			} catch (e) {
				new Notice(`Error: ${(e as Error).message}`);
			}
		});

		const cancelBtn = editor.createEl('button', { cls: 'tp-btn tp-btn--cancel', text: 'Cancel' });
		cancelBtn.addEventListener('click', () => editor.remove());
	}

	// ─── open source note ───────────────────────────────────────────────────

	private async openSource(task: VaultTask): Promise<void> {
		const file = this.app.vault.getAbstractFileByPath(task.sourcePath);
		if (!file) return;

		const existingLeaf = this.app.workspace.getLeavesOfType('markdown')
			.find(l => (l.view as any)?.file?.path === task.sourcePath);
		const leaf = existingLeaf ?? this.app.workspace.getLeaf('tab');

		if (!existingLeaf) await leaf.openFile(file as TFile);
		this.app.workspace.revealLeaf(leaf);

		const view = leaf.view as any;
		if (view?.editor) {
			view.editor.setCursor({ line: task.sourceLine, ch: 0 });
			view.editor.scrollIntoView(
				{ from: { line: task.sourceLine, ch: 0 }, to: { line: task.sourceLine, ch: 0 } },
				true,
			);
		}
	}
}
