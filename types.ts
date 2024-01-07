
import {IconName} from "obsidian";

export interface Provider {
	name: string;
	model: string;
	apiKey: string;
	endpoint: string;
}

export interface WorkflowTask {
	name: string;
	provider: Provider;
	temperature: number;
	frequencyPenalty: number;
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
	providers: Provider[];
}
