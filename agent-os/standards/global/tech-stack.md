## Tech stack for Browser Extension projects

Define your technical stack below. This serves as a reference for all team members and helps maintain consistency across the project.

### Extension Platform
- **Manifest Version:** [e.g., Manifest V3]
- **Target Browsers:** [e.g., Chrome, Firefox, Edge, Safari]
- **Minimum Browser Versions:** [e.g., Chrome 88+, Firefox 109+, Edge 88+]

### Frontend Framework
- **UI Framework:** [e.g., React, Vue, Svelte, Preact, or Vanilla JS]
- **UI Library:** [e.g., shadcn/ui, DaisyUI, Tailwind UI, or custom]
- **Styling:** [e.g., Tailwind CSS, CSS Modules, Styled Components, vanilla CSS]
- **State Management:** [e.g., Zustand, Jotai, Redux, Valtio, React Context]

### Build Tools & Development
- **Build Tool:** [e.g., Vite, webpack, Rollup, Parcel]
- **Package Manager:** [e.g., npm, pnpm, yarn]
- **TypeScript:** [Yes/No - if yes, specify tsconfig setup]
- **Linting/Formatting:** [e.g., ESLint, Prettier, Biome]
- **Extension Framework:** [e.g., Plasmo, WXT, CRXJS, or custom setup]

### Backend/API Integration
- **Backend API:** [e.g., REST API hosted on Railway, Vercel serverless functions]
- **API Client:** [e.g., fetch, axios, ky]
- **Authentication:** [e.g., JWT, OAuth 2.0, API keys, Firebase Auth]
- **Backend Framework:** [e.g., Express, FastAPI, if you have companion backend]

### Storage & Data
- **Extension Storage:** [e.g., chrome.storage.local, chrome.storage.sync]
- **IndexedDB:** [e.g., Dexie.js, idb, if using IndexedDB]
- **Cache Strategy:** [e.g., Service Worker cache, memory cache, chrome.storage cache]

### AI Integration (if applicable)
- **LLM Provider:** [e.g., OpenAI, Anthropic, local models, OpenRouter]
- **AI SDK/Library:** [e.g., OpenAI SDK, LangChain, Vercel AI SDK]
- **Streaming:** [e.g., SSE, fetch streams, chrome.runtime ports]
- **Privacy:** [e.g., local processing, PII redaction, user consent]

### Testing & Quality
- **Testing Framework:** [e.g., Jest, Vitest, Mocha]
- **E2E Testing:** [e.g., Puppeteer, Playwright, Selenium]
- **Chrome API Mocking:** [e.g., sinon-chrome, @types/chrome with custom mocks]
- **Component Testing:** [e.g., React Testing Library, Vue Test Utils]

### Deployment & Distribution
- **Chrome Web Store:** [Yes/No - publisher account details]
- **Firefox Add-ons:** [Yes/No - AMO account details]
- **Edge Add-ons:** [Yes/No - partner center account]
- **Self-Hosting:** [Yes/No - if providing update_url for enterprise]
- **CI/CD:** [e.g., GitHub Actions, GitLab CI, CircleCI]

### Monitoring & Analytics
- **Error Tracking:** [e.g., Sentry, Rollbar, Bugsnag]
- **Analytics:** [e.g., Google Analytics, Mixpanel, Amplitude, PostHog]
- **Usage Tracking:** [e.g., custom telemetry, chrome.storage metrics]

### Developer Tools
- **Version Control:** [e.g., GitHub, GitLab]
- **Extension Hot Reload:** [e.g., webpack-extension-reloader, Plasmo HMR]
- **Source Maps:** [Yes/No - how are they handled in production]
- **Browser DevTools:** [Extensions used for debugging]
