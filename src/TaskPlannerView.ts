import { ItemView, WorkspaceLeaf, TFile, Notice } from 'obsidian';
import { VaultTask, DateType, DATE_EMOJI, DATE_LABEL } from './types';
import { scanVault } from './taskScanner';
import { writeTaskDate, completeTask } from './taskWriter';

export const VIEW_TYPE = 'vault-task-planner';

function isoToday(): string {
	return new Date().toISOString().slice(0, 10);
}

function addDays(iso: string, n: number): string {
	const d = new Date(iso);
	d.setDate(d.getDate() + n);
	return d.toISOString().slice(0, 10);
}

function startOfWeek(iso: string): string {
	const d = new Date(iso);
	const day = d.getDay(); // 0=Sun
	const diff = day === 0 ? -6 : 1 - day; // Monday-based
	d.setDate(d.getDate() + diff);
	return d.toISOString().slice(0, 10);
}

function formatDisplayDate(iso: string): string {
	const [y, m, d] = iso.split('-');
	return `${d}/${m}/${y}`;
}

function shortFileName(path: string): string {
	return path.split('/').pop()?.replace(/\.md$/, '') ?? path;
}

function getTaskPrimaryDate(task: VaultTask): string | null {
	// Priority: due > before > end > start
	for (const type of ['due', 'before', 'end', 'start'] as DateType[]) {
		const d = task.dates.find(d => d.type === type);
		if (d) return d.value;
	}
	return null;
}

interface WeekColumn {
	startIso: string;
	endIso: string; // inclusive
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

export class TaskPlannerView extends ItemView {
	private tasks: VaultTask[] = [];
	private filterPath: string = '';
	private filterType: DateType | '' = '';

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
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
		this.registerEvent(
			this.app.vault.on('create', async () => this.refresh())
		);
		this.registerEvent(
			this.app.vault.on('delete', async () => this.refresh())
		);
	}

	async refresh(): Promise<void> {
		console.log('[TaskPlanner] refresh() start, tasks before:', this.tasks.length);
		this.tasks = await scanVault(this.app);
		console.log('[TaskPlanner] refresh() done, tasks after:', this.tasks.length);
		this.render();
	}

	private render(): void {
		const container = this.containerEl.children[1] as HTMLElement;
		container.empty();
		container.addClass('task-planner-root');

		this.renderHeader(container);
		this.renderTimeline(container);
		this.renderTaskList(container);
	}

	private renderHeader(container: HTMLElement): void {
		const header = container.createEl('div', { cls: 'tp-header' });
		header.createEl('h2', { text: 'Vault Task Planner' });

		const controls = header.createEl('div', { cls: 'tp-controls' });

		// Filter by file
		const fileSelect = controls.createEl('select', { cls: 'tp-select' });
		fileSelect.createEl('option', { value: '', text: 'All notes' });
		const paths = [...new Set(this.tasks.map(t => t.sourcePath))].sort();
		for (const p of paths) {
			const opt = fileSelect.createEl('option', { value: p, text: shortFileName(p) });
			if (p === this.filterPath) opt.selected = true;
		}
		fileSelect.addEventListener('change', () => {
			this.filterPath = fileSelect.value;
			this.render();
		});

		// Filter by date type
		const typeSelect = controls.createEl('select', { cls: 'tp-select' });
		typeSelect.createEl('option', { value: '', text: 'All date types' });
		for (const type of ['due', 'before', 'start', 'end'] as DateType[]) {
			const opt = typeSelect.createEl('option', {
				value: type,
				text: `${DATE_EMOJI[type]} ${DATE_LABEL[type]}`,
			});
			if (type === this.filterType) opt.selected = true;
		}
		typeSelect.addEventListener('change', () => {
			this.filterType = typeSelect.value as DateType | '';
			this.render();
		});

		const refreshBtn = controls.createEl('button', { cls: 'tp-btn', text: '↻ Refresh' });
		refreshBtn.addEventListener('click', () => this.refresh());

		const count = header.createEl('div', { cls: 'tp-count' });
		count.setText(`${this.filteredTasks().length} tasks`);
	}

