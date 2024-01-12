import {App, PluginSettingTab, Setting} from "obsidian";
import {ApiKeysModal, WorkflowModal} from "./modals";
import {Workflow, WorkflowSettings} from "./types";
import {generateRandomIcon, generateUniqueName} from "./helpers";
import WorkflowPlugin from "../main";

/**
 * A class representing the Workflow Setting Tab.
 * @extends PluginSettingTab
 */
export class WorkflowSettingTab
	extends PluginSettingTab {
	plugin: WorkflowPlugin;  // Replace "MyPlugin" with the name of your plugin class

	constructor(app: App, plugin: WorkflowPlugin) {
		super(app, plugin);
		this.plugin = plugin;
		this.refresh();  // call refresh instead of display
	}

	refresh() {
		this.containerEl.empty();  // Clear the UI
		this.display();  // Generate the UI again
	}

	display(): void {
		const {containerEl} = this;
		// Here you can add your dynamic content as explained in the previous response
		// this.plugin.settings will give you access to your plugin's settings
		containerEl.empty(); // Clear the settings container



		containerEl.createEl('h1', {text: 'Set API Keys'});
		// button to edit / view providers
		new Setting(containerEl)
			.setName('Add API Keys')
			.addButton(button => button
				.setButtonText('Edit')
				.onClick(() => {
					let modal = new ApiKeysModal(this.app, this.plugin);
					modal.open();
				}));

		containerEl.createEl('h1', {text: 'LLM Models'});

		let infoDiv = containerEl.createEl('div');
		infoDiv.createEl('p', {text: `Once you have added your API keys, you can use the specefic models below`});

		let providersDiv = containerEl.createEl('div');
		let amountOfProviders = this.plugin.settings.providers.length;

		// list all providers and models
		for (let provider of this.plugin.settings.providers) {
			const status = provider.apiKey.trim() === '' ? '🔴' : '🟢';
			providersDiv.createEl('p', {text: `${status} / ${provider.name} / ${provider.model}`});
		}


		containerEl.createEl('h1', {text: 'Workflows'});
		// button to add a new workflow
		new Setting(containerEl)
			.setName('Add Workflow')
			.addButton(button => button
				.setButtonText('Add')
				.onClick(() => {
					// create a new workflow
					let workflow: Workflow = {
						workflowName: generateUniqueName("WF"),
						workflowIcon: generateRandomIcon(),
						tasks: [],
					};
					this.plugin.settings.workflows.push(workflow);
					// Come back to the same scroll position
					let scrollPosition = containerEl.scrollTop;
					this.display();
					containerEl.scrollTop = scrollPosition;
					// Save settings
					this.plugin.saveSettings().then(r => {
						this.refresh();
					});
				}));

		this.plugin.settings.workflows.forEach((workflow, index) => {
			let workflowDiv = containerEl.createEl('div');

			// add a heading for the workflow
			workflowDiv.createEl('h3', {text: workflow.workflowName});
			if (workflow.tasks.length > 0) {
				workflowDiv.createEl('p', {text: `Tasks: ${workflow.tasks.length}`});
				workflowDiv.createEl('p', {text: `Providers: ${workflow.tasks.map(task => task.provider.name).join(', ')}`});
			}

			new Setting(workflowDiv)
				.addButton(button => button
					.setButtonText('Edit / View Workflow')
					.onClick(() => {
						let modal = new WorkflowModal(this.app, workflow, this.plugin);
						modal.open();
						this.plugin.saveSettings().then(r => {
							this.refresh();
						});
					}))
				.addButton(button => button
					.setButtonText('Delete Workflow')
					.setWarning()
					.setIcon('trash')
					.onClick(() => {
						// remove the workflow from the settings
						this.plugin.settings.workflows = this.plugin.settings.workflows.filter(w => w.workflowName !== workflow.workflowName);
						let scrollPosition = containerEl.scrollTop;
						this.display();
						// come back to scroll position
						containerEl.scrollTop = scrollPosition;
						this.plugin.saveSettings().then(r => {
							this.refresh();
						});
					}));
		});
	}
}

/**
 * Default settings object for PpxObsidian.
 * @typedef {Object} PpxObsidianSettings
 * @property {string} openaiKey - The OpenAI key.
 * @property {string} ppxKey - The Ppx key.
 * @property {Array} workflows - An array of workflows.
 * @property {Array} providers - An array of providers.
 */
export const DEFAULT_SETTINGS: WorkflowSettings = {
	workflows: [],
	providers: [
		// Models from Perplexity
		{name: 'perplexity', model: 'pplx-7b-online', apiKey: ''},
		{name: 'perplexity', model: 'pplx-70b-online', apiKey: ''},
		{name: 'perplexity', model: 'pplx-7b-chat', apiKey: ''},
		{name: 'perplexity', model: 'pplx-70b-chat', apiKey: ''},
		{name: 'perplexity', model: 'mistral-7b-instruct', apiKey: ''},
		{name: 'perplexity', model: 'mistral-8x7b-instruct', apiKey: ''},
		{name: 'perplexity', model: 'codellama-34b-instruct', apiKey: ''},
		{name: 'perplexity', model: 'llama-2-70b-chat', apiKey: ''},

		// Models from OpenAI
		{name: 'openai', model: 'gpt-3.5-turbo', apiKey: ''},
		{name: 'openai', model: 'gpt-4', apiKey: ''},
	],
	apiKeys: [],
}


