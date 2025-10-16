## Streaming AI responses in extensions

- **SSE Support**: Use Server-Sent Events or streaming fetch for AI responses
- **Background Streaming**: Handle streaming in background script; forward chunks to UI
- **Incremental Rendering**: Render AI response chunks as they arrive
- **Message Forwarding**: Forward streaming chunks via `chrome.runtime.sendMessage`
- **Port-Based Streaming**: Use `chrome.runtime.connect` for long-lived streaming connections
- **Buffer Management**: Buffer chunks appropriately; don't overwhelm UI with updates
- **Partial Parsing**: Parse and display partial responses (e.g., markdown) as they stream
- **Stream Cancellation**: Allow users to stop generation; close stream connection
- **Error Handling**: Handle stream interruptions; show partial results or error
- **Reconnection**: Implement reconnection logic if stream drops unexpectedly
- **Progress Indicators**: Show progress during streaming (e.g., typing indicator)
- **Content Scripts**: Forward streaming responses to content scripts for inline display
- **Performance**: Optimize rendering performance for rapid chunk updates
- **Completion Detection**: Detect when stream completes; finalize UI state
