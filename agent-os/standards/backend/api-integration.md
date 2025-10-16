## Backend API integration patterns

- **API Communication**: Make API calls from background script, not content scripts
- **Request Proxying**: Proxy requests through background to avoid CORS issues
- **Authentication**: Store API tokens in `chrome.storage.local`; send in Authorization header
- **Token Refresh**: Implement token refresh logic; handle 401 responses gracefully
- **Rate Limiting**: Implement client-side rate limiting to respect API limits
- **Request Queuing**: Queue requests when offline; retry when connection restored
- **Retry Logic**: Implement exponential backoff for failed requests
- **Timeout Handling**: Set appropriate timeouts; handle timeout errors
- **Error Mapping**: Map API errors to user-friendly messages
- **Request Cancellation**: Cancel in-flight requests when no longer needed
- **Batch Requests**: Batch multiple requests when API supports it
- **Caching Strategy**: Cache API responses in storage; respect cache headers
- **Offline Support**: Provide offline functionality with cached data
- **API Versioning**: Handle API version changes; migrate to new endpoints gracefully
