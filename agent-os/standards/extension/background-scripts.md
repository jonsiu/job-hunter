## Background script (service worker) architecture

- **Service Worker Model**: Use service worker (V3) instead of persistent background page
- **Event-Driven**: Background script may be terminated; design for event-driven architecture
- **State Management**: Store state in `chrome.storage` not memory; service worker may wake/sleep
- **Alarm API**: Use `chrome.alarms` for periodic tasks; not `setTimeout`/`setInterval`
- **Message Handling**: Listen for `chrome.runtime.onMessage` for content script communication
- **Tab Management**: Use `chrome.tabs` API to query, create, update, remove tabs
- **Context Menus**: Register context menus in `chrome.runtime.onInstalled` listener
- **Web Requests**: Use `declarativeNetRequest` (V3) instead of `webRequest` blocking
- **Offscreen Documents**: Use `chrome.offscreen` API for DOM/Canvas operations (V3)
- **Storage Sync**: Use `chrome.storage.sync` for cross-device user data
- **Badge Text**: Update extension icon badge with `chrome.action.setBadgeText`
- **Notifications**: Use `chrome.notifications` API for system notifications
- **Error Handling**: Add global error handler; log to console or external service
- **Startup Tasks**: Use `chrome.runtime.onStartup` for initialization on browser start
