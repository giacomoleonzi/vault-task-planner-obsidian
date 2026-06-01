import { App, PluginSettingTab, Setting } from 'obsidian';
import { PluginSettings } from './types';
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

		containerEl.createEl('h2', { text: 'Vault Task Planner — Settings' });

		containerEl.createEl('p', {
			text: 'Configure the default timeline window. You can also adjust it directly in the planner view.',
			cls: 'setting-item-description',
		});

		new Setting(containerEl)
			.setName('Weeks back')
			.setDesc('How many weeks before today to include in the timeline.')
			.addSlider(slider => slider
				.setLimits(0, 8, 1)
				.setValue(this.plugin.settings.weeksBack)
				.setDynamicTooltip()
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
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.weeksForward = value;
					await this.plugin.saveSettings();
				})
			);
	}
}
