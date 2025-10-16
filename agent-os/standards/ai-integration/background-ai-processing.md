## Background AI processing for extensions

- **API Call Location**: Make all AI API calls from background script, not content scripts
- **Request Proxying**: Content scripts request AI via messaging; background handles API
- **Token Management**: Store AI API keys securely in `chrome.storage.local`
- **Offscreen API**: Use `chrome.offscreen` for AI tasks requiring DOM (e.g., rendering markdown)
- **Batch Processing**: Queue multiple AI requests; process in batches when possible
- **Priority Queue**: Prioritize user-initiated requests over background tasks
- **Request Cancellation**: Support canceling in-flight AI requests when user navigates away
- **Result Caching**: Cache AI responses in storage; reuse for identical prompts
- **Alarm-Based Processing**: Use `chrome.alarms` for periodic AI tasks (summarization, analysis)
- **Service Worker Limits**: Design around service worker termination; save progress to storage
- **Quota Management**: Track AI usage; enforce per-user quotas to control costs
- **Error Recovery**: Retry failed AI requests with exponential backoff
- **Cost Attribution**: Track costs per user or per feature for analysis
- **Model Selection**: Choose appropriate model based on task complexity and cost
