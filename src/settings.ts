import { App, PluginSettingTab, Setting } from 'obsidian';
import type { PluginSettings } from './types';
import VaultTaskPlannerPlugin from './main';

export class TaskPlannerSettingTab extends PluginSettingTab {
	private plugin: VaultTaskPlannerPlugin;

	constructor(app: App, plugin: VaultTaskPlannerPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl).setHeading().setName('Timeline window');

		containerEl.createEl('p', {
			text: 'Set the default range of weeks shown in the timeline. You can also adjust this on the fly directly in the planner view.',
			cls: 'setting-item-description',
		});

		new Setting(containerEl)
			.setName('Weeks back')
			.setDesc('How many weeks before today to include in the timeline.')
			.addSlider(slider => slider
				.setLimits(0, 8, 1)
				.setValue(this.plugin.settings.weeksBack)
				.onChange(async (value) => {
					this.plugin.settings.weeksBack = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName('Weeks forward')
			.setDesc('How many weeks ahead of today to include in the timeline.')
			.addSlider(slider => slider
				.setLimits(1, 12, 1)
				.setValue(this.plugin.settings.weeksForward)
				.onChange(async (value) => {
					this.plugin.settings.weeksForward = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl).setHeading().setName('Appearance');

		new Setting(containerEl)
			.setName('Task font size')
			.setDesc('Font size (in px) for task text in the list and timeline chips.')
			.addSlider(slider => slider
				.setLimits(10, 24, 1)
				.setValue(this.plugin.settings.taskFontSize)
				.onChange(async (value) => {
					this.plugin.settings.taskFontSize = value;
					await this.plugin.saveSettings();
				})
			);
	}
}

// Satisfy the linter — PluginSettings is used as a type import above
export type { PluginSettings };
