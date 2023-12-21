import {
	App,
	IconName,
	MarkdownView,
	Menu,
	Modal,
	Notice,
	Plugin,
	PluginSettingTab,
	requestUrl,
	RequestUrlParam,
	RequestUrlResponse,
	Setting
} from 'obsidian';

/**
 * Represents a provider that can be used to fetch data from an API.
 * @interface Provider
 */
interface Provider {
	name: string;
	model: string;
	apiKey: string;
	endpoint: string;
}

/**
 * Represents a workflow task.
 * @interface
 * @property {string} name - The name of the task.
 * @property {Provider} provider - The provider of the task.
 * @property {number} temperature - The temperature for task execution.
 * @property {number} frequencyPenalty - The frequency penalty for task execution.
 * @property {number} maxTokens - The maximum number of tokens allowed for task execution.
 * @property {string} prompt - The prompt for the task.
 * @property {string} systemPrompt - The system prompt for the task.
 * @property {TaskMode} mode - The mode for task execution.
 */
interface WorkflowTask {
	name: string;
	provider: Provider;
	temperature: number;
	frequencyPenalty: number;
	maxTokens: number;
	prompt: string;
	systemPrompt: string;
}

/**
 * Represents a workflow that needs to be executed.
 *
 * @interface
 */
interface Workflow {
	workflowName: string;
	workflowIcon: IconName;
	tasks: WorkflowTask[];
	objective: string; // inject the objective into the system propmpt so that the LLM knows what the end goal is
}

/**
 * Represents the settings for PpxObsidian.
 * @interface
 */
interface PpxObsidianSettings {
	openaiKey: string;
	ppxKey: string;
	workflows: Workflow[];
	providers: Provider[];
}

/**
 * Default settings object for PpxObsidian.
 * @typedef {Object} PpxObsidianSettings
 * @property {string} openaiKey - The OpenAI key.
 * @property {string} ppxKey - The Ppx key.
 * @property {Array} workflows - An array of workflows.
 * @property {Array} providers - An array of providers.
 */
const DEFAULT_SETTINGS: PpxObsidianSettings = {
	openaiKey: '',
	ppxKey: '',
	workflows: [],
	providers: [],
}

/**
 * Generates a unique task name by combining a randomly generated unique ID and a randomly selected element name from the periodic table.
 *
 * @param {string} append - The string to append to the unique task name.
 * @returns {string} The unique task name.
 */
function generateUniqueName(append: string): string {
	const periodicTableElements = [
		"Hydrogen",
		"Helium",
		"Lithium",
		"Beryllium",
		"Boron",
		"Carbon",
		"Nitrogen",
		"Oxygen",
		"Fluorine",
		"Neon",
		"Sodium",
		"Magnesium",
		"Aluminum",
		"Silicon",
		"Phosphorus",
		"Sulfur",
		"Chlorine",
		"Argon",
		"Potassium",
		"Calcium",
		"Scandium",
		"Titanium",
		"Vanadium",
		"Chromium",
		"Manganese",
		"Iron",
		"Cobalt",
		"Nickel",
		"Copper",
		"Zinc",
		"Gallium",
		"Germanium",
		"Arsenic",
		"Selenium",
		"Bromine",
		"Krypton",
		"Rubidium",
		"Strontium",
		"Yttrium",
		"Zirconium",
		"Niobium",
		"Molybdenum",
		"Technetium",
		"Ruthenium",
		"Rhodium",
		"Palladium",
		"Silver",
		"Cadmium",
		"Indium",
		"Tin",
		"Antimony",
		"Tellurium",
		"Iodine",
		"Xenon",
		"Cesium",
		"Barium",
		"Lanthanum",
		"Cerium",
		"Praseodymium",
		"Neodymium",
		"Promethium",
		"Samarium",
		"Europium",
		"Gadolinium",
		"Terbium",
		"Dysprosium",
		"Holmium",
		"Erbium",
		"Thulium",
		"Ytterbium",
		"Lutetium",
		"Hafnium",
		"Tantalum",
		"Tungsten",
		"Rhenium",
		"Osmium",
		"Iridium",
		"Platinum",
		"Gold",
		"Mercury",
		"Thallium",
		"Lead",
		"Bismuth",
		"Polonium",
		"Astatine",
		"Radon",
		"Francium",
		"Radium",
		"Actinium",
		"Thorium",
		"Protactinium",
		"Uranium",
		"Neptunium",
		"Plutonium",
		"Americium",
		"Curium",
		"Berkelium",
		"Californium",
		"Einsteinium"
	];
	const uniqueid = Math.floor(Math.random() * 1000);
	const randomElement = Math.floor(Math.random() * 99);
	const elementName = periodicTableElements[randomElement];
	return `${append}-${uniqueid}-${elementName}`;
}


