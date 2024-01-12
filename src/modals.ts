import {App, Modal, Setting} from "obsidian";
import {ApiKey, ProviderName, Temperature, Workflow, WorkflowTask} from "./types";
import WorkflowPlugin from "../main";
import {
	createSettingTemperature,
	createSettingWithButton,
	createSettingWithText,
	createSettingWithTextArea,
	generateUniqueName
} from "./helpers";


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
		this.render();
		let {contentEl} = this;
		contentEl.empty();

		contentEl.createEl('h1', {text: `Workflow: ${this.workflow.workflowName}`});

		// edit workflow name
		createSettingWithTextArea(contentEl, 'Workflow Name', this.workflow.workflowName, (value: string) => {
			this.workflow.workflowName = value;
			this.plugin.saveSettings().then(() => {
				this.close();
				this.open();
			});
		});

		this.workflow.tasks.forEach((task) => {
			let taskEl = contentEl.createEl('div');
			taskEl.innerHTML = `
            <h2>${task.name}</h2>
            <p>${task.prompt}</p>
            <p>Provider: ${task.provider.name}</p>
            <p>Temperature: ${task.temperature}</p>
            <p>Max Tokens: ${task.maxTokens}</p>
        `;

			// edit button
			let editButton = taskEl.createEl('button', {text: 'Edit this Task'});
			editButton.addEventListener('click', () => {
				new TaskModal(this.app, task, this.workflow, this, this.plugin, false).open();
			});

			// delete button
			let deleteButton = taskEl.createEl('button', {text: 'Delete this Task'});
			deleteButton.addEventListener('click', () => {
				this.workflow.tasks = this.workflow.tasks.filter(t => t.name !== task.name);
				this.plugin.saveSettings().then(() => {
					this.close();
					this.open();
				});
			});
		});

		// add task button
		let addTaskButton = contentEl.createEl('button', {text: 'Add Task'});
		addTaskButton.addEventListener('click', () => {
			new TaskModal(this.app, {
				name: generateUniqueName("TSK"),
				prompt: 'prompt_here',
				provider: this.plugin.settings.providers[0],
				temperature: 'Medium',  // or 'Creative' | 'Precise'
				maxTokens: 500,
			}, this.workflow, this, this.plugin, true).open();
		});
	}

	onClose() {
		let {contentEl} = this;
		contentEl.empty();
		super.onClose();
		this.plugin.refreshSettingsTab();
	}

	reload() {
		this.close();
		this.open();
	}

	render() {
		let {contentEl} = this;
		contentEl.empty();
	}

	refreshModal() {
		this.close();
		this.open();
	}
}


export class ApiKeysModal extends Modal {
	plugin: WorkflowPlugin;

	constructor(app: App, plugin: WorkflowPlugin) {
		super(app);
		this.plugin = plugin;
	}

	onOpen() {
		let {contentEl} = this;
		// Set the title
		contentEl.createEl('h1', {text: `Add API Keys`});

		// Fetch keys from settings or set with empty string by default
		const OpenAIKey = this.plugin.settings.apiKeys.find(key => key.name === 'openai')?.apiKey || '';
		const PerplexityKey = this.plugin.settings.apiKeys.find(key => key.name === 'perplexity')?.apiKey || '';

		// Edit OpenAI API Key
		new Setting(contentEl)
			.setName('OpenAI API Key')
			.addText(textInput => textInput
				.setPlaceholder('Enter your API Key for OpenAI')
				.setValue(OpenAIKey)
				.onChange(async value => {
					this.updateAPIKey('openai', value)
				}));

		// Edit Perplexity API Key
		new Setting(contentEl)
			.setName('Perplexity API Key')
			.addText(textInput => textInput
				.setPlaceholder('Enter your API Key for Perplexity ')
				.setValue(PerplexityKey)
				.onChange(async value => {
					this.updateAPIKey('perplexity', value);
				}));
	}

