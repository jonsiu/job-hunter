## Extension permissions management

- **Principle of Least Privilege**: Request only permissions actually needed
- **Permission Justification**: Document why each permission is required
- **Optional Permissions**: Use `optional_permissions` for features users can enable
- **Runtime Permission Requests**: Request optional permissions at time of use, not install
- **Permission Warnings**: Understand which permissions trigger Chrome Web Store warnings
- **Host Permissions**: Request specific host patterns; avoid broad `*://*/*` unless necessary
- **ActiveTab Permission**: Use `activeTab` to access current tab without host permissions
- **Scripting Permission**: Request `scripting` permission for dynamic content script injection
- **Storage Permission**: Not required for `chrome.storage.local`; required for `storage.sync`
- **Tabs Permission**: Avoid if possible; needed only for sensitive tab data (URL, title)
- **WebRequest Permission**: Use `declarativeNetRequest` instead to avoid blocking webRequest
- **Cookie Permission**: Request only for specific hosts where cookie access is needed
- **Permission Revocation**: Handle cases where users revoke optional permissions
- **Cross-Browser Differences**: Account for permission differences between browsers
