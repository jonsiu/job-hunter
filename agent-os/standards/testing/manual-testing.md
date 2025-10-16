## Manual testing checklist for extensions

- **Installation Testing**: Test fresh install, update, and reinstall scenarios
- **Uninstall Testing**: Verify cleanup on uninstall; no orphaned data
- **Permission Testing**: Test with different permission configurations
- **Cross-Browser Testing**: Test on Chrome, Firefox, Edge, Safari (if supported)
- **Version Testing**: Test on minimum and latest browser versions
- **Popup Testing**: Test popup UI at various window sizes; different states
- **Content Script Testing**: Test on variety of websites; edge cases and popular sites
- **Background Testing**: Verify background tasks run correctly; check alarms fire
- **Storage Testing**: Test storage limits; quota exceeded scenarios
- **Network Testing**: Test offline mode; slow network; API failures
- **Update Testing**: Test extension update process; data migration
- **Performance Testing**: Check CPU/memory usage; impact on page load times
- **Security Testing**: Test XSS prevention; CSP violations; permission checks
- **Accessibility Testing**: Keyboard navigation; screen reader compatibility
- **Localization Testing**: Test in different languages (if internationalized)
