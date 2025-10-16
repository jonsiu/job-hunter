## Extension popup UI patterns

- **Size Constraints**: Popup max size varies by browser (Chrome: 800x600px, Firefox: viewport size)
- **Responsive Design**: Design for minimum 300x400px; support various popup sizes
- **Fast Rendering**: Popup should render instantly; preload data in background script
- **Lightweight HTML**: Keep popup HTML minimal; lazy load complex components
- **State Persistence**: Popup closes on blur; persist state in background or storage
- **Loading States**: Show skeleton screens or spinners for async operations
- **Framework Choice**: Consider framework-free for small popups; React/Vue for complex UIs
- **CSS Isolation**: Use scoped styles or CSS modules to avoid conflicts
- **Dark Mode**: Support system dark mode with `prefers-color-scheme` media query
- **Accessibility**: Ensure keyboard navigation, ARIA labels, focus management
- **Error Handling**: Display user-friendly error messages for failed operations
- **Action Buttons**: Provide clear CTAs; indicate loading/success states
- **Settings Link**: Include link to options page for advanced configuration
- **Cross-Browser Styling**: Test popup appearance across browsers; account for differences