/**
 * Makes a request to a provider using the given messages and provider information.
 *
 * @param {string} notes - The current notes.
 * @param {Provider} provider - The provider information.
 * @param {WorkflowTask} workflowTask - The workflow task.
 * @param {Workflow} workflow - The workflow.
 * @returns {Promise<string>} A promise that resolves with the content of the first choice of the response, or rejects with an error message.
 */
async function call_provider(notes: string, provider: Provider, workflowTask: WorkflowTask, workflow: Workflow): Promise<string> {
	const options: RequestUrlParam = {
		method: 'POST',
		url: provider.endpoint,
		headers: {
			'accept': 'application/json',
			'content-type': 'application/json',
			'authorization': `Bearer ${provider.apiKey}`,
		},
		body: JSON.stringify({
			model: provider.model,
			messages: [
				{role: 'system', content: workflowTask.systemPrompt},
				{
					role: 'system',
					content: "Make sure your answer helps in achiving the following objective" + workflow.objective
				},
				{role: 'user', content: workflowTask.prompt + "current notes:" + notes},
			],
			temperature: workflowTask.temperature,
			presence_penalty: workflowTask.frequencyPenalty,
			max_tokens: workflowTask.maxTokens,
		})
	};

	try {
		const response: RequestUrlResponse = await requestUrl(options);
		const responseData = response.json; // Directly accessing the json property
		// new Notice('Response from OpenAI API: ' + JSON.stringify(responseData));
		return responseData.choices[0].message.content;
	} catch (error) {
		let errorMessage = 'An error occurred: ' + error;
		new Notice(errorMessage);
		return errorMessage;
	}
}

/**
 * Generates a random icon from a predefined list of icons.
 *
 * @returns {string} A random icon from the list.
 */
function generateRandomIcon() {
	// generate a random icon
	const icons = [
		'book-a',
		'book-audio',
		'book-open',
		'book-copy',
		'book-dashed',
		'pen-line',
		'library-big',
		'message-circle-more',
	]
	const randomIcon = Math.floor(Math.random() * 8);
	return icons[randomIcon];
}

/**
 * A class representing the Workflow Setting Tab.
 * @extends PluginSettingTab
 */
