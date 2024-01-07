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
import {Provider, WorkflowTask, Workflow, WorkflowSettings} from './types';
import {
	generateRandomIcon,
	generateUniqueName,
	grabLastSectionByLine, ignoreBotLines,
	removeEmptyLines,
	removeEmptyLinesfromStart
} from "./helpers";
import {call_provider} from "./api_calls";
import {ProvidersModal, WorkflowModal} from "./modals";
import {DEFAULT_SETTINGS, WorkflowSettingTab} from "./settings";

/**
 * A class representing the PpxObsidian plugin.
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
		const fileMenu = new Menu();

		// create a ribbon icon and add a menu item to the ribbon icon per workflow
		this.addRibbonIcon('book', 'Run Workflow', (evt: MouseEvent) => {
				// create a file menu on the ribbon icon

				// add the file menu to the ribbon icon
				fileMenu.showAtPosition({x: evt.clientX, y: evt.clientY});
			}
		);

		// add a menu item for each workflow
		this.settings.workflows.forEach(workflow => {
			fileMenu.addItem(item => {
				item.setTitle(workflow.workflowName);
				item.setIcon(workflow.workflowIcon);
				item.onClick(() => {

					const workflowTasks = workflow.tasks;
					let view = this.app.workspace.getActiveViewOfType(MarkdownView);

					if (!view) {
						new Notice('No active note found.');
						return;
					}

					const cursor = view.editor.getCursor().line
					const entireText = grabLastSectionByLine(removeEmptyLinesfromStart(removeEmptyLines(ignoreBotLines(view.editor.getValue()))), cursor);
					let currentNote = removeEmptyLines(view.editor.getValue());
					currentNote = view.editor.getValue();
					new Notice(cursor.toString() + ' ' + entireText);
					view.editor.setValue(currentNote + `\n\n> [!info] WorkFlow\n> 🤖▶️ Running workflow ${workflow.workflowName}...`)

					// run the tasks ( recursively )
					runTask(workflowTasks[0]);

					async function runTask(task: WorkflowTask) {
						const totalTasks = workflowTasks.length;

						// create a new message object
						let message = {
							id: generateUniqueName("MSG"),
							type: 'text',
							content: task.prompt,
						};

						if (!view) {
							new Notice('No active note found.');
							return;
						}

						let newText = `\n\n> [!info] WorkFlow\n> 🤖▶️ Running task ${workflowTasks.indexOf(task) + 1} of ${totalTasks}: : ${task.name} \n\n`;
						view.editor.setValue(currentNote + '\n\n' + newText);

						let noteTitle = view.file?.basename

						if (noteTitle) {
							currentNote = noteTitle + currentNote
						}

						// call the provider
						call_provider(
							currentNote,
							task.provider,
							task,
							workflow
						).then(response => {
								if (view) {
									let currentNote = removeEmptyLines(view.editor.getValue());
									view.editor.setValue('\n\n' + currentNote + '\n\n' + response + `\n\n> [!info] WorkFlow\n> 🤖✅ Task ${workflowTasks.indexOf(task) + 1} of ${workflowTasks.length} : ${task.name} completed.\n\n`);

									if (workflowTasks.indexOf(task) < workflowTasks.length - 1) {
										let currentNote = removeEmptyLines(view.editor.getValue());
										runTask(workflowTasks[workflowTasks.indexOf(task) + 1]);
										// clean up
										view.editor.setValue(removeEmptyLinesfromStart(removeEmptyLines(view.editor.getValue())));
									} else {
										let currentNote = removeEmptyLines(view.editor.getValue());
										view.editor.setValue('\n\n' + currentNote + `\n\n> [!info] WorkFlow\n> 🤖✅✅ Workflow ${workflow.workflowName} completed.\n\n`);
										// clean up
										view.editor.setValue(removeEmptyLinesfromStart(removeEmptyLines(view.editor.getValue())));
										let originalText = view.editor.getValue();
										let modifiedText = originalText.replace(/(\n{3,})/g, '\n\n');
										view.editor.setValue(modifiedText);
									}
								} else {
									new Notice('No active note found.');
								}
							}
						);
					}
				});
			});
		});


		let currentMousePosition = {x: 0, y: 0};
		window.addEventListener('mousemove', function (event) {
			currentMousePosition.x = event.clientX;
			currentMousePosition.y = event.clientY;
		});

		this.addCommand({
			id: 'show-file-menu',
			name: 'Show File Menu',
			callback: () => {
				// show at the previously recorded mouse position
				fileMenu.showAtPosition(currentMousePosition);
			}
		});


		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document,
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
			);

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
