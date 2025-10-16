## Extension versioning and update management

- **Semantic Versioning**: Use semver (major.minor.patch) for version numbers
- **Auto-Updates**: Chrome/Firefox auto-update from stores; no manual update mechanism needed
- **Update Checks**: Extensions check for updates every 5 hours automatically
- **Breaking Changes**: Increment major version for breaking changes; provide migration
- **Version Storage**: Store current version in storage; detect version changes
- **Migration Logic**: Implement `chrome.runtime.onInstalled` handler for data migration
- **Backward Compatibility**: Maintain compatibility with previous version's stored data
- **Rollback Strategy**: Have plan to rollback if critical bug discovered post-release
- **Staged Rollout**: Use Chrome Web Store staged rollout for gradual deployment
- **Version Communication**: Notify users of significant updates via notification or popup
- **Deprecation Warnings**: Warn users before removing features; provide alternatives
- **Update URL**: Optionally specify `update_url` in manifest for self-hosted updates
- **Beta Program**: Offer beta channel for early adopters to test updates
- **Release Cadence**: Establish regular release schedule; balance features and stability
