import {
	App,
	Editor,
	MarkdownView, Menu,
	Modal,
	Notice,
	Plugin,
	PluginSettingTab,
	RequestUrlResponse,
	Setting
} from 'obsidian';
import {requestUrl, RequestUrlParam} from 'obsidian';

interface PpxObsidianSettings {
	ppxKey: string;
	openaiKey: string;
}

const DEFAULT_SETTINGS: PpxObsidianSettings = {
	ppxKey: 'you_perplexity_api_key_here',
	openaiKey: 'you_openai_api_key_here',
}

async function call_perplexity_api(messages: object, ppxKey: string) {
	const options: RequestUrlParam = {
		method: 'POST',
		url: 'https://api.perplexity.ai/chat/completions',
		headers: {
			'accept': 'application/json',
			'content-type': 'application/json',
			'authorization': `Bearer ${ppxKey}`,
		},
		body: JSON.stringify({
			model: 'pplx-7b-online',
			messages: messages,
			temperature: 0,
			presence_penalty: 2.0,
		})
	};

	try {
		const response: RequestUrlResponse = await requestUrl(options);
		const responseData = response.json; // Directly accessing the json property
		new Notice('Response from Perplexity API: ' + JSON.stringify(responseData));
		return responseData.choices[0].message.content;
	} catch (error) {
		let errorMessage = 'An error occurred: ' + error;
		new Notice(errorMessage);
		return errorMessage;
	}
}


async function call_openai_api(messages: Object, openaiKey: string) {
	const options: RequestUrlParam = {
		method: 'POST',
		url: 'https://api.openai.com/v1/chat/completions',
		headers: {
			'accept': 'application/json',
			'content-type': 'application/json',
			'authorization': `Bearer ${openaiKey}`,
		},
		body: JSON.stringify({
			model: 'gpt-3.5-turbo',
			messages: messages,
			temperature: 0,
			presence_penalty: 2.0,
		})
	};

	try {
		const response: RequestUrlResponse = await requestUrl(options);
		const responseData = response.json; // Directly accessing the json property
		new Notice('Response from OpenAI API: ' + JSON.stringify(responseData));
		return responseData.choices[0].message.content;
	} catch (error) {
		let errorMessage = 'An error occurred: ' + error;
		new Notice(errorMessage);
		return errorMessage;
	}
}


export default class PpxObsidian extends Plugin {
	settings: PpxObsidianSettings;


