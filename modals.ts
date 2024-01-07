import {App, Modal, Setting} from "obsidian";
import {Provider, Workflow, WorkflowTask} from "./types";
import WorkflowPlugin from "./main";
import {
	addTaskToWorkflow,
	createSettingWithButton,
	createSettingWithText,
	createSettingWithTextArea,
	generateUniqueName
} from "./helpers";

/**
 * Represents a modal for managing API providers.
 * @extends Modal
 */
export class ProvidersModal extends Modal {
	provider: Provider;
	plugin: WorkflowPlugin;

	constructor(app: App, provider: Provider, plugin: WorkflowPlugin) {
		super(app);
		this.provider = provider;
		this.plugin = plugin;
	}

	onOpen() {
		let {contentEl} = this;
		// Set the title
		contentEl.createEl('h1', {text: `API Providers`});
		createSettingWithButton(contentEl, `Add Provider`, 'Add Provider', () => {
			// create a new provider
			let provider: Provider = {
				name: 'New Provider',
				model: 'model_here',
				apiKey: 'api_key_here',
				endpoint: 'https://api.openai.com/v1/chat/completions',
			};
			this.plugin.settings.providers.push(provider);
			// Save settings
			this.plugin.saveSettings().then(r => {
				this.close();
				this.open();
				this.plugin.settingsTab.refresh();
			});
		});

		// display all providers from the provider object
		for (let provider of this.plugin.settings.providers) {
			let providerDiv = contentEl.createEl('div');

			// add a heading for the provider
			providerDiv.createEl('h3', {text: provider.name});

			new Setting(providerDiv)
				.setName('Provider Name')
				.addText(textInput => textInput
					.setPlaceholder('Enter your provider name')
					.setValue(provider.name)
					.onChange(async value => {
						provider.name = value;
						await this.plugin.saveSettings();
						this.plugin.settingsTab.refresh();
					}));

			new Setting(providerDiv)
				.setName('Model')
				.addText(textInput => textInput
					.setPlaceholder('Enter your model')
					.setValue(provider.model)
					.onChange(async value => {
						provider.model = value;
						// Save settings
						await this.plugin.saveSettings();
						this.plugin.settingsTab.refresh();
					}));

			new Setting(providerDiv)
				.setName('API Key')
				.addText(textInput => textInput
					.setPlaceholder('Enter your API Key')
					.setValue(provider.apiKey)
					.onChange(async value => {
						provider.apiKey = value;
						// Save settings
						await this.plugin.saveSettings();
						this.plugin.settingsTab.refresh();
					}));

			new Setting(providerDiv)
				.setName('Endpoint')
				.addText(textInput => textInput
					.setPlaceholder('Enter your endpoint')
					.setValue(provider.endpoint)
					.onChange(async value => {
						provider.endpoint = value;
						await this.plugin.saveSettings();
						this.plugin.settingsTab.refresh();
					}));

			// Add a button to delete the provider
			new Setting(providerDiv)
				.setName(`Delete Provider`)
				.addButton(button => button
					.setWarning()
					.setIcon('trash')
					.setButtonText('Delete')
					.onClick(() => {
						// remove the provider from the settings
						this.plugin.settings.providers = this.plugin.settings.providers.filter(p => p.name !== provider.name);
						// Save settings
						this.plugin.saveSettings().then(r => {
							this.close();
							this.open();
							this.plugin.settingsTab.refresh();
						});
					}));


		}
	}

	onClose() {
		let {contentEl} = this;
		contentEl.empty();
		super.onClose();
		this.plugin.refreshSettingsTab();
	}
}


/**
 * Represents a modal for editing a workflow.
 * @extends Modal
 */
export class WorkflowModal extends Modal {
	workflow: Workflow;
	plugin: WorkflowPlugin;

	constructor(app: App, workflow: Workflow, plugin: WorkflowPlugin) {
		super(app);
		this.workflow = workflow;
		this.plugin = plugin;
	}

	onOpen() {
		let {contentEl} = this;
		// Set the title of the Modal to the workflow name
		contentEl.createEl('h2', {text: `Edit Workflow: ${this.workflow.workflowName}`});

		createSettingWithTextArea(contentEl, 'Workflow Name', this.workflow.workflowName, (value: string) => {
			this.workflow.workflowName = value;
		});

		createSettingWithButton(contentEl, `Add Task`, 'Add Task', () => addTaskToWorkflow(this.workflow, this.plugin));

		this.workflow.tasks.forEach((task, index) => {
			// add a heading for the task
			contentEl.createEl('h3', {text: task.name});

			createSettingWithTextArea(contentEl, 'Task Name', task.name, (value: string) => {
				task.name = value;
			});
			createSettingWithTextArea(contentEl, 'Prompt', task.prompt, (value: string) => {
				task.prompt = value;
			});

			new Setting(contentEl)
				.setName('Provider')
				.addDropdown(dropdown => {
					// Dynamically add each provider to the dropdown
					const providerOptions: Record<string, string> = {}
					this.plugin.settings.providers.forEach(provider => {
						providerOptions[provider.name] = provider.name;
					});
					dropdown.addOptions(providerOptions)
					dropdown.setValue(task.provider.name) // Use provider name as the value since our options keys are provider names
						.onChange(async value => {
							const selectedProvider = this.plugin.settings.providers.find(provider => provider.name === value);
							if (selectedProvider) { // Check if provider was found
								task.provider = selectedProvider;
							}
						});
				});

			createSettingWithText(contentEl, 'Temperature', task.temperature.toString(), (value: number) => {
				task.temperature = value;
			}, true);

			createSettingWithText(contentEl, 'Frequency Penalty', task.frequencyPenalty.toString(), (value: number) => {
				task.frequencyPenalty = value;
			}, true);

			createSettingWithText(contentEl, 'Max Tokens', task.maxTokens.toString(), (value: number) => {
				task.maxTokens = Number(value);
			}, true);

			// Add a button to delete the task
			createSettingWithButton(contentEl, `Delete Task`, 'Delete Task', () => {
				// remove the task from the workflow
				this.workflow.tasks = this.workflow.tasks.filter(t => t.name !== task.name);
				// Save settings
				this.plugin.saveSettings().then(r => {
					this.close();
					this.open();
					this.plugin.settingsTab.refresh();
				});
			});
		});
	}

	onClose() {
		let {contentEl} = this;
		contentEl.empty();
		super.onClose();
		this.plugin.refreshSettingsTab();
	}
}
