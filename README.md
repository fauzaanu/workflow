# Workflow Plugin for Obsidian
![](.README_images/x.gif)
Workflow is an obsidian plugin that allows you to create and run connected LLM workflows. Each task can be configured to use a different API provider and parameters. 

A provider in the context of this plugin is the API connection including the model. Settings such as temperature, frequency penalty and max tokens are defined outside of the provider and are set for each task. This means you can use a provider with different settings.

## Supported API Providers
1. [OpenAI](https://openai.com/)
2. [Perplexity](https://perplexity.ai/)

>If you dont want to modify the plugin, you can use a cloudflare worker to restructure the API response to match the format of the other providers. see [replicate.js](replicate.js) for an idea. The only requirement is that the response should be in the same format as openAI response.

## The idea of a workflow

1. repeatable process
2. series of steps, can be rather complex
3. each step is a task assigned to a LLM provider
4. each task is focused on a specefic outcome but, the LLM is aware of the final outcome as well (through a system prompt)
5. each task can be configured to use a different provider and parameters

## Parameters for workflow
- `name` : the name of the workflow, just for reference for you, not used anywhere else
- `tasks` : a list of tasks
- `objective` : describe the end goal of the workflow, this is injected to all the tasks as a system prompt

## Parameters for task
- `name` : the name of the task, just for reference for you, not used anywhere else
- `provider` : the provider to use for this task, "from any of the providers you have configured"
- `prompt` : the prompt to use for this task, "Do this and that"
- `system_prompt` : the system prompt to use for this task,"You are an expert in this and that"
- `max_tokens` : the max tokens to use for this task, using too many can result in errors
- `frequency_penalty` : the frequency penalty to use for this task, this is injected to the provider's frequency penalty, refer to the provider's documentation for guidelines
- `temperature` : the temperature to use for this task, refer to the provider's documentation for guidelines


## Installation

Download the `workflow.zip` file from the repository's releases page and extract it to your Obsidian vault's plugin folder - `<your_vault>/.obsidian/plugins/`. Once that's done, enable it from the "Plugin" section of the Obsidian's settings. Configure the API providers and set up workflows based on your requirements.

## License

This plugin is licensed under the [GNU General Public License v3.0](https://www.gnu.org/licenses/gpl-3.0.en.html).

You can refer to the [LICENSE](LICENSE) file for more details.

by [@fauzaanu](https://t.me/fauzaanu)





