import * as fs from "fs";
import {Workflow, WorkflowTask} from "./types";
import {MarkdownView, Menu, Notice, Setting} from "obsidian";
import {call_provider} from "./api_calls";

/**
 * Generates a unique task name by combining a randomly generated unique ID and a randomly selected element name from the periodic table.
 *
 * @param {string} append - The string to append to the unique task name.
 * @returns {string} The unique task name.
 */
export function generateUniqueName(append: string): string {
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
 * Generates a random icon from a predefined list of icons.
 *
 * @returns {string} A random icon from the list.
 */
export function generateRandomIcon() {
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
 * Saves the settings to the settings.json file.
 *
 * @param {any} settings - The settings to save.
 * @return {void}
 */
export function saveSettingsToFile(settings: any) {
	try {
		// Convert the settings object to a JSON string
		const settingsJson = JSON.stringify(settings, null, 2);
		// Write the JSON string to a file synchronously
		fs.writeFileSync('settings.json', settingsJson);
		console.log("Settings saved successfully.");
	} catch (e) {
		console.error("Failed to save settings: ", e);
	}
}


// Helper functions for manipulating text
/**
 * Removes empty lines from a given text.
 *
 * @param {string} text - The text to remove empty lines from.
 * @return {string} The text with empty lines removed.
 */
export function removeEmptyLines(text: string) {
	return text.replace(/(\n{3,})/g, '\n\n');
}

/**
 * Removes leading empty lines from a given text.
 *
 * @param {string} text - The text to remove empty lines from.
 * @return {string} - The text with leading empty lines removed.
 */
export function removeEmptyLinesfromStart(text: string) {
	// This regular expression will match all leading newline characters
	return text.replace(/^(\n+)/, '');
}

/**
 * Removes lines starting with ">" from the given text.
 *
 * @param {string} entireText - The entire text to filter.
 * @return {string} The filtered text without lines starting with ">".
 */
export function ignoreBotLines(entireText: string) {
	// ignore the lines that starts with a >
	let lines = entireText.split('\n');
	let filteredLines = lines.filter(line => !line.startsWith('>'));
	entireText = filteredLines.join('\n');
	return entireText;
}

/**
 * Retrieves the last section of a given text based on the line number.
 *
 * @param {string} entireText - The entire text to search in.
 * @param {number} lineNumber - The line number to start searching from.
 * @returns {string} The last section of the text.
 */
export function grabLastSectionByLine(entireText: string, lineNumber: number): string {
	const lines = entireText.split('\n');
	let markdownLinesIndex: number[] = [];
	for (let i = 0; i <= lineNumber; i++) {
		if (lines[i].startsWith('# ') || lines[i].startsWith('##')) {
			markdownLinesIndex.push(i);
		}
	}
	let lastSectionText = '';
	if (markdownLinesIndex.length !== 0) {
		const lastMarkdownLineIndex = markdownLinesIndex[markdownLinesIndex.length - 1];
		lastSectionText = lines.slice(lastMarkdownLineIndex).join('\n');
	}
	return lastSectionText.trim();
}

/**
 * Adds a task to the given workflow.
 *
 * @param {Workflow} workflow - The workflow to add the task to.
 * @param {any} plugin - The plugin object.
 * @throws {Error} - If the plugin object does not have a `settings.providers` array.
 * @returns {void}
 *
 * @example
 * const workflow = { tasks: [] };
 * const plugin = { settings: { providers: [{}] }, modalInstance: {} };
 * addTaskToWorkflow(workflow, plugin);
 */
export function addTaskToWorkflow(workflow: Workflow, plugin: any): void {
	let task: WorkflowTask = {
		name: generateUniqueName("TSK"),
		prompt: 'prompt_here',
		provider: plugin.settings.providers[0],
		temperature: 'Medium',  // or 'Creative' | 'Precise'
		maxTokens: 500,
	};
	workflow.tasks.push(task);
	plugin.saveSettings().then(() => {
		plugin.modalInstance.close();
		plugin.modalInstance.open();
	});
}

/**
 * Creates a setting with a text area.
 *
 * @param {HTMLElement} parentEl - The parent element to append the setting to.
 * @param {string} label - The label for the setting.
 * @param {string} initialValue - The initial value for the text area.
 * @param {function} onChangeCallback - The callback function to be called when the value of the text area changes.
 * @return {undefined}
 */
export function createSettingWithTextArea(parentEl: HTMLElement, label: string, initialValue: string, onChangeCallback: (value: string) => void) {
	new Setting(parentEl)
		.setName(label)
		.addTextArea(textArea => {
			textArea
				.setPlaceholder(`Enter your ${label.toLowerCase()}`)
				.setValue(initialValue)
				.onChange(async value => {
					onChangeCallback(value);
					await this.plugin.saveSettings();
				});
			textArea.inputEl.style.height = '100%';  // Set textarea height to 100%
			textArea.inputEl.style.width = '100%';  // Set textarea width to 100%
		});
}

/**
 * Creates a setting with a button element.
 *
 * @param {HTMLElement} parentEl - The parent element to append the setting to.
 * @param {string} label - The label for the setting.
 * @param {string} buttonLabel - The text for the button element.
 * @param {Function} onClickCallback - The callback function to execute when the button is clicked.
 * @return {void}
 */
export function createSettingWithButton(parentEl: HTMLElement, label: string, buttonLabel: string, onClickCallback: () => void) {
	new Setting(parentEl)
		.setName(label)
		.addButton(button => button
			.setButtonText(buttonLabel)
			.onClick(onClickCallback));
}

/**
 * Create a setting with text input.
 *
 * @param {HTMLElement} parentEl - The parent element to append the setting to.
 * @param {string} label - The label of the setting.
 * @param {string} initialValue - The initial value of the text input.
 * @param {function} onChangeCallback - The callback function to be called when the value changes.
 * @param {boolean} [parseAsNumber=false] - A flag indicating whether to parse the value as a number.
 *
 * @return {void}
 */
export function createSettingWithText(parentEl: HTMLElement, label: string, initialValue: string, onChangeCallback: (value: number | string) => void, parseAsNumber = false) {
	new Setting(parentEl)
		.setName(label)
		.addText(textInput => {
			textInput
				.setPlaceholder(`Enter your ${label.toLowerCase()}`)
				.setValue(initialValue)
				.onChange(async (value) => {
					onChangeCallback(parseAsNumber ? Number(value) : value);
					await this.plugin.saveSettings();
					this.plugin.settingsTab.refresh();
				});
		});
}

export function createSettingTemperature(parentEl: HTMLElement, label: string, initialValue: string, onChangeCallback: (value: string) => void) {
	new Setting(parentEl)
		.setName(label)
		.addDropdown(dropdownInput => {
			dropdownInput
				.addOption('Creative', 'Creative')
				.addOption('Medium', 'Medium')
				.addOption('Precise', 'Precise')
				.setValue(initialValue)
				.onChange(async (value) => {
					onChangeCallback(value);
					await this.plugin.saveSettings();
					this.plugin.settingsTab.refresh();
				});
		});
}


export function createFileMenu(fileMenu: Menu, workflows: Workflow[]) {
	workflows.forEach((workflow: Workflow) => {
		fileMenu.addItem(item => {
			item.setTitle(workflow.workflowName);
			item.setIcon(workflow.workflowIcon);
			item.onClick(async () => {
				const view = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (!view) {
					new Notice('No active note found.');
					return;
				}
				await runWorkflowTasks(view, workflow.tasks, workflow.workflowName);
			});
		});
	});
	return fileMenu;
}

async function runWorkflowTasks(view: MarkdownView, workflowTasks: WorkflowTask[], workflowName: string, offset = 0) {
	// If there's at least one task to run
	if (workflowTasks.length > 0) {
		// Fetch the current note and task
		let currentNote = view.editor.getValue();
		let currentTask = workflowTasks[0];

		// Prepare the task running notice and append it
		const taskNumber = 1 + offset;
		const taskNotice = `\n\n> [!info] Running Workflow - ${workflowName}\n> 🤖 Running task ${taskNumber} of ${workflowTasks.length+offset} : ${currentTask.name}`;
		view.editor.setValue(currentNote + taskNotice);

		// Get the note's title and prepare the note for the bot (removing the task notice)
		const noteTitle = view.file?.basename;
		const botNote = `title: ${noteTitle}\n\n${currentNote.split(taskNotice).join('')}`;

		// Call the provider and get the response
		const response = await call_provider(botNote, currentTask.provider, currentTask);

		// Prepare the task completion notice and append it along with the bot's response
		currentNote = view.editor.getValue();
		const taskCompletionNotice = `\n\n> [!done] Workflow - ${workflowName}\n> 🤖 Task ${taskNumber} : ${currentTask.name} completed.\n\n`;
		view.editor.setValue(currentNote + '\n\n' + response + taskCompletionNotice);

		// If there are more tasks, run them
		if (workflowTasks.length > 1) {
			await runWorkflowTasks(view, workflowTasks.slice(1), workflowName, offset+1);
		}
		// If no more tasks, append the workflow completion message
		else {
			currentNote = view.editor.getValue();
			view.editor.setValue(currentNote + `\n\n> [!done] Workflow - ${workflowName}\n> 🤖 All Tasks completed.\n\n`);
		}
	}
}
