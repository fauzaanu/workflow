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
import {ProviderModel, WorkflowTask, Workflow, WorkflowSettings} from './src/types';
import {
	createFileMenu,
	generateRandomIcon,
	generateUniqueName,
	grabLastSectionByLine, ignoreBotLines,
	removeEmptyLines,
	removeEmptyLinesfromStart
} from "./src/helpers";
import {call_provider} from "./src/api_calls";
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

		// Get all .workflow files in the vault
		const workflowFiles = this.app.vault.getFiles().filter(file => file.extension === 'workflow');

		// For each .workflow file, load and parse its JSON content, then process it
		for (const workflowFile of workflowFiles) {
			try {
				const fileContent = await this.app.vault.read(workflowFile);
				const parsedContent = JSON.parse(fileContent);

				// Here: Add parsedContent to your list of workflows. Make sure that
				// parsedContent is indeed a valid workflow object by checking its structure.
			} catch (e) {
				console.log(`Failed to load or parse .workflow file: ${workflowFile.basename}`, e);
			}
		}

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
				const fileMenu = createFileMenu(new Menu(), this.settings.workflows);
// add the file menu to the ribbon icon
				fileMenu.showAtPosition(currentMousePosition);

			}
		);



		this.addCommand({
			id: 'show-file-menu',
			name: 'Show File Menu',
			callback: () => {
				const fileMenu = createFileMenu(new Menu(), this.settings.workflows);
// show at the previously recorded mouse position
				fileMenu.showAtPosition(currentMousePosition);
			}
		});


		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {
		// save the settings
		this.saveSettings().then(r => {
			console.log("Settings saved successfully.");
		});
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
