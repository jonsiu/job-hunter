## Frontend state management for extensions

- **Storage as Source of Truth**: Use `chrome.storage` as primary state store
- **Local State**: Use component state for ephemeral UI-only state
- **Shared State**: Share state between popup/options/content via background script and storage
- **State Synchronization**: Listen for `chrome.storage.onChanged` to sync state across contexts
- **State Libraries**: Use lightweight libraries (Zustand, Jotai, Valtio) for complex state
- **Redux/Context**: Consider Redux or React Context for large extensions with complex state flows
- **State Initialization**: Load initial state from storage on component mount
- **Optimistic Updates**: Update UI immediately; reconcile with storage async
- **State Migration**: Implement versioned state schema with migration logic
- **Background State**: Store app state in background script; expose via messaging
- **Computed Values**: Derive computed values from storage state; memoize expensive computations
- **State Debugging**: Use Redux DevTools or similar for state debugging
- **State Persistence**: Automatically persist state changes to storage
- **Error Recovery**: Implement fallback state when storage read fails
