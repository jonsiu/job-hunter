## Extension UI component patterns

- **Design System**: Use consistent colors, typography, spacing across popup/options/content
- **Component Library**: Choose lightweight library (e.g., shadcn/ui, DaisyUI) or build custom
- **Browser UI Alignment**: Optionally match browser's native UI style for better integration
- **Icon System**: Use SVG icons; provide multiple sizes; ensure high DPI support
- **Form Controls**: Use accessible form controls; proper labeling and error states
- **Modals/Dialogs**: Use browser-native `<dialog>` element or accessible modal component
- **Tooltips**: Provide context-sensitive help with tooltips; use `title` attribute or library
- **Toast Notifications**: Show non-intrusive success/error toasts; auto-dismiss appropriately
- **Loading Indicators**: Use consistent loading patterns; skeleton screens for content
- **Empty States**: Design helpful empty states with CTAs to guide users
- **Animation**: Use subtle animations for transitions; respect `prefers-reduced-motion`
- **Typography**: Choose web-safe fonts or include font files; ensure readability
- **Color Contrast**: Meet WCAG AA standards (4.5:1 for normal text, 3:1 for large text)
- **Component Testing**: Test components in isolation; use Storybook or similar tool
