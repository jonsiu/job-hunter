## Background processing and task management

- **Service Worker Lifecycle**: Design for service worker termination; persist state to storage
- **Alarm API**: Use `chrome.alarms` for periodic tasks; minimum interval is 1 minute
- **Task Queuing**: Implement task queue in storage for work that survives service worker restarts
- **Long-Running Tasks**: Break long tasks into chunks; use alarms to resume
- **Offscreen Documents**: Use `chrome.offscreen` API for DOM operations or Canvas in background
- **Web Workers**: Use Web Workers for CPU-intensive work without blocking service worker
- **Idle Detection**: Use `chrome.idle` API to detect user activity state
- **Network Detection**: Listen for `navigator.onLine` to detect connectivity changes
- **Tab Lifecycle**: Listen for `chrome.tabs.onUpdated` to react to tab changes
- **Install/Update Handlers**: Use `chrome.runtime.onInstalled` for setup and migration tasks
- **Startup Handlers**: Use `chrome.runtime.onStartup` for browser launch initialization
- **Cleanup Tasks**: Clean up old data periodically; implement data retention policies
- **Progress Tracking**: Track progress of long operations; surface to UI
- **Priority Queues**: Implement priority system for user-initiated vs background tasks
