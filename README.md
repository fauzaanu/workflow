# Workflow Plugin for Obsidian

Workflow is a powerful plugin for the markdown-based knowledge management system, Obsidian. Workflow integrates programming workflows directly into your Obsidian editor, making your content editing more efficient and versatile.

## Features

### Diverse API Integration
The Workflow plugin allows the integration of multiple APIs seamlessly into your Obsidian workspace. Although it comes with in-built support for OpenAI (GPT-3), the Workflow plugin is flexible and can integrate with **any other API that follows the same specification as OpenAI**. This greatly opens up possibilities for bringing AI-powered assistance into your Obsidian editor.

### Workflow Creation and Management
The Workflow plugin enables you to create, edit, and delete workflows, each consisting of one or more tasks. These workflows assist in the automation of content updates, bringing more structure and ease to your content editing process.

### Customizable Tasks
Tasks within workflows are automated routines that commission the integrated API providers to perform an array of functions. These functions range from generating AI-created text, extracting information from unstructured text, and much more. Each task can be fine-tuned to fit your specific needs.

## Usage

A workflow is a collection of tasks that are executed in sequence. Workflows are versatile and can be customized based on your needs.

Every task within a workflow has its unique parameters:

- **Provider**: Choose from the API providers you have configured.
- **Temperature and Frequency Penalty**: Configure the AI's behavior during task execution.
- **Prompt**: The trigger sent to the AI.
- **System Prompt**: Additional instructions for the AI describing the desired format of the response.
- **Mode**: Choose between 'append' or 'replace' modes for the task's output manipulation.

## Installation

- Download the latest `workflow.zip` from the repository's `releases`.
- Extract the `workflow.zip` to Obsidian vault's plugins folder: `<your_vault>/.obsidian/plugins/`.
- Enabled the plugin within Obsidian's settings under the "Plugin" section.
- Configure the API providers and set up workflows to meet your needs.

## License

The Workflow plugin for Obsidian is licensed under the terms of the MIT license. Refer to `LICENSE` for more information.

**Note**: This is a basic README structure for the Workflow plugin. Additional instructions, details, screenshots, or contribution guidelines can be added as needed.