	async onload() {
		await this.loadSettings();
		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('microscope', 'Research Current Note', (evt: MouseEvent) => {

			// grab the current note
			const view = this.app.workspace.getActiveViewOfType(MarkdownView);

			function betterText(text: string, original: Boolean): string {

				if (original) return text;

				if (text.length > 4000) {
					new Notice("Text too long, last 4000 characters will be used")
					text = text.substring(text.length - 4000);
					// find the first line break
					try {
						let index = text.indexOf('\n');
						// start from the next line
						text = text.substring(index + 1);
						return text;
					} catch (err) {
						new Notice("No line breaks found, using entire text")
						return text;
					}
				}
				return text;
			}

			// create a file menu
			let fileMenu = new Menu();
			fileMenu.addItem((item) => {
				item.setTitle('Research Current Note');
				item.setIcon('dice');
				item.onClick(() => {
					new Notice('Researching Current Note');
					// grab the entire text
					if (view) {

						let entireText = view.editor.getValue();
						entireText = betterText(entireText, true);


						// extract key points from the current note : openai
						const keypoints = [
							{
								role: 'system',
								content: 'You are a professional research assistant that can extract key points from a note. Keep your responses as the following:-[KEYPOINT]-[KEYPOINT]'
							},
							{role: 'user', content: "extract key points from the following text:" + entireText},
						]

						call_openai_api(keypoints, this.settings.openaiKey).then(
							(response) => {
								// add the response to the next line
								let editor = view.editor;

								// Insert the response at the current cursor position
								editor.setCursor(editor.lineCount(), 0);
								editor.replaceSelection('\n\n## Key Points \n\n' + response);
								new Notice("Processed response from OpenAI API")

								// create questions from the key points : openai
								entireText = betterText(entireText, false);
								const questions = [
									{
										role: 'system',
										content: 'You are a professional research assistant that can create questions from key points. Keep your responses as the following:-[QUESTION]-[QUESTION]'
									},
									{
										role: 'user',
										content: "create questions from the following key points:" + entireText
									},
								]
								call_openai_api(questions, this.settings.openaiKey).then(
									(response) => {
										// add the response to the next line
										let editor = view.editor;

										// Insert the response at the current cursor position
										editor.setCursor(editor.lineCount(), 0);
										editor.replaceSelection('\n\n## Questions \n\n' + response);
										new Notice("Processed response from OpenAI API")

										// create a summary from the whole text : openai
										entireText = betterText(entireText, false);
										const summary = [
											{
												role: 'system',
												content: 'You are a professional research assistant that can create a summary while expanding on the topics discussed from a note.'
											},
											{role: 'user', content: "Here are my current notes" + entireText},
										]
										call_openai_api(summary, this.settings.openaiKey).then(
											(response) => {
												// add the response to the next line
												let editor = view.editor;

												// Insert the response at the current cursor position
												editor.setCursor(editor.lineCount(), 0);
												editor.replaceSelection('\n\n## Summary \n\n' + response);
												new Notice("Processed response from OpenAI API")

												// call perplexity api
												entireText = betterText(entireText, false);
												const messages = [
													{
														role: 'system',
														content: 'You are a professional research assistant that can create a summary from a note.'
													},
													{
														role: 'user',
														content: "Correct me, help me learn more about the following:" + entireText
													},
												]

												new Notice("Sending request to Perplexity API")
												call_perplexity_api(messages, this.settings.ppxKey).then(
													(response) => {
														// add the response to the next line
														let editor = view.editor;

														// Insert the response at the current cursor position
														editor.setCursor(editor.lineCount(), 0);
														editor.replaceSelection('\n\n## Perplexity - Realtime Info \n\n' + response);
														new Notice("Processed response from Perplexity API")

														// create #tags from the whole text : openai
														// like cornell notes
														entireText = betterText(entireText, false);
														const tags = [
															{
																role: 'system',
																content: 'You are a professional research assistant that can create #tags from a note. These should be the most important single word keywords of the notes. This is for the end of the notes following the rules of cornell note taking system. Keep your responses as the following:#TAG #TAG #TAG'
															},
															{
																role: 'user',
																content: "create single word #tags from the following text from most important keywords:" + entireText
															},
														]
														call_openai_api(tags, this.settings.openaiKey).then(
															(response) => {
																// add the response to the next line
																let editor = view.editor;

																// Insert the response at the current cursor position
																editor.setCursor(editor.lineCount(), 0);

																// taggify the response so that obsidian can recognize it as a tag
																// no spaces, no special characters, _ between words
																response = response.replaceAll(" ", "_");
																response = response.replaceAll(",", "");
																response = response.replaceAll(".", "");
																response = response.replaceAll("?", "");
																response = response.replaceAll("!", "");
																response = response.replaceAll(":", "");
																response = response.replaceAll(";", "");
																response = response.replaceAll("-", "");
																response = response.replaceAll("(", "");
																response = response.replaceAll(")", "");
																response = response.replaceAll("[", "");
																response = response.replaceAll("]", "");
																response = response.replaceAll("{", "");
																response = response.replaceAll("}", "");
																response = response.replaceAll("/", "");
																response = response.replaceAll("\\", "");
																response = response.replaceAll("\"", "");
																response = response.replaceAll("\'", "");
																response = response.replaceAll("`", "");
																response = response.replaceAll("~", "");
																response = response.replaceAll("<", "");
																response = response.replaceAll(">", "");
																response = response.replaceAll("|", "");
																response = response.replaceAll("=", "");
																response = response.replaceAll("+", "");
																response = response.replaceAll("*", "");
																response = response.replaceAll("&", "");
																response = response.replaceAll("%", "");
																response = response.replaceAll("$", "");
																response = response.replaceAll("@", "");
																response = response.replaceAll("^", "");
																response = response.replaceAll("#", "\n#");
																response = response.replaceAll("_\n", "\n");


																editor.replaceSelection('\n\n### Key words \n\n' + response);
																new Notice("Processed response from OpenAI API")

																// change the title of the note to something more meaningful
																const title_gen = [
																	{
																		role: 'system',
																		content: 'You are a professional research assistant that can generate a title for a note. Keep your responses as the following:-[TITLE]'
																	},
																	{
																		role: 'user',
																		content: "generate a title for the following text:" + entireText
																	},
																]
																call_openai_api(title_gen, this.settings.openaiKey).then(
																	(response) => {
																		// change title
																		let editor = view.editor;
																		let file = view.file?.name;

																		// Insert the response as the title
																		file = response + ".md";


																		new Notice("Processed response from OpenAI API")
																	}
																).catch(err => {
																	console.error(err);  // If an error occurs, log it to console
																	new Notice('An error occurred: ' + err.message); // And also display a notice about it
																});
															}
														).catch(err => {
															console.error(err);  // If an error occurs, log it to console
															new Notice('An error occurred: ' + err.message); // And also display a notice about it
														});
													}
												).catch(err => {
													console.error(err);  // If an error occurs, log it to console
													new Notice('An error occurred: ' + err.message); // And also display a notice about it
												});
											}
										).catch(err => {
											console.error(err);  // If an error occurs, log it to console
											new Notice('An error occurred: ' + err.message); // And also display a notice about it
										});
									}
								).catch(err => {
									console.error(err);  // If an error occurs, log it to console
									new Notice('An error occurred: ' + err.message); // And also display a notice about it
								});
							}
						).catch(err => {
							console.error(err);  // If an error occurs, log it to console
							new Notice('An error occurred: ' + err.message); // And also display a notice about it
						});


					}
				});
			});

			fileMenu.addItem((item) => {
				item.setTitle('Summarize Current Note');
				item.setIcon('dice');
				item.onClick(() => {
					new Notice('Summarizing Current Note');
					if (view) {
						let entireText = view.editor.getValue();
						entireText = betterText(entireText, true);


						// extract key points from the current note : openai
						const keypoints = [
							{
								role: 'system',
								content: 'Summarize the following text while expanding on the topics discussed. Retain the important information and include a section for key takeaways. Format in markdown.'
							},
							{role: 'user', content: "Summarize the following text:" + entireText},
						]

						call_openai_api(keypoints, this.settings.openaiKey).then(
							(response) => {
								// add the response to the next line
								let editor = view.editor;

								// Insert the response at the current cursor position
								editor.setCursor(editor.lineCount(), 0);
								editor.replaceSelection('\n\n## Key Points \n\n' + response);

							}
						).catch(err => {
							console.error(err);  // If an error occurs, log it to console
							new Notice('An error occurred: ' + err.message); // And also display a notice about it
						});
					}

				});

				// Menu appears on right click on the ribbon item
				fileMenu.showAtPosition({x: evt.pageX, y: evt.pageY});
			});

			fileMenu.addItem((item) => {
				item.setTitle('Re-write Current Note');
				item.setIcon('dice');
				item.onClick(() => {
					new Notice('Summarizing Current Note');
					if (view) {
						let entireText = view.editor.getValue();
						entireText = betterText(entireText, true);


						// extract key points from the current note : openai
						const keypoints = [
							{
								role: 'system',
								content: 'You are an expert re-writer and researcher.'
							},
							{
								role: 'user',
								content: 'Compose concise and well-organized notes in the first person, as if these are my own. Prioritize clarity, coherence, and maintain a professional tone. Retain essential details, eliminate redundancies, and ensure the notes accurately convey the original meaning. Organize the content logically for optimal readability. Additionally, simplify any complex concepts to make them easy for anyone to understand.' + entireText
							},
						];


						call_openai_api(keypoints, this.settings.openaiKey).then(
							(response) => {
								// add the response to the next line
								let editor = view.editor;

								// replace the entire text with the response
								editor.setValue(response);

							}
						).catch(err => {
							console.error(err);  // If an error occurs, log it to console
							new Notice('An error occurred: ' + err.message); // And also display a notice about it
						});
					}

				});

				// Menu appears on right click on the ribbon item
				fileMenu.showAtPosition({x: evt.pageX, y: evt.pageY});
			});


		});


		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-sample-modal-simple',
			name: 'Open sample modal (simple)',
			callback: () => {
				new SampleModal(this.app).open();
			}
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'sample-editor-command',
			name: 'Sample editor command',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection('Sample Editor Command');
			}
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'open-sample-modal-complex',
			name: 'Open sample modal (complex)',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

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

class SampleModal
	extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: PpxObsidian;

	constructor(app: App, plugin: PpxObsidian) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Perplexity API Key')
			.setDesc('API Key from Perplexity')
			.addText(text => text
				.setPlaceholder('Enter your api key')
				.setValue(this.plugin.settings.ppxKey)
				.onChange(async (value) => {
					this.plugin.settings.ppxKey = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('OpenAI API Key')
			.setDesc('API Key from OpenAI')
			.addText(text => text
				.setPlaceholder('Enter your api key')
				.setValue(this.plugin.settings.openaiKey)
				.onChange(async (value) => {
					this.plugin.settings.openaiKey = value;
					await this.plugin.saveSettings();
				}));
	}
}


