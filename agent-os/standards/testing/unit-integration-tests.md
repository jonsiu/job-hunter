## Unit and integration testing for extensions

- **Testing Framework**: Use Jest, Vitest, or Mocha for unit tests
- **Chrome API Mocking**: Mock `chrome.*` APIs using `sinon-chrome` or custom mocks
- **Storage Mocking**: Mock `chrome.storage` with in-memory implementation for tests
- **Message Mocking**: Test message handlers with mocked sender objects
- **Component Testing**: Test React/Vue components with Testing Library
- **Background Script Tests**: Test service worker event handlers in isolation
- **Content Script Tests**: Test content script logic with JSDOM or similar
- **Test Coverage**: Aim for 80%+ coverage on critical business logic
- **Integration Tests**: Test communication between content/background/popup
- **Async Testing**: Properly handle async operations with async/await in tests
- **Test Isolation**: Each test should be independent; avoid shared state
- **Setup/Teardown**: Clear mocks and reset state between tests
- **Test Data**: Use factory functions or fixtures for test data
- **Snapshot Testing**: Use snapshots for UI components; review changes carefully
