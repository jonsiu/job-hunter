## Extension storage patterns

- **Storage APIs**: Use `chrome.storage.local` for local data, `chrome.storage.sync` for synced
- **Storage Limits**: Respect quota limits (5MB local, 100KB sync per item, 8KB total sync)
- **Sync Storage**: Use sync storage for user preferences that should follow across devices
- **Migration Strategy**: Implement version-based migration for storage schema changes
- **Atomic Updates**: Use storage.local for atomic updates; sync has eventual consistency
- **Batch Operations**: Batch multiple storage operations to reduce overhead
- **Storage Events**: Listen for `chrome.storage.onChanged` to react to storage updates
- **IndexedDB**: Use IndexedDB for large datasets or complex queries
- **Cache Strategy**: Cache frequently accessed data in memory with storage as source of truth
- **Clear on Uninstall**: Consider clearing sensitive data on extension uninstall
- **Encryption**: Encrypt sensitive data before storing; don't rely on storage encryption alone
- **Default Values**: Provide sensible defaults when storage keys don't exist
- **Namespace Keys**: Prefix storage keys to avoid collisions (e.g., `settings.theme`)
- **Storage Access**: Abstract storage behind service/repository layer for testability
