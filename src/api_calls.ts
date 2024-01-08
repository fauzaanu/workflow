import {Notice, requestUrl, RequestUrlParam, RequestUrlResponse} from "obsidian";
import {ProviderModel, Workflow, WorkflowTask} from "./types";

/**
 * Makes a request to a provider using the given messages and provider information.
 *
 * @param {string} notes - The current notes.
 * @param {ProviderModel} provider - The provider information.
 * @param {WorkflowTask} workflowTask - The workflow task.
 * @returns {Promise<string>} A promise that resolves with the content of the first choice of the response, or rejects with an error message.
 */
export async function call_provider(
	notes: string,
	provider: ProviderModel,
	workflowTask: WorkflowTask
): Promise<string> {
	// Determine the endpoint URL based on the provider name
	let url;
	if (provider.name === "openai") {
		url = "https://api.openai.com/v1/chat/completions";
	} else if (provider.name === "perplexity") {
		url = "https://api.perplexity.ai/chat/completions";
	} else {
		throw new Error("Unsupported provider: " + provider.name);
	}

	if (!provider.apiKey || provider.apiKey.trim() === "") {
		throw new Error(`API key for the provider "${provider.name}" is not set. 
    Please set the API key before making a request.`);
	}

	// determine the temperature
	// export type Temperature = 'Creative' | 'Medium' | 'Precise';
	let temperature;
	if (workflowTask.temperature === "Creative") {
		temperature = 1.9;
	} else if (workflowTask.temperature === "Medium") {
		temperature = 1.1;
	} else if (workflowTask.temperature === "Precise") {
		temperature = 0.3;
	} else {
		throw new Error("Unsupported temperature: " + workflowTask.temperature);
	}


	const options: RequestUrlParam = {
		method: "POST",
		url: url,
		headers: {
			accept: "application/json",
			"content-type": "application/json",
			authorization: `Bearer ${provider.apiKey}`
		},
		body: JSON.stringify({
			model: provider.model,
			messages: [
				{
					role: "system",
					content: "You are a note taking assistant within the obsidian note taker. Use markdown, have a proper structure in your responses and directly address at assisting the user. The instructions are marked with user instruction and the notes are before it. Always re-think and re-analyze before answering."
				},
				{role: "user", content: "user instruction:" + workflowTask.prompt + "user notes:" + notes}
			],
			temperature: temperature,
			presence_penalty: 1.9,
			max_tokens: workflowTask.maxTokens
		})
	};

	let responseData: any = {};

	try {
		const response: RequestUrlResponse = await requestUrl(options);
		responseData = response.json; // Directly accessing the json property
		return responseData.choices[0].message.content;
	} catch (error) {
		let errorMessage = "An error occurred: " + error + "Your options:" + JSON.stringify(options) + "Your response:" + "```/n"+ JSON.stringify(responseData) + "/n```";
		new Notice(errorMessage);
		return errorMessage;
	}
}
