import {Notice, requestUrl, RequestUrlParam, RequestUrlResponse} from "obsidian";
import {Provider, Workflow, WorkflowTask} from "./types";

/**
 * Makes a request to a provider using the given messages and provider information.
 *
 * @param {string} notes - The current notes.
 * @param {Provider} provider - The provider information.
 * @param {WorkflowTask} workflowTask - The workflow task.
 * @param {Workflow} workflow - The workflow.
 * @returns {Promise<string>} A promise that resolves with the content of the first choice of the response, or rejects with an error message.
 */
export async function call_provider(notes: string, provider: Provider, workflowTask: WorkflowTask, workflow: Workflow): Promise<string> {
	// return notes; // for debugging purposes
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
				{role: 'system', content: "You are a helpful note-taking assistant"},
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

