## End-to-end testing for browser extensions

- **E2E Framework**: Use Puppeteer, Playwright, or Selenium for E2E tests
- **Extension Loading**: Load unpacked extension in test browser instance
- **Test Scenarios**: Test critical user flows from installation to key features
- **Popup Testing**: Open and interact with popup programmatically
- **Content Script Testing**: Inject extension into test pages; verify DOM changes
- **Background Testing**: Trigger background events; verify side effects
- **Storage Assertions**: Inspect `chrome.storage` state during tests
- **Network Mocking**: Mock API responses for consistent test behavior
- **Screenshot Comparison**: Use visual regression testing for UI changes
- **Cross-Browser Testing**: Run E2E tests on Chrome, Firefox, Edge
- **Flaky Test Prevention**: Add proper waits; avoid timing-based assertions
- **Test Data Cleanup**: Clean up test data in storage after test runs
- **Parallel Execution**: Run tests in parallel for faster feedback
- **CI Integration**: Run E2E tests in headless mode on CI
