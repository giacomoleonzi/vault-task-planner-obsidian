import { Plugin, WorkspaceLeaf } from 'obsidian';
import { TaskPlannerView, VIEW_TYPE } from './TaskPlannerView';
import { TaskPlannerSettingTab } from './settings';
import { PluginSettings, DEFAULT_SETTINGS } from './types';

export default class VaultTaskPlannerPlugin extends Plugin {
	settings: PluginSettings = { ...DEFAULT_SETTINGS };

	async onload(): Promise<void> {
		await this.loadSettings();

		this.registerView(VIEW_TYPE, (leaf) => new TaskPlannerView(leaf, this));

		this.addRibbonIcon('calendar-check', 'Open task planner', () => {
			void this.activateView();
		});

		this.addCommand({
			id: 'open-task-planner',
			name: 'Open task planner',
			callback: () => { void this.activateView(); },
		});

		this.addSettingTab(new TaskPlannerSettingTab(this.app, this));
	}

	onunload(): void {
		// Do not detach leaves on unload — Obsidian handles view lifecycle
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<PluginSettings>);
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
		// Refresh any open planner views so the new range takes effect immediately
		this.app.workspace.getLeavesOfType(VIEW_TYPE).forEach(leaf => {
			(leaf.view as TaskPlannerView).render();
		});
	}

	async activateView(): Promise<void> {
		const { workspace } = this.app;
		const existing = workspace.getLeavesOfType(VIEW_TYPE);

		let leaf: WorkspaceLeaf;
		if (existing.length > 0) {
			leaf = existing[0];
		} else {
			leaf = workspace.getRightLeaf(false) ?? workspace.getLeaf('tab');
			await leaf.setViewState({ type: VIEW_TYPE, active: true });
		}

		void workspace.revealLeaf(leaf);
	}
}