	// Handle updating an API Key
	updateAPIKey(name: ProviderName, apiKey: string) {
		let keyIndex = this.plugin.settings.apiKeys.findIndex(key => key.name === name);

		// If the key does not exist in settings, we add a new key
		if (keyIndex === -1) {
			const newKey: ApiKey = {name, apiKey};
			this.plugin.settings.apiKeys.push(newKey);
		}
		// else we just update the key
		else {
			this.plugin.settings.apiKeys[keyIndex].apiKey = apiKey;
		}

		// Also update the apiKey in the providers array
		this.plugin.settings.providers.forEach(provider => {
			if (provider.name === name) {
				provider.apiKey = apiKey;
			}
		});

		this.plugin.saveSettings().then(() => {
			this.plugin.settingsTab.refresh();
			this.plugin.settingsTab.display();
		});
	}

	// Handle adding a new API Key
	addAPIKey(name: ProviderName, apiKey: string) {
		const newKey: ApiKey = {name, apiKey};
		this.plugin.settings.apiKeys.push(newKey);
		this.plugin.saveSettings().then(() => {
			this.plugin.settingsTab.refresh();
		});
	}

	onClose() {
		let {contentEl} = this;
		contentEl.empty();
		super.onClose();
		this.plugin.refreshSettingsTab();
	}
}


export class TaskModal extends Modal {
	task: WorkflowTask;
	plugin: WorkflowPlugin;
	workflow: Workflow;
	workflowModal: WorkflowModal;
	isNewTask: boolean;

	constructor(app: App, task: WorkflowTask, workflow: Workflow, workflowModal: WorkflowModal, plugin: WorkflowPlugin, isNewTask: boolean) {
		super(app);
		this.task = task;
		this.plugin = plugin;
		this.workflow = workflow;
		this.workflowModal = workflowModal;
		this.isNewTask = isNewTask;
	}

	onOpen() {
		let {contentEl} = this;
		// Set the title of the Modal to the task name
		contentEl.createEl('h2', {text: `Edit Task: ${this.task.name}`});

		createSettingWithTextArea(contentEl, 'Task Name', this.task.name, (value: string) => {
			this.task.name = value;
		});

		createSettingWithTextArea(contentEl, 'Prompt', this.task.prompt, (value: string) => {
			this.task.prompt = value;
		});

		// temperature
		createSettingTemperature(contentEl, 'Temperature', this.task.temperature, (value: string) => {
			this.task.temperature = value as Temperature;
		});

		// max tokens
		createSettingWithText(contentEl, 'Max Tokens', this.task.maxTokens.toString(), (value: number) => {
			this.task.maxTokens = Number(value);
			this.plugin.saveSettings().then(() => {
				this.close();
				this.open();
			});
		}, true);

		new Setting(contentEl)
			.setName('Provider')
			.addDropdown(dropdown => {
				// Dynamically add each provider to the dropdown
				const providerOptions: Record<string, string> = {}
				this.plugin.settings.providers.forEach(provider => {

					// If the provider does not have an API Key, we don't add it to the dropdown
					if (provider.apiKey.trim() === '') {
						return;
					}

					providerOptions[provider.model] = provider.model;
				});
				dropdown.addOptions(providerOptions)
				dropdown.setValue(this.task.provider.model) // Use provider name as the value since our options keys are provider names
					.onChange(async value => {
						const selectedProvider = this.plugin.settings.providers.find(provider => provider.model === value);
						if (selectedProvider) { // Check if provider was found
							this.task.provider = selectedProvider;
						}
					});
			});

		// save button
		createSettingWithButton(contentEl, `Save Task`, 'Save Task', () => {
			if (this.isNewTask) {
				this.workflow.tasks.push(this.task);
			}
			this.plugin.saveSettings().then(() => {
				this.close();
				this.workflowModal.reload();
			});
		});

		// delete button
		createSettingWithButton(contentEl, `Delete Task`, 'Delete Task', () => {
			// remove the task from the workflow
			this.workflow.tasks = this.workflow.tasks.filter(t => t.name !== this.task.name);
			// Save settings
			this.plugin.saveSettings().then(() => {
				this.close();
				this.workflowModal.reload();
			});
		});
	}

}
