import {IconName} from "obsidian";

export type ProviderName = 'openai' | 'perplexity';
export type Temperature = 'Creative' | 'Medium' | 'Precise';


export interface ProviderModel {
	name: ProviderName;
	model: string;
	apiKey: string;
}

export interface ApiKey {
	name: ProviderName;
	apiKey: string;
}

export interface WorkflowTask {
	name: string;
	provider: ProviderModel;
	temperature: Temperature;
	maxTokens: number;
	prompt: string;
}

export interface Workflow {
	workflowName: string;
	workflowIcon: IconName;
	tasks: WorkflowTask[];
}

export interface WorkflowSettings {
	workflows: Workflow[];
	providers: ProviderModel[];
	apiKeys: ApiKey[];
}


