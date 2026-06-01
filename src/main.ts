import { Plugin, WorkspaceLeaf } from 'obsidian';
import { TaskPlannerView, VIEW_TYPE } from './TaskPlannerView';

export default class VaultTaskPlannerPlugin extends Plugin {
	async onload(): Promise<void> {
		this.registerView(VIEW_TYPE, (leaf) => new TaskPlannerView(leaf));

		this.addRibbonIcon('calendar-check', 'Open Task Planner', () => {
			this.activateView();
		});

		this.addCommand({
			id: 'open-task-planner',
			name: 'Open Task Planner',
			callback: () => this.activateView(),
		});
	}

	onunload(): void {
		this.app.workspace.detachLeavesOfType(VIEW_TYPE);
	}

	async activateView(): Promise<void> {
		const { workspace } = this.app;

		let leaf: WorkspaceLeaf | null = null;
		const existing = workspace.getLeavesOfType(VIEW_TYPE);

		if (existing.length > 0) {
			leaf = existing[0];
		} else {
			leaf = workspace.getRightLeaf(false);
			if (!leaf) leaf = workspace.getLeaf('tab');
			await leaf.setViewState({ type: VIEW_TYPE, active: true });
		}

		workspace.revealLeaf(leaf);
	}
}
