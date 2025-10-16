## Content script patterns and best practices

- **Injection Strategy**: Declare content scripts in manifest or inject programmatically
- **Match Patterns**: Use specific match patterns; avoid `<all_urls>` unless necessary
- **Run At**: Use `document_idle` (default) unless you need `document_start` or `document_end`
- **Isolated World**: Content scripts run in isolated JS context; use messaging to access page context
- **CSS Injection**: Inject CSS carefully; namespace classes to avoid conflicts
- **DOM Manipulation**: Use MutationObserver for dynamic content changes
- **Performance**: Minimize content script size; lazy load heavy functionality
- **Script Injection**: Use `chrome.scripting.executeScript` API (V3) for dynamic injection
- **All Frames**: Set `all_frames: true` only when needed for iframes
- **Cleanup**: Remove event listeners and observers when content script unloads
- **Error Handling**: Wrap content script code in try-catch; log errors to background
- **Communication**: Use `chrome.runtime.sendMessage` to communicate with background
- **Page Context Access**: Use `window.postMessage` to communicate with page scripts
- **Security**: Never eval or execute untrusted code from the page