	private filteredTasks(): VaultTask[] {
		return this.tasks.filter(t => {
			if (this.filterPath && t.sourcePath !== this.filterPath) return false;
			if (this.filterType) {
				if (!t.dates.some(d => d.type === this.filterType)) return false;
			}
			return true;
		});
	}

	private renderTimeline(container: HTMLElement): void {
		const today = isoToday();
		const windowStart = addDays(today, -7);
		const windowEnd = addDays(today, 28);

		// Build week columns
		const weeks: WeekColumn[] = [];
		let weekStart = startOfWeek(windowStart);
		while (weekStart <= windowEnd) {
			const days: DayBucket[] = [];
			for (let i = 0; i < 7; i++) {
				const iso = addDays(weekStart, i);
				if (iso < windowStart || iso > windowEnd) { weekStart = addDays(weekStart, 7); continue; }
				days.push({
					iso,
					label: new Date(iso + 'T00:00:00').toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric' }),
					isToday: iso === today,
					isPast: iso < today,
				});
			}
			if (days.length > 0) {
				const weekEnd = days[days.length - 1].iso;
				weeks.push({
					startIso: weekStart,
					endIso: weekEnd,
					label: `Settimana del ${formatDisplayDate(weekStart)}`,
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
			const weekEl = timelineEl.createEl('div', { cls: 'tp-week' + (week.isCurrentWeek ? ' tp-week--current' : '') });
			weekEl.createEl('div', { cls: 'tp-week-label', text: week.label });

			const daysEl = weekEl.createEl('div', { cls: 'tp-days' });

			for (const day of week.days) {
				const dayEl = daysEl.createEl('div', {
					cls: 'tp-day' +
						(day.isToday ? ' tp-day--today' : '') +
						(day.isPast ? ' tp-day--past' : ''),
				});
				dayEl.createEl('div', { cls: 'tp-day-label', text: day.label });

				const dayTasks = tasksWithDates.filter(t => getTaskPrimaryDate(t) === day.iso);
				if (dayTasks.length === 0) {
					dayEl.createEl('div', { cls: 'tp-day-empty', text: '—' });
				} else {
					for (const task of dayTasks) {
						this.renderTaskChip(dayEl, task);
					}
				}
			}
		}

		// Overdue section
		const overdue = tasksWithDates.filter(t => {
			const d = getTaskPrimaryDate(t);
			return d !== null && d < windowStart;
		});
		if (overdue.length > 0) {
			const overdueEl = section.createEl('div', { cls: 'tp-overdue' });
			overdueEl.createEl('div', { cls: 'tp-section-label', text: '⚠️ Scaduti (prima della finestra)' });
			for (const task of overdue) {
				this.renderTaskRow(overdueEl, task);
			}
		}
	}

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
				new Notice(`Could not complete task: ${err.message}`);
			}
		});

		const text = chip.createEl('span', { cls: 'tp-chip-text', text: task.text });
		text.addEventListener('click', () => this.openSource(task));

