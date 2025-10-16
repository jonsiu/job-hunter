## Prompt engineering and management for extensions

- **Prompt Templates**: Define reusable prompt templates for common tasks
- **Context Injection**: Inject page context into prompts (URL, title, selected text)
- **System Prompts**: Use system prompts to define AI behavior and constraints
- **Token Limits**: Respect model token limits; truncate content intelligently
- **Prompt Versioning**: Version prompts; A/B test different prompt strategies
- **User Customization**: Allow power users to customize prompts via options page
- **Prompt Storage**: Store prompts in code or `chrome.storage` based on mutability
- **Dynamic Prompts**: Generate prompts dynamically based on user action and page context
- **Few-Shot Examples**: Include examples in prompts to guide AI behavior
- **Instruction Clarity**: Write clear, specific instructions; avoid ambiguity
- **Output Format**: Specify desired output format (JSON, markdown, plain text)
- **Safety Instructions**: Include safety guardrails in prompts (no harmful content)
- **Prompt Optimization**: Optimize prompts for token usage and response quality
- **Fallback Prompts**: Have simpler fallback prompts for rate-limited scenarios
