## Extension messaging patterns

- **One-Time Messages**: Use `chrome.runtime.sendMessage` for single request-response
- **Long-Lived Connections**: Use `chrome.runtime.connect` for persistent connections
- **External Messaging**: Use `chrome.runtime.sendMessage(extensionId)` for cross-extension
- **Native Messaging**: Use native messaging API to communicate with native apps
- **Message Structure**: Define consistent message format: `{type, payload, metadata}`
- **Response Handling**: Always handle async responses; use promises or callbacks
- **Error Propagation**: Return error information in response message
- **Message Validation**: Validate message structure and payload before processing
- **Port Disconnection**: Listen for `port.onDisconnect` to detect connection loss
- **Cross-Origin**: Use `externally_connectable` manifest key for web page messaging
- **Message Types**: Define message type constants; avoid magic strings
- **Serialization**: Use structured clone algorithm; don't send DOM objects or functions
- **Security**: Validate message sender; check `sender.id` and `sender.url`
- **Timeout Handling**: Implement timeout logic for long-running message responses
