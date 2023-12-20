# Workflow Plugin for Obsidian

Workflow is an obsidian plugin that allows you to create and run workflows with multiple tasks. Each task can be configured to use a different API provider, and different parameters can be set for each task. You can add as many tasks as you want to a workflow, and each task starts after the previous task has finished.

## Wide API Integration
Though the Workflow plugin has built-in support for OpenAI (GPT-3), it is not bound to it. Workflow is designed to be extendable, enabling integration with any API that follows the same specification as OpenAI. This feature enhances its adaptability, allowing you to harness the power of various AI services within your Obsidian workspace. 

## Task and Workflow Management
Workflow lets you seamlessly create, edit, and manage your workflows. Each workflow can contain multiple tasks, enabling comprehensive automation sequences. You can bring structu!re to your content editing and management process, thanks to the organized task flow.

## Fully Customizable Tasks
Tasks are essentially controlled instructions for the integrated API. You can command the API to perform various functions ranging from generating AI-based text content to analyzing unstructured text data. The parameters for each task can be individually tweaked, offering complete customization at each step of your workflow. This adaptability opens up numerous possibilities in content creation and data management.

## Parameters for tasks

Specific parameters can be adjusted for each task. Here are some of the things you can adjust:

- **Provider**: Choose the API provider that will be used to execute this task. You can configure multiple API providers and choose the one that is most suited for each task.
- **Temperature and Frequency Penalty**: Modify how the AI behaves during task execution. This can help you tune the generated content to your liking.
- **Prompt**: Set the question or command that will trigger the AI.
- **System Prompt**: Additional instructions for the AI to understand the desired format and content of the response.
- **Mode**: You can choose between 'append' or 'replace' modes depending on whether you want the task's output to supplement or overwrite the existing content.

## Installation

Download the `workflow.zip` file from the repository's releases page and extract it to your Obsidian vault's plugin folder - `<your_vault>/.obsidian/plugins/`. Once that's done, enable it from the "Plugin" section of the Obsidian's settings. Configure the API providers and set up workflows based on your requirements.

## License

Workflow Obsidian Plugin is distributed under the MIT license. Please see the `LICENSE` file for more details.

