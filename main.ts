import {
	App,
	MarkdownView,
	Menu,
	Modal,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting
} from 'obsidian';
import {WorkflowSettings} from './src/types';
import {
	createFileMenu,
} from "./src/helpers";
import {DEFAULT_SETTINGS, WorkflowSettingTab} from "./src/settings";

/**
 * Represents a WorkflowPlugin that extends the Plugin class.
 * @class
 * @extends Plugin
 */
export default class WorkflowPlugin
	extends Plugin {
	settings: WorkflowSettings;
	settingsTab: WorkflowSettingTab;

	refreshSettingsTab() {
		if (this.settingsTab) {
			this.settingsTab.refresh();
		}
	}

	async onload() {
		await this.loadSettings();

		this.settings.providers = DEFAULT_SETTINGS.providers.map(defaultProvider => {
			// Find the API key from the saved data for this provider
			let apiKeyEntry = this.settings.apiKeys.find(
				entry => entry.name === defaultProvider.name
			);
			// If it exists, assign it to the apiKey of the provider, else keep it as is
			return apiKeyEntry
				? {...defaultProvider, apiKey: apiKeyEntry.apiKey}
				: defaultProvider;
		});

		// Save the updated settings
		await this.saveData(this.settings);


		const workflows = this.settings.workflows;

		// add the workflow settings tab
		this.settingsTab = new WorkflowSettingTab(this.app, this);
		this.addSettingTab(this.settingsTab);

		let currentMousePosition = {x: 0, y: 0};
		window.addEventListener('mousemove', function (event) {
			currentMousePosition.x = event.clientX;
			currentMousePosition.y = event.clientY;
		});


		// create a ribbon icon and add a menu item to the ribbon icon per workflow
		this.addRibbonIcon('book', 'Run Workflow', (evt: MouseEvent) => {
				// create a file menu on the ribbon icon
				const fileMenu = createFileMenu(new Menu(), workflows, this.settings);
				// add the file menu to the ribbon icon
				fileMenu.showAtPosition(currentMousePosition);

			}
		);


		this.addCommand({
			id: 'show-file-menu',
			name: 'Show File Menu',
			callback: () => {
				const fileMenu = createFileMenu(new Menu(), this.settings.workflows, this.settings);
				// show at the previously recorded mouse position
				fileMenu.showAtPosition(currentMousePosition);
			}
		});
	}

	onunload() {
		// save the settings
		this.saveSettings();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