		const editBtn = chip.createEl('button', { cls: 'tp-chip-edit', text: '✎' });
		editBtn.addEventListener('click', (e) => {
			e.stopPropagation();
			this.openDateEditor(task, chip);
		});
	}

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
			for (const task of withDate) {
				this.renderTaskRow(section, task);
			}
		}

		if (unscheduled.length > 0) {
			section.createEl('div', { cls: 'tp-section-label', text: 'Unscheduled' });
			for (const task of unscheduled) {
				this.renderTaskRow(section, task);
			}
		}

		if (tasks.length === 0) {
			section.createEl('div', { cls: 'tp-empty', text: 'No incomplete tasks found.' });
		}
	}

	private renderTaskRow(parent: HTMLElement, task: VaultTask): void {
		const row = parent.createEl('div', { cls: 'tp-task-row' });

		const checkbox = row.createEl('span', { cls: 'tp-checkbox', text: '☐' });
		checkbox.setAttribute('title', 'Mark as complete');
		checkbox.addEventListener('click', async () => {
			// Optimistic UI: show checked state immediately
			checkbox.setText('☑');
			checkbox.addClass('tp-checkbox--done');
			row.addClass('tp-task-row--completing');
			try {
				await completeTask(this.app, task.sourcePath, task.sourceLine);
				// vault.on('modify') will trigger refresh and remove the row
			} catch (e) {
				// Revert on failure
				checkbox.setText('☐');
				checkbox.removeClass('tp-checkbox--done');
				row.removeClass('tp-task-row--completing');
				new Notice(`Could not complete task: ${e.message}`);
			}
		});

		const body = row.createEl('div', { cls: 'tp-task-body' });

		const textEl = body.createEl('span', { cls: 'tp-task-text', text: task.text });
		textEl.addEventListener('click', () => this.openSource(task));

		const meta = body.createEl('div', { cls: 'tp-task-meta' });
		meta.createEl('span', { cls: 'tp-task-source', text: shortFileName(task.sourcePath) });

		for (const d of task.dates) {
			const tag = meta.createEl('span', { cls: `tp-date-tag tp-date-${d.type}` });
			tag.setText(`${DATE_EMOJI[d.type]} ${d.value}`);
		}

		const editBtn = row.createEl('button', { cls: 'tp-btn-small', text: '+ Date' });
		editBtn.addEventListener('click', () => this.openDateEditor(task, row));
	}

	private openDateEditor(task: VaultTask, anchor: HTMLElement): void {
		// Remove any existing editor
		const existing = anchor.querySelector('.tp-date-editor');
		if (existing) { existing.remove(); return; }

		const editor = anchor.createEl('div', { cls: 'tp-date-editor' });

		const typeSelect = editor.createEl('select', { cls: 'tp-select' });
		for (const type of ['due', 'before', 'start', 'end'] as DateType[]) {
			const existing = task.dates.find(d => d.type === type);
			const opt = typeSelect.createEl('option', {
				value: type,
				text: `${DATE_EMOJI[type]} ${DATE_LABEL[type]}`,
			});
			if (existing) opt.setAttribute('data-current', existing.value);
		}

		const dateInput = editor.createEl('input', { cls: 'tp-date-input', type: 'date' });

		// Pre-fill if date already exists for selected type
		const prefill = () => {
			const selectedType = typeSelect.value as DateType;
			const existing = task.dates.find(d => d.type === selectedType);
			dateInput.value = existing?.value ?? isoToday();
		};
		prefill();
		typeSelect.addEventListener('change', prefill);

		const saveBtn = editor.createEl('button', { cls: 'tp-btn', text: 'Save' });
		saveBtn.addEventListener('click', async () => {
			const type = typeSelect.value as DateType;
			const value = dateInput.value;
			if (!value) { new Notice('Select a date first'); return; }
			try {
				await writeTaskDate(this.app, task.sourcePath, task.sourceLine, type, value);
				editor.remove();
				// refresh is triggered by vault.on('modify')
			} catch (e) {
				new Notice(`Error: ${e.message}`);
			}
		});

		const cancelBtn = editor.createEl('button', { cls: 'tp-btn tp-btn--cancel', text: 'Cancel' });
		cancelBtn.addEventListener('click', () => editor.remove());

		editor.appendChild(typeSelect);
		editor.appendChild(dateInput);
		editor.appendChild(saveBtn);
		editor.appendChild(cancelBtn);
	}

	private async openSource(task: VaultTask): Promise<void> {
		const file = this.app.vault.getAbstractFileByPath(task.sourcePath);
		if (!file) return;

		// Reuse an existing leaf that already has this file open, otherwise open a new tab
		const existing = this.app.workspace.getLeavesOfType('markdown')
			.find(l => (l.view as any)?.file?.path === task.sourcePath);
		const leaf = existing ?? this.app.workspace.getLeaf('tab');

		if (!existing) await leaf.openFile(file as TFile);

		this.app.workspace.revealLeaf(leaf);

		// Position cursor at the task line
		const view = leaf.view as any;
		if (view?.editor) {
			view.editor.setCursor({ line: task.sourceLine, ch: 0 });
			view.editor.scrollIntoView({ from: { line: task.sourceLine, ch: 0 }, to: { line: task.sourceLine, ch: 0 } }, true);
		}
	}
}
