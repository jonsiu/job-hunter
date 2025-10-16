## AI integration in content scripts

- **Context Extraction**: Extract page content for AI analysis; respect user privacy
- **Selective Data**: Send only relevant DOM content to AI; not entire page
- **Page Context**: Use `window.getSelection()` for user-selected text
- **Element Interaction**: Add AI features to specific page elements (text areas, inputs)
- **Shadow DOM**: Handle Shadow DOM when extracting content from modern web apps
- **Content Sanitization**: Strip sensitive data (passwords, credit cards) before sending to AI
- **Visual Context**: Capture screenshots using `chrome.tabs.captureVisibleTab` for visual AI
- **Streaming UI**: Display streaming AI responses inline on page; use custom elements
- **Undo/Redo**: Provide undo functionality for AI-generated content insertions
- **Loading States**: Show loading indicators while waiting for AI response
- **Error Handling**: Handle AI errors gracefully; don't break page functionality
- **Permission Awareness**: Check if user granted optional AI permissions
- **Page Performance**: Minimize performance impact on host page; defer heavy operations
- **Content Persistence**: Don't persist modified content without user confirmation