class WorkflowSettingTab
	extends PluginSettingTab {
	plugin: PpxObsidian;  // Replace "MyPlugin" with the name of your plugin class

	constructor(app: App, plugin: PpxObsidian) {
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
		containerEl.createEl('h1', {text: 'API Providers'});
		// list all providers as labels, name, model,temperature, frequency penalty, max tokens
		let providersDiv = containerEl.createEl('div');
		let amountOfProviders = this.plugin.settings.providers.length;

		providersDiv.createEl('p', {text: `Amount of Providers: ${amountOfProviders}`});

		// button to edit / view providers
		new Setting(containerEl)
			.setName('Edit / View Providers')
			.addButton(button => button
				.setButtonText('Edit')
				.onClick(() => {
					let modal = new ProvidersModal(this.app, this.plugin.settings.providers[0], this.plugin);
					modal.open();
				}));


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
						objective: 'objective_here',
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
			workflowDiv.createEl('p', {text: `Objective: ${workflow.objective}`});
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
 * Represents a modal for managing API providers.
 * @extends Modal
 */
class ProvidersModal extends Modal {
	provider: Provider;
	plugin: PpxObsidian;

	constructor(app: App, provider: Provider, plugin: PpxObsidian) {
		super(app);
		this.provider = provider;
		this.plugin = plugin;
	}

	onOpen() {
		let {contentEl} = this;
		// Set the title
		contentEl.createEl('h1', {text: `API Providers`});

		// button to add a new provider
		new Setting(contentEl)
			.setName('Add Provider')
			.addButton(button => button
				.setButtonText('Add')
				.onClick(() => {
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
				}));

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
class WorkflowModal extends Modal {
	workflow: Workflow;
	plugin: PpxObsidian;

	constructor(app: App, workflow: Workflow, plugin: PpxObsidian) {
		super(app);
		this.workflow = workflow;
		this.plugin = plugin;
	}

	onOpen() {
		let {contentEl} = this;
		// Set the title of the Modal to the workflow name
		contentEl.createEl('h2', {text: `Edit Workflow: ${this.workflow.workflowName}`});

		// edit all the workflow properties
		new Setting(contentEl)
			.setName('Workflow Name')
			.addTextArea(textArea => {
				textArea
					.setPlaceholder('Enter your workflow name')
					.setValue(this.workflow.workflowName)
					.onChange(async value => {
						this.workflow.workflowName = value;
					});
				textArea.inputEl.style.height = '100%';  // Set textarea height to 100%
				textArea.inputEl.style.width = '100%';  // Set textarea width to 100%
			});

		// edit workflow object
		new Setting(contentEl)
			.setName('Objective')
			.addTextArea(textArea => {
				textArea
					.setPlaceholder('Enter your workflow objective')
					.setValue(this.workflow.objective)
					.onChange(async value => {
						this.workflow.objective = value;
					});
				textArea.inputEl.style.height = '100%';  // Set textarea height to 100%
				textArea.inputEl.style.width = '100%';  // Set textarea width to 100%
			});

		// add a button to add a new task
		new Setting(contentEl)
			.setName(`Add Task`)
			.addButton(button => button
				.setButtonText('Add Task')
				.setCta()
				.onClick(() => {
					// create a new task
					let task: WorkflowTask = {
						name: generateUniqueName("TSK"),
						prompt: 'prompt_here',
						systemPrompt: 'system_prompt_here',
						// for the provider grab the first provider in the list
						provider: this.plugin.settings.providers[0],
						temperature: 0,
						frequencyPenalty: 2.0,
						maxTokens: 0,
					};
					this.workflow.tasks.push(task);
					// Refresh the display to include the new task edit fields
					this.plugin.saveSettings().then(r => {
						this.close();
						this.open();
					});
				}));


		// edit tasks
		this.workflow.tasks.forEach((task, index) => {
			// add a heading for the task
			contentEl.createEl('h3', {text: task.name});

			new Setting(contentEl)
				.setName('Task Name')
				.addTextArea(textArea => {
					textArea
						.setPlaceholder('Enter your task name')
						.setValue(task.name)
						.onChange(async value => {
							task.name = value;
						});
					textArea.inputEl.style.height = '100%';  // Set textarea height to 100%
					textArea.inputEl.style.width = '100%';  // Set textarea width to 100%
				});

			new Setting(contentEl)
				.setName('Prompt')
				.addTextArea(textArea => {
					textArea
						.setPlaceholder('Enter your task prompt')
						.setValue(task.prompt)
						.onChange(async value => {
							task.prompt = value;
						});
					textArea.inputEl.style.height = '100%';  // Set textarea height to 100%
					textArea.inputEl.style.width = '100%';  // Set textarea width to 100%
				});

			new Setting(contentEl)
				.setName('System Prompt')
				.addTextArea(textArea => {
					textArea
						.setPlaceholder('Enter your task system prompt')
						.setValue(task.systemPrompt)
						.onChange(async value => {
							task.systemPrompt = value;
						});
					textArea.inputEl.style.height = '100%';  // Set textarea height to 100%
					textArea.inputEl.style.width = '100%';  // Set textarea width to 100%
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

			new Setting(contentEl)
				.setName('Temperature')
				.addText(textInput => textInput
					.setPlaceholder('Enter your temperature')
					.setValue(task.temperature.toString())
					.onChange(async value => {
						task.temperature = Number(value);
					}));


			new Setting(contentEl)
				.setName('Frequency Penalty')
				.addText(textInput => textInput
					.setPlaceholder('Enter your frequency penalty')
					.setValue(task.frequencyPenalty.toString())
					.onChange(async value => {
						task.frequencyPenalty = Number(value);
					}));

			new Setting(contentEl)
				.setName('Max Tokens')
				.addText(textInput => textInput
					.setPlaceholder('Enter your max tokens')
					.setValue(task.maxTokens.toString())
					.onChange(async value => {
						task.maxTokens = Number(value);
					}));


			// add delete task button
			new Setting(contentEl)
				.setName(`Delete Task`)
				.addButton(button => button
					.setButtonText('Delete')
					.setWarning()
					.setIcon('trash')
					.onClick(() => {
						// remove the task from the workflow
						this.workflow.tasks = this.workflow.tasks.filter(t => t.name !== task.name);
						// Refresh the display to remove the deleted task
						// Save settings
						this.plugin.saveSettings().then(r => {
							this.close();
							this.open();
						});
					}));
		});

		// add a button to add a new task
		new Setting(contentEl)
			.setName(`Add Task`)
			.addButton(button => button
				.setButtonText('Add Task')
				.setCta()
				.onClick(() => {
					// create a new task
					let task: WorkflowTask = {
						name: generateUniqueName("TSK"),
						prompt: 'prompt_here',
						systemPrompt: 'system_prompt_here',
						// for the provider grab the first provider in the list
						provider: this.plugin.settings.providers[0],
						temperature: 0,
						frequencyPenalty: 2.0,
						maxTokens: 0,
					};
					this.workflow.tasks.push(task);
					// Refresh the display to include the new task edit fields
					this.plugin.saveSettings().then(r => {
						this.close();
						this.open();
					});
				}));

	}

	onClose() {
		let {contentEl} = this;
		contentEl.empty();
		super.onClose();
		this.plugin.refreshSettingsTab();
	}
}

/**
 * A class representing the PpxObsidian plugin.
 * @extends Plugin
 */
export default class PpxObsidian
	extends Plugin {
	settings: PpxObsidianSettings;
	settingsTab: WorkflowSettingTab;


	refreshSettingsTab() {
		if (this.settingsTab) {
			this.settingsTab.refresh();
		}
	}

	async onload() {
		await this.loadSettings();


		// add the workflow settings tab
		this.settingsTab = new WorkflowSettingTab(this.app, this);
		this.addSettingTab(this.settingsTab);


		// create a ribbon icon and add a menu item to the ribbon icon per workflow
		this.addRibbonIcon('book', 'Run Workflow', (evt: MouseEvent) => {
				// create a file menu on the ribbon icon
				const fileMenu = new Menu();
				// add a menu item for each workflow
				this.settings.workflows.forEach(workflow => {
					fileMenu.addItem(item => {
						item.setTitle(workflow.workflowName);
						item.setIcon(workflow.workflowIcon);
						item.onClick(() => {
							// run each task one by one
							const workflowTasks = workflow.tasks;

							// grab the current note
							let view = this.app.workspace.getActiveViewOfType(MarkdownView);

							if (view) {
								let currentNote = view.editor.getValue();
								view.editor.setValue(currentNote + `\n\n> 🤖▶️ Running workflow ${workflow.workflowName}...`)
							}

							// run the tasks ( recursively )
							runTask(workflowTasks[0]);

							if (view) {
								let originalText = view.editor.getValue();
								let modifiedText = originalText.replace(/(\n{3,})/g, '\n\n');
								view.editor.setValue(modifiedText);
							}

							function removeEmptyLines(text: string) {
								return text.replace(/(\n{3,})/g, '\n\n');
							}

							function removeEmptyLinesfromStart(text: string) {
								// This regular expression will match all leading newline characters
								return text.replace(/^(\n+)/, '');
							}

							function ignoreBotLines(entireText: string) {
								// ignore the lines that starts with a >
								let lines = entireText.split('\n');
								let filteredLines = lines.filter(line => !line.startsWith('>'));
								entireText = filteredLines.join('\n');
								return entireText;
							}


							async function runTask(task: WorkflowTask) {
								// create a new message object
								let message = {
									id: generateUniqueName("MSG"),
									type: 'text',
									content: task.prompt,
								};

								if (view) {
									let entireText = removeEmptyLinesfromStart(removeEmptyLines(ignoreBotLines(view.editor.getValue())));
									let currentNote = removeEmptyLines(view.editor.getValue());
									const totalTasks = workflowTasks.length;
									view.editor.setValue('\n\n' + currentNote + `\n\n> 🤖▶️ Running task ${workflowTasks.indexOf(task) + 2} of ${totalTasks}: : ${task.name} \n\n`);

									// call the provider
									call_provider(
										entireText,
										task.provider,
										task,
										workflow
									).then(response => {
											if (view) {
												let currentNote = removeEmptyLines(view.editor.getValue());
												view.editor.setValue('\n\n' + currentNote + '\n\n' + response + `\n\n> 🤖✅ Task ${workflowTasks.indexOf(task) + 1} of ${workflowTasks.length} : ${task.name} completed.\n\n`);

												if (workflowTasks.indexOf(task) < workflowTasks.length - 1) {
													let currentNote = removeEmptyLines(view.editor.getValue());
													runTask(workflowTasks[workflowTasks.indexOf(task) + 1]);
													// clean up
													view.editor.setValue(removeEmptyLinesfromStart(removeEmptyLines(view.editor.getValue())));
												} else {
													let currentNote = removeEmptyLines(view.editor.getValue());
													view.editor.setValue('\n\n' + currentNote + `\n\n> 🤖✅✅ Workflow ${workflow.workflowName} completed.\n\n`);
													// clean up
													view.editor.setValue(removeEmptyLinesfromStart(removeEmptyLines(view.editor.getValue())));
												}
											} else {
												new Notice('No active note found.');
											}
										}
									);

								} else {
									new Notice('No active note found.');
								}

							}
						});
					});
				});

				// add the file menu to the ribbon icon
				fileMenu.showAtPosition({x: evt.clientX, y: evt.clientY});
			}
		);


		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this
			.registerDomEvent(document,

				'click'
				, (
					evt: MouseEvent
				) => {
					console
						.log(
							'click'
							,
							evt
						);
				}
			)
		;

// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {

	}


	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}


	async saveSettings() {
		await this.saveData(this.settings);
	}
}
